"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PracticeDraft } from "@/lib/practice-draft";
import type { SelectedAnswer } from "@repaso/sdk";
import { createPracticeSession, submitPracticeAttempt } from "@repaso/sdk";
import AccessNotice from "@/components/AccessNotice";
import AppHeader from "@/components/AppHeader";
import PageLoader from "@/components/PageLoader";
import { clearPracticeDraft, loadPracticeDraft } from "@/lib/practice-draft";
import { supabaseBrowser } from "@/lib/supabase";
import { useStudentAccess } from "@/lib/student-access";

export default function PracticeSummaryPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const { loading: accessLoading, user, membership, allowed, error: accessError } = useStudentAccess();
  const [draft, setDraft] = useState<PracticeDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessLoading || !allowed || !slug || !user) {
      return;
    }

    const storedDraft = loadPracticeDraft(user.id, slug);

    if (!storedDraft) {
      router.replace(`/topics/${slug}/practice`);
      return;
    }

    setDraft(storedDraft);
    setError(null);
    setLoading(false);
  }, [accessLoading, allowed, router, slug, user]);

  const answeredCount = useMemo(
    () => Object.values(draft?.answers ?? {}).filter(Boolean).length,
    [draft]
  );
  const totalQuestions = draft?.questions.length ?? 0;
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);
  const flaggedQuestionIds = useMemo(() => new Set(draft?.flaggedQuestionIds ?? []), [draft]);

  async function handleSubmit() {
    if (!draft || !membership || !user) {
      return;
    }

    if (unansweredCount > 0) {
      setError("Todavía tienes preguntas sin responder. Vuelve a la práctica para completarlas.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const client = supabaseBrowser();
      const session = await createPracticeSession(client, {
        tenantId: membership.tenant_id,
        userId: user.id,
        topicId: draft.topicId,
        config: {
          question_count: draft.questions.length,
          source: "student_mvp",
          summary_reviewed: true,
        },
      });

      const payload: SelectedAnswer[] = draft.questions.map((question) => ({
        question_id: question.question_id,
        selected_option_ids: draft.answers[question.question_id] ? [draft.answers[question.question_id]] : [],
      }));

      const result = await submitPracticeAttempt(client, {
        practiceSessionId: session.id,
        topicId: draft.topicId,
        answers: payload,
      });

      clearPracticeDraft(user.id, draft.topicSlug);
      router.push(`/attempts/${result.attempt_id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible enviar la práctica.");
      setSubmitting(false);
    }
  }

  if (!allowed) {
    if (accessLoading || !slug) {
      return <PageLoader label="Preparando resumen..." />;
    }

    return (
      <AccessNotice
        title="Resumen no disponible"
        message={accessError ?? "Necesitas una membresía activa o en prueba para revisar este intento."}
      />
    );
  }

  if (!slug || accessLoading || loading || !draft) {
    return <PageLoader label="Preparando resumen..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={`Resumen: ${draft.topicName}`}
        subtitle="Revisa preguntas respondidas, pendientes y marcadas antes de enviar"
        backHref={`/topics/${slug}/practice`}
        backLabel="Volver a preguntas"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-foreground/10 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-background px-4 py-4">
              <p className="text-sm text-text-secondary">Respondidas</p>
              <p className="text-3xl font-semibold text-foreground">{answeredCount}</p>
            </div>
            <div className="rounded-2xl bg-background px-4 py-4">
              <p className="text-sm text-text-secondary">Sin responder</p>
              <p className="text-3xl font-semibold text-foreground">{unansweredCount}</p>
            </div>
            <div className="rounded-2xl bg-background px-4 py-4">
              <p className="text-sm text-text-secondary">Marcadas</p>
              <p className="text-3xl font-semibold text-foreground">{flaggedQuestionIds.size}</p>
            </div>
          </div>
        </section>

        {error ? <div className="bg-error/10 border border-error rounded-2xl p-4 text-error">{error}</div> : null}

        <section className="space-y-4">
          {draft.questions.map((question, index) => {
            const selectedOptionId = draft.answers[question.question_id];
            const selectedOption = question.options.find((option) => option.id === selectedOptionId);
            const isFlagged = flaggedQuestionIds.has(question.question_id);

            return (
              <article key={question.question_id} className="bg-white rounded-2xl border border-foreground/10 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">Pregunta {index + 1}</p>
                    <h2 className="text-lg font-semibold text-foreground">{question.prompt}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${selectedOption ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                      {selectedOption ? "Respondida" : "Sin responder"}
                    </span>
                    {isFlagged ? (
                      <span className="rounded-full bg-warning/15 px-3 py-1 text-sm font-medium text-foreground">
                        Marcada
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-background px-4 py-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">Respuesta actual</p>
                  <p className="text-text-secondary">
                    {selectedOption ? (
                      <>
                        <span className="font-semibold text-foreground mr-2">{selectedOption.label}.</span>
                        {selectedOption.value}
                      </>
                    ) : (
                      "Esta pregunta sigue pendiente."
                    )}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push(`/topics/${slug}/practice`)}
            className="inline-flex items-center justify-center rounded-full border border-foreground/10 bg-white px-6 py-3 font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-background"
          >
            Editar respuestas
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || unansweredCount > 0}
            className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 font-medium transition-colors"
          >
            {submitting ? "Enviando..." : "Enviar práctica"}
          </button>
        </div>
      </main>
    </div>
  );
}
