# Supabase Agent Guide

## Scope
This directory contains the backend source of truth for Repaso.

- Database: PostgreSQL on Supabase
- Backend model: migrations, seeds, Row Level Security, and Edge Functions
- Source of truth for schema: `migrations/`
- Seed data: `seeds/seed.sql`
- Edge Functions: `functions/`

Current function directories:

- `functions/auth-webhook`
- `functions/hello`

## Commands
Preferred commands from the repository root:

- Start local Supabase: `npm run db:start`
- Stop local Supabase: `npm run db:stop`
- Apply migrations: `npm run db:migrate`
- Reset local DB: `npm run db:reset`

Direct workspace commands:

- `npm run start --workspace=infra/database`
- `npm run stop --workspace=infra/database`
- `npm run migrate --workspace=infra/database`
- `npm run reset --workspace=infra/database`

Deployment-oriented scripts defined in `infra/database/package.json`:

- `deploy-function`
- `seed`
- `deploy`

## Working Rules

- Treat SQL migrations as the canonical schema history
- Do not edit production state manually in docs or application code and pretend the schema changed
- Add new schema changes as forward migrations only
- Keep tenant isolation and RLS intact
- Do not move critical authorization logic into frontend clients
- Keep DB naming in `snake_case`

## Schema and Security

- Multi-tenancy is implemented with `tenant_id` on business tables
- Access control depends on JWT claims plus RLS policies
- `auth.users` is the identity source; app-level user data is modeled in `public`
- The custom auth token hook and `user_tenants` relationship are central to tenant/role resolution

Before changing access behavior:

- inspect the relevant policies in the migration history
- verify whether JWT claim expectations also need to change
- document any non-obvious security implications

## Edge Functions

- Keep server-side secrets and privileged operations in Edge Functions or secure backend paths
- Avoid duplicating logic between SQL/RLS and Edge Functions without a clear boundary
- If a function depends on schema changes, land the migration and function change together

## Documentation Pointers

- Project-wide context: `docs/project-context.md`
- Detailed schema reference: `docs/data-model.md`

Use those documents as summaries, but treat the SQL migrations in this directory as authoritative when there is any mismatch.
