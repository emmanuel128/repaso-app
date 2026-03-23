# Web Agent Guide

## Scope
This directory contains the Repaso web application.

- Framework: Next.js 16 App Router
- Language: TypeScript
- UI styling: Tailwind CSS v4
- Runtime: React 19
- External app dependency: `@repaso/sdk`

Primary source folders:

- `src/app`: route segments and pages
- `src/components`: web UI components
- `src/lib`: client-side and shared web utilities

Current visible routes:

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/topics`

## Commands
Run commands from the repository root unless there is a reason to scope them locally.

- Dev server: `npm run dev:web`
- Local dev from this workspace: `npm run dev`
- Build: `npm run build --workspace=apps/web`
- Lint: `npm run lint --workspace=apps/web`
- Typecheck: `npm run typecheck --workspace=apps/web`

## Working Rules

- Preserve the App Router structure under `src/app`
- Keep database and auth trust boundaries in Supabase, not in the client
- Use the shared SDK and shared packages when logic is meant to be reused across apps
- Respect the repo convention: DB is `snake_case`, TypeScript is `camelCase`
- Avoid introducing parallel data contracts that drift from Supabase schema or generated APIs

## Supabase Integration

- Web Supabase helpers currently live in `src/lib/supabase.ts`
- Client code must never use a service role key
- Authorization assumptions must align with JWT claims and RLS policies defined in Supabase

## UI Notes

- This project already uses Tailwind and Next.js defaults; extend that stack instead of replacing it
- Preserve responsive behavior across desktop and mobile widths
- Reuse existing route/layout patterns before creating new top-level structures

## When Changing This App

- For new user-facing flows, check whether the needed schema or policy already exists in `infra/database/supabase`
- For auth-sensitive features, verify both the client behavior and the backing RLS assumptions
- If adding shared business logic, prefer moving it into `packages/*` instead of duplicating it in web
