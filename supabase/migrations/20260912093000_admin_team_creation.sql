-- =============================================================
-- Límite de equipos por sala y alta atómica de equipo + capitán
-- =============================================================

alter table public.rooms
  add column max_teams integer not null default 5 check (max_teams between 2 and 20);

-- Crea un equipo y su capitán en una sola operación: o se crean los dos
-- o ninguno. Solo la ejecuta el servidor (secret key).
create function public.create_team(p_room_id uuid, p_name text, p_captain_name text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_room public.rooms;
  v_team_count integer;
  v_team_id uuid;
begin
  -- Bloquea la sala: dos altas simultáneas no pueden superar el límite
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'La sala no existe';
  end if;

  if v_room.status <> 'setup' then
    raise exception 'No se pueden añadir equipos con la subasta empezada';
  end if;

  select count(*) into v_team_count from public.teams where room_id = p_room_id;
  if v_team_count >= v_room.max_teams then
    raise exception 'La sala ya tiene % equipos', v_room.max_teams;
  end if;

  insert into public.teams (room_id, name, initial_budget)
  values (p_room_id, trim(p_name), v_room.initial_budget)
  returning id into v_team_id;

  insert into public.players (room_id, name, status, is_captain, team_id, sold_price, sold_at)
  values (p_room_id, trim(p_captain_name), 'sold', true, v_team_id, 0, now());

  return v_team_id;
end;
$$;

-- Supabase da permiso de ejecución a anon/authenticated por defecto: se lo quitamos
revoke execute on function public.create_team(uuid, text, text) from public, anon, authenticated;
