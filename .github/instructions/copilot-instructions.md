# Repaso – AI Agent Instructions

**GitHub Repository:** [emmanuel128/repaso-app](https://github.com/emmanuel128/repaso-app)

Whitelabel educational exam platform. Backend: Supabase (Auth, Postgres, Edge Functions). Web: Next.js 16 App Router, React 19, Tailwind CSS v4. Mobile: Expo (no scaffold yet). Node.js engine: `24.x`.

**Detailed area guides:** [apps/web/agent.md](../../apps/web/agent.md) · [packages/agent.md](../../packages/agent.md) · [infra/database/supabase/agent.md](../../infra/database/supabase/agent.md)

## Architecture

| Area | Description |
|------|-------------|
| `apps/web` | Next.js 16, App Router, route groups `(student)` `(owner)` `(admin)` `(instructor)` |
| `apps/mobile` | Expo placeholder — no features yet |
| `infra/database/supabase` | SQL migrations, seeds, RLS, Edge Functions |
| `packages/domain` | Domain models and access predicates — namespaces: `Access`, `Admin`, `Instructor`, `Owner`, `Shared`, `Student` |
| `packages/application` | Use cases and access orchestration — same namespaces |
| `packages/infrastructure` | Supabase adapters — same namespaces |
| `packages/hooks` | React hooks — same namespaces; no `window.location` or `next/navigation` |

## Critical Import Rules

- Import shared packages via **namespaced exports only**: `import { Student } from '@repaso/hooks'` — never from `packages/*/src/...` internal paths.
- Route files and components must only import from `@repaso/hooks`. Never import `@repaso/application` or `@repaso/infrastructure` directly from route files or components.
- Cross-role access orchestration belongs in `packages/application/src/access`, not in any role slice.
- `packages/hooks` must stay free of `window.location` and `next/navigation`; navigation stays in the app layer.

## Web Dependency Wiring (apps/web)

- Web dependency composition: `src/lib/repaso-dependencies.ts`
- Hook context injection: `src/components/RepasoProviders.tsx`
- Role guard predicates: `src/lib/role-authorization.ts` — keep `RoleGuardLayout` call sites declarative; no inline role checks in layouts.
- Supabase client helpers: `src/lib/supabase.ts` — **never use `service_role` key in client code.**

## Database & Supabase Rules

- DB naming: `snake_case`; TypeScript: `camelCase`.
- Multi-tenant: `tenant_id` on all business tables; RLS + JWT claims enforce isolation.
- All schema changes are **forward-only migrations** in `infra/database/supabase/migrations/`.
- JWT claims resolve `tenant_id` and `user_role` via `public.custom_access_token_hook`. `CurrentAccess` exposes `isStudent`, `isInstructor`, `isAdmin`, `isOwner`.
- Authorization logic lives in DB/RLS and Edge Functions — not in frontend clients.

## Build & Dev Commands

```bash
npm install              # install all workspaces
npm run dev:web          # web dev server
npm run db:start         # start local Supabase
npm run db:stop          # stop local Supabase
npm run db:migrate       # apply pending migrations
npm run db:seed          # run seeds without full reset
npm run db:reset         # reset local DB + re-seed
npm run typecheck        # typecheck all workspaces
npm run lint:all         # lint all workspaces
npm run build:all        # build all workspaces
```

## Commits

Usa el formato: `<tipo>(área): descripción breve`  
Ejemplo: `feat(auth): agregar recuperación de contraseña`  
Tipos: `feat` | `fix` | `chore` | `docs` | `test` | `refactor`

Branch names: `feature/<short-description>` · `fix/<issue>` · `chore/<task>`

## Language Convention

- All **entities (tables, columns, models, interfaces, relations)** must be defined in **English**.
- User-facing text (questions, instructions, labels) may stay in Spanish.

## UI Styling

Use CSS variables from `apps/web/src/app/globals.css` (`--primary`, `--secondary`, `--accent`, etc.) — never hardcode hex colors. No React Query or SWR; use hooks only.

## CI / Quality

- After web changes: run `lint` + `typecheck` + `build` for `apps/web`.
- After DB changes: run `db:migrate` (and `db:reset` if seeds changed).
- Keep `.github/workflows/` steps idempotent.

## Docs

- `docs/project-context.md` — project overview and system architecture
- `docs/data-model.md` — schema reference, RLS helpers, JWT claims

## Pitfalls

- Importing `@repaso/application` or `@repaso/infrastructure` directly from route files or UI components.
- Bypassing `apps/web/src/lib/repaso-dependencies.ts` for infrastructure wiring in the web app.
- Bypassing `apps/web/src/components/RepasoProviders.tsx` and manually threading repos/dependencies through pages.
- Using `service_role` key anywhere in client code.
- Adding role-aware business logic under any `*/shared` namespace.
- Adding a new role/feature slice to only one package — always propagate to `domain`, `application`, `infrastructure`, and `hooks`.
- Treating `apps/mobile` as already implemented.
- Writing schema changes as anything other than forward-only SQL migrations.
- Hardcoding exam-specific text that should be tenant-configurable.
