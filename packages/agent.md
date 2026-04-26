# Packages Guide

This document describes the current structure and intended boundaries of the shared internal packages under `packages/`.

## Package Layout

The monorepo currently has four internal shared packages:

- `@repaso/domain`
- `@repaso/application`
- `@repaso/infrastructure`
- `@repaso/hooks`

Each package root exposes **namespaced exports only**.

### `@repaso/domain`

Root namespaces:

- `Access`
- `Admin`
- `Instructor`
- `Owner`
- `Shared`
- `Student`

Current responsibilities:

- `Access`: centralized access policy and role predicates
- `Instructor`: scaffolded instructor feature namespaces for future analytics and management flows
- `Shared`: primitive/base types such as auth state, membership, raw role types
- `Student`: student-facing domain models

Important rule:

- Do not place role-aware business logic under `domain/shared`.

### `@repaso/application`

Root namespaces:

- `Access`
- `Admin`
- `Instructor`
- `Owner`
- `Student`

Current responsibilities:

- `Access`: orchestration for current-access resolution
- `Instructor`: scaffolded instructor use-case namespaces and placeholder contracts
- `Student`: student use cases and repository contracts

Important rule:

- Cross-role access orchestration belongs in `application/access`, not in any role slice.

### `@repaso/infrastructure`

Root namespaces:

- `Access`
- `Admin`
- `Instructor`
- `Owner`
- `Shared`
- `Student`

Current responsibilities:

- `Access`: neutral persistence adapters for current access
- `Instructor`: scaffolded instructor repository namespaces reserved for future analytics/data adapters
- `Shared`: Supabase auth/client primitives
- `Student`: student repository implementation

Important rule:

- Do not add multi-role or student-specific repository logic under `infrastructure/shared`.

### `@repaso/hooks`

Root namespaces:

- `Access`
- `Admin`
- `Instructor`
- `Owner`
- `Student`

Current responsibilities:

- `Access`: `CurrentAccessProvider` and `useCurrentAccess`
- `Instructor`: scaffolded instructor hook namespaces reserved for future UI integration
- `Student`: student hooks, repository dependency context, and student mutations

Important rule:

- `packages/hooks` must stay free of `window.location` and `next/navigation`; navigation remains in the app layer.

## Current Slice Structure

### Neutral access stack

The shared access flow is intentionally split across packages:

- `@repaso/infrastructure.Access.createSupabaseAccessRepository`
- `@repaso/application.Access.resolveCurrentAccess`
- `@repaso/hooks.Access.CurrentAccessProvider`
- `@repaso/hooks.Access.useCurrentAccess`
- `@repaso/domain.Access.*` for access predicates and role helpers

`CurrentAccess` currently includes:

- `isStudent`
- `isInstructor`
- `isAdmin`
- `isOwner`

### Student stack

The implemented vertical slice today is `Student`.

In practice:

- `@repaso/domain.Student` holds student entities and DTOs
- `@repaso/application.Student` holds student use cases and the `StudentRepository` contract
- `@repaso/infrastructure.Student` provides the Supabase student repository
- `@repaso/hooks.Student` provides student dependency wiring and student hooks

The student hooks namespace currently exposes:

- `StudentDependenciesProvider`
- `useAreasWithTopics`
- `useAttemptReview`
- `useDashboard`
- `useGlobalSearch`
- `usePracticeContent`
- `usePracticeMutations`
- `useTopicDetail`

### Instructor scaffold

Instructor now has a scaffolded vertical slice shape across all shared packages.

Current instructor feature namespaces:

- `Dashboard`
- `CohortMonitoring`
- `IndividualDiagnosis`
- `StudentManagement`
- `QuestionAnalysis`

These namespaces are placeholders only. They establish stable module boundaries without claiming implemented instructor analytics.

## Rules For Future Changes

- Import shared packages through their public namespaces, never via package-internal source paths.
- Centralize authorization predicates in `@repaso/domain.Access`.
- Keep access orchestration in `@repaso/application.Access`.
- Keep auth/data adapters in `@repaso/infrastructure`, not in apps.
- Keep role-specific business logic out of `shared`.
- If a new role slice is introduced, add it consistently across `domain`, `application`, `infrastructure`, and `hooks`.
- `Instructor` now has scaffolded feature namespaces; `Admin` and `Owner` remain placeholder slices until they gain real behavior.

## Fast Reference

Use these namespaces when wiring the app layer:

- `Domain.Access` for route authorization and role predicates
- `Domain.Shared` for shared primitive types like `CurrentAccess`
- `Application.Access` for access dependencies and resolution
- `Application.Student` for student use cases
- `Infrastructure.Access` for access repositories
- `Infrastructure.Student` for student repositories
- `Hooks.Access` for current-access context/hooks
- `Hooks.Student` for student-focused React hooks
