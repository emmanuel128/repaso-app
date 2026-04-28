-- Medium fix: allow students to read question media while keeping writes instructor-only.
-- Low fixes: remove dead RLS write policies, remove redundant jwt_custom_claims,
-- and add missing index on attempts.practice_session_id.

-- Replace legacy combined policy with explicit read/write policies.
DROP POLICY IF EXISTS "qm_rw" ON "public"."question_media";

CREATE POLICY "qm_read" ON "public"."question_media"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM "public"."questions" q
      WHERE q.id = "question_media"."question_id"
        AND q.tenant_id = "public"."current_tenant_id"()
        AND (
          "public"."is_instructor"()
          OR "public"."has_active_membership"()
        )
    )
  );

CREATE POLICY "qm_write" ON "public"."question_media"
  USING (
    EXISTS (
      SELECT 1
      FROM "public"."questions" q
      WHERE q.id = "question_media"."question_id"
        AND q.tenant_id = "public"."current_tenant_id"()
        AND "public"."is_instructor"()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "public"."questions" q
      WHERE q.id = "question_media"."question_id"
        AND q.tenant_id = "public"."current_tenant_id"()
        AND "public"."is_instructor"()
    )
  );


-- Include question media in attempt review payload.
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
        ), '[]'::jsonb),
        'media', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', qm.id,
              'kind', qm.kind,
              'storage_path', qm.storage_path,
              'caption', qm.caption
            )
          )
          from question_media qm
          where qm.question_id = q.id
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


-- Include question media in practice session payload.
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
          ), '[]'::jsonb),
          'media', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', qm.id,
                'kind', qm.kind,
                'storage_path', qm.storage_path,
                'caption', qm.caption
              )
            )
            from question_media qm
            where qm.question_id = sq.id
          ), '[]'::jsonb)
        )
        order by sq.position asc
      ),
      '[]'::jsonb
    )
  from scoped_questions sq;
end;
$$;


-- Low fix: remove dead write policies (no matching authenticated DML grants).
DROP POLICY IF EXISTS "m_admin_rw" ON "public"."memberships";
DROP POLICY IF EXISTS "pe_admin_rw" ON "public"."payment_events";
DROP POLICY IF EXISTS "ut_admin_rw" ON "public"."user_tenants";


-- Low fix: remove redundant helper function.
DROP FUNCTION IF EXISTS "public"."jwt_custom_claims"("event" "jsonb");


-- Low fix: add missing index for practice session lookups.
CREATE INDEX IF NOT EXISTS "idx_attempts_practice_session_id"
  ON "public"."attempts" USING "btree" ("practice_session_id");
