-- =============================================================
-- Controles de la subasta: sacar un jugador, pausar, reanudar, cancelar
-- Todas bloquean las filas que tocan (for update) para que dos
-- órdenes simultáneas no dejen la subasta en un estado imposible.
-- =============================================================

-- Saca un jugador disponible a subasta con el tiempo y precio de la sala
create function public.start_auction(p_room_id uuid, p_player_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_room public.rooms;
  v_player public.players;
  v_auction_id uuid;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'La sala no existe';
  end if;
  if v_room.status = 'finished' then
    raise exception 'La subasta de esta sala ya ha terminado';
  end if;

  if exists (
    select 1 from public.auctions
    where room_id = p_room_id and status in ('running', 'paused')
  ) then
    raise exception 'Ya hay un jugador en subasta';
  end if;

  select * into v_player from public.players
  where id = p_player_id and room_id = p_room_id
  for update;
  if not found then
    raise exception 'El jugador no es de esta sala';
  end if;
  if v_player.status <> 'available' then
    raise exception 'Ese jugador no está disponible';
  end if;

  insert into public.auctions (room_id, player_id, status, starting_price, ends_at)
  values (
    p_room_id,
    p_player_id,
    'running',
    v_room.min_price,
    now() + v_room.auction_seconds * interval '1 second'
  )
  returning id into v_auction_id;

  update public.players set status = 'in_auction' where id = p_player_id;

  if v_room.status = 'setup' then
    update public.rooms set status = 'live' where id = p_room_id;
  end if;

  return v_auction_id;
end;
$$;

-- Congela el contador guardando los milisegundos que quedaban
create function public.pause_auction(p_auction_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_auction public.auctions;
  v_remaining_ms integer;
begin
  select * into v_auction from public.auctions where id = p_auction_id for update;
  if not found then
    raise exception 'La subasta no existe';
  end if;
  if v_auction.status <> 'running' then
    raise exception 'La subasta no está en marcha';
  end if;

  v_remaining_ms := ceil(extract(epoch from (v_auction.ends_at - now())) * 1000);
  if v_remaining_ms <= 0 then
    raise exception 'El tiempo ya se ha agotado';
  end if;

  update public.auctions
  set status = 'paused', paused_remaining_ms = v_remaining_ms, ends_at = null
  where id = p_auction_id;
end;
$$;

-- Vuelve a poner el contador en marcha con el tiempo que quedaba
create function public.resume_auction(p_auction_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_auction public.auctions;
begin
  select * into v_auction from public.auctions where id = p_auction_id for update;
  if not found then
    raise exception 'La subasta no existe';
  end if;
  if v_auction.status <> 'paused' then
    raise exception 'La subasta no está en pausa';
  end if;

  update public.auctions
  set status = 'running',
      ends_at = now() + v_auction.paused_remaining_ms * interval '1 millisecond',
      paused_remaining_ms = null
  where id = p_auction_id;
end;
$$;

-- Anula la subasta: el jugador vuelve a la lista (las pujas quedan en el historial)
create function public.cancel_auction(p_auction_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_auction public.auctions;
begin
  select * into v_auction from public.auctions where id = p_auction_id for update;
  if not found then
    raise exception 'La subasta no existe';
  end if;
  if v_auction.status not in ('running', 'paused') then
    raise exception 'La subasta ya está cerrada';
  end if;

  update public.auctions
  set status = 'cancelled', closed_at = now(), paused_remaining_ms = null
  where id = p_auction_id;

  update public.players set status = 'available' where id = v_auction.player_id;
end;
$$;

revoke execute on function public.start_auction(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.pause_auction(uuid) from public, anon, authenticated;
revoke execute on function public.resume_auction(uuid) from public, anon, authenticated;
revoke execute on function public.cancel_auction(uuid) from public, anon, authenticated;
