-- =============================================================
-- Acceso de presidentes: un PIN de 4 cifras por equipo
-- =============================================================

-- Tabla aparte (y no una columna de teams) para que el PIN no se pueda
-- exponer por accidente cuando abramos la lectura pública de los equipos.
create table public.team_access (
  team_id uuid primary key references public.teams (id) on delete cascade,
  pin text not null check (pin ~ '^[0-9]{4}$'),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz
);

alter table public.team_access enable row level security;

-- Equipos que ya existían: PIN aleatorio (se puede cambiar desde el panel)
insert into public.team_access (team_id, pin)
select id, lpad(floor(random() * 10000)::integer::text, 4, '0')
from public.teams;

-- create_team ahora también guarda el PIN (lo genera el servidor)
drop function public.create_team(uuid, text, text);

create function public.create_team(
  p_room_id uuid,
  p_name text,
  p_captain_name text,
  p_pin text
)
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

  insert into public.team_access (team_id, pin) values (v_team_id, p_pin);

  return v_team_id;
end;
$$;

revoke execute on function public.create_team(uuid, text, text, text) from public, anon, authenticated;

-- Comprueba el PIN de un equipo: devuelve 'ok', 'wrong' o 'locked'.
-- Tras 5 fallos seguidos bloquea el equipo 5 minutos, para que nadie
-- pueda probar las 10.000 combinaciones.
create function public.verify_team_pin(p_team_id uuid, p_pin text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_access public.team_access;
begin
  select * into v_access from public.team_access where team_id = p_team_id for update;
  if not found then
    return 'wrong';
  end if;

  if v_access.locked_until is not null and v_access.locked_until > now() then
    return 'locked';
  end if;

  if v_access.pin = p_pin then
    update public.team_access
    set failed_attempts = 0, locked_until = null
    where team_id = p_team_id;
    return 'ok';
  end if;

  if v_access.failed_attempts + 1 >= 5 then
    update public.team_access
    set failed_attempts = 0, locked_until = now() + interval '5 minutes'
    where team_id = p_team_id;
    return 'locked';
  end if;

  update public.team_access
  set failed_attempts = failed_attempts + 1
  where team_id = p_team_id;
  return 'wrong';
end;
$$;

revoke execute on function public.verify_team_pin(uuid, text) from public, anon, authenticated;
