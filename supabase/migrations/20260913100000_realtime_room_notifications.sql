-- =============================================================
-- Tiempo real: cada cambio en una subasta avisa a todas las
-- pantallas de su sala a través de Supabase Realtime.
-- =============================================================

-- El aviso solo dice "algo ha cambiado": cada pantalla vuelve a pedir los
-- datos a nuestro servidor. Así las tablas siguen cerradas al público.
create function public.notify_room_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('auction_id', new.id, 'status', new.status),
    'changed',
    'room:' || new.room_id::text,
    true -- canal privado: solo lo recibe quien cumpla la política de abajo
  );
  return null;
end;
$$;

revoke execute on function public.notify_room_change() from public, anon, authenticated;

-- Salta al sacar un jugador, con cada puja, al pausar, reanudar y cancelar
create trigger auctions_notify_room
after insert or update on public.auctions
for each row execute function public.notify_room_change();

-- Cualquiera puede ESCUCHAR los avisos de las salas, pero nadie puede
-- ENVIARLOS desde el navegador: no hay política de insert.
create policy "Room broadcasts can be received"
on realtime.messages
for select
to anon, authenticated
using (
  (select realtime.topic()) like 'room:%'
  and realtime.messages.extension = 'broadcast'
);
