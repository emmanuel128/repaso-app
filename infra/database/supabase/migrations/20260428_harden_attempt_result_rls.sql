-- Make attempt result rows RPC-owned while preserving student read access.

drop policy if exists at_self_rw on attempts;
drop policy if exists at_self_read on attempts;
create policy at_self_read on attempts for select
using (user_id = current_user_id() and tenant_id = current_tenant_id());

drop policy if exists aa_self_rw on attempt_answers;
drop policy if exists aa_self_read on attempt_answers;
create policy aa_self_read on attempt_answers for select
using (
  exists (
    select 1
    from attempts a
    where a.id = attempt_id
      and a.user_id = current_user_id()
      and a.tenant_id = current_tenant_id()
  )
);

drop policy if exists aao_self_rw on attempt_answer_options;
drop policy if exists aao_self_read on attempt_answer_options;
create policy aao_self_read on attempt_answer_options for select
using (
  exists (
    select 1
    from attempt_answers aa
    join attempts a on a.id = aa.attempt_id
    where aa.id = attempt_answer_id
      and a.user_id = current_user_id()
      and a.tenant_id = current_tenant_id()
  )
);

revoke insert, update, delete on table attempts from authenticated, anon;
revoke insert, update, delete on table attempt_answers from authenticated, anon;
revoke insert, update, delete on table attempt_answer_options from authenticated, anon;

grant select on table attempts to authenticated;
grant select on table attempt_answers to authenticated;
grant select on table attempt_answer_options to authenticated;
