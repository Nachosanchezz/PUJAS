-- =============================================================
-- Tiempo real más rápido: el aviso lleva el estado de la subasta
-- (precio, quién gana, contador) para que las pantallas lo pinten
-- al instante, sin esperar a pedir la página al servidor.
-- También avisa cuando cambia un jugador (ventas y correcciones).
-- =============================================================

create or replace function public.notify_room_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payload jsonb;
begin
  if tg_table_name = 'auctions' then
    v_payload := jsonb_build_object(
      'auction_id', new.id,
      'status', new.status,
      'current_price', new.current_price,
      'leading_team_id', new.leading_team_id,
      'leading_team_name', (select t.name from public.teams t where t.id = new.leading_team_id),
      'ends_at', new.ends_at,
      'paused_remaining_ms', new.paused_remaining_ms,
      -- Hora real del servidor al enviar: corrige el reloj de cada móvil
      'server_now', clock_timestamp()
    );
  else
    v_payload := jsonb_build_object('player_id', new.id);
  end if;

  perform realtime.send(v_payload, 'changed', 'room:' || new.room_id::text, true);
  return null;
end;
$$;

-- Solo en update: importar jugadores (insert) no necesita avisar a nadie
create trigger players_notify_room
after update on public.players
for each row execute function public.notify_room_change();
