-- =============================================================
-- Cierre de subastas (VENDIDO / sin pujas) y correcciones del admin
-- =============================================================

-- La sala pasa a 'finished' cuando ya no queda nadie por vender, y vuelve
-- a 'live' si una corrección devuelve algún jugador a la lista.
create function public.refresh_room_status(p_room_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.rooms
  set status = case
    when exists (
      select 1 from public.players
      where room_id = p_room_id and status <> 'sold'
    ) then 'live'::public.room_status
    else 'finished'::public.room_status
  end
  where id = p_room_id and status <> 'setup';
$$;

-- Cierra una subasta cuyo tiempo ha terminado (o ya mismo, si p_force).
-- La pueden pedir varias pantallas a la vez: solo la primera hace algo.
-- Devuelve 'sold', 'unsold', 'cancelled', 'open' (aún no ha terminado)
-- o 'closed' (ya estaba cerrada).
create function public.close_auction(p_auction_id uuid, p_force boolean default false)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_auction public.auctions;
  v_team public.team_standings;
begin
  -- Mismo bloqueo que place_bid: una puja y un cierre simultáneos se
  -- ordenan, y el que llega segundo ve el resultado del primero.
  select * into v_auction from public.auctions where id = p_auction_id for update;
  if not found then
    raise exception 'La subasta no existe';
  end if;

  if v_auction.status not in ('running', 'paused') then
    return 'closed';
  end if;

  -- Una puja de última hora pudo ampliar el tiempo: entonces no se cierra
  if not p_force and (v_auction.status = 'paused' or now() < v_auction.ends_at) then
    return 'open';
  end if;

  -- Nadie ha pujado: el jugador vuelve a la lista
  if v_auction.leading_team_id is null then
    update public.auctions
    set status = 'unsold', closed_at = now(), paused_remaining_ms = null
    where id = p_auction_id;
    update public.players set status = 'available' where id = v_auction.player_id;
    return 'unsold';
  end if;

  select * into v_team from public.team_standings where team_id = v_auction.leading_team_id;

  -- Defensa: si una corrección manual dejó al ganador sin plaza o sin dinero
  if v_team.slots_left <= 0 or v_auction.current_price > v_team.remaining then
    update public.auctions
    set status = 'cancelled', closed_at = now(), paused_remaining_ms = null
    where id = p_auction_id;
    update public.players set status = 'available' where id = v_auction.player_id;
    return 'cancelled';
  end if;

  -- VENDIDO: el jugador pasa al equipo y su precio se descuenta del presupuesto
  update public.auctions
  set status = 'sold', closed_at = now(), paused_remaining_ms = null
  where id = p_auction_id;

  update public.players
  set status = 'sold',
      team_id = v_auction.leading_team_id,
      sold_price = v_auction.current_price,
      sold_at = now()
  where id = v_auction.player_id;

  perform public.refresh_room_status(v_auction.room_id);
  return 'sold';
end;
$$;

-- Corrección: adjudicar a mano un jugador disponible a un equipo
create function public.assign_player(p_player_id uuid, p_team_id uuid, p_price integer)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_player public.players;
  v_team public.team_standings;
begin
  select * into v_player from public.players where id = p_player_id for update;
  if not found then
    raise exception 'El jugador no existe';
  end if;
  if v_player.status <> 'available' then
    raise exception 'Solo se pueden adjudicar jugadores disponibles';
  end if;

  select * into v_team from public.team_standings
  where team_id = p_team_id and room_id = v_player.room_id;
  if not found then
    raise exception 'El equipo no es de esta sala';
  end if;
  if p_price < 0 then
    raise exception 'El precio no puede ser negativo';
  end if;
  if v_team.slots_left <= 0 then
    raise exception 'La plantilla de % está completa', v_team.name;
  end if;
  -- Misma regla que en las pujas: siempre debe poder completar su plantilla
  if p_price > v_team.max_bid then
    raise exception '% puede pagar como máximo % M€', v_team.name, v_team.max_bid;
  end if;

  update public.players
  set status = 'sold', team_id = p_team_id, sold_price = p_price, sold_at = now()
  where id = p_player_id;

  perform public.refresh_room_status(v_player.room_id);
end;
$$;

-- Corrección: deshacer una venta. El jugador vuelve a la lista y el equipo
-- recupera el dinero (el presupuesto se calcula a partir de los jugadores).
create function public.unassign_player(p_player_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_player public.players;
begin
  select * into v_player from public.players where id = p_player_id for update;
  if not found then
    raise exception 'El jugador no existe';
  end if;
  if v_player.is_captain then
    raise exception 'El presidente no se puede quitar de su equipo';
  end if;
  if v_player.status <> 'sold' then
    raise exception 'Ese jugador no está vendido';
  end if;

  update public.players
  set status = 'available', team_id = null, sold_price = null, sold_at = null
  where id = p_player_id;

  perform public.refresh_room_status(v_player.room_id);
end;
$$;

revoke execute on function public.refresh_room_status(uuid) from public, anon, authenticated;
revoke execute on function public.close_auction(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.assign_player(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.unassign_player(uuid) from public, anon, authenticated;
