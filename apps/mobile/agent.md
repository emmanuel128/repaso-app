# Mobile Agent Guide

## Scope
This directory is reserved for the Repaso mobile application.

- Target platforms: iOS and Android
- Planned framework: Expo with React Native
- Expected sharing model: `packages/domain`, `packages/application`, and `packages/hooks`
- Current status: scaffold placeholder only

Right now this directory contains no mobile implementation beyond `.gitkeep`.

## Commands
There is currently no local mobile package manifest in this directory.

Relevant repo-level intent:

- Root script expects future support for `npm run dev:mobile`

Before adding code here:

- create the actual Expo app scaffold
- add an `apps/mobile/package.json`
- align workspace scripts with the chosen Expo setup

## Working Rules

- Treat this project as future-facing; do not document or assume implemented mobile features that do not exist
- Keep mobile-specific UI in this app, but push reusable domain logic into `packages/*`
- Reuse the same Supabase backend and schema as the web app
- Keep the whitelabel architecture intact
- When role-specific mobile surfaces arrive, mirror the web split between shared code and role-oriented app shells
- Mirror the web dependency strategy: keep mobile-specific assembly in the mobile app layer, and consume `packages/domain`, `packages/application`, and `packages/hooks` directly rather than importing web-only utilities

## Implementation Expectations

- Authentication should rely on Supabase Auth
- Data access should follow the same RLS and tenant assumptions as web
- Database schema changes must be made in Supabase migrations, not through app-local assumptions
- Shared types and SDK integrations should come from workspace packages where possible

## If You Start Building Mobile

- add the minimal Expo scaffold first
- define clear app entrypoints and environment handling
- wire auth and data access through shared abstractions instead of duplicating the web client setup blindly
- prefer consuming `packages/hooks` and `packages/application` rather than importing Supabase queries directly into screens
- document any new commands here once the project exists
