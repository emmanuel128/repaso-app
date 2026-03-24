# Data Model

## Overview
This document describes the current PostgreSQL data model used by Repaso in Supabase.

- Source of truth: `infra/database/supabase/migrations/20251026_init.sql`
- Seed data: `infra/database/supabase/seeds/*.sql`
- Architecture: multi-tenant, with tenant-scoped business tables
- Naming: database columns and tables use `snake_case`
- Identity: application users are anchored to `auth.users`; profile and tenant membership data live in `public`

At the time of writing, the schema defines:

- 5 enum types
- 20 application tables in `public`
- Row Level Security on every application table

## Design Principles

### Multi-tenancy
Most business tables include `tenant_id` and are isolated by tenant through RLS policies driven by JWT claims.

Core tenant-scoped domains:

- tenant configuration
- educational content
- quizzes and practice
- student progress
- billing and audit data

### Authentication and identity
Supabase Auth owns the canonical user account record in `auth.users`.

Application-level user data is split into:

- `profiles`: personal profile metadata
- `user_tenants`: user-to-tenant membership plus role
- `memberships`: billing/subscription state per user and tenant

### Content model
Educational content is hierarchical:

`tenant -> areas -> topics -> content assets/questions`

Questions can then be composed into quizzes, answered in attempts, and aggregated into progress records.

## JWT Claims and Access Helpers
The schema relies on custom JWT claims and helper SQL functions for RLS.

### Helper functions

- `set_updated_at()`: trigger function that refreshes `updated_at` before update
- `jwt_claim(claim text)`: reads a claim from `auth.jwt()`
- `jwt_role()`: returns `user_role` claim
- `current_tenant_id()`: returns `tenant_id` claim as `uuid`
- `current_user_id()`: returns `sub` claim as `uuid`
- `has_any_role(roles text[])`: generic role membership helper
- `is_admin()`: true for `owner` or `admin`
- `is_instructor()`: true for `owner`, `admin`, or `instructor`

### Custom access token hook
`public.custom_access_token_hook(event jsonb)` looks up the user in `public.user_tenants` and injects:

- `tenant_id`
- `user_role`

This makes tenant and role context available to RLS policies through JWT claims.

Constraint to keep in mind:

- the hook currently selects one row from `user_tenants` for a user without explicit ordering or tenant selection logic
- if a user belongs to multiple tenants, the token will reflect whichever row is returned by the query

## Enum Types

### `role_type`
Values:

- `owner`
- `admin`
- `instructor`
- `student`

Used by:

- `user_tenants.role`

### `membership_status`
Values:

- `trialing`
- `active`
- `past_due`
- `canceled`
- `incomplete`
- `incomplete_expired`
- `unpaid`
- `paused`

Used by:

- `memberships.status`

### `question_type`
Values:

- `single_choice`
- `multiple_choice`
- `true_false`
- `free_text`

Used by:

- `questions.type`

### `difficulty`
Values:

- `easy`
- `medium`
- `hard`

Used by:

- `questions.difficulty`

### `content_status`
Values:

- `draft`
- `published`
- `archived`

Used by:

- `areas.status`
- `topics.status`
- `topic_notes.status`
- `mnemonics.status`
- `cases.status`
- `questions.status`
- `quizzes.status`

## Entity Relationship Summary

### Tenant and identity

- `tenants` has one `tenant_settings`
- `tenants` has many `tenant_domains`
- `tenants` has many `user_tenants`
- `tenants` has many `memberships`
- `profiles` is a 1:1 extension of `auth.users`
- `auth.users` can belong to many tenants through `user_tenants`

### Learning content

- `tenants` has many `areas`
- `areas` has many `topics`
- `topics` has many `topic_notes`
- `topics` can have many `mnemonics`
- `topics` can have many `cases`
- `topics` can have many `questions`

### Assessment model

- `questions` has many `question_options`
- `questions` has many `question_media`
- `questions` has many `question_tags`
- `tags` has many `question_tags`
- `quizzes` has many `quiz_questions`
- `questions` can belong to many quizzes through `quiz_questions`

### Practice and progress

- `auth.users` has many `practice_sessions`
- `auth.users` has many `attempts`
- `attempts` has many `attempt_answers`
- `attempt_answers` has many `attempt_answer_options`
- `auth.users` has many `user_topic_progress`
- `auth.users` has many `study_notes`

## Table Reference

### `tenants`
Purpose: root entity for whitelabel isolation.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `slug citext not null unique`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Relationships:

- referenced by most business tables through `tenant_id`
- parent of `tenant_settings`, `tenant_domains`, `areas`, `topics`, `questions`, `quizzes`, billing, and progress data

Behavior:

- `updated_at` maintained by trigger
- deleting a tenant cascades into most tenant-owned data

### `tenant_settings`
Purpose: branding and feature configuration for a tenant.

Columns:

- `tenant_id uuid primary key references tenants(id) on delete cascade`
- `logo_url text`
- `brand_primary text`
- `brand_secondary text`
- `features jsonb not null default '{}'::jsonb`
- `settings jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Relationships:

- 1:1 with `tenants`

Behavior:

- `features` and `settings` are flexible JSON configuration bags
- deleted automatically when the tenant is deleted

### `tenant_domains`
Purpose: maps custom domains to a tenant.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `domain citext not null unique`
- `is_primary boolean not null default false`
- `created_at timestamptz not null default now()`

Indexes:

- `idx_tenant_domains_tenant (tenant_id)`

Behavior:

- domain values are globally unique across tenants
- there is no database constraint limiting a tenant to one primary domain

### `profiles`
Purpose: app-specific user profile metadata.

Columns:

- `id uuid primary key references auth.users(id) on delete cascade`
- `first_name text`
- `last_name text`
- `avatar_url text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Relationships:

- 1:1 with `auth.users`

Behavior:

- this table does not duplicate auth credentials or email
- profile disappears automatically if the auth user is deleted

### `user_tenants`
Purpose: associates a user with a tenant and role.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `role role_type not null default 'student'`
- `created_at timestamptz not null default now()`

Constraints:

- unique `(user_id, tenant_id)`

Indexes:

- `idx_user_tenants_user (user_id)`
- `idx_user_tenants_tenant (tenant_id)`

Behavior:

- this is the core authorization mapping table
- a user may belong to multiple tenants with different roles

### `memberships`
Purpose: subscription and Stripe state per user and tenant.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `status membership_status not null`
- `stripe_customer_id text`
- `stripe_subscription_id text`
- `stripe_price_id text`
- `current_period_end timestamptz`
- `cancel_at timestamptz`
- `canceled_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- unique `(user_id, tenant_id)`

Indexes:

- `idx_memberships_tenant_status (tenant_id, status)`

Behavior:

- exactly one current membership row per user and tenant is implied by the unique key
- historical subscription versions are not modeled separately

### `payment_events`
Purpose: stores Stripe webhook events for auditability and idempotency.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `stripe_event_id text not null unique`
- `type text not null`
- `payload jsonb not null`
- `created_at timestamptz not null default now()`

Indexes:

- `idx_payment_events_tenant_created (tenant_id, created_at desc)`

Behavior:

- `stripe_event_id` is globally unique
- raw webhook payload is preserved in `payload`

### `areas`
Purpose: top-level curriculum grouping inside a tenant.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `name text not null`
- `slug citext not null`
- `description text`
- `order_index int not null default 0`
- `status content_status not null default 'published'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- unique `(tenant_id, slug)`

Indexes:

- `idx_areas_tenant_order (tenant_id, order_index)`

Behavior:

- area ordering is explicit
- area slugs are unique only inside a tenant

### `topics`
Purpose: curriculum topic inside an area.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `area_id uuid not null references areas(id) on delete cascade`
- `name text not null`
- `slug citext not null`
- `description text`
- `order_index int not null default 0`
- `status content_status not null default 'published'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- unique `(tenant_id, slug)`

Indexes:

- `idx_topics_tenant_area (tenant_id, area_id)`

Behavior:

- deleting an area cascades into its topics
- topic ordering is explicit inside the tenant

### `topic_notes`
Purpose: long-form notes tied to a topic.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `topic_id uuid not null references topics(id) on delete cascade`
- `title text not null`
- `content_md text not null`
- `status content_status not null default 'draft'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `idx_topic_notes_tenant_topic (tenant_id, topic_id)`

Behavior:

- markdown content is stored directly in the row
- deleting a topic cascades to its notes

### `mnemonics`
Purpose: memory aids associated with a topic or stored more generally at tenant level.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `topic_id uuid references topics(id) on delete set null`
- `title text not null`
- `content_md text not null`
- `status content_status not null default 'published'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `idx_mnemonics_tenant_topic (tenant_id, topic_id)`

Behavior:

- topic association is optional
- deleting a topic keeps the mnemonic and nulls `topic_id`

### `cases`
Purpose: case studies or clinical scenarios.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `topic_id uuid references topics(id) on delete set null`
- `title text not null`
- `body_md text not null`
- `status content_status not null default 'published'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `idx_cases_tenant_topic (tenant_id, topic_id)`

Behavior:

- topic association is optional
- deleting a topic preserves the case and nulls the topic reference

### `questions`
Purpose: question bank item.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `topic_id uuid references topics(id) on delete set null`
- `type question_type not null`
- `difficulty difficulty not null default 'medium'`
- `prompt text not null`
- `explanation text`
- `source text`
- `points numeric not null default 1`
- `status content_status not null default 'published'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `idx_questions_tenant_topic (tenant_id, topic_id)`
- `idx_questions_tenant_difficulty (tenant_id, difficulty)`

Behavior:

- supports multiple question formats through `type`
- correctness rules for selectable answers are represented in `question_options`
- no database check enforces that a single-choice question has exactly one correct option

### `question_options`
Purpose: answer options for objective questions.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `question_id uuid not null references questions(id) on delete cascade`
- `label text`
- `value text not null`
- `is_correct boolean not null default false`
- `explanation text`
- `order_index int not null default 0`

Indexes:

- `idx_qo_question (question_id)`

Behavior:

- options are deleted automatically when the question is deleted
- this table is also used to define the correct answer set

### `question_media`
Purpose: media attachments for questions.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `question_id uuid not null references questions(id) on delete cascade`
- `kind text not null`
- `storage_path text not null`
- `caption text`

Indexes:

- `idx_qm_question (question_id)`

Behavior:

- `kind` is free text; comments indicate expected values such as `image`, `audio`, and `video`
- there is no enum or check constraint on media type

### `tags`
Purpose: tenant-local tags for question categorization.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `name text not null`
- `slug citext not null`

Constraints:

- unique `(tenant_id, slug)`

Behavior:

- tags are tenant-scoped and reusable across questions

### `question_tags`
Purpose: many-to-many join table between questions and tags.

Columns:

- `question_id uuid not null references questions(id) on delete cascade`
- `tag_id uuid not null references tags(id) on delete cascade`

Constraints:

- primary key `(question_id, tag_id)`

Behavior:

- deleting either side removes the association automatically

### `quizzes`
Purpose: curated assessment containers.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `title text not null`
- `description text`
- `slug citext not null`
- `is_public boolean not null default false`
- `status content_status not null default 'draft'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- unique `(tenant_id, slug)`

Indexes:

- `idx_quizzes_tenant_public (tenant_id, is_public)`

Behavior:

- public visibility is represented by `is_public`
- publication state is represented separately by `status`

### `quiz_questions`
Purpose: question ordering and optional scoring overrides inside a quiz.

Columns:

- `quiz_id uuid not null references quizzes(id) on delete cascade`
- `question_id uuid not null references questions(id) on delete cascade`
- `position int not null default 0`
- `points_override numeric`

Constraints:

- primary key `(quiz_id, question_id)`

Behavior:

- the same question can appear in many quizzes
- `points_override` allows quiz-specific scoring without modifying base question points

### `practice_sessions`
Purpose: tracks a user’s self-directed practice run.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `topic_id uuid references topics(id) on delete set null`
- `config jsonb not null default '{}'::jsonb`
- `started_at timestamptz not null default now()`
- `ended_at timestamptz`

Indexes:

- `idx_practice_sessions_user (user_id, started_at desc)`

Behavior:

- `config` stores dynamic practice settings such as question count, difficulty, or tags
- deleting the linked topic preserves the session and nulls `topic_id`

### `attempts`
Purpose: top-level attempt record for a quiz or practice session.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `quiz_id uuid references quizzes(id) on delete set null`
- `practice_session_id uuid references practice_sessions(id) on delete set null`
- `started_at timestamptz not null default now()`
- `submitted_at timestamptz`
- `score numeric default 0`
- `max_score numeric default 0`

Indexes:

- `idx_attempts_user (user_id, started_at desc)`
- `idx_attempts_tenant (tenant_id, started_at desc)`

Behavior:

- an attempt may be attached to a quiz, a practice session, or potentially both
- the database does not enforce exclusivity between `quiz_id` and `practice_session_id`

### `attempt_answers`
Purpose: per-question answer record inside an attempt.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `attempt_id uuid not null references attempts(id) on delete cascade`
- `question_id uuid not null references questions(id) on delete cascade`
- `is_correct boolean`
- `score numeric default 0`
- `answered_at timestamptz not null default now()`
- `free_text_answer text`

Indexes:

- `idx_attempt_answers_attempt (attempt_id)`
- `idx_attempt_answers_question (question_id)`

Behavior:

- supports objective and free-text responses
- selected options, when relevant, are stored in `attempt_answer_options`
- there is no unique constraint preventing multiple answer rows for the same `(attempt_id, question_id)`

### `attempt_answer_options`
Purpose: selected options for an `attempt_answers` row.

Columns:

- `attempt_answer_id uuid not null references attempt_answers(id) on delete cascade`
- `option_id uuid not null references question_options(id) on delete cascade`
- `selected boolean not null default true`

Constraints:

- primary key `(attempt_answer_id, option_id)`

Behavior:

- primarily models which options were chosen
- `selected` is redundant with row existence for current usage, but could support soft toggling semantics

### `user_topic_progress`
Purpose: aggregate progress per user, tenant, and topic.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `topic_id uuid not null references topics(id) on delete cascade`
- `total_correct int not null default 0`
- `total_incorrect int not null default 0`
- `last_score numeric`
- `last_attempt_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- unique `(tenant_id, user_id, topic_id)`

Indexes:

- `idx_utp_tenant_user (tenant_id, user_id)`

Behavior:

- designed as a denormalized summary table
- likely updated by application or backend logic rather than triggers in the current schema

### `study_notes`
Purpose: user-authored notes tied to a topic and/or question.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `topic_id uuid references topics(id) on delete set null`
- `question_id uuid references questions(id) on delete set null`
- `content_md text not null`
- `is_private boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `idx_study_notes_user (user_id, created_at desc)`
- `idx_study_notes_tenant (tenant_id)`

Behavior:

- notes default to private
- topic and question references are optional and independently nullable

### `audit_log`
Purpose: append-oriented audit trail for tenant activity.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid references tenants(id) on delete set null`
- `actor_user_id uuid references auth.users(id) on delete set null`
- `event_type text not null`
- `entity_type text not null`
- `entity_id uuid`
- `data jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Indexes:

- `idx_audit_tenant_created (tenant_id, created_at desc)`

Behavior:

- tenant and actor are nullable to preserve historical records if referenced rows are removed
- no insert/update policies are currently defined in the migration; only admin read access exists

## Delete Semantics

### Cascading deletes
The following patterns use `on delete cascade`:

- deleting a tenant removes most tenant-owned records
- deleting a user removes `profiles`, `user_tenants`, `memberships`, `practice_sessions`, `attempts`, `user_topic_progress`, and `study_notes`
- deleting a question removes `question_options`, `question_media`, `question_tags`, and dependent attempt answers
- deleting a quiz removes `quiz_questions`
- deleting an attempt removes `attempt_answers`, which then remove `attempt_answer_options`

### Nulling foreign keys
The following relationships are intentionally preserved with `set null`:

- `mnemonics.topic_id`
- `cases.topic_id`
- `questions.topic_id`
- `practice_sessions.topic_id`
- `attempts.quiz_id`
- `attempts.practice_session_id`
- `study_notes.topic_id`
- `study_notes.question_id`
- `audit_log.tenant_id`
- `audit_log.actor_user_id`

## Row Level Security Model
All documented tables have RLS enabled.

### Admin-only tenant management

- `tenants`: admins can select and modify
- `tenant_settings`: admins can read/write within current tenant
- `tenant_domains`: admins can read/write within current tenant
- `payment_events`: admins can read/write within current tenant
- `audit_log`: admins can read within current tenant

### Self-service user data

- `profiles`: users can select and update only their own profile
- `user_tenants`: users can view their own links; admins can manage tenant links
- `memberships`: users can view their own memberships; admins can manage tenant memberships
- `study_notes`: users can read/write only their own notes in the active tenant
- `practice_sessions`: users can read/write only their own sessions in the active tenant
- `attempts`: users can read/write only their own attempts in the active tenant
- `attempt_answers`: users can read/write only answers that belong to their own attempts
- `attempt_answer_options`: users can read/write only selected options that belong to their own attempts

### Tenant content access

- `areas`, `topics`, `topic_notes`, `mnemonics`, `cases`, `questions`, `quizzes`
  - any user in the current tenant can read
  - instructors and above can write

### Content child tables

- `question_options`, `question_media`, `question_tags`, `quiz_questions`
  - access is inherited indirectly through the parent question or quiz
  - writes require instructor-level privileges through the parent entity

### Progress tables

- `user_topic_progress`
  - users can read only their own progress in the current tenant
  - instructors and above can write within the tenant

## Seeded Baseline Data
The ordered seed files create a minimal default tenant setup.

### Default tenant

- `tenants.id = 11111111-1111-1111-1111-111111111111`
- `name = 'Default Tenant'`
- `slug = 'default'`

### Default settings

- `tenant_settings.features = {"onboarding": true}`

### Initial curriculum

- area: `General`
- topic: `Introductions`

These seeds exist for local/bootstrap use and are not a substitute for full curriculum content.

## Current Gaps and Implicit Rules
These are not enforced by the database today, but they are important application-level considerations.

- multi-tenant token selection is ambiguous for users in multiple tenants because the auth hook reads a single `user_tenants` row without explicit selection logic
- `question_type` semantics are not enforced with check constraints
- `question_media.kind` is free text
- `tenant_domains` does not enforce a single primary domain per tenant
- `attempts` does not enforce whether an attempt must belong to exactly one of quiz or practice session
- `attempt_answers` does not enforce one answer per question per attempt
- `user_topic_progress` is denormalized but has no database trigger maintenance
- there are no explicit soft-delete columns anywhere in the schema

## Recommended Reading Order for Implementation Work
When making product or backend changes, use this order:

1. `tenants`, `user_tenants`, and JWT helpers for tenant and role assumptions
2. `areas`, `topics`, and content tables for curriculum changes
3. `questions`, `question_options`, `tags`, and `question_tags` for item-bank work
4. `quizzes`, `practice_sessions`, `attempts`, and answer tables for exam flows
5. `user_topic_progress`, `study_notes`, `memberships`, and `audit_log` for user state and operational concerns
