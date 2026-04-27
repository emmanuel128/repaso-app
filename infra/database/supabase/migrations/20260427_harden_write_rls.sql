-- Harden privileged write policies so INSERT checks include authorization.

drop policy if exists tenants_modify on tenants;
create policy tenants_modify on tenants for all
using (is_admin())
with check (is_admin());

drop policy if exists tenant_settings_rw on tenant_settings;
create policy tenant_settings_rw on tenant_settings for all
using (tenant_id = current_tenant_id() and is_admin())
with check (tenant_id = current_tenant_id() and is_admin());

drop policy if exists tenant_domains_rw on tenant_domains;
create policy tenant_domains_rw on tenant_domains for all
using (tenant_id = current_tenant_id() and is_admin())
with check (tenant_id = current_tenant_id() and is_admin());

drop policy if exists ut_admin_rw on user_tenants;
create policy ut_admin_rw on user_tenants for all
using (tenant_id = current_tenant_id() and is_admin())
with check (tenant_id = current_tenant_id() and is_admin());

drop policy if exists m_admin_rw on memberships;
create policy m_admin_rw on memberships for all
using (tenant_id = current_tenant_id() and is_admin())
with check (tenant_id = current_tenant_id() and is_admin());

drop policy if exists pe_admin_rw on payment_events;
create policy pe_admin_rw on payment_events for all
using (tenant_id = current_tenant_id() and is_admin())
with check (tenant_id = current_tenant_id() and is_admin());

drop policy if exists areas_write on areas;
create policy areas_write on areas for all
using (tenant_id = current_tenant_id() and is_instructor())
with check (tenant_id = current_tenant_id() and is_instructor());

drop policy if exists topics_write on topics;
create policy topics_write on topics for all
using (tenant_id = current_tenant_id() and is_instructor())
with check (tenant_id = current_tenant_id() and is_instructor());

drop policy if exists tn_write on topic_notes;
create policy tn_write on topic_notes for all
using (tenant_id = current_tenant_id() and is_instructor())
with check (tenant_id = current_tenant_id() and is_instructor());

drop policy if exists mn_write on mnemonics;
create policy mn_write on mnemonics for all
using (tenant_id = current_tenant_id() and is_instructor())
with check (tenant_id = current_tenant_id() and is_instructor());

drop policy if exists cs_write on cases;
create policy cs_write on cases for all
using (tenant_id = current_tenant_id() and is_instructor())
with check (tenant_id = current_tenant_id() and is_instructor());

drop policy if exists q_write on questions;
create policy q_write on questions for all
using (tenant_id = current_tenant_id() and is_instructor())
with check (tenant_id = current_tenant_id() and is_instructor());

drop policy if exists qo_rw on question_options;
create policy qo_rw on question_options for all
using (
  exists (
    select 1
    from questions q
    where q.id = question_id
      and q.tenant_id = current_tenant_id()
      and is_instructor()
  )
)
with check (
  exists (
    select 1
    from questions q
    where q.id = question_id
      and q.tenant_id = current_tenant_id()
      and is_instructor()
  )
);

drop policy if exists qm_rw on question_media;
create policy qm_rw on question_media for all
using (
  exists (
    select 1
    from questions q
    where q.id = question_id
      and q.tenant_id = current_tenant_id()
      and is_instructor()
  )
)
with check (
  exists (
    select 1
    from questions q
    where q.id = question_id
      and q.tenant_id = current_tenant_id()
      and is_instructor()
  )
);

drop policy if exists tags_rw on tags;
create policy tags_rw on tags for all
using (tenant_id = current_tenant_id() and is_instructor())
with check (tenant_id = current_tenant_id() and is_instructor());

drop policy if exists qtags_rw on question_tags;
create policy qtags_rw on question_tags for all
using (
  exists (
    select 1
    from questions q
    join tags t on t.id = tag_id
    where q.id = question_id
      and q.tenant_id = current_tenant_id()
      and t.tenant_id = current_tenant_id()
      and is_instructor()
  )
)
with check (
  exists (
    select 1
    from questions q
    join tags t on t.id = tag_id
    where q.id = question_id
      and q.tenant_id = current_tenant_id()
      and t.tenant_id = current_tenant_id()
      and is_instructor()
  )
);

drop policy if exists qu_write on quizzes;
create policy qu_write on quizzes for all
using (tenant_id = current_tenant_id() and is_instructor())
with check (tenant_id = current_tenant_id() and is_instructor());

drop policy if exists qq_rw on quiz_questions;
create policy qq_rw on quiz_questions for all
using (
  exists (
    select 1
    from quizzes qu
    where qu.id = quiz_id
      and qu.tenant_id = current_tenant_id()
      and is_instructor()
  )
)
with check (
  exists (
    select 1
    from quizzes qu
    join questions q on q.id = question_id
    where qu.id = quiz_id
      and qu.tenant_id = current_tenant_id()
      and q.tenant_id = current_tenant_id()
      and is_instructor()
  )
);

drop policy if exists utp_admin_rw on user_topic_progress;
create policy utp_admin_rw on user_topic_progress for all
using (tenant_id = current_tenant_id() and is_instructor())
with check (tenant_id = current_tenant_id() and is_instructor());
