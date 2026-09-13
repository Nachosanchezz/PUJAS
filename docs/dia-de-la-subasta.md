# Paso a paso para el día de la subasta

**Web:** https://pujas-7j22.vercel.app · **Sala:** Puja Split 3 · **Código:** `ER7PAP`

| Quién | Qué necesita |
|---|---|
| **Admin** | Un ordenador, la contraseña de admin y la sala de control abierta |
| **Cada presidente** | Su móvil (con Wi-Fi o datos), el enlace de la sala y el PIN de su equipo |
| **Pantalla grande** (opcional) | Una tele o proyector con la página de plantillas |

---

## 1. Unos días antes (admin)

1. **Revisa la sala.** Entra en https://pujas-7j22.vercel.app/admin, pon la contraseña y abre **Puja Split 3**. Comprueba que están los **5 equipos con su presidente** y los **33 jugadores**.
   - ¿Falta alguien? Añádelo en *Jugadores en subasta*: pegando una lista o uno a uno.
   - ¿Sobra alguien? Pulsa *Eliminar* en su fila.
   - Los equipos no se pueden añadir una vez empezada la subasta: revísalo antes.
2. **Manda a cada presidente, por privado,** el enlace de la sala y su PIN. El PIN de cada equipo está en su tarjeta del panel. Por ejemplo:
   > Mañana es la subasta 🔨 Entra aquí: https://pujas-7j22.vercel.app/room/ER7PAP
   > Tu equipo es **Nacho** y tu PIN es **1234**. No se lo pases a nadie.
3. **Si alguien filtra su PIN**, pulsa *Nuevo PIN* en su tarjeta. El anterior deja de valer y quien estuviera dentro con él queda fuera.

## 2. El día, 15 minutos antes

4. **Despierta la base de datos.** Si la web lleva **más de 7 días sin usarse**, Supabase pausa el proyecto (plan gratuito).
   1. Abre https://pujas-7j22.vercel.app/status. Si sale **"Conectado a Supabase"** en verde, todo bien.
   2. Si sale en rojo, entra en [supabase.com/dashboard](https://supabase.com/dashboard), abre el proyecto **pujas** y pulsa **Restore**. Espera un par de minutos y vuelve a mirar `/status`.
5. **El admin abre la sala de control.** En el ordenador, entra en `/admin` → **Puja Split 3** → **Abrir sala de control**. Déjala abierta toda la subasta.
6. **(Opcional) Pantalla grande.** Abre https://pujas-7j22.vercel.app/room/ER7PAP/plantillas en la tele. Se actualiza sola con cada fichaje.

## 3. Entran los presidentes

7. Cada presidente **abre el enlace** en su móvil: https://pujas-7j22.vercel.app/room/ER7PAP. También puede entrar en la portada y escribir el código `ER7PAP`.
8. **Elige su equipo**, escribe **su PIN** y pulsa **Entrar como presidente**.
9. Verá **"Tu equipo"** con 1/8 jugadores, **200 M€** y una puja máxima de **194 M€**. Ya está dentro. Si recarga o cierra el navegador, sigue dentro.

**Si algo falla al entrar:**
- *"PIN incorrecto"*: revisa el PIN en el panel del admin.
- *"Demasiados intentos fallidos"*: tras 5 fallos seguidos, ese equipo se bloquea **5 minutos**. Espera y vuelve a probar.

**Consejos para los presidentes:**
- Mantened la **pantalla encendida**: si el móvil se bloquea, al volver la página se pone al día sola.
- Si en algún momento no veis cambios, **recargad la página**.

## 4. La subasta

10. **El admin elige un jugador** en *Jugadores disponibles* y pulsa **Sacar a subasta**. En todas las pantallas aparece el jugador, el contador de **15 segundos** y el **precio de salida (1 M€)**.
11. **Los presidentes pujan** con **+1**, **+5** o **+10**.
    - Cada botón muestra la **cantidad total** que vas a pujar. Por ejemplo, con la puja en 10 M€, el botón +5 pone **15 M€**.
    - La primera puja parte de 0: **+5 son 5 M€**.
    - Si alguien sube justo antes que tú, tu puja se rechaza. Nunca pujarás más de lo que ves en el botón.
    - Si vas ganando no puedes pujar: verás **"VAS GANANDO"**.
    - No puedes pasar de **tu puja máxima**, que sale debajo de los botones.
12. **Anti-último segundo:** si alguien puja cuando quedan **menos de 5 segundos**, el contador **vuelve a 5**.
13. **Al llegar a 0:**
    - **Si alguien ha pujado:** sale **VENDIDO** en todas las pantallas. El jugador pasa a la plantilla del ganador y se le descuenta el dinero.
    - **Si nadie ha pujado:** sale **"Sin pujas"** y el jugador vuelve a la lista. El admin puede sacarlo otra vez más tarde.
14. **El admin saca al siguiente jugador** y se repite hasta vender los 33.

### Reglas que conviene recordar

| Regla | Detalle |
|---|---|
| Presupuesto | 200 M€ por equipo |
| Precio de salida | 1 M€ |
| Plantillas | 3 equipos acaban con **8** jugadores y 2 con **7** (presidente incluido). Cuando 3 equipos llegan a 8, los otros dos se quedan con tope 7 |
| Puja máxima | Lo que te queda − 1 M€ por cada plaza que te falte cubrir después de esta. Así nunca te quedas sin dinero para completar la plantilla |
| Último segundo | Una puja con menos de 5 s devuelve el contador a 5 |

## 5. Si algo sale mal (admin, en la sala de control)

| Problema | Botón |
|---|---|
| Hay que parar un momento | **Pausar** (el contador se congela) y luego **Reanudar** |
| Hay que cerrar ya la subasta de este jugador | **Adjudicar ya**: se vende a quien vaya ganando |
| El jugador salió por error | **Cancelar subasta**: vuelve a la lista sin venderse |
| Se vendió a quien no era o por un precio mal | **Deshacer** en la lista de *Vendidos*: el jugador vuelve a la lista y el equipo recupera su dinero |
| Hay que asignar un jugador a mano | **Adjudicar a mano**: eliges jugador, equipo y precio |
| Un presidente no ve cambios | Que recargue la página |
| Un presidente no puede entrar | Revisa su PIN en el panel (o dale uno nuevo con *Nuevo PIN*) |

## 6. Al terminar

15. Cuando se vende el último jugador, la sala pasa sola a **"Terminada"**.
16. En **Plantillas** pulsa **Copiar para WhatsApp** y pégalo en el grupo: salen todos los equipos con sus jugadores y precios.
17. En **Historial** queda cada subasta con todas sus pujas y la hora, por si alguien tiene dudas.

---

**¿Otra subasta en el futuro?** En `/admin` crea una **sala nueva**: tendrá otro código, y la anterior queda guardada con su historial.
