create or replace function public.get_instructor_dashboard_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
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

grant execute on function public.get_instructor_dashboard_snapshot() to authenticated;
