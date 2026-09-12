-- =============================================================
-- Pujas: todas las reglas se validan aquí, en la base de datos
-- =============================================================

create function public.place_bid(p_auction_id uuid, p_team_id uuid, p_amount integer)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_auction public.auctions;
  v_team public.team_standings;
  v_anti_snipe integer;
begin
  -- Bloquea la subasta: si dos presidentes pujan a la vez, la segunda
  -- espera a la primera y se valida contra el precio ya actualizado.
  select * into v_auction from public.auctions where id = p_auction_id for update;
  if not found then
    raise exception 'La subasta no existe';
  end if;
  if v_auction.status = 'paused' then
    raise exception 'La subasta está en pausa';
  end if;
  if v_auction.status <> 'running' then
    raise exception 'La subasta ya ha terminado';
  end if;
  if now() >= v_auction.ends_at then
    raise exception 'Se ha acabado el tiempo';
  end if;

  select * into v_team from public.team_standings
  where team_id = p_team_id and room_id = v_auction.room_id;
  if not found then
    raise exception 'Tu equipo no está en esta sala';
  end if;

  if v_auction.leading_team_id = p_team_id then
    raise exception 'Ya vas ganando esta subasta';
  end if;
  if p_amount < v_auction.starting_price then
    raise exception 'La puja mínima es % M€', v_auction.starting_price;
  end if;
  if p_amount <= coalesce(v_auction.current_price, 0) then
    raise exception 'Alguien ya ha pujado % M€', v_auction.current_price;
  end if;
  if v_team.slots_left <= 0 then
    raise exception 'Tu plantilla está completa';
  end if;
  if p_amount > v_team.max_bid then
    raise exception 'Tu puja máxima es % M€', v_team.max_bid;
  end if;

  insert into public.bids (auction_id, team_id, amount)
  values (p_auction_id, p_team_id, p_amount);

  select anti_snipe_seconds into v_anti_snipe from public.rooms where id = v_auction.room_id;

  -- Anti-último segundo: si quedan menos de X segundos, el contador vuelve a X
  update public.auctions
  set current_price = p_amount,
      leading_team_id = p_team_id,
      ends_at = greatest(ends_at, now() + v_anti_snipe * interval '1 second')
  where id = p_auction_id;
end;
$$;

revoke execute on function public.place_bid(uuid, uuid, integer) from public, anon, authenticated;
