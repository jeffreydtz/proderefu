# Prode Mundial 2026 ⚽

Prode (pool de pronósticos) privado del Mundial 2026. Pozo único y cerrado:
solo el admin (vos) invita jugadores. Pronósticos del marcador a 120′, tabla con
puntos automáticos, fixture por día, tablas de grupo, llave eliminatoria,
estadísticas personales y recordatorios por email. Estética retro editorial
(crema · tinta · rojo ladrillo · dorado · verde cancha) con modo claro y oscuro,
y UI **mobile-first**.

**En producción:** https://proderefu.vercel.app — deploy automático al pushear a `main`.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Drizzle ORM +
Postgres (**Supabase**) · NextAuth v5 (passkeys/WebAuthn) · shadcn/ui · Vitest.

> Para agentes / contribuidores: leé **`AGENTS.md`** — tiene el estado vivo de la
> infra (Supabase, Vercel), variables, deploy, branding y convenciones mobile.

## Reglas de puntaje

- Resultado **exacto** = 3 pts · acertar el **resultado** (gana/empata/pierde) = 1 pt · errar = 0.
- Se puntúa el marcador de **120′** (no los penales). Configurable en `/admin/ajustes`.
- Desempates en la tabla: puntos → exactos → resultados → menor error de diferencia de gol → nombre.

## Puesta en marcha (local)

```bash
pnpm install
cp .env.example .env.local      # completá DATABASE_URL (pooler), AUTH_SECRET, OWNER_EMAIL
pnpm db:push                    # aplica el esquema (migraciones drizzle/) — si la DB está vacía
pnpm db:seed                    # carga 48 equipos + 104 partidos + settings + invitación admin
pnpm dev
```

`pnpm db:seed` imprime un link `/invite/<token>`. Abrilo, registrá tu passkey y
quedás como **admin** (porque tu email = `OWNER_EMAIL`).

### Variables de entorno

Mínimas: `DATABASE_URL` (Supabase, **transaction pooler**, puerto 6543),
`AUTH_SECRET` (`npx auth secret`), `NEXT_PUBLIC_APP_URL`, `OWNER_EMAIL`.
Opcionales: `FOOTBALL_DATA_TOKEN` (scores en vivo), SMTP `EMAIL_SERVER_*` + `EMAIL_FROM`
(invitaciones y recordatorios), `CRON_SECRET` (crons). Ver `.env.example` y `AGENTS.md`.

> La app habla con Postgres **directo** (Drizzle/postgres.js), no usa el SDK ni Auth de
> Supabase. Por eso va el string **pooler** (con `prepare:false`) y RLS está activado en
> todas las tablas públicas sin policies (la app entra como `postgres`, owner, y la
> saltea; cierra el acceso anónimo vía PostgREST).

## Fixture / fuente de datos (gratis)

- **Estructura (equipos, grupos, partidos):** [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) — dominio público, sin API key. La usa el seed.
- **Scores en vivo:** [football-data.org](https://www.football-data.org/) v4, plan gratuito (token requerido). Se sincroniza solo en la ventana de cada partido.

> El seed es **idempotente**: re-ejecutalo si el fixture de openfootball se actualiza.
> Siempre podés cargar resultados a mano en `/admin/resultados` (manda sobre la sync).

## Deploy (Vercel + Supabase, capa gratuita)

El proyecto ya está en producción y conectado por Git (push a `main` = deploy).

1. **Base de datos:** Supabase (proyecto `glfcpxcnbyzvaofxdsjk`). Esquema y datos ya
   cargados. Para una DB nueva: aplicá `drizzle/` (o `pnpm db:push`) y corré `pnpm db:seed`.
2. **Env vars en Vercel:** editá `.env.vercel` (gitignored) y corré
   `bash scripts/setup-vercel-env.sh`. Poné `NEXT_PUBLIC_APP_URL` con el **dominio
   definitivo** — las passkeys quedan atadas a él.
3. **Deploy:** `git push origin main` (auto) o `npx vercel --prod`.
4. `vercel.json` programa el cron diario `keepalive` (reconcilia scores). Vercel manda
   `Authorization: Bearer $CRON_SECRET` automáticamente.

> Si un deploy falla, casi siempre es una env var faltante: `src/db/index.ts` tira error
> al importar si no está `DATABASE_URL`.

### Crons externos (gratis, [cron-job.org](https://cron-job.org))

El plan hobby de Vercel limita los crons a 1/día, así que estos van por fuera.
En cada job agregá el header `Authorization: Bearer <CRON_SECRET>` y limitá el
rango de fechas a jun–jul 2026:

| Job | URL | Frecuencia |
| --- | --- | --- |
| Scores en vivo | `https://proderefu.vercel.app/api/cron/sync` | `*/5 * * * *` (se auto-gatea a la ventana del partido) |
| Recordatorios | `https://proderefu.vercel.app/api/cron/reminders` | `0 * * * *` (cada hora) |

## Branding / iconos

Todo se genera por código (sin assets binarios) desde `src/lib/brand.ts` vía
convenciones de Next + `next/og`: favicon (`app/icon.svg`), apple-icon, icono PWA
512 maskable, imágenes OG/Twitter y `manifest`. Logo in-app: `BrandLogo`. Para
cambiarlos, usá el skill **`app-icons`** (`.claude/skills/app-icons/`).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm db:push` | aplica el esquema a la DB |
| `pnpm db:generate` | genera migración desde el esquema |
| `pnpm db:seed` | carga el fixture + settings + invitación admin |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm test` | Vitest (scoring, grupos, llave, stats, locks) |
| `pnpm lint` | ESLint |
| `bash scripts/setup-vercel-env.sh` | sube las env vars de `.env.vercel` a Vercel |

## Estructura

- `src/app/(app)/` — app autenticada (tabla, pronosticos, partidos, grupos, llave, perfil) + `admin/`.
- `src/lib/scoring/` — motor de puntaje (puro + servicio DB).
- `src/lib/standings/`, `src/lib/bracket*.ts`, `src/lib/stats*.ts` — lógica pura + servicios.
- `src/lib/sync/` — sincronización de scores (window-gated) + parser openfootball.
- `src/lib/brand.ts` — paleta + marca; alimenta iconos y `BrandLogo`.
- `src/components/retro/` — sistema de diseño retro editorial.
- `scripts/seed.ts` — seed idempotente · `scripts/setup-vercel-env.sh` — env de Vercel.
