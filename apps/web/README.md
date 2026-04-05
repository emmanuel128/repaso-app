# Web App

Next.js 16 App Router application for the current Repaso student experience, with route-group scaffolding for future owner, admin, and instructor surfaces.

## Current Structure

- `src/app/(student)`: current student-facing routes
- `src/app/(owner)`: placeholder owner routes and layout
- `src/app/(admin)`: placeholder admin routes and layout
- `src/app/(instructor)`: placeholder instructor routes and layout
- `src/app/dashboard/page.tsx`: role-based dashboard switcher
- `src/components`: shared web UI
- `src/components/RepasoProviders.tsx`: root provider assembly for shared access and student dependencies
- `src/lib/supabase.ts`: low-level web Supabase/auth bootstrap
- `src/lib/repaso-dependencies.ts`: web dependency composition boundary
- `src/lib/role-authorization.ts`: shared role-area authorization helpers for guarded layouts

## Dependency Rules

- Web routes and components should consume shared access and student logic through namespaced hooks from `@repaso/hooks`
- Web routes and components may use `@repaso/domain` types, but should not import `@repaso/application` or `@repaso/infrastructure` directly
- `src/components/RepasoProviders.tsx` is the root context bridge that wires web dependencies into `@repaso/hooks`
- Infrastructure assembly for the web app lives behind `src/lib/repaso-dependencies.ts`
- `src/lib/supabase.ts` and `src/lib/repaso-dependencies.ts` are the allowed web boundary to infrastructure
- Role-gated layouts should reuse helpers from `src/lib/role-authorization.ts` instead of inline role predicates

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

## Authorization Notes

- `Access.useCurrentAccess()` is the shared headless access hook consumed by the web app
- `(admin)`, `(instructor)`, and `(owner)` layouts are guarded through `RoleGuardLayout` plus shared helpers in `src/lib/role-authorization.ts`
- The current role rules are exact-match checks for `admin`, `instructor`, and `owner`

## Commands

Run from the repository root unless you need workspace-local execution.

- Dev: `npm run dev:web`
- Local workspace dev: `npm run dev --workspace=apps/web`
- Build: `npm run build --workspace=apps/web`
- Lint: `npm run lint --workspace=apps/web`
- Typecheck: `npm run typecheck --workspace=apps/web`
