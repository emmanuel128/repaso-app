"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Access, Instructor } from "@repaso/hooks";
import AppHeader from "@/components/AppHeader";
import PageLoader from "@/components/PageLoader";
import { createAuthClient } from "@/lib/supabase";

const INSTRUCTOR_LINKS = [
  {
    href: "/instructor/cohort-monitoring",
    title: "Cohort Monitoring",
    description:
      "Profundiza en el rendimiento promedio del grupo y detecta tendencias por cohorte.",
  },
  {
    href: "/instructor/individual-diagnosis",
    title: "Individual Diagnosis",
    description:
      "Revisa las áreas de dificultad de cada estudiante antes de tutorías o sesiones de apoyo.",
  },
  {
    href: "/instructor/student-management",
    title: "Student Management",
    description:
      "Supervisa la actividad reciente de estudio y el seguimiento del cohorte.",
  },
  {
    href: "/instructor/question-analysis",
    title: "Question Analysis",
    description:
      "Identifica preguntas con alto nivel de fallo para reforzar contenido en clase.",
  },
] as const;

function formatStudentName(value: string | null | undefined): string {
  return value?.trim() || "Estudiante";
}

export default function InstructorDashboard() {
  const router = useRouter();
  const access = Access.useCurrentAccess();
  const { snapshot, loading, error } = Instructor.useDashboard();

  async function handleSignOut() {
    const auth = createAuthClient();
    await auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return <PageLoader label="Cargando dashboard del instructor..." />;
  }

  const snapshotData = snapshot ?? {
    studentsCount: 0,
    activeStudentsLast7Days: 0,
    cohortAccuracy: 0,
    questionsAnswered: 0,
    attentionTopics: [],
    recentActivity: [],
  };

  const hasPracticeData = snapshotData.questionsAnswered > 0;
  const tenantName = access.tenant?.name ?? "tu cohorte";
  const greetingName =
    access.user?.user_metadata?.full_name ?? access.user?.email ?? "Instructor";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Dashboard del instructor"
        subtitle={`Resumen en vivo de ${tenantName}`}
        rightSlot={
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-primary transition-colors hover:text-secondary"
          >
            Cerrar sesión
          </button>
        }
      />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-primary to-accent p-8 text-white">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] opacity-80">
            Instructor
          </p>
          <h2 className="mb-3 text-3xl font-bold">
            Hola, {formatStudentName(greetingName)}
          </h2>
          <p className="max-w-3xl text-white/90">
            Este dashboard resume la actividad reciente de estudio y práctica de{" "}
            {tenantName}. La métrica de actividad refleja comportamiento
            académico de los últimos 7 días, no seguimiento de inicio de sesión.
          </p>
        </section>

        {error ? (
          <div className="rounded-2xl border border-error bg-error/10 p-4 text-error">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-text-secondary">
              Estudiantes
            </p>
            <p className="text-4xl font-bold text-foreground">
              {snapshotData.studentsCount}
            </p>
          </article>
          <article className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-text-secondary">
              Activos en 7 días
            </p>
            <p className="text-4xl font-bold text-accent">
              {snapshotData.activeStudentsLast7Days}
            </p>
          </article>
          <article className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-text-secondary">
              Precisión del cohorte
            </p>
            <p className="text-4xl font-bold text-success">
              {snapshotData.cohortAccuracy}%
            </p>
          </article>
          <article className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-text-secondary">
              Respuestas corregidas
            </p>
            <p className="text-4xl font-bold text-foreground">
              {snapshotData.questionsAnswered}
            </p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Áreas que requieren atención
                </h3>
                <p className="text-text-secondary">
                  Temas con menor precisión entre estudiantes con actividad en
                  los últimos 7 días.
                </p>
              </div>
              <Link
                href="/instructor/cohort-monitoring"
                className="text-sm font-medium text-primary transition-colors hover:text-secondary"
              >
                Ver análisis
              </Link>
            </div>

            {hasPracticeData && snapshotData.attentionTopics.length ? (
              <div className="space-y-4">
                {snapshotData.attentionTopics.map((topic) => (
                  <div
                    key={topic.topicId}
                    className="rounded-2xl border border-foreground/10 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {topic.topicName}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {topic.answeredQuestions} respuestas registradas ·{" "}
                          {topic.studentsTracked} estudiantes activos incluidos
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-error">
                        {topic.accuracy}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full bg-gradient-to-r from-error to-accent"
                        style={{ width: `${Math.max(topic.accuracy, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-foreground/15 p-6 text-text-secondary">
                Aún no hay suficiente actividad corregida para calcular temas que
                requieran atención.
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Actividad reciente del cohorte
                </h3>
                <p className="text-text-secondary">
                  Últimos intentos enviados por estudiantes del tenant.
                </p>
              </div>
              <Link
                href="/instructor/student-management"
                className="text-sm font-medium text-primary transition-colors hover:text-secondary"
              >
                Ver seguimiento
              </Link>
            </div>

            {snapshotData.recentActivity.length ? (
              <div className="space-y-4">
                {snapshotData.recentActivity.map((activity) => (
                  <div
                    key={activity.attemptId}
                    className="rounded-2xl border border-foreground/10 p-4"
                  >
                    <p className="font-semibold text-foreground">
                      {activity.topicName}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {activity.scorePercent}% · {formatStudentName(activity.studentName)}
                    </p>
                    <p className="mt-2 text-sm text-text-secondary">
                      {new Date(activity.submittedAt).toLocaleString("es-PR")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-foreground/15 p-6 text-text-secondary">
                Todavía no hay intentos enviados para mostrar actividad reciente.
              </div>
            )}
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {INSTRUCTOR_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-foreground/10 bg-white p-6 shadow-sm transition hover:border-foreground/20 hover:bg-neutral-50"
            >
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">
                  {link.title}
                </h3>
                <p className="leading-7 text-text-secondary">
                  {link.description}
                </p>
                <span className="text-sm font-medium text-primary">
                  Abrir área
                </span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
