"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PracticeQuestion, SelectedAnswer, TopicDetail } from "@repaso/sdk";
import { createPracticeSession, fetchTopicDetail, fetchTopicPracticeQuestions, submitPracticeAttempt } from "@repaso/sdk";
import AppHeader from "@/components/AppHeader";
import AccessNotice from "@/components/AccessNotice";
import PageLoader from "@/components/PageLoader";
import { supabaseBrowser } from "@/lib/supabase";
import { useStudentAccess } from "@/lib/student-access";

type AnswerMap = Record<string, string>;

const QUESTION_LIMIT = 5;

export default function PracticePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { loading: accessLoading, user, membership, allowed, error: accessError } = useStudentAccess();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const [detail, setDetail] = useState<TopicDetail | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessLoading || !allowed || !slug) {
      return;
    }

    const currentSlug = slug;
    const client = supabaseBrowser();
    let mounted = true;

    async function loadPractice() {
      setLoading(true);
      try {
        const topicDetail = await fetchTopicDetail(client, currentSlug);

        if (!topicDetail) {
          throw new Error("No encontramos el tema solicitado.");
        }

        const practiceQuestions = await fetchTopicPracticeQuestions(client, topicDetail.topic.id, QUESTION_LIMIT);

        if (!mounted) {
          return;
        }

        setDetail(topicDetail);
        setQuestions(practiceQuestions);
        setAnswers({});
        setError(null);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la práctica.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPractice();

    return () => {
      mounted = false;
    };
  }, [accessLoading, allowed, slug]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  }

  async function handleSubmit() {
    if (!detail || !user || !membership) {
      return;
    }

    const missingAnswers = questions.some((question) => !answers[question.question_id]);
    if (missingAnswers) {
      setError("Contesta todas las preguntas antes de enviar tu práctica.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const client = supabaseBrowser();
      const session = await createPracticeSession(client, {
        tenantId: membership.tenant_id,
        userId: user.id,
        topicId: detail.topic.id,
        config: {
          question_count: questions.length,
          source: "student_mvp",
        },
      });

      const payload: SelectedAnswer[] = questions.map((question) => ({
        question_id: question.question_id,
        selected_option_ids: answers[question.question_id] ? [answers[question.question_id]] : [],
      }));

      const result = await submitPracticeAttempt(client, {
        practiceSessionId: session.id,
        topicId: detail.topic.id,
        answers: payload,
      });

      router.push(`/attempts/${result.attempt_id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible enviar la práctica.");
      setSubmitting(false);
    }
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

  if (error && !detail) {
    return <AccessNotice title="Práctica no disponible" message={error} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={`Práctica: ${detail?.topic.name ?? "Tema"}`}
        subtitle="Responde y revisa tu resultado al finalizar"
        backHref={detail ? `/topics/${detail.topic.slug}` : "/topics"}
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
                  <span className="text-sm text-text-secondary capitalize">{question.difficulty}</span>
                </div>

                <div className="space-y-3">
                  {question.options.map((option) => {
                    const selected = answers[question.question_id] === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelect(question.question_id, option.id)}
                        className={`w-full text-left rounded-2xl border px-4 py-4 transition-colors ${
                          selected
                            ? "border-primary bg-primary/10 text-foreground"
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 font-medium transition-colors"
              >
                {submitting ? "Enviando..." : "Enviar práctica"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
