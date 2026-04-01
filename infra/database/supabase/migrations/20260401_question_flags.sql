-- Persist per-user question bookmarks/flags for review workflows

create table if not exists user_question_flags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, question_id)
);

create trigger user_question_flags_set_updated_at
before update on user_question_flags
for each row execute procedure set_updated_at();

create index if not exists idx_user_question_flags_user
on user_question_flags(tenant_id, user_id, created_at desc);

create index if not exists idx_user_question_flags_question
on user_question_flags(question_id);

alter table user_question_flags enable row level security;

create policy uqf_self_rw on user_question_flags for all using (
  tenant_id = current_tenant_id()
  and user_id = current_user_id()
  and exists (
    select 1
    from questions q
    where q.id = question_id
      and q.tenant_id = current_tenant_id()
  )
) with check (
  tenant_id = current_tenant_id()
  and user_id = current_user_id()
  and exists (
    select 1
    from questions q
    where q.id = question_id
      and q.tenant_id = current_tenant_id()
  )
);
