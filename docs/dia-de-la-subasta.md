# Guía para el día de la subasta

## El día antes

1. **Supabase despierto.** En el plan gratuito, los proyectos sin uso durante 7 días se pausan. Entra en [supabase.com/dashboard](https://supabase.com/dashboard) y comprueba que el proyecto `pujas` está activo. Si está pausado, pulsa *Restore*.
2. **Cambiar la secret key** (salió en la conversación de desarrollo):
   1. Supabase → *Settings → API Keys* → *Secret keys* → crea una nueva.
   2. Vercel → proyecto → *Settings → Environment Variables* → edita `SUPABASE_SECRET_KEY` con la nueva.
   3. Pon la nueva también en `.env.local` si vas a seguir desarrollando.
   4. Vercel → *Deployments* → en el último, *⋯ → Redeploy*.
   5. Cuando la web funcione con la nueva, borra la antigua en Supabase.
3. **Contraseña de admin larga** en Vercel (`ADMIN_PASSWORD`), y *Redeploy*.
4. **Sala limpia.** Que no queden ventas ni subastas de prueba.
5. **PIN nuevos.** En el panel de la sala, pulsa *Nuevo PIN* en cada equipo y manda a cada presidente, **por privado**, el enlace de la sala y su PIN.
6. **Ensayo.** Prueba con un amigo desde su casa: entrar con PIN, pujar y ver el VENDIDO.
7. **Abre la web.** Hacerlo una vez calienta el servidor de Vercel y comprueba que todo responde.

## Durante la subasta

- **Admin:** ordenador con la **sala de control** (`/admin/rooms/CÓDIGO/live`).
- **Pantalla grande (opcional):** la página de **plantillas** (`/room/CÓDIGO/plantillas`), que se actualiza sola.
- **Presidentes:** en el móvil, con la pantalla encendida. Si alguno deja de ver cambios, que recargue la página.
- **Si algo sale mal:**
  - *Pausar* para parar el contador.
  - *Adjudicar ya* para cerrar al momento.
  - *Deshacer* en la lista de vendidos para devolver un jugador y su dinero.
  - *Adjudicar a mano* para corregir cualquier otra cosa.

## Después

- **Plantillas → Copiar para WhatsApp** para mandar el resultado al grupo.
- El **historial** guarda todas las pujas por si hay dudas.
