"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Access, Student } from "@repaso/hooks";
import AppHeader from "@/components/AppHeader";
import AccessNotice from "@/components/AccessNotice";
import PageLoader from "@/components/PageLoader";

export default function AttemptReviewPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = typeof params.attemptId === "string" ? params.attemptId : null;
  const access = Access.useCurrentAccess();
  const accessLoading = access.loading;
  const allowed = access.isStudent && access.hasActiveMembership;
  const accessError = allowed
    ? null
    : access.error ?? "Tu membresía no tiene acceso activo al contenido de estudio.";
  const { review, loading, error } = Student.useAttemptReview(allowed ? attemptId : null);

  const score = useMemo(() => review.reduce((sum, item) => sum + item.score, 0), [review]);
  const maxScore = review.length;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  if (!allowed) {
    if (accessLoading || !attemptId) {
      return <PageLoader label="Cargando revisión..." />;
    }

    return (
      <AccessNotice
        title="Revisión no disponible"
        message={accessError ?? "Necesitas una membresía activa o en prueba para revisar este intento."}
      />
    );
  }

  if (!attemptId || accessLoading || loading) {
    return <PageLoader label="Cargando revisión..." />;
  }

  if (error) {
    return <AccessNotice title="Revisión no disponible" message={error} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Revisión del intento"
        subtitle={`Resultado: ${percentage}%`}
        backHref="/student"
        backLabel="Dashboard"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-foreground/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">Resumen</p>
            <h2 className="text-3xl font-bold text-foreground">
              {score}/{maxScore} correctas
            </h2>
          </div>
          <Link href="/student/topics" className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-secondary text-white px-5 py-3 font-medium transition-colors">
            Practicar otro tema
          </Link>
        </section>

        <section className="space-y-6">
          {review.map((question, index) => (
            <article key={question.question_id} className="bg-white rounded-2xl border border-foreground/10 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">Pregunta {index + 1}</p>
                  <h3 className="text-xl font-semibold text-foreground">{question.prompt}</h3>
                </div>
                <span className={`rounded-full px-4 py-2 text-sm font-medium ${question.is_correct ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                  {question.is_correct ? "Correcta" : "Incorrecta"}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                {question.options.map((option) => {
                  const selected = question.selected_option_ids.includes(option.id);

                  return (
                    <div
                      key={option.id}
                      className={`rounded-2xl border px-4 py-4 ${
                        option.is_correct
                          ? "border-success bg-success/10"
                          : selected
                            ? "border-error bg-error/10"
                            : "border-foreground/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-foreground">
                          <span className="font-semibold mr-2">{option.label}.</span>
                          {option.value}
                        </p>
                        <div className="text-sm font-medium">
                          {option.is_correct ? <span className="text-success">Respuesta correcta</span> : null}
                          {!option.is_correct && selected ? <span className="text-error">Tu respuesta</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-background p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">Explicación</p>
                <p className="text-text-secondary leading-7">
                  {question.explanation ?? "Esta pregunta aún no tiene explicación publicada."}
                </p>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
