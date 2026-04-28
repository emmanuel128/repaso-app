-- Fix 1: custom_access_token_hook — add ORDER BY + LIMIT 1
-- Prevents PL/pgSQL "query returned more than one row" error when a user
-- belongs to multiple tenants. Picks the earliest membership as default.

CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  declare
    _tenant_id uuid;
    _role role_type;
  begin
    select ut.tenant_id, ut.role
    into _tenant_id, _role
    from public.user_tenants ut
    where ut.user_id = (event ->> 'user_id')::uuid
    order by ut.created_at asc
    limit 1;

    if _tenant_id is not null then
      event := jsonb_set(event, '{claims, tenant_id}', to_jsonb(_tenant_id));
      event := jsonb_set(event, '{claims, user_role}', to_jsonb(_role::text));
    end if;

    return event;
  end;
$$;


-- Fix 1b: jwt_custom_claims — add deterministic ORDER BY before its LIMIT 1

CREATE OR REPLACE FUNCTION "public"."jwt_custom_claims"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select jsonb_build_object(
    'tenant_id', ut.tenant_id,
    'role', ut.role
  )
  from user_tenants ut
  where ut.user_id = (event ->> 'user_id')::uuid
  order by ut.created_at asc
  limit 1
$$;


-- Fix 2: submit_practice_attempt — guard against double submission
-- Prevents duplicate attempts and progressive inflation of user_topic_progress.

CREATE OR REPLACE FUNCTION "public"."submit_practice_attempt"("p_practice_session_id" "uuid", "p_topic_id" "uuid", "p_answers" "jsonb") RETURNS TABLE("attempt_id" "uuid", "score" numeric, "max_score" numeric, "correct_count" integer, "question_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_attempt_id uuid := gen_random_uuid();
  v_now timestamptz := now();
  v_session_question_ids uuid[];
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

  -- Double-submission guard: check ended_at
  if exists (
    select 1
    from practice_sessions ps
    where ps.id = p_practice_session_id
      and ps.ended_at is not null
  ) then
    raise exception 'Practice session already submitted';
  end if;

  -- Double-submission guard: check existing attempts (belt-and-suspenders)
  if exists (
    select 1
    from attempts a
    where a.practice_session_id = p_practice_session_id
  ) then
    raise exception 'Practice session already submitted';
  end if;

  select coalesce(array_agg(psq.question_id order by psq.position), '{}'::uuid[])
  into v_session_question_ids
  from practice_sessions ps
  join practice_session_questions psq on psq.practice_session_id = ps.id
  where ps.id = p_practice_session_id
    and ps.user_id = current_user_id()
    and ps.tenant_id = current_tenant_id()
    and ps.topic_id = p_topic_id;

  if coalesce(array_length(v_session_question_ids, 1), 0) = 0 then
    raise exception 'Practice session has no scoped questions';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
    where item ->> 'question_id' is null
      or (item ->> 'question_id')::uuid <> all(v_session_question_ids)
  ) then
    raise exception 'Answer is outside this practice session';
  end if;

  if exists (
    with normalized_answers as (
      select
        (item ->> 'question_id')::uuid as question_id,
        (selected_value)::uuid as option_id
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
      cross join lateral jsonb_array_elements_text(
        coalesce(item -> 'selected_option_ids', '[]'::jsonb)
      ) selected_value
    )
    select 1
    from normalized_answers na
    left join question_options qo
      on qo.id = na.option_id
      and qo.question_id = na.question_id
    where qo.id is null
  ) then
    raise exception 'Answer option is not valid for question';
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
    select q.id, q.points, psq.position
    from practice_session_questions psq
    join questions q on q.id = psq.question_id
    where psq.practice_session_id = p_practice_session_id
      and q.topic_id = p_topic_id
      and q.tenant_id = current_tenant_id()
      and q.status = 'published'
  ),
  graded as (
    select
      sq.id as question_id,
      sq.points,
      sq.position,
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
    order by g.position asc
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


-- Fix 3: Randomize question order in practice sessions

CREATE OR REPLACE FUNCTION "public"."start_student_practice_session"("p_topic_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("practice_session_id" "uuid", "questions" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_session_id uuid := gen_random_uuid();
  v_question_ids uuid[];
begin
  if current_user_id() is null or current_tenant_id() is null then
    raise exception 'Unauthorized';
  end if;

  if not has_active_membership() then
    raise exception 'Membership required';
  end if;

  if not exists (
    select 1
    from topics t
    where t.id = p_topic_id
      and t.tenant_id = current_tenant_id()
      and t.status = 'published'
  ) then
    raise exception 'Topic not found';
  end if;

  select coalesce(array_agg(scoped.id order by scoped.ord), '{}'::uuid[])
  into v_question_ids
  from (
    select q.id, random() as ord
    from questions q
    where q.topic_id = p_topic_id
      and q.tenant_id = current_tenant_id()
      and q.status = 'published'
    order by random()
    limit greatest(coalesce(p_limit, 10), 1)
  ) scoped;

  insert into practice_sessions (
    id,
    tenant_id,
    user_id,
    topic_id,
    config
  )
  values (
    v_session_id,
    current_tenant_id(),
    current_user_id(),
    p_topic_id,
    jsonb_build_object(
      'question_count', coalesce(array_length(v_question_ids, 1), 0),
      'source', 'student_mvp'
    )
  );

  insert into practice_session_questions (
    practice_session_id,
    question_id,
    position
  )
  select
    v_session_id,
    selected.question_id,
    selected.ordinality::int
  from unnest(v_question_ids) with ordinality as selected(question_id, ordinality);

  return query
  with scoped_questions as (
    select
      q.id,
      q.prompt,
      q.explanation,
      q.difficulty,
      q.points,
      psq.position
    from practice_session_questions psq
    join questions q on q.id = psq.question_id
    where psq.practice_session_id = v_session_id
      and q.topic_id = p_topic_id
      and q.tenant_id = current_tenant_id()
      and q.status = 'published'
  )
  select
    v_session_id,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'question_id', sq.id,
          'prompt', sq.prompt,
          'explanation', sq.explanation,
          'difficulty', sq.difficulty,
          'points', sq.points,
          'options', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', qo.id,
                'label', qo.label,
                'value', qo.value,
                'order_index', qo.order_index
              )
              order by qo.order_index asc
            )
            from question_options qo
            where qo.question_id = sq.id
          ), '[]'::jsonb)
        )
        order by sq.position asc
      ),
      '[]'::jsonb
    )
  from scoped_questions sq;
end;
$$;


-- Fix 3b: Randomize question order in get_topic_practice_questions

CREATE OR REPLACE FUNCTION "public"."get_topic_practice_questions"("p_topic_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("question_id" "uuid", "prompt" "text", "explanation" "text", "difficulty" "public"."difficulty", "points" numeric, "options" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with scoped_questions as (
    select q.id, q.prompt, q.explanation, q.difficulty, q.points
    from questions q
    where q.topic_id = p_topic_id
      and q.tenant_id = current_tenant_id()
      and q.status = 'published'
    order by random()
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
