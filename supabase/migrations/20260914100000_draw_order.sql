-- =============================================================
-- Orden de salida sorteado: cada jugador de la subasta recibe un
-- número al azar y la sala guarda cuándo se hizo el sorteo.
-- =============================================================

alter table public.players add column draw_order integer check (draw_order > 0);
create unique index players_room_draw_order on public.players (room_id, draw_order)
  where draw_order is not null;

alter table public.rooms add column order_drawn_at timestamptz;

-- Sortea el orden de salida: una sola vez y antes de empezar la subasta.
-- gen_random_uuid() usa el generador aleatorio criptográfico de PostgreSQL:
-- es como mezclar las bolas de un bombo, nadie puede prever el resultado.
create function public.draw_auction_order(p_room_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_room public.rooms;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'La sala no existe';
  end if;
  if v_room.order_drawn_at is not null then
    raise exception 'El orden de salida ya está sorteado';
  end if;
  if v_room.status <> 'setup' then
    raise exception 'La subasta ya ha empezado';
  end if;

  update public.players p
  set draw_order = shuffled.n
  from (
    select id, row_number() over (order by gen_random_uuid()) as n
    from public.players
    where room_id = p_room_id and not is_captain
  ) shuffled
  where p.id = shuffled.id;

  update public.rooms set order_drawn_at = now() where id = p_room_id;
end;
$$;

revoke execute on function public.draw_auction_order(uuid) from public, anon, authenticated;

-- Jugadores añadidos después del sorteo: van al final de la lista
create function public.append_to_draw_order()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.is_captain and new.draw_order is null and exists (
    select 1 from public.rooms where id = new.room_id and order_drawn_at is not null
  ) then
    select coalesce(max(draw_order), 0) + 1 into new.draw_order
    from public.players
    where room_id = new.room_id;
  end if;
  return new;
end;
$$;

create trigger players_append_to_draw_order
before insert on public.players
for each row execute function public.append_to_draw_order();
