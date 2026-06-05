# Prode Mundial 2026 ⚽

Prode (pool de pronósticos) privado del Mundial 2026. Pozo único y cerrado:
solo el admin (vos) invita jugadores. Pronósticos del marcador a 120′, tabla con
puntos automáticos, fixture por día, tablas de grupo, llave eliminatoria,
estadísticas personales y recordatorios por email. Estética retro editorial
(crema · tinta · rojo ladrillo · dorado · verde cancha) con modo claro y oscuro.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Drizzle ORM +
Postgres (Neon) · NextAuth v5 (passkeys/WebAuthn) · shadcn/ui · Vitest.

## Reglas de puntaje

- Resultado **exacto** = 3 pts · acertar el **resultado** (gana/empata/pierde) = 1 pt · errar = 0.
- Se puntúa el marcador de **120′** (no los penales). Configurable en `/admin/ajustes`.
- Desempates en la tabla: puntos → exactos → resultados → menor error de diferencia de gol → nombre.

## Puesta en marcha (local)

```bash
pnpm install
cp .env.example .env.local      # completá DATABASE_URL, AUTH_SECRET, OWNER_EMAIL
pnpm db:push                    # aplica el esquema (migraciones drizzle/)
pnpm db:seed                    # carga 48 equipos + partidos + settings + invitación admin
pnpm dev
```

`pnpm db:seed` imprime un link `/invite/<token>`. Abrilo, registrá tu passkey y
quedás como **admin** (porque tu email = `OWNER_EMAIL`).

### Variables de entorno

Mínimas: `DATABASE_URL` (Neon, string **pooled**), `AUTH_SECRET` (`npx auth secret`),
`NEXT_PUBLIC_APP_URL`, `OWNER_EMAIL`.
Opcionales: `FOOTBALL_DATA_TOKEN` (scores en vivo), SMTP `EMAIL_SERVER_*` + `EMAIL_FROM`
(invitaciones y recordatorios por email), `CRON_SECRET` (crons). Ver `.env.example`.

## Fixture / fuente de datos (gratis)

- **Estructura (equipos, grupos, partidos):** [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) — dominio público, sin API key. La usa el seed.
- **Scores en vivo:** [football-data.org](https://www.football-data.org/) v4, plan gratuito (token requerido). Se sincroniza solo en la ventana de cada partido.

> ⚠️ El fixture 2026 de openfootball puede estar incompleto. El seed es
> **idempotente**: re-ejecutalo cuando se complete. Si el fetch falla, dejá un
> snapshot del JSON en `scripts/fixtures/worldcup-2026.json` y reintentá.
> Siempre podés cargar resultados a mano en `/admin/resultados` (manda sobre la sync).

## Deploy (Vercel + Neon, capa gratuita)

1. Base de datos: creá un proyecto en [Neon](https://neon.tech) y copiá el string **pooled**.
2. Importá el repo en Vercel. Cargá las env vars (incluí `CRON_SECRET` y poné
   `NEXT_PUBLIC_APP_URL` con tu **dominio definitivo** — las passkeys quedan atadas a él).
3. `vercel.json` ya programa el cron diario `keepalive` (mantiene Neon despierto +
   fuerza una sync). Vercel envía `Authorization: Bearer $CRON_SECRET` automáticamente.
4. Tras el primer deploy, corré el seed apuntando a la DB de prod
   (`DATABASE_URL=... pnpm db:seed`) o desde un entorno con esa env.

### Crons externos (gratis, [cron-job.org](https://cron-job.org))

El plan hobby de Vercel limita los crons a 1/día, así que estos van por fuera.
En cada job agregá el header `Authorization: Bearer <CRON_SECRET>` y limitá el
rango de fechas a jun–jul 2026:

| Job | URL | Frecuencia |
| --- | --- | --- |
| Scores en vivo | `https://TU-APP/api/cron/sync` | `*/5 * * * *` (se auto-gatea a la ventana del partido) |
| Recordatorios | `https://TU-APP/api/cron/reminders` | `0 * * * *` (cada hora) |

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm db:push` | aplica el esquema a la DB |
| `pnpm db:generate` | genera migración desde el esquema |
| `pnpm db:seed` | carga el fixture + settings + invitación admin |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm test` | Vitest (lógica de scoring, grupos, llave, stats, locks) |
| `pnpm lint` | ESLint |

## Estructura

- `src/app/(app)/` — app autenticada (tabla, pronosticos, partidos, grupos, llave, perfil) + `admin/`.
- `src/lib/scoring/` — motor de puntaje (puro + servicio DB).
- `src/lib/standings/`, `src/lib/bracket*.ts`, `src/lib/stats*.ts` — lógica pura + servicios.
- `src/lib/sync/` — sincronización de scores (window-gated) + parser openfootball.
- `src/components/retro/` — sistema de diseño retro editorial.
- `scripts/seed.ts` — seed idempotente.
