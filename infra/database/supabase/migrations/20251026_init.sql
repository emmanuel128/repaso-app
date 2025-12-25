-- Repaso Psicología PR — DB bootstrap (Supabase / PostgreSQL)
-- Fecha: 2025-10-28
-- Convenciones: entidades en inglés, snake_case, multi-tenant (tenant_id en tablas de negocio)
-- Ejecuta con Supabase CLI como una migración inicial.

-- Extensions
-- questions: Item/question bank for quizzes and practice, linked to topics.
-- =========================
create extension if not exists pgcrypto;       -- gen_random_uuid()
create extension if not exists pg_trgm;        -- búsquedas LIKE/ILIKE veloces
create extension if not exists citext;         -- texto case-insensitive

-- =========================
-- Helper functions & triggers
-- =========================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

create or replace function jwt_claim(claim text)
returns text language sql stable as $$
  select nullif(auth.jwt() ->> claim, '')
$$;

create or replace function jwt_role()
returns text language sql stable as $$
  select coalesce(jwt_claim('user_role'), '')
$$;

create or replace function current_tenant_id()
returns uuid language sql stable as $$
  select (jwt_claim('tenant_id'))::uuid
$$;

create or replace function current_user_id()
returns uuid language sql stable as $$
  select (jwt_claim('sub'))::uuid
$$;

create or replace function has_any_role(roles text[])
returns boolean language sql stable as $$
  select jwt_role() = any(roles)
$$;

create or replace function is_admin()
returns boolean language sql stable as $$
  select jwt_role() in ('owner','admin')
$$;

create or replace function is_instructor()
returns boolean language sql stable as $$
  select jwt_role() in ('owner','admin','instructor')
$$;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer -- Add this line to bypass RLS
set search_path = public -- Security best practice for definer functions
as $$
  declare
    _tenant_id uuid;
    _role role_type;
  begin

    -- 1. Fetch values into variables
    select ut.tenant_id, ut.role
    into _tenant_id, _role
    from public.user_tenants ut
    where ut.user_id = (event ->> 'user_id')::uuid;

    -- 2. Inject claims into the event object
    -- If no record is found, it will just skip adding these specific claims
    if _tenant_id is not null then
      event := jsonb_set(event, '{claims, tenant_id}', to_jsonb(_tenant_id));
      event := jsonb_set(event, '{claims, user_role}', to_jsonb(_role::text));
    end if;
    
    -- RAISE LOG 'Auth Hook Output: %', event;

    return event;
  end;
$$;

-- =========================
-- Enums
-- =========================
create type role_type as enum ('owner','admin','instructor','student');
create type membership_status as enum (
  'trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid','paused'
);
create type question_type as enum ('single_choice','multiple_choice','true_false','free_text');
create type difficulty as enum ('easy','medium','hard');
create type content_status as enum ('draft','published','archived');

-- =========================
-- Core: tenants, profiles, mapping usuario↔tenant
-- =========================
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tenants_set_updated_at
  before update on tenants for each row execute procedure set_updated_at();

create table if not exists tenant_settings (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  logo_url text,
  brand_primary text,
  brand_secondary text,
  features jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tenant_settings_set_updated_at
  before update on tenant_settings for each row execute procedure set_updated_at();

create table if not exists tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  domain citext not null unique,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_tenant_domains_tenant on tenant_domains(tenant_id);

-- Perfil de usuario vinculado a auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at
  before update on profiles for each row execute procedure set_updated_at();

-- Usuarios pertenecen a uno o más tenants con un rol
create table if not exists user_tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  role role_type not null default 'student',
  created_at timestamptz not null default now(),
  unique (user_id, tenant_id)
);
create index if not exists idx_user_tenants_user on user_tenants(user_id);
create index if not exists idx_user_tenants_tenant on user_tenants(tenant_id);

-- Membresías/Stripe por usuario y tenant
create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  status membership_status not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tenant_id)
);
create trigger memberships_set_updated_at
  before update on memberships for each row execute procedure set_updated_at();
create index if not exists idx_memberships_tenant_status on memberships(tenant_id, status);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  stripe_event_id text not null unique,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_payment_events_tenant_created on payment_events(tenant_id, created_at desc);

-- =========================
-- Contenido: áreas, tópicos, notas, mnemonics, casos
-- =========================
create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  slug citext not null,
  description text,
  order_index int not null default 0,
  status content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create trigger areas_set_updated_at before update on areas for each row execute procedure set_updated_at();
create index if not exists idx_areas_tenant_order on areas(tenant_id, order_index);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  area_id uuid not null references areas(id) on delete cascade,
  name text not null,
  slug citext not null,
  description text,
  order_index int not null default 0,
  status content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create trigger topics_set_updated_at before update on topics for each row execute procedure set_updated_at();
create index if not exists idx_topics_tenant_area on topics(tenant_id, area_id);

create table if not exists topic_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  title text not null,
  content_md text not null,
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger topic_notes_set_updated_at before update on topic_notes for each row execute procedure set_updated_at();
create index if not exists idx_topic_notes_tenant_topic on topic_notes(tenant_id, topic_id);

create table if not exists mnemonics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  title text not null,
  content_md text not null,
  status content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger mnemonics_set_updated_at before update on mnemonics for each row execute procedure set_updated_at();
create index if not exists idx_mnemonics_tenant_topic on mnemonics(tenant_id, topic_id);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  title text not null,
  body_md text not null,
  status content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger cases_set_updated_at before update on cases for each row execute procedure set_updated_at();
create index if not exists idx_cases_tenant_topic on cases(tenant_id, topic_id);

-- =========================
-- Preguntas y banco de ítems
-- =========================
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  type question_type not null,
  difficulty difficulty not null default 'medium',
  prompt text not null,
  explanation text,
  source text,
  points numeric not null default 1,
  status content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger questions_set_updated_at before update on questions for each row execute procedure set_updated_at();
create index if not exists idx_questions_tenant_topic on questions(tenant_id, topic_id);
create index if not exists idx_questions_tenant_difficulty on questions(tenant_id, difficulty);

-- question_options: Possible answer options for each question.
create table if not exists question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  label text,
  value text not null,
  is_correct boolean not null default false,
  explanation text,
  order_index int not null default 0
);
create index if not exists idx_qo_question on question_options(question_id);

-- question_media: Media (image, audio, video) attached to questions.
create table if not exists question_media (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  kind text not null,              -- image, audio, video
  storage_path text not null,
  caption text
);
create index if not exists idx_qm_question on question_media(question_id);

-- tags: Optional tags for categorizing questions.
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  slug citext not null,
  unique (tenant_id, slug)
);
  -- question_tags: Many-to-many mapping between questions and tags.
create table if not exists question_tags (
  question_id uuid not null references questions(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (question_id, tag_id)
);

-- =========================
-- Quizzes/exams & práctica
-- =========================
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  description text,
  slug citext not null,
  is_public boolean not null default false,
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create trigger quizzes_set_updated_at before update on quizzes for each row execute procedure set_updated_at();
create index if not exists idx_quizzes_tenant_public on quizzes(tenant_id, is_public);

create table if not exists quiz_questions (
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  position int not null default 0,
  points_override numeric,
  primary key (quiz_id, question_id)
);

create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  config jsonb not null default '{}'::jsonb,  -- e.g., num_questions, difficulty, tags
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists idx_practice_sessions_user on practice_sessions(user_id, started_at desc);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete set null,
  practice_session_id uuid references practice_sessions(id) on delete set null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric default 0,
  max_score numeric default 0
);
create index if not exists idx_attempts_user on attempts(user_id, started_at desc);
create index if not exists idx_attempts_tenant on attempts(tenant_id, started_at desc);

create table if not exists attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  is_correct boolean,
  score numeric default 0,
  answered_at timestamptz not null default now(),
  free_text_answer text
);
create index if not exists idx_attempt_answers_attempt on attempt_answers(attempt_id);
create index if not exists idx_attempt_answers_question on attempt_answers(question_id);

create table if not exists attempt_answer_options (
  attempt_answer_id uuid not null references attempt_answers(id) on delete cascade,
  option_id uuid not null references question_options(id) on delete cascade,
  selected boolean not null default true,
  primary key (attempt_answer_id, option_id)
);

-- =========================
-- Progreso del estudiante y notas
-- =========================
create table if not exists user_topic_progress (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  total_correct int not null default 0,
  total_incorrect int not null default 0,
  last_score numeric,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, topic_id)
);
create trigger utp_set_updated_at before update on user_topic_progress for each row execute procedure set_updated_at();
create index if not exists idx_utp_tenant_user on user_topic_progress(tenant_id, user_id);

create table if not exists study_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  question_id uuid references questions(id) on delete set null,
  content_md text not null,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger study_notes_set_updated_at before update on study_notes for each row execute procedure set_updated_at();
create index if not exists idx_study_notes_user on study_notes(user_id, created_at desc);
create index if not exists idx_study_notes_tenant on study_notes(tenant_id);

-- =========================
-- Auditoría
-- =========================
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_tenant_created on audit_log(tenant_id, created_at desc);

-- =========================
-- RLS (Row Level Security)
-- Nota: Denegar por defecto; luego abrir con políticas específicas.
-- =========================
-- Tenants: sólo admins pueden ver/editar su propio tenant
alter table tenants enable row level security;
create policy tenants_select on tenants for select using (is_admin());
create policy tenants_modify on tenants for all using (is_admin()) with check (true);

alter table tenant_settings enable row level security;
create policy tenant_settings_rw on tenant_settings
  for all using (tenant_id = current_tenant_id() and is_admin())
  with check (tenant_id = current_tenant_id());

alter table tenant_domains enable row level security;
create policy tenant_domains_rw on tenant_domains
  for all using (tenant_id = current_tenant_id() and is_admin())
  with check (tenant_id = current_tenant_id());

-- Profiles: cada usuario ve/edita sólo su perfil
alter table profiles enable row level security;
create policy profiles_self_select on profiles for select using (id = current_user_id());
create policy profiles_self_update on profiles for update using (id = current_user_id()) with check (id = current_user_id());

-- User-tenants: el usuario ve sus vínculos; admin del tenant puede gestionarlos
alter table user_tenants enable row level security;
create policy ut_select_self on user_tenants for select using (user_id = current_user_id());
create policy ut_admin_rw on user_tenants for all using (
  tenant_id = current_tenant_id() and is_admin()
) with check (tenant_id = current_tenant_id());

-- Memberships: lectura propia; admins del tenant lectura total
alter table memberships enable row level security;
create policy m_select_self on memberships for select using (
  user_id = current_user_id()
);
create policy m_admin_rw on memberships for all using (
  tenant_id = current_tenant_id() and is_admin()
) with check (tenant_id = current_tenant_id());

alter table payment_events enable row level security;
create policy pe_admin_rw on payment_events for all using (
  tenant_id = current_tenant_id() and is_admin()
) with check (tenant_id = current_tenant_id());

-- Contenido
alter table areas enable row level security;
create policy areas_read on areas for select using (tenant_id = current_tenant_id());
create policy areas_write on areas for all using (
  tenant_id = current_tenant_id() and is_instructor()
) with check (tenant_id = current_tenant_id());

alter table topics enable row level security;
create policy topics_read on topics for select using (tenant_id = current_tenant_id());
create policy topics_write on topics for all using (
  tenant_id = current_tenant_id() and is_instructor()
) with check (tenant_id = current_tenant_id());

alter table topic_notes enable row level security;
create policy tn_read on topic_notes for select using (tenant_id = current_tenant_id());
create policy tn_write on topic_notes for all using (
  tenant_id = current_tenant_id() and is_instructor()
) with check (tenant_id = current_tenant_id());

alter table mnemonics enable row level security;
create policy mn_read on mnemonics for select using (tenant_id = current_tenant_id());
create policy mn_write on mnemonics for all using (
  tenant_id = current_tenant_id() and is_instructor()
) with check (tenant_id = current_tenant_id());

alter table cases enable row level security;
create policy cs_read on cases for select using (tenant_id = current_tenant_id());
create policy cs_write on cases for all using (
  tenant_id = current_tenant_id() and is_instructor()
) with check (tenant_id = current_tenant_id());

-- Preguntas y banco
alter table questions enable row level security;
create policy q_read on questions for select using (tenant_id = current_tenant_id());
create policy q_write on questions for all using (
  tenant_id = current_tenant_id() and is_instructor()
) with check (tenant_id = current_tenant_id());

alter table question_options enable row level security;
create policy qo_rw on question_options for all using (
  exists(select 1 from questions q where q.id = question_id and q.tenant_id = current_tenant_id() and is_instructor())
) with check (
  exists(select 1 from questions q where q.id = question_id and q.tenant_id = current_tenant_id())
);

alter table question_media enable row level security;
create policy qm_rw on question_media for all using (
  exists(select 1 from questions q where q.id = question_id and q.tenant_id = current_tenant_id() and is_instructor())
) with check (
  exists(select 1 from questions q where q.id = question_id and q.tenant_id = current_tenant_id())
);

alter table tags enable row level security;
create policy tags_rw on tags for all using (
  tenant_id = current_tenant_id() and is_instructor()
) with check (tenant_id = current_tenant_id());

alter table question_tags enable row level security;
create policy qtags_rw on question_tags for all using (
  exists(select 1 from questions q join tags t on t.id = tag_id where q.id = question_id and q.tenant_id = current_tenant_id() and t.tenant_id = current_tenant_id() and is_instructor())
) with check (
  exists(select 1 from questions q join tags t on t.id = tag_id where q.id = question_id and q.tenant_id = current_tenant_id() and t.tenant_id = current_tenant_id())
);

-- Quizzes y práctica
alter table quizzes enable row level security;
create policy qu_read on quizzes for select using (tenant_id = current_tenant_id());
create policy qu_write on quizzes for all using (
  tenant_id = current_tenant_id() and is_instructor()
) with check (tenant_id = current_tenant_id());

alter table quiz_questions enable row level security;
create policy qq_rw on quiz_questions for all using (
  exists(select 1 from quizzes qu where qu.id = quiz_id and qu.tenant_id = current_tenant_id() and is_instructor())
) with check (
  exists(select 1 from quizzes qu join questions q on q.id = question_id where qu.id = quiz_id and qu.tenant_id = current_tenant_id() and q.tenant_id = current_tenant_id())
);

alter table practice_sessions enable row level security;
create policy ps_self_rw on practice_sessions for all using (
  user_id = current_user_id() and tenant_id = current_tenant_id()
) with check (user_id = current_user_id() and tenant_id = current_tenant_id());

alter table attempts enable row level security;
create policy at_self_rw on attempts for all using (
  user_id = current_user_id() and tenant_id = current_tenant_id()
) with check (user_id = current_user_id() and tenant_id = current_tenant_id());

alter table attempt_answers enable row level security;
create policy aa_self_rw on attempt_answers for all using (
  exists(select 1 from attempts a where a.id = attempt_id and a.user_id = current_user_id() and a.tenant_id = current_tenant_id())
) with check (
  exists(select 1 from attempts a where a.id = attempt_id and a.user_id = current_user_id() and a.tenant_id = current_tenant_id())
);

alter table attempt_answer_options enable row level security;
create policy aao_self_rw on attempt_answer_options for all using (
  exists(select 1 from attempt_answers aa join attempts a on a.id = aa.attempt_id where aa.id = attempt_answer_id and a.user_id = current_user_id() and a.tenant_id = current_tenant_id())
) with check (
  exists(select 1 from attempt_answers aa join attempts a on a.id = aa.attempt_id where aa.id = attempt_answer_id and a.user_id = current_user_id() and a.tenant_id = current_tenant_id())
);

-- Progreso y notas
alter table user_topic_progress enable row level security;
create policy utp_self_read on user_topic_progress for select using (
  user_id = current_user_id() and tenant_id = current_tenant_id()
);
create policy utp_admin_rw on user_topic_progress for all using (
  tenant_id = current_tenant_id() and is_instructor()
) with check (tenant_id = current_tenant_id());

alter table study_notes enable row level security;
create policy sn_self_rw on study_notes for all using (
  user_id = current_user_id() and tenant_id = current_tenant_id()
) with check (user_id = current_user_id() and tenant_id = current_tenant_id());

-- Auditoría (solo admin lectura)
alter table audit_log enable row level security;
create policy audit_admin_read on audit_log for select using (
  tenant_id = current_tenant_id() and is_admin()
);


