# Web App

Next.js 16 App Router application for the current Repaso student experience, with route-group scaffolding for future owner, admin, and instructor surfaces.

## Current Structure

- `src/app/(student)`: current student-facing routes
- `src/app/(owner)`: placeholder owner routes and layout
- `src/app/(admin)`: placeholder admin routes and layout
- `src/app/(instructor)`: placeholder instructor routes and layout
- `src/app/dashboard/page.tsx`: role-based dashboard switcher
- `src/components`: shared web UI
- `src/lib/supabase.ts`: low-level web Supabase/auth bootstrap
- `src/lib/repaso-dependencies.ts`: web dependency composition boundary

## Dependency Rules

- Web routes and components should consume shared logic from `@repaso/hooks`, `@repaso/application`, and `@repaso/domain`
- Web routes and components should not import `@repaso/infrastructure` directly
- Infrastructure assembly for the web app lives behind `src/lib/repaso-dependencies.ts`
- `src/lib/supabase.ts` and `src/lib/repaso-dependencies.ts` are the allowed web boundary to infrastructure

## Current User-Facing Routes

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/topics`
- `/topics/[slug]`
- `/topics/[slug]/practice`
- `/topics/[slug]/practice/summary`
- `/search`
- `/attempts/[attemptId]`
- `/owner`
- `/admin`
- `/instructor`

## Commands

Run from the repository root unless you need workspace-local execution.

- Dev: `npm run dev:web`
- Local workspace dev: `npm run dev --workspace=apps/web`
- Build: `npm run build --workspace=apps/web`
- Lint: `npm run lint --workspace=apps/web`
- Typecheck: `npm run typecheck --workspace=apps/web`
