"use client";

import { useEffect, useMemo, useState } from "react";
import { Access, Student } from "@repaso/hooks";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import AccessNotice from "@/components/AccessNotice";
import FlagToggleButton from "@/components/FlagToggleButton";
import PageLoader from "@/components/PageLoader";
import { loadPracticeDraft, sanitizePracticeDraft, savePracticeDraft } from "@/lib/practice-draft";

type AnswerMap = Record<string, string>;

const QUESTION_LIMIT = 5;

export default function PracticePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const access = Access.useCurrentAccess();
  const accessLoading = access.loading;
  const user = access.user;
  const membership = access.membership;
  const allowed = access.isStudent && access.hasActiveMembership;
  const accessError = allowed
    ? null
    : access.error ?? "Tu membresía no tiene acceso activo al contenido de estudio.";
  const { content, loading, error: contentError } = Student.usePracticeContent(
    allowed ? slug : null,
    QUESTION_LIMIT
  );
  const { updateQuestionFlag } = Student.usePracticeMutations();
  const detail = content?.detail ?? null;
  const questions = useMemo(() => content?.questions ?? [], [content?.questions]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [pendingFlagIds, setPendingFlagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content || !user || !slug) {
      return;
    }

    const draft = loadPracticeDraft(user.id, slug);
    const sanitizedDraft = sanitizePracticeDraft(draft, questions);

    setAnswers(sanitizedDraft.answers);
    setFlaggedQuestionIds(content.flaggedQuestionIds);
    setError(null);
  }, [content, questions, slug, user]);

  useEffect(() => {
    if (!content || !detail || !user || !slug || questions.length === 0) {
      return;
    }

    savePracticeDraft(user.id, slug, {
      practiceSessionId: content.practiceSessionId,
      topicId: detail.topic.id,
      topicSlug: detail.topic.slug,
      topicName: detail.topic.name,
      questions,
      answers,
      flaggedQuestionIds,
      updatedAt: new Date().toISOString(),
    });
  }, [answers, content, detail, flaggedQuestionIds, questions, slug, user]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );
  const flaggedCount = flaggedQuestionIds.length;
  const unansweredCount = Math.max(questions.length - answeredCount, 0);

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  }

  async function handleToggleFlag(questionId: string) {
    if (!membership || !user) {
      return;
    }

    const currentlyFlagged = flaggedQuestionIds.includes(questionId);

    setFlaggedQuestionIds((current) =>
      currentlyFlagged ? current.filter((item) => item !== questionId) : [...current, questionId]
    );
    setPendingFlagIds((current) => [...current, questionId]);
    setError(null);

    try {
      await updateQuestionFlag({
        tenantId: membership.tenant_id,
        userId: user.id,
        questionId,
        flagged: !currentlyFlagged,
      });
    } catch (toggleError) {
      setFlaggedQuestionIds((current) =>
        currentlyFlagged ? [...current, questionId] : current.filter((item) => item !== questionId)
      );
      setError(toggleError instanceof Error ? toggleError.message : "No fue posible actualizar la marca.");
    } finally {
      setPendingFlagIds((current) => current.filter((item) => item !== questionId));
    }
  }

  function handleReviewSummary() {
    if (!detail || !user || !slug) {
      return;
    }

    router.push(`/student/topics/${slug}/practice/summary`);
  }

  if (!allowed) {
    if (accessLoading || !slug) {
      return <PageLoader label="Preparando práctica..." />;
    }

    return (
      <AccessNotice
        title="Práctica no disponible"
        message={accessError ?? "Necesitas una membresía activa o en prueba para resolver preguntas."}
      />
    );
  }

  if (!slug || accessLoading || loading) {
    return <PageLoader label="Preparando práctica..." />;
  }

  if ((error || contentError) && !detail) {
    return <AccessNotice title="Práctica no disponible" message={error ?? contentError ?? "No fue posible cargar la práctica."} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={`Práctica: ${detail?.topic.name ?? "Tema"}`}
        subtitle="Responde y revisa tu resultado al finalizar"
        backHref={detail ? `/student/topics/${detail.topic.slug}` : "/student/topics"}
        backLabel="Volver al tema"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-foreground/10 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">Sesión rápida</p>
              <h2 className="text-2xl font-semibold text-foreground">{questions.length} preguntas publicadas</h2>
            </div>
            <div className="text-right">
              <p className="text-text-secondary">Respondidas</p>
              <p className="text-3xl font-bold text-primary">
                {answeredCount}/{questions.length}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-background px-4 py-3">
              <p className="text-sm text-text-secondary">Respondidas</p>
              <p className="text-2xl font-semibold text-foreground">{answeredCount}</p>
            </div>
            <div className="rounded-2xl bg-background px-4 py-3">
              <p className="text-sm text-text-secondary">Sin responder</p>
              <p className="text-2xl font-semibold text-foreground">{unansweredCount}</p>
            </div>
            <div className="rounded-2xl bg-background px-4 py-3">
              <p className="text-sm text-text-secondary">Marcadas</p>
              <p className="text-2xl font-semibold text-foreground">{flaggedCount}</p>
            </div>
          </div>
        </section>

        {error ? <div className="bg-error/10 border border-error rounded-2xl p-4 text-error">{error}</div> : null}

        {questions.length === 0 ? (
          <section className="bg-white rounded-2xl border border-foreground/10 p-6 text-text-secondary">
            Este tema todavía no tiene preguntas publicadas. Añade contenido en Supabase o vuelve a intentarlo más tarde.
          </section>
        ) : (
          <section className="space-y-6">
            {questions.map((question, index) => (
              <article key={question.question_id} className="bg-white rounded-2xl border border-foreground/10 p-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">Pregunta {index + 1}</p>
                    <h3 className="text-xl font-semibold text-foreground">{question.prompt}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary capitalize">{question.difficulty}</span>
                    <FlagToggleButton
                      flagged={flaggedQuestionIds.includes(question.question_id)}
                      disabled={pendingFlagIds.includes(question.question_id)}
                      onToggle={() => handleToggleFlag(question.question_id)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {question.options.map((option) => {
                    const selected = answers[question.question_id] === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelect(question.question_id, option.id)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-foreground/10 hover:border-primary/40 hover:bg-background"
                        }`}
                      >
                        <span className="font-semibold mr-2">{option.label}.</span>
                        {option.value}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleReviewSummary}
            disabled={questions.length === 0}
            className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 font-medium transition-colors"
          >
            Revisar resumen
          </button>
        </div>
      </main>
    </div>
  );
}
