


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."content_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."content_status" OWNER TO "postgres";


CREATE TYPE "public"."difficulty" AS ENUM (
    'easy',
    'medium',
    'hard'
);


ALTER TYPE "public"."difficulty" OWNER TO "postgres";


CREATE TYPE "public"."membership_status" AS ENUM (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'unpaid',
    'paused'
);


ALTER TYPE "public"."membership_status" OWNER TO "postgres";


CREATE TYPE "public"."question_type" AS ENUM (
    'single_choice',
    'multiple_choice',
    'true_false',
    'free_text'
);


ALTER TYPE "public"."question_type" OWNER TO "postgres";


CREATE TYPE "public"."role_type" AS ENUM (
    'owner',
    'admin',
    'instructor',
    'student'
);


ALTER TYPE "public"."role_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select (jwt_claim('tenant_id'))::uuid
$$;


ALTER FUNCTION "public"."current_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select (jwt_claim('sub'))::uuid
$$;


ALTER FUNCTION "public"."current_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
      -- event := jsonb_set(event, '{claims, role}', to_jsonb(_role));
      event := jsonb_set(event, '{claims, user_role}', to_jsonb(_role::text));
    end if;
    
    -- RAISE LOG 'Auth Hook Output: %', event;

    return event;
  end;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_attempt_review"("p_attempt_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."get_attempt_review"("p_attempt_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instructor_cohort_accuracy"("p_days" integer DEFAULT 30) RETURNS TABLE("window_days" integer, "evaluated_students" integer, "active_students" integer, "answered_questions" integer, "correct_answers" integer, "average_accuracy" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_window_days int := greatest(coalesce(p_days, 30), 1);
  v_window_start timestamptz := now() - make_interval(days => greatest(coalesce(p_days, 30), 1));
begin
  if current_user_id() is null or current_tenant_id() is null or not is_instructor() then
    raise exception 'Unauthorized';
  end if;

  return query
  with scoped_answers as (
    select a.user_id, aa.is_correct
    from attempts a
    join attempt_answers aa on aa.attempt_id = a.id
    join user_tenants ut on ut.user_id = a.user_id
      and ut.tenant_id = a.tenant_id
      and ut.role = 'student'
    where a.tenant_id = current_tenant_id()
      and a.submitted_at is not null
      and a.submitted_at >= v_window_start
  ),
  scoped_activity as (
    select distinct a.user_id
    from attempts a
    join user_tenants ut on ut.user_id = a.user_id
      and ut.tenant_id = a.tenant_id
      and ut.role = 'student'
    where a.tenant_id = current_tenant_id()
      and a.submitted_at is not null
      and a.submitted_at >= now() - interval '7 days'
  )
  select
    v_window_days,
    coalesce((select count(distinct sa.user_id)::int from scoped_answers sa), 0),
    coalesce((select count(*)::int from scoped_activity), 0),
    count(sa.is_correct)::int,
    count(*) filter (where sa.is_correct)::int,
    case
      when count(sa.is_correct) = 0 then 0
      else round((count(*) filter (where sa.is_correct)::numeric / count(sa.is_correct)::numeric) * 100, 2)
    end
  from scoped_answers sa;
end;
$$;


ALTER FUNCTION "public"."get_instructor_cohort_accuracy"("p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instructor_dashboard_snapshot"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_snapshot jsonb;
begin
  if current_user_id() is null or current_tenant_id() is null then
    raise exception 'Unauthorized';
  end if;

  if not is_instructor() then
    raise exception 'Instructor access required';
  end if;

  with student_scope as (
    select ut.user_id
    from user_tenants ut
    where ut.tenant_id = current_tenant_id()
      and ut.role = 'student'
  ),
  submitted_attempt_scope as (
    select
      a.id,
      a.user_id,
      a.score,
      a.max_score,
      a.submitted_at,
      ps.topic_id,
      t.name as topic_name,
      t.slug as topic_slug
    from attempts a
    left join practice_sessions ps on ps.id = a.practice_session_id
    left join topics t on t.id = ps.topic_id
    where a.tenant_id = current_tenant_id()
      and a.user_id in (select ss.user_id from student_scope ss)
      and a.submitted_at is not null
  ),
  answer_scope as (
    select aa.is_correct
    from attempt_answers aa
    join submitted_attempt_scope sas on sas.id = aa.attempt_id
  ),
  active_student_scope as (
    select distinct active_rows.user_id
    from (
      select sas.user_id
      from submitted_attempt_scope sas
      where sas.submitted_at >= now() - interval '7 days'

      union

      select utp.user_id
      from user_topic_progress utp
      where utp.tenant_id = current_tenant_id()
        and utp.user_id in (select ss.user_id from student_scope ss)
        and utp.last_attempt_at >= now() - interval '7 days'
    ) active_rows
  ),
  attention_topic_scope as (
    select
      utp.topic_id,
      coalesce(t.name, 'Tema') as topic_name,
      t.slug as topic_slug,
      sum(utp.total_correct)::int as total_correct,
      sum(utp.total_incorrect)::int as total_incorrect,
      count(distinct utp.user_id)::int as students_tracked
    from user_topic_progress utp
    left join topics t on t.id = utp.topic_id
    where utp.tenant_id = current_tenant_id()
      and utp.user_id in (select ass.user_id from active_student_scope ass)
      and (coalesce(utp.total_correct, 0) + coalesce(utp.total_incorrect, 0)) > 0
    group by utp.topic_id, t.name, t.slug
  ),
  ranked_attention_topics as (
    select
      ats.topic_id,
      ats.topic_name,
      ats.topic_slug,
      case
        when (ats.total_correct + ats.total_incorrect) > 0
          then round((ats.total_correct::numeric * 100) / nullif((ats.total_correct + ats.total_incorrect)::numeric, 0))
        else 0
      end::int as accuracy,
      (ats.total_correct + ats.total_incorrect)::int as answered_questions,
      ats.students_tracked
    from attention_topic_scope ats
    order by
      case
        when (ats.total_correct + ats.total_incorrect) > 0
          then round((ats.total_correct::numeric * 100) / nullif((ats.total_correct + ats.total_incorrect)::numeric, 0))
        else 0
      end asc,
      (ats.total_correct + ats.total_incorrect) desc
    limit 5
  ),
  recent_activity_scope as (
    select
      sas.id as attempt_id,
      sas.user_id as student_id,
      coalesce(
        nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
        'Estudiante'
      ) as student_name,
      coalesce(sas.topic_name, 'Practica general') as topic_name,
      sas.topic_slug,
      case
        when coalesce(sas.max_score, 0) > 0
          then round((coalesce(sas.score, 0)::numeric * 100) / nullif(sas.max_score::numeric, 0))
        else 0
      end::int as score_percent,
      sas.submitted_at
    from submitted_attempt_scope sas
    left join profiles p on p.id = sas.user_id
    order by sas.submitted_at desc
    limit 5
  ),
  aggregate_values as (
    select
      (select count(*)::int from student_scope) as students_count,
      (select count(*)::int from active_student_scope) as active_students_last_7_days,
      (select count(*)::int from answer_scope) as questions_answered,
      (
        select coalesce(sum(case when answer_scope.is_correct then 1 else 0 end), 0)::int
        from answer_scope
      ) as correct_answers
  )
  select jsonb_build_object(
    'students_count',
    av.students_count,
    'active_students_last_7_days',
    av.active_students_last_7_days,
    'cohort_accuracy',
    case
      when av.questions_answered > 0
        then round((av.correct_answers::numeric * 100) / nullif(av.questions_answered::numeric, 0))::int
      else 0
    end,
    'questions_answered',
    av.questions_answered,
    'attention_topics',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'topic_id', rat.topic_id,
            'topic_name', rat.topic_name,
            'topic_slug', rat.topic_slug,
            'accuracy', rat.accuracy,
            'answered_questions', rat.answered_questions,
            'students_tracked', rat.students_tracked
          )
          order by rat.accuracy asc, rat.answered_questions desc
        )
        from ranked_attention_topics rat
      ),
      '[]'::jsonb
    ),
    'recent_activity',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'attempt_id', ras.attempt_id,
            'student_id', ras.student_id,
            'student_name', ras.student_name,
            'topic_name', ras.topic_name,
            'topic_slug', ras.topic_slug,
            'score_percent', ras.score_percent,
            'submitted_at', ras.submitted_at
          )
          order by ras.submitted_at desc
        )
        from recent_activity_scope ras
      ),
      '[]'::jsonb
    )
  )
  into v_snapshot
  from aggregate_values av;

  return coalesce(
    v_snapshot,
    jsonb_build_object(
      'students_count', 0,
      'active_students_last_7_days', 0,
      'cohort_accuracy', 0,
      'questions_answered', 0,
      'attention_topics', '[]'::jsonb,
      'recent_activity', '[]'::jsonb
    )
  );
end;
$$;


ALTER FUNCTION "public"."get_instructor_dashboard_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instructor_most_missed_questions"("p_days" integer DEFAULT 30, "p_limit" integer DEFAULT 10, "p_min_attempts" integer DEFAULT 5) RETURNS TABLE("question_id" "uuid", "question_prompt" "text", "topic_id" "uuid", "topic_name" "text", "topic_slug" "text", "incorrect_count" integer, "attempt_count" integer, "miss_rate" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_window_days int := greatest(coalesce(p_days, 30), 1);
  v_window_start timestamptz := now() - make_interval(days => greatest(coalesce(p_days, 30), 1));
  v_limit int := greatest(coalesce(p_limit, 10), 1);
  v_min_attempts int := greatest(coalesce(p_min_attempts, 5), 1);
begin
  if current_user_id() is null or current_tenant_id() is null or not is_instructor() then
    raise exception 'Unauthorized';
  end if;

  return query
  with question_stats as (
    select
      q.id as question_id,
      q.prompt as question_prompt,
      q.topic_id,
      t.name as topic_name,
      t.slug::text as topic_slug,
      count(aa.id)::int as attempt_count,
      count(*) filter (where not aa.is_correct)::int as incorrect_count
    from attempts a
    join attempt_answers aa on aa.attempt_id = a.id
    join questions q on q.id = aa.question_id
    join topics t on t.id = q.topic_id
    join user_tenants ut on ut.user_id = a.user_id
      and ut.tenant_id = a.tenant_id
      and ut.role = 'student'
    where a.tenant_id = current_tenant_id()
      and a.submitted_at is not null
      and a.submitted_at >= v_window_start
    group by q.id, q.prompt, q.topic_id, t.name, t.slug
    having count(aa.id) >= v_min_attempts
      and count(*) filter (where not aa.is_correct) > 0
  )
  select
    qs.question_id,
    qs.question_prompt,
    qs.topic_id,
    qs.topic_name,
    qs.topic_slug,
    qs.incorrect_count,
    qs.attempt_count,
    round((qs.incorrect_count::numeric / qs.attempt_count::numeric) * 100, 2) as miss_rate
  from question_stats qs
  order by qs.incorrect_count desc, miss_rate desc, qs.question_id
  limit v_limit;
end;
$$;


ALTER FUNCTION "public"."get_instructor_most_missed_questions"("p_days" integer, "p_limit" integer, "p_min_attempts" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instructor_student_activity"("p_days" integer DEFAULT 7) RETURNS TABLE("anonymous_student_id" "text", "last_attempt_at" timestamp with time zone, "is_active" boolean, "attempt_count" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_window_days int := greatest(coalesce(p_days, 7), 1);
  v_window_start timestamptz := now() - make_interval(days => greatest(coalesce(p_days, 7), 1));
begin
  if current_user_id() is null or current_tenant_id() is null or not is_instructor() then
    raise exception 'Unauthorized';
  end if;

  return query
  with roster as (
    select ut.user_id
    from user_tenants ut
    where ut.tenant_id = current_tenant_id()
      and ut.role = 'student'
  ),
  recent_activity as (
    select
      a.user_id,
      count(a.id)::int as attempt_count
    from attempts a
    join roster r on r.user_id = a.user_id
    where a.tenant_id = current_tenant_id()
      and a.submitted_at is not null
      and a.submitted_at >= v_window_start
    group by a.user_id
  ),
  latest_activity as (
    select
      a.user_id,
      max(a.submitted_at) as last_attempt_at
    from attempts a
    join roster r on r.user_id = a.user_id
    where a.tenant_id = current_tenant_id()
      and a.submitted_at is not null
    group by a.user_id
  )
  select
    concat('student-', substr(md5(r.user_id::text), 1, 8)) as anonymous_student_id,
    la.last_attempt_at,
    coalesce(ra.attempt_count, 0) > 0 as is_active,
    coalesce(ra.attempt_count, 0) as attempt_count
  from roster r
  left join recent_activity ra on ra.user_id = r.user_id
  left join latest_activity la on la.user_id = r.user_id
  order by is_active asc, coalesce(la.last_attempt_at, to_timestamp(0)) asc;
end;
$$;


ALTER FUNCTION "public"."get_instructor_student_activity"("p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instructor_student_weak_topics"("p_days" integer DEFAULT 30, "p_student_limit" integer DEFAULT 10, "p_topics_per_student" integer DEFAULT 3, "p_min_answers" integer DEFAULT 3) RETURNS TABLE("anonymous_student_id" "text", "topic_id" "uuid", "topic_name" "text", "topic_slug" "text", "total_answered" integer, "accuracy" numeric, "last_attempt_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_window_days int := greatest(coalesce(p_days, 30), 1);
  v_window_start timestamptz := now() - make_interval(days => greatest(coalesce(p_days, 30), 1));
  v_student_limit int := greatest(coalesce(p_student_limit, 10), 1);
  v_topics_per_student int := greatest(coalesce(p_topics_per_student, 3), 1);
  v_min_answers int := greatest(coalesce(p_min_answers, 3), 1);
begin
  if current_user_id() is null or current_tenant_id() is null or not is_instructor() then
    raise exception 'Unauthorized';
  end if;

  return query
  with topic_stats as (
    select
      a.user_id,
      q.topic_id,
      t.name as topic_name,
      t.slug::text as topic_slug,
      count(aa.id)::int as total_answered,
      count(*) filter (where aa.is_correct)::int as correct_answers,
      max(a.submitted_at) as last_attempt_at
    from attempts a
    join attempt_answers aa on aa.attempt_id = a.id
    join questions q on q.id = aa.question_id
    join topics t on t.id = q.topic_id
    join user_tenants ut on ut.user_id = a.user_id
      and ut.tenant_id = a.tenant_id
      and ut.role = 'student'
    where a.tenant_id = current_tenant_id()
      and a.submitted_at is not null
      and a.submitted_at >= v_window_start
    group by a.user_id, q.topic_id, t.name, t.slug
    having count(aa.id) >= v_min_answers
  ),
  student_scores as (
    select
      user_id,
      sum(total_answered) as total_answered,
      case
        when sum(total_answered) = 0 then 0
        else round((sum(correct_answers)::numeric / sum(total_answered)::numeric) * 100, 2)
      end as accuracy
    from topic_stats
    group by user_id
  ),
  ranked_students as (
    select
      ss.user_id,
      row_number() over (order by ss.accuracy asc, ss.total_answered desc, ss.user_id) as student_rank
    from student_scores ss
    limit v_student_limit
  ),
  ranked_topics as (
    select
      ts.user_id,
      ts.topic_id,
      ts.topic_name,
      ts.topic_slug,
      ts.total_answered,
      ts.last_attempt_at,
      case
        when ts.total_answered = 0 then 0
        else round((ts.correct_answers::numeric / ts.total_answered::numeric) * 100, 2)
      end as accuracy,
      row_number() over (
        partition by ts.user_id
        order by
          case
            when ts.total_answered = 0 then 0
            else round((ts.correct_answers::numeric / ts.total_answered::numeric) * 100, 2)
          end asc,
          ts.total_answered desc,
          ts.topic_id
      ) as topic_rank
    from topic_stats ts
    join ranked_students rs on rs.user_id = ts.user_id
  )
  select
    concat('student-', substr(md5(rt.user_id::text), 1, 8)) as anonymous_student_id,
    rt.topic_id,
    rt.topic_name,
    rt.topic_slug,
    rt.total_answered,
    rt.accuracy,
    rt.last_attempt_at
  from ranked_topics rt
  where rt.topic_rank <= v_topics_per_student
  order by anonymous_student_id asc, rt.accuracy asc, rt.total_answered desc;
end;
$$;


ALTER FUNCTION "public"."get_instructor_student_weak_topics"("p_days" integer, "p_student_limit" integer, "p_topics_per_student" integer, "p_min_answers" integer) OWNER TO "postgres";


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


ALTER FUNCTION "public"."get_topic_practice_questions"("p_topic_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_active_membership"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from memberships
    where user_id = current_user_id()
      and tenant_id = current_tenant_id()
      and status in ('trialing', 'active')
  )
$$;


ALTER FUNCTION "public"."has_active_membership"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_any_role"("roles" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select jwt_role() = any(roles)
$$;


ALTER FUNCTION "public"."has_any_role"("roles" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select jwt_role() in ('owner','admin')
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_instructor"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select jwt_role() in ('owner','admin','instructor')
$$;


ALTER FUNCTION "public"."is_instructor"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jwt_claim"("claim" "text") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select nullif(auth.jwt() ->> claim, '')
$$;


ALTER FUNCTION "public"."jwt_claim"("claim" "text") OWNER TO "postgres";


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

  -- union all

  -- -- fallback obligatorio: NUNCA retornar NULL
  -- select '{}'::jsonb

  limit 1
$$;


ALTER FUNCTION "public"."jwt_custom_claims"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jwt_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(jwt_claim('user_role'), '')
$$;


ALTER FUNCTION "public"."jwt_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


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

  select coalesce(array_agg(scoped.id order by scoped.created_at asc), '{}'::uuid[])
  into v_question_ids
  from (
    select q.id, q.created_at
    from questions q
    where q.topic_id = p_topic_id
      and q.tenant_id = current_tenant_id()
      and q.status = 'published'
    order by q.created_at asc
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


ALTER FUNCTION "public"."start_student_practice_session"("p_topic_id" "uuid", "p_limit" integer) OWNER TO "postgres";


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


ALTER FUNCTION "public"."submit_practice_attempt"("p_practice_session_id" "uuid", "p_topic_id" "uuid", "p_answers" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "public"."citext" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "status" "public"."content_status" DEFAULT 'published'::"public"."content_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attempt_answer_options" (
    "attempt_answer_id" "uuid" NOT NULL,
    "option_id" "uuid" NOT NULL,
    "selected" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."attempt_answer_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attempt_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attempt_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "is_correct" boolean,
    "score" numeric DEFAULT 0,
    "answered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "free_text_answer" "text"
);


ALTER TABLE "public"."attempt_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "quiz_id" "uuid",
    "practice_session_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "submitted_at" timestamp with time zone,
    "score" numeric DEFAULT 0,
    "max_score" numeric DEFAULT 0
);


ALTER TABLE "public"."attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "actor_user_id" "uuid",
    "event_type" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "topic_id" "uuid",
    "title" "text" NOT NULL,
    "body_md" "text" NOT NULL,
    "status" "public"."content_status" DEFAULT 'published'::"public"."content_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "status" "public"."membership_status" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "stripe_price_id" "text",
    "current_period_end" timestamp with time zone,
    "cancel_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mnemonics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "topic_id" "uuid",
    "title" "text" NOT NULL,
    "content_md" "text" NOT NULL,
    "status" "public"."content_status" DEFAULT 'published'::"public"."content_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mnemonics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "stripe_event_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_session_questions" (
    "practice_session_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    CONSTRAINT "practice_session_questions_position_check" CHECK (("position" > 0))
);


ALTER TABLE "public"."practice_session_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "topic_id" "uuid",
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone
);


ALTER TABLE "public"."practice_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."question_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "caption" "text"
);


ALTER TABLE "public"."question_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."question_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "label" "text",
    "value" "text" NOT NULL,
    "is_correct" boolean DEFAULT false NOT NULL,
    "explanation" "text",
    "order_index" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."question_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."question_tags" (
    "question_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."question_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "topic_id" "uuid",
    "type" "public"."question_type" NOT NULL,
    "difficulty" "public"."difficulty" DEFAULT 'medium'::"public"."difficulty" NOT NULL,
    "prompt" "text" NOT NULL,
    "explanation" "text",
    "source" "text",
    "points" numeric DEFAULT 1 NOT NULL,
    "status" "public"."content_status" DEFAULT 'published'::"public"."content_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "quiz_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "points_override" numeric
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "slug" "public"."citext" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "status" "public"."content_status" DEFAULT 'draft'::"public"."content_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "topic_id" "uuid",
    "question_id" "uuid",
    "content_md" "text" NOT NULL,
    "is_private" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."study_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "public"."citext" NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_domains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "domain" "public"."citext" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenant_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_settings" (
    "tenant_id" "uuid" NOT NULL,
    "logo_url" "text",
    "brand_primary" "text",
    "brand_secondary" "text",
    "features" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenant_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "public"."citext" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."topic_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "topic_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content_md" "text" NOT NULL,
    "status" "public"."content_status" DEFAULT 'draft'::"public"."content_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."topic_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "area_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "public"."citext" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "status" "public"."content_status" DEFAULT 'published'::"public"."content_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_question_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_question_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "role" "public"."role_type" DEFAULT 'student'::"public"."role_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_topic_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "topic_id" "uuid" NOT NULL,
    "total_correct" integer DEFAULT 0 NOT NULL,
    "total_incorrect" integer DEFAULT 0 NOT NULL,
    "last_score" numeric,
    "last_attempt_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_topic_progress" OWNER TO "postgres";


ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_tenant_id_slug_key" UNIQUE ("tenant_id", "slug");



ALTER TABLE ONLY "public"."attempt_answer_options"
    ADD CONSTRAINT "attempt_answer_options_pkey" PRIMARY KEY ("attempt_answer_id", "option_id");



ALTER TABLE ONLY "public"."attempt_answers"
    ADD CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attempts"
    ADD CONSTRAINT "attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_tenant_id_key" UNIQUE ("user_id", "tenant_id");



ALTER TABLE ONLY "public"."mnemonics"
    ADD CONSTRAINT "mnemonics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_stripe_event_id_key" UNIQUE ("stripe_event_id");



ALTER TABLE ONLY "public"."practice_session_questions"
    ADD CONSTRAINT "practice_session_questions_pkey" PRIMARY KEY ("practice_session_id", "question_id");



ALTER TABLE ONLY "public"."practice_session_questions"
    ADD CONSTRAINT "practice_session_questions_practice_session_id_position_key" UNIQUE ("practice_session_id", "position");



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_media"
    ADD CONSTRAINT "question_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_options"
    ADD CONSTRAINT "question_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_tags"
    ADD CONSTRAINT "question_tags_pkey" PRIMARY KEY ("question_id", "tag_id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("quiz_id", "question_id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_tenant_id_slug_key" UNIQUE ("tenant_id", "slug");



ALTER TABLE ONLY "public"."study_notes"
    ADD CONSTRAINT "study_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_tenant_id_slug_key" UNIQUE ("tenant_id", "slug");



ALTER TABLE ONLY "public"."tenant_domains"
    ADD CONSTRAINT "tenant_domains_domain_key" UNIQUE ("domain");



ALTER TABLE ONLY "public"."tenant_domains"
    ADD CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_settings"
    ADD CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("tenant_id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."topic_notes"
    ADD CONSTRAINT "topic_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_tenant_id_slug_key" UNIQUE ("tenant_id", "slug");



ALTER TABLE ONLY "public"."user_question_flags"
    ADD CONSTRAINT "user_question_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_question_flags"
    ADD CONSTRAINT "user_question_flags_tenant_id_user_id_question_id_key" UNIQUE ("tenant_id", "user_id", "question_id");



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_user_id_tenant_id_key" UNIQUE ("user_id", "tenant_id");



ALTER TABLE ONLY "public"."user_topic_progress"
    ADD CONSTRAINT "user_topic_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_topic_progress"
    ADD CONSTRAINT "user_topic_progress_tenant_id_user_id_topic_id_key" UNIQUE ("tenant_id", "user_id", "topic_id");



CREATE INDEX "idx_areas_tenant_order" ON "public"."areas" USING "btree" ("tenant_id", "order_index");



CREATE INDEX "idx_attempt_answers_attempt" ON "public"."attempt_answers" USING "btree" ("attempt_id");



CREATE INDEX "idx_attempt_answers_question" ON "public"."attempt_answers" USING "btree" ("question_id");



CREATE INDEX "idx_attempt_answers_question_correct" ON "public"."attempt_answers" USING "btree" ("question_id", "is_correct");



CREATE INDEX "idx_attempts_tenant" ON "public"."attempts" USING "btree" ("tenant_id", "started_at" DESC);



CREATE INDEX "idx_attempts_tenant_submitted_user" ON "public"."attempts" USING "btree" ("tenant_id", "submitted_at" DESC, "user_id");



CREATE INDEX "idx_attempts_user" ON "public"."attempts" USING "btree" ("user_id", "started_at" DESC);



CREATE INDEX "idx_audit_tenant_created" ON "public"."audit_log" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_cases_tenant_topic" ON "public"."cases" USING "btree" ("tenant_id", "topic_id");



CREATE INDEX "idx_memberships_tenant_status" ON "public"."memberships" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_mnemonics_tenant_topic" ON "public"."mnemonics" USING "btree" ("tenant_id", "topic_id");



CREATE INDEX "idx_payment_events_tenant_created" ON "public"."payment_events" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_practice_sessions_user" ON "public"."practice_sessions" USING "btree" ("user_id", "started_at" DESC);



CREATE INDEX "idx_psq_question" ON "public"."practice_session_questions" USING "btree" ("question_id");



CREATE INDEX "idx_qm_question" ON "public"."question_media" USING "btree" ("question_id");



CREATE INDEX "idx_qo_question" ON "public"."question_options" USING "btree" ("question_id");



CREATE INDEX "idx_questions_tenant_difficulty" ON "public"."questions" USING "btree" ("tenant_id", "difficulty");



CREATE INDEX "idx_questions_tenant_topic" ON "public"."questions" USING "btree" ("tenant_id", "topic_id");



CREATE INDEX "idx_quizzes_tenant_public" ON "public"."quizzes" USING "btree" ("tenant_id", "is_public");



CREATE INDEX "idx_study_notes_tenant" ON "public"."study_notes" USING "btree" ("tenant_id");



CREATE INDEX "idx_study_notes_user" ON "public"."study_notes" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_tenant_domains_tenant" ON "public"."tenant_domains" USING "btree" ("tenant_id");



CREATE INDEX "idx_topic_notes_tenant_topic" ON "public"."topic_notes" USING "btree" ("tenant_id", "topic_id");



CREATE INDEX "idx_topics_tenant_area" ON "public"."topics" USING "btree" ("tenant_id", "area_id");



CREATE INDEX "idx_user_question_flags_question" ON "public"."user_question_flags" USING "btree" ("question_id");



CREATE INDEX "idx_user_question_flags_user" ON "public"."user_question_flags" USING "btree" ("tenant_id", "user_id", "created_at" DESC);



CREATE INDEX "idx_user_tenants_tenant" ON "public"."user_tenants" USING "btree" ("tenant_id");



CREATE INDEX "idx_user_tenants_tenant_role_user" ON "public"."user_tenants" USING "btree" ("tenant_id", "role", "user_id");



CREATE INDEX "idx_user_tenants_user" ON "public"."user_tenants" USING "btree" ("user_id");



CREATE INDEX "idx_user_topic_progress_tenant_last_attempt" ON "public"."user_topic_progress" USING "btree" ("tenant_id", "last_attempt_at" DESC);



CREATE INDEX "idx_utp_tenant_user" ON "public"."user_topic_progress" USING "btree" ("tenant_id", "user_id");



CREATE OR REPLACE TRIGGER "areas_set_updated_at" BEFORE UPDATE ON "public"."areas" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "cases_set_updated_at" BEFORE UPDATE ON "public"."cases" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "memberships_set_updated_at" BEFORE UPDATE ON "public"."memberships" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "mnemonics_set_updated_at" BEFORE UPDATE ON "public"."mnemonics" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "questions_set_updated_at" BEFORE UPDATE ON "public"."questions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "quizzes_set_updated_at" BEFORE UPDATE ON "public"."quizzes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "study_notes_set_updated_at" BEFORE UPDATE ON "public"."study_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tenant_settings_set_updated_at" BEFORE UPDATE ON "public"."tenant_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tenants_set_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "topic_notes_set_updated_at" BEFORE UPDATE ON "public"."topic_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "topics_set_updated_at" BEFORE UPDATE ON "public"."topics" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "user_question_flags_set_updated_at" BEFORE UPDATE ON "public"."user_question_flags" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "utp_set_updated_at" BEFORE UPDATE ON "public"."user_topic_progress" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attempt_answer_options"
    ADD CONSTRAINT "attempt_answer_options_attempt_answer_id_fkey" FOREIGN KEY ("attempt_answer_id") REFERENCES "public"."attempt_answers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attempt_answer_options"
    ADD CONSTRAINT "attempt_answer_options_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."question_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attempt_answers"
    ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attempt_answers"
    ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attempts"
    ADD CONSTRAINT "attempts_practice_session_id_fkey" FOREIGN KEY ("practice_session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attempts"
    ADD CONSTRAINT "attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attempts"
    ADD CONSTRAINT "attempts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attempts"
    ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mnemonics"
    ADD CONSTRAINT "mnemonics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mnemonics"
    ADD CONSTRAINT "mnemonics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_session_questions"
    ADD CONSTRAINT "practice_session_questions_practice_session_id_fkey" FOREIGN KEY ("practice_session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_session_questions"
    ADD CONSTRAINT "practice_session_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_media"
    ADD CONSTRAINT "question_media_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_options"
    ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_tags"
    ADD CONSTRAINT "question_tags_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_tags"
    ADD CONSTRAINT "question_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_notes"
    ADD CONSTRAINT "study_notes_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."study_notes"
    ADD CONSTRAINT "study_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_notes"
    ADD CONSTRAINT "study_notes_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."study_notes"
    ADD CONSTRAINT "study_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_domains"
    ADD CONSTRAINT "tenant_domains_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_settings"
    ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topic_notes"
    ADD CONSTRAINT "topic_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topic_notes"
    ADD CONSTRAINT "topic_notes_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_question_flags"
    ADD CONSTRAINT "user_question_flags_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_question_flags"
    ADD CONSTRAINT "user_question_flags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_question_flags"
    ADD CONSTRAINT "user_question_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_topic_progress"
    ADD CONSTRAINT "user_topic_progress_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_topic_progress"
    ADD CONSTRAINT "user_topic_progress_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_topic_progress"
    ADD CONSTRAINT "user_topic_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "aa_self_read" ON "public"."attempt_answers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."attempts" "a"
  WHERE (("a"."id" = "attempt_answers"."attempt_id") AND ("a"."user_id" = "public"."current_user_id"()) AND ("a"."tenant_id" = "public"."current_tenant_id"())))));



CREATE POLICY "aao_self_read" ON "public"."attempt_answer_options" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."attempt_answers" "aa"
     JOIN "public"."attempts" "a" ON (("a"."id" = "aa"."attempt_id")))
  WHERE (("aa"."id" = "attempt_answer_options"."attempt_answer_id") AND ("a"."user_id" = "public"."current_user_id"()) AND ("a"."tenant_id" = "public"."current_tenant_id"())))));



ALTER TABLE "public"."areas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "areas_read" ON "public"."areas" FOR SELECT USING (("tenant_id" = "public"."current_tenant_id"()));



CREATE POLICY "areas_write" ON "public"."areas" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()));



CREATE POLICY "at_self_read" ON "public"."attempts" FOR SELECT USING ((("user_id" = "public"."current_user_id"()) AND ("tenant_id" = "public"."current_tenant_id"())));



ALTER TABLE "public"."attempt_answer_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attempt_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attempts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_admin_read" ON "public"."audit_log" FOR SELECT USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"()));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cs_read" ON "public"."cases" FOR SELECT USING (("tenant_id" = "public"."current_tenant_id"()));



CREATE POLICY "cs_write" ON "public"."cases" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()));



CREATE POLICY "m_admin_rw" ON "public"."memberships" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"()));



CREATE POLICY "m_select_self" ON "public"."memberships" FOR SELECT USING (("user_id" = "public"."current_user_id"()));



ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mn_read" ON "public"."mnemonics" FOR SELECT USING (("tenant_id" = "public"."current_tenant_id"()));



CREATE POLICY "mn_write" ON "public"."mnemonics" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()));



ALTER TABLE "public"."mnemonics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pe_admin_rw" ON "public"."payment_events" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"()));



ALTER TABLE "public"."practice_session_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."practice_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_self_insert" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = "public"."current_user_id"()));



CREATE POLICY "profiles_self_select" ON "public"."profiles" FOR SELECT USING (("id" = "public"."current_user_id"()));



CREATE POLICY "profiles_self_update" ON "public"."profiles" FOR UPDATE USING (("id" = "public"."current_user_id"())) WITH CHECK (("id" = "public"."current_user_id"()));



CREATE POLICY "ps_self_read" ON "public"."practice_sessions" FOR SELECT USING ((("user_id" = "public"."current_user_id"()) AND ("tenant_id" = "public"."current_tenant_id"())));



CREATE POLICY "psq_self_read" ON "public"."practice_session_questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."practice_sessions" "ps"
  WHERE (("ps"."id" = "practice_session_questions"."practice_session_id") AND ("ps"."user_id" = "public"."current_user_id"()) AND ("ps"."tenant_id" = "public"."current_tenant_id"())))));



CREATE POLICY "q_read" ON "public"."questions" FOR SELECT USING (("tenant_id" = "public"."current_tenant_id"()));



CREATE POLICY "q_write" ON "public"."questions" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()));



CREATE POLICY "qm_rw" ON "public"."question_media" USING ((EXISTS ( SELECT 1
   FROM "public"."questions" "q"
  WHERE (("q"."id" = "question_media"."question_id") AND ("q"."tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."questions" "q"
  WHERE (("q"."id" = "question_media"."question_id") AND ("q"."tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()))));



CREATE POLICY "qo_rw" ON "public"."question_options" USING ((EXISTS ( SELECT 1
   FROM "public"."questions" "q"
  WHERE (("q"."id" = "question_options"."question_id") AND ("q"."tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."questions" "q"
  WHERE (("q"."id" = "question_options"."question_id") AND ("q"."tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()))));



CREATE POLICY "qq_rw" ON "public"."quiz_questions" USING ((EXISTS ( SELECT 1
   FROM "public"."quizzes" "qu"
  WHERE (("qu"."id" = "quiz_questions"."quiz_id") AND ("qu"."tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."quizzes" "qu"
     JOIN "public"."questions" "q" ON (("q"."id" = "quiz_questions"."question_id")))
  WHERE (("qu"."id" = "quiz_questions"."quiz_id") AND ("qu"."tenant_id" = "public"."current_tenant_id"()) AND ("q"."tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()))));



CREATE POLICY "qtags_rw" ON "public"."question_tags" USING ((EXISTS ( SELECT 1
   FROM ("public"."questions" "q"
     JOIN "public"."tags" "t" ON (("t"."id" = "question_tags"."tag_id")))
  WHERE (("q"."id" = "question_tags"."question_id") AND ("q"."tenant_id" = "public"."current_tenant_id"()) AND ("t"."tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."questions" "q"
     JOIN "public"."tags" "t" ON (("t"."id" = "question_tags"."tag_id")))
  WHERE (("q"."id" = "question_tags"."question_id") AND ("q"."tenant_id" = "public"."current_tenant_id"()) AND ("t"."tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()))));



CREATE POLICY "qu_read" ON "public"."quizzes" FOR SELECT USING (("tenant_id" = "public"."current_tenant_id"()));



CREATE POLICY "qu_write" ON "public"."quizzes" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()));



ALTER TABLE "public"."question_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."question_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."question_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sn_self_rw" ON "public"."study_notes" USING ((("user_id" = "public"."current_user_id"()) AND ("tenant_id" = "public"."current_tenant_id"()))) WITH CHECK ((("user_id" = "public"."current_user_id"()) AND ("tenant_id" = "public"."current_tenant_id"())));



ALTER TABLE "public"."study_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_rw" ON "public"."tags" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()));



ALTER TABLE "public"."tenant_domains" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenant_domains_rw" ON "public"."tenant_domains" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"()));



ALTER TABLE "public"."tenant_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenant_settings_rw" ON "public"."tenant_settings" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"()));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenants_modify" ON "public"."tenants" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "tenants_select" ON "public"."tenants" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "tn_read" ON "public"."topic_notes" FOR SELECT USING (("tenant_id" = "public"."current_tenant_id"()));



CREATE POLICY "tn_write" ON "public"."topic_notes" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()));



ALTER TABLE "public"."topic_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."topics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "topics_read" ON "public"."topics" FOR SELECT USING (("tenant_id" = "public"."current_tenant_id"()));



CREATE POLICY "topics_write" ON "public"."topics" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()));



CREATE POLICY "uqf_self_rw" ON "public"."user_question_flags" USING ((("tenant_id" = "public"."current_tenant_id"()) AND ("user_id" = "public"."current_user_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."questions" "q"
  WHERE (("q"."id" = "user_question_flags"."question_id") AND ("q"."tenant_id" = "public"."current_tenant_id"())))))) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND ("user_id" = "public"."current_user_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."questions" "q"
  WHERE (("q"."id" = "user_question_flags"."question_id") AND ("q"."tenant_id" = "public"."current_tenant_id"()))))));



ALTER TABLE "public"."user_question_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_topic_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ut_admin_rw" ON "public"."user_tenants" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_admin"()));



CREATE POLICY "ut_select_self" ON "public"."user_tenants" FOR SELECT USING (("user_id" = "public"."current_user_id"()));






CREATE POLICY "utp_admin_rw" ON "public"."user_topic_progress" USING ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"())) WITH CHECK ((("tenant_id" = "public"."current_tenant_id"()) AND "public"."is_instructor"()));



CREATE POLICY "utp_self_read" ON "public"."user_topic_progress" FOR SELECT USING ((("user_id" = "public"."current_user_id"()) AND ("tenant_id" = "public"."current_tenant_id"())));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT ALL ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";


REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "anon";
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "authenticated";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "anon";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "authenticated";


GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "service_role";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "service_role";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "service_role";


GRANT SELECT ON TABLE
    "public"."areas",
    "public"."attempt_answer_options",
    "public"."attempt_answers",
    "public"."attempts",
    "public"."audit_log",
    "public"."cases",
    "public"."memberships",
    "public"."mnemonics",
    "public"."payment_events",
    "public"."practice_session_questions",
    "public"."practice_sessions",
    "public"."profiles",
    "public"."question_media",
    "public"."question_options",
    "public"."question_tags",
    "public"."questions",
    "public"."quiz_questions",
    "public"."quizzes",
    "public"."study_notes",
    "public"."tags",
    "public"."tenant_domains",
    "public"."tenant_settings",
    "public"."tenants",
    "public"."topic_notes",
    "public"."topics",
    "public"."user_question_flags",
    "public"."user_tenants",
    "public"."user_topic_progress"
TO "authenticated";


GRANT INSERT, UPDATE, DELETE ON TABLE
    "public"."areas",
    "public"."cases",
    "public"."mnemonics",
    "public"."question_media",
    "public"."question_options",
    "public"."question_tags",
    "public"."questions",
    "public"."quiz_questions",
    "public"."quizzes",
    "public"."study_notes",
    "public"."tags",
    "public"."tenant_domains",
    "public"."tenant_settings",
    "public"."tenants",
    "public"."topic_notes",
    "public"."topics",
    "public"."user_question_flags",
    "public"."user_topic_progress"
TO "authenticated";


GRANT INSERT, UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_tenants" TO "supabase_auth_admin";


REVOKE ALL ON FUNCTION "public"."current_tenant_id"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."current_user_id"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."get_attempt_review"("p_attempt_id" "uuid") FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."get_instructor_cohort_accuracy"("p_days" integer) FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."get_instructor_dashboard_snapshot"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."get_instructor_most_missed_questions"("p_days" integer, "p_limit" integer, "p_min_attempts" integer) FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."get_instructor_student_activity"("p_days" integer) FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."get_instructor_student_weak_topics"("p_days" integer, "p_student_limit" integer, "p_topics_per_student" integer, "p_min_answers" integer) FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."get_topic_practice_questions"("p_topic_id" "uuid", "p_limit" integer) FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."has_active_membership"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."has_any_role"("roles" "text"[]) FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."is_instructor"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."jwt_claim"("claim" "text") FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."jwt_custom_claims"("event" "jsonb") FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."jwt_role"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."start_student_practice_session"("p_topic_id" "uuid", "p_limit" integer) FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."submit_practice_attempt"("p_practice_session_id" "uuid", "p_topic_id" "uuid", "p_answers" "jsonb") FROM PUBLIC, "anon", "authenticated";


GRANT EXECUTE ON FUNCTION "public"."current_tenant_id"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."current_user_id"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_attempt_review"("p_attempt_id" "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_instructor_cohort_accuracy"("p_days" integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_instructor_dashboard_snapshot"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_instructor_most_missed_questions"("p_days" integer, "p_limit" integer, "p_min_attempts" integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_instructor_student_activity"("p_days" integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_instructor_student_weak_topics"("p_days" integer, "p_student_limit" integer, "p_topics_per_student" integer, "p_min_answers" integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_topic_practice_questions"("p_topic_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."has_active_membership"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."has_any_role"("roles" "text"[]) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."is_instructor"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."jwt_claim"("claim" "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."jwt_role"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."start_student_practice_session"("p_topic_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."submit_practice_attempt"("p_practice_session_id" "uuid", "p_topic_id" "uuid", "p_answers" "jsonb") TO "authenticated";


GRANT EXECUTE ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";
GRANT EXECUTE ON FUNCTION "public"."jwt_custom_claims"("event" "jsonb") TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."jwt_custom_claims"("event" "jsonb") TO "supabase_auth_admin";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


SELECT pg_catalog.set_config('search_path', 'public', false);

