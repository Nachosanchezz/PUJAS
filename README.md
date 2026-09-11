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
npm run dev
```

Abre [http://localhost:3100](http://localhost:3100).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 3100 |
| `npm run build` | Compila la versión de producción |
| `npm run start` | Sirve la versión compilada |
| `npm run lint` | Revisa el código con ESLint |
| `npm run typecheck` | Genera los tipos de rutas y comprueba TypeScript |

## Estructura

```
src/app/        Rutas de la aplicación (App Router)
```
