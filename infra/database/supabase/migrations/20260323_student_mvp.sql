-- Student MVP support for practice delivery, grading, and review

create or replace function has_active_membership()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from memberships
    where user_id = current_user_id()
      and tenant_id = current_tenant_id()
      and status in ('trialing', 'active')
  )
$$;

create or replace function public.get_topic_practice_questions(
  p_topic_id uuid,
  p_limit int default 10
)
returns table (
  question_id uuid,
  prompt text,
  explanation text,
  difficulty difficulty,
  points numeric,
  options jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with scoped_questions as (
    select q.id, q.prompt, q.explanation, q.difficulty, q.points
    from questions q
    where q.topic_id = p_topic_id
      and q.tenant_id = current_tenant_id()
      and q.status = 'published'
    order by q.created_at asc
    limit greatest(coalesce(p_limit, 10), 1)
  )
  select
    q.id as question_id,
    q.prompt,
    q.explanation,
    q.difficulty,
    q.points,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', qo.id,
          'label', qo.label,
          'value', qo.value,
          'order_index', qo.order_index
        )
        order by qo.order_index asc
      ) filter (where qo.id is not null),
      '[]'::jsonb
    ) as options
  from scoped_questions q
  left join question_options qo on qo.question_id = q.id
  where current_user_id() is not null
    and current_tenant_id() is not null
    and has_active_membership()
  group by q.id, q.prompt, q.explanation, q.difficulty, q.points
  order by q.id;
$$;

grant execute on function public.get_topic_practice_questions(uuid, int) to authenticated;

create or replace function public.submit_practice_attempt(
  p_practice_session_id uuid,
  p_topic_id uuid,
  p_answers jsonb
)
returns table (
  attempt_id uuid,
  score numeric,
  max_score numeric,
  correct_count int,
  question_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_id uuid := gen_random_uuid();
  v_now timestamptz := now();
begin
  if current_user_id() is null or current_tenant_id() is null then
    raise exception 'Unauthorized';
  end if;

  if not has_active_membership() then
    raise exception 'Membership required';
  end if;

  if not exists (
    select 1
    from practice_sessions ps
    where ps.id = p_practice_session_id
      and ps.user_id = current_user_id()
      and ps.tenant_id = current_tenant_id()
      and ps.topic_id = p_topic_id
  ) then
    raise exception 'Practice session not found';
  end if;

  insert into attempts (
    id,
    tenant_id,
    user_id,
    practice_session_id,
    started_at,
    submitted_at,
    score,
    max_score
  )
  values (
    v_attempt_id,
    current_tenant_id(),
    current_user_id(),
    p_practice_session_id,
    v_now,
    v_now,
    0,
    0
  );

  with normalized_answers as (
    select
      (item ->> 'question_id')::uuid as question_id,
      coalesce(
        array_agg((selected_value)::uuid) filter (where selected_value is not null),
        '{}'::uuid[]
      ) as selected_option_ids
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
    left join lateral jsonb_array_elements_text(
      coalesce(item -> 'selected_option_ids', '[]'::jsonb)
    ) selected_value on true
    group by (item ->> 'question_id')::uuid
  ),
  scoped_questions as (
    select q.id, q.points
    from questions q
    where q.topic_id = p_topic_id
      and q.tenant_id = current_tenant_id()
      and q.status = 'published'
  ),
  graded as (
    select
      sq.id as question_id,
      sq.points,
      coalesce(na.selected_option_ids, '{}'::uuid[]) as selected_option_ids,
      coalesce((
        select array_agg(qo.id order by qo.order_index asc)
        from question_options qo
        where qo.question_id = sq.id
          and qo.is_correct = true
      ), '{}'::uuid[]) as correct_option_ids
    from scoped_questions sq
    left join normalized_answers na on na.question_id = sq.id
  ),
  inserted_answers as (
    insert into attempt_answers (
      attempt_id,
      question_id,
      is_correct,
      score,
      answered_at
    )
    select
      v_attempt_id,
      g.question_id,
      g.selected_option_ids = g.correct_option_ids,
      case
        when g.selected_option_ids = g.correct_option_ids then g.points
        else 0
      end,
      v_now
    from graded g
    returning id, question_id
  ),
  option_rows as (
    select
      ia.id as attempt_answer_id,
      unnest(g.selected_option_ids) as option_id
    from inserted_answers ia
    join graded g on g.question_id = ia.question_id
  )
  insert into attempt_answer_options (attempt_answer_id, option_id, selected)
  select attempt_answer_id, option_id, true
  from option_rows;

  update attempts a
  set
    score = totals.score,
    max_score = totals.max_score
  from (
    select
      coalesce(sum(aa.score), 0) as score,
      coalesce(sum(q.points), 0) as max_score
    from attempt_answers aa
    join questions q on q.id = aa.question_id
    where aa.attempt_id = v_attempt_id
  ) totals
  where a.id = v_attempt_id;

  update practice_sessions
  set ended_at = v_now
  where id = p_practice_session_id;

  insert into user_topic_progress (
    tenant_id,
    user_id,
    topic_id,
    total_correct,
    total_incorrect,
    last_score,
    last_attempt_at
  )
  select
    current_tenant_id(),
    current_user_id(),
    p_topic_id,
    sum(case when aa.is_correct then 1 else 0 end)::int,
    sum(case when aa.is_correct then 0 else 1 end)::int,
    case
      when max(a.max_score) > 0 then round((max(a.score) / max(a.max_score)) * 100, 2)
      else 0
    end,
    v_now
  from attempts a
  join attempt_answers aa on aa.attempt_id = a.id
  where a.id = v_attempt_id
  on conflict (tenant_id, user_id, topic_id)
  do update set
    total_correct = user_topic_progress.total_correct + excluded.total_correct,
    total_incorrect = user_topic_progress.total_incorrect + excluded.total_incorrect,
    last_score = excluded.last_score,
    last_attempt_at = excluded.last_attempt_at,
    updated_at = now();

  return query
  select
    a.id,
    a.score,
    a.max_score,
    coalesce(sum(case when aa.is_correct then 1 else 0 end), 0)::int,
    count(aa.id)::int
  from attempts a
  left join attempt_answers aa on aa.attempt_id = a.id
  where a.id = v_attempt_id
  group by a.id, a.score, a.max_score;
end;
$$;

grant execute on function public.submit_practice_attempt(uuid, uuid, jsonb) to authenticated;

create or replace function public.get_attempt_review(
  p_attempt_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'question_id', q.id,
        'prompt', q.prompt,
        'explanation', q.explanation,
        'is_correct', aa.is_correct,
        'score', aa.score,
        'selected_option_ids', coalesce((
          select jsonb_agg(aao.option_id order by qo.order_index asc)
          from attempt_answer_options aao
          join question_options qo on qo.id = aao.option_id
          where aao.attempt_answer_id = aa.id
        ), '[]'::jsonb),
        'options', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', qo.id,
              'label', qo.label,
              'value', qo.value,
              'is_correct', qo.is_correct,
              'order_index', qo.order_index
            )
            order by qo.order_index asc
          )
          from question_options qo
          where qo.question_id = q.id
        ), '[]'::jsonb)
      )
      order by aa.answered_at asc
    ),
    '[]'::jsonb
  )
  from attempts a
  join attempt_answers aa on aa.attempt_id = a.id
  join questions q on q.id = aa.question_id
  where a.id = p_attempt_id
    and a.user_id = current_user_id()
    and a.tenant_id = current_tenant_id()
    and has_active_membership();
$$;

grant execute on function public.get_attempt_review(uuid) to authenticated;
