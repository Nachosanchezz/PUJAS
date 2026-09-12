# Subasta Liga Fútbol Sala

Aplicación web para organizar el draft de una liga de fútbol sala mediante una **subasta de jugadores en directo**.

- 5 equipos, cada presidente con un presupuesto ficticio (200 M€ por defecto).
- El administrador elige qué jugador sale a subasta.
- Los presidentes pujan desde el móvil y todos ven las pujas en tiempo real.
- Al terminar el contador, el jugador se adjudica al mejor postor y se descuenta de su presupuesto.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Base de datos | Supabase (PostgreSQL) |
| Tiempo real | Supabase Realtime |
| Hosting | Vercel |

## Requisitos

- Node.js 20.9 o superior
- npm

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y rellena los valores de Supabase
npm run dev
```

Abre [http://localhost:3100](http://localhost:3100). En [/status](http://localhost:3100/status) puedes comprobar la conexión con la base de datos.

### Base de datos

El proyecto de Supabase se enlaza una vez con `npx supabase login` y `npx supabase link --project-ref <ref>`. Después:

```bash
npm run db:push    # aplica las migraciones pendientes de supabase/migrations/
npm run db:types   # regenera src/types/database.ts a partir del esquema
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 3100 |
| `npm run build` | Compila la versión de producción |
| `npm run start` | Sirve la versión compilada |
| `npm run lint` | Revisa el código con ESLint |
| `npm run typecheck` | Genera los tipos de rutas y comprueba TypeScript |
| `npm run db:push` | Aplica las migraciones en Supabase |
| `npm run db:types` | Genera los tipos de TypeScript de la base de datos |

## Estructura

```
src/app/               Rutas de la aplicación (App Router)
src/lib/               Cliente de Supabase y utilidades
src/types/             Tipos generados de la base de datos
supabase/migrations/   Esquema de la base de datos (SQL)
docs/                  Documentación (modelo de datos y reglas)
```

## Reglas de la liga

5 equipos y 38 jugadores (5 capitanes + 33 en subasta). Tres equipos acaban con 8 jugadores y dos con 7. Todos los jugadores salen a 1 M€, y la puja máxima reserva 1 M€ por cada plaza que quede por cubrir. Detalle completo en [docs/modelo-de-datos.md](docs/modelo-de-datos.md).
