-- =============================================================
-- Esquema inicial: salas, equipos, jugadores, subastas y pujas
-- Importes en millones de euros (enteros): 20 = 20 M€
-- =============================================================

create type room_status as enum ('setup', 'live', 'finished');
create type player_status as enum ('available', 'in_auction', 'sold');
create type auction_status as enum ('running', 'paused', 'sold', 'unsold', 'cancelled');

-- -------------------------------------------------------------
-- rooms: una sala = una subasta completa, con sus reglas
-- -------------------------------------------------------------
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  name text not null check (length(trim(name)) > 0),
  status room_status not null default 'setup',
  initial_budget integer not null default 200 check (initial_budget > 0),
  min_price integer not null default 1 check (min_price > 0),
  -- Reparto de plantillas: `teams_at_max` equipos pueden llegar a
  -- `squad_size_max` jugadores; el resto se queda en `squad_size_min`.
  squad_size_max integer not null default 8,
  squad_size_min integer not null default 7,
  teams_at_max integer not null default 3 check (teams_at_max >= 0),
  auction_seconds integer not null default 15 check (auction_seconds between 5 and 300),
  anti_snipe_seconds integer not null default 5,
  created_at timestamptz not null default now(),
  check (squad_size_min between 1 and squad_size_max),
  check (anti_snipe_seconds between 0 and auction_seconds)
);

-- -------------------------------------------------------------
-- teams: los equipos que pujan
-- -------------------------------------------------------------
create table teams (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  initial_budget integer not null default 200 check (initial_budget > 0),
  created_at timestamptz not null default now(),
  unique (room_id, name)
);

-- -------------------------------------------------------------
-- players: todos los jugadores, incluidos los capitanes
-- -------------------------------------------------------------
create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  position text,
  photo_url text,
  status player_status not null default 'available',
  is_captain boolean not null default false,
  -- Sin "on delete": no se puede borrar un equipo que tenga jugadores.
  team_id uuid references teams (id),
  sold_price integer check (sold_price >= 0),
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, name),
  -- Vendido <=> tiene equipo y precio
  check ((status = 'sold') = (team_id is not null)),
  check ((status = 'sold') = (sold_price is not null)),
  -- El capitán ya está en su equipo y no cuesta nada
  check (not is_captain or (status = 'sold' and sold_price = 0))
);

create index players_team_id_idx on players (team_id);
create unique index players_one_captain_per_team on players (team_id) where is_captain;

-- -------------------------------------------------------------
-- auctions: cada vez que un jugador sale a subasta
-- -------------------------------------------------------------
create table auctions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  status auction_status not null default 'running',
  starting_price integer not null check (starting_price > 0),
  -- Puja más alta y equipo que la tiene (null hasta la primera puja)
  current_price integer,
  leading_team_id uuid references teams (id),
  -- Hora exacta de fin: los clientes calculan el contador a partir de aquí
  ends_at timestamptz,
  paused_remaining_ms integer check (paused_remaining_ms > 0),
  started_at timestamptz not null default now(),
  closed_at timestamptz,
  check ((current_price is null) = (leading_team_id is null)),
  check (current_price is null or current_price >= starting_price),
  check (status <> 'running' or ends_at is not null),
  check (status <> 'paused' or paused_remaining_ms is not null),
  check ((status in ('running', 'paused')) = (closed_at is null)),
  check (status <> 'sold' or leading_team_id is not null),
  check (status <> 'unsold' or leading_team_id is null)
);

create index auctions_room_id_idx on auctions (room_id);
create index auctions_player_id_idx on auctions (player_id);
-- Solo puede haber una subasta abierta por sala
create unique index auctions_one_open_per_room on auctions (room_id)
  where status in ('running', 'paused');

-- -------------------------------------------------------------
-- bids: historial de pujas
-- -------------------------------------------------------------
create table bids (
  id bigint generated always as identity primary key,
  auction_id uuid not null references auctions (id) on delete cascade,
  -- Cascade para que borrar una sala no falle. Un equipo con jugadores
  -- (siempre tiene a su capitán) sigue sin poder borrarse.
  team_id uuid not null references teams (id) on delete cascade,
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now(),
  -- Cada puja supera a la anterior, así que no puede haber dos iguales
  unique (auction_id, amount)
);

create index bids_team_id_idx on bids (team_id);

-- -------------------------------------------------------------
-- Seguridad: RLS activado en todas las tablas.
-- Sin políticas, nadie puede leer ni escribir con la clave pública;
-- las abriremos una a una en fases posteriores.
-- -------------------------------------------------------------
alter table rooms enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table auctions enable row level security;
alter table bids enable row level security;

-- -------------------------------------------------------------
-- team_standings: presupuesto y plazas de cada equipo, calculados
-- siempre a partir de los jugadores (nunca se guardan a mano).
--
-- Tope de plantilla dinámico: un equipo puede llegar a squad_size_max
-- mientras haya menos de teams_at_max OTROS equipos que ya lo hayan
-- alcanzado; si no, su tope es squad_size_min.
--
-- Puja máxima = restante - (plazas por cubrir - 1) * precio mínimo
-- -------------------------------------------------------------
create view team_standings with (security_invoker = true) as
with squads as (
  select
    t.id as team_id,
    t.room_id,
    t.name,
    t.initial_budget,
    count(p.id)::integer as players_count,
    coalesce(sum(p.sold_price), 0)::integer as spent
  from teams t
  left join players p on p.team_id = t.id
  group by t.id
),
caps as (
  select
    s.*,
    r.min_price,
    case
      when s.players_count >= r.squad_size_max then r.squad_size_max
      when (
        select count(*)
        from squads other
        where other.room_id = s.room_id
          and other.team_id <> s.team_id
          and other.players_count >= r.squad_size_max
      ) < r.teams_at_max then r.squad_size_max
      else r.squad_size_min
    end as squad_size_cap
  from squads s
  join rooms r on r.id = s.room_id
)
select
  team_id,
  room_id,
  name,
  initial_budget,
  players_count,
  spent,
  initial_budget - spent as remaining,
  squad_size_cap,
  greatest(squad_size_cap - players_count, 0) as slots_left,
  case
    when squad_size_cap - players_count > 0 then
      greatest(initial_budget - spent - (squad_size_cap - players_count - 1) * min_price, 0)
    else 0
  end as max_bid
from caps;
