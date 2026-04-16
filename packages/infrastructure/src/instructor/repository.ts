import type { Instructor as ApplicationInstructor } from "@repaso/application";
import type { Instructor as DomainInstructor } from "@repaso/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

interface InstructorDashboardRpcAttentionTopicRow {
  topic_id: string;
  topic_name: string;
  topic_slug: string | null;
  accuracy: number | string;
  answered_questions: number | string;
  students_tracked: number | string;
}

interface InstructorDashboardRpcRecentActivityRow {
  attempt_id: string;
  student_id: string;
  student_name: string;
  topic_name: string;
  topic_slug: string | null;
  score_percent: number | string;
  submitted_at: string;
}

interface InstructorDashboardRpcSnapshot {
  students_count: number | string;
  active_students_last_7_days: number | string;
  cohort_accuracy: number | string;
  questions_answered: number | string;
  attention_topics?: InstructorDashboardRpcAttentionTopicRow[] | null;
  recent_activity?: InstructorDashboardRpcRecentActivityRow[] | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }

  return 0;
}

function mapAttentionTopicRow(
  row: InstructorDashboardRpcAttentionTopicRow
): DomainInstructor.AttentionTopicRow {
  return {
    topicId: row.topic_id,
    topicName: row.topic_name,
    topicSlug: row.topic_slug,
    accuracy: toNumber(row.accuracy),
    answeredQuestions: toNumber(row.answered_questions),
    studentsTracked: toNumber(row.students_tracked),
  };
}

function mapRecentActivityRow(
  row: InstructorDashboardRpcRecentActivityRow
): DomainInstructor.RecentActivityRow {
  return {
    attemptId: row.attempt_id,
    studentId: row.student_id,
    studentName: row.student_name,
    topicName: row.topic_name,
    topicSlug: row.topic_slug,
    scorePercent: toNumber(row.score_percent),
    submittedAt: row.submitted_at,
  };
}

export function createSupabaseInstructorRepository(
  client: SupabaseClient
): ApplicationInstructor.InstructorRepository {
  return {
    async fetchDashboardSnapshot(): Promise<DomainInstructor.DashboardSnapshot> {
      const { data, error } = await client.rpc(
        "get_instructor_dashboard_snapshot"
      );

      if (error) {
        throw error;
      }

      const snapshot = (data ?? {}) as InstructorDashboardRpcSnapshot;

      return {
        studentsCount: toNumber(snapshot.students_count),
        activeStudentsLast7Days: toNumber(
          snapshot.active_students_last_7_days
        ),
        cohortAccuracy: toNumber(snapshot.cohort_accuracy),
        questionsAnswered: toNumber(snapshot.questions_answered),
        attentionTopics: (snapshot.attention_topics ?? []).map(
          mapAttentionTopicRow
        ),
        recentActivity: (snapshot.recent_activity ?? []).map(
          mapRecentActivityRow
        ),
      };
    },
  };
}
