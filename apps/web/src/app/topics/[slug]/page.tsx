"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchTopicDetail, type TopicDetail } from "@repaso/sdk";
import AppHeader from "@/components/AppHeader";
import AccessNotice from "@/components/AccessNotice";
import MarkdownContent from "@/components/MarkdownContent";
import PageLoader from "@/components/PageLoader";
import { supabaseBrowser } from "@/lib/supabase";
import { useStudentAccess } from "@/lib/student-access";

export default function TopicDetailPage() {
  const { loading: accessLoading, allowed, error: accessError } = useStudentAccess();
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const [detail, setDetail] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessLoading || !allowed || !slug) {
      return;
    }

    const currentSlug = slug;
    const client = supabaseBrowser();
    let mounted = true;

    async function loadDetail() {
      setLoading(true);
      try {
        const data = await fetchTopicDetail(client, currentSlug);
        if (!mounted) {
          return;
        }

        setDetail(data);
        setError(data ? null : "No encontramos ese tema.");
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el tema.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [accessLoading, allowed, slug]);

  if (!allowed) {
    if (accessLoading || !slug) {
      return <PageLoader label="Cargando tema..." />;
    }

    return (
      <AccessNotice
        title="Tema no disponible"
        message={accessError ?? "Necesitas una membresía activa o en prueba para estudiar este contenido."}
      />
    );
  }

  if (!slug || accessLoading || loading) {
    return <PageLoader label="Cargando tema..." />;
  }

  if (error || !detail) {
    return <AccessNotice title="Tema no disponible" message={error ?? "No encontramos ese tema."} />;
  }

  const answered = (detail.progress?.total_correct ?? 0) + (detail.progress?.total_incorrect ?? 0);
  const accuracy = answered > 0 ? Math.round(((detail.progress?.total_correct ?? 0) / answered) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={detail.topic.name}
        subtitle={detail.topic.description ?? "Repaso guiado del tema"}
        backHref="/topics"
        backLabel="Temas"
        rightSlot={
          <Link href={`/topics/${detail.topic.slug}/practice`} className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-secondary text-white px-4 py-2 text-sm font-medium transition-colors">
            Practicar ahora
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="bg-white rounded-2xl border border-foreground/10 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-3">Preguntas disponibles</p>
            <p className="text-4xl font-bold text-foreground">{detail.questionCount}</p>
          </article>
          <article className="bg-white rounded-2xl border border-foreground/10 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-3">Preguntas trabajadas</p>
            <p className="text-4xl font-bold text-primary">{answered}</p>
          </article>
          <article className="bg-white rounded-2xl border border-foreground/10 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-3">Precisión</p>
            <p className="text-4xl font-bold text-success">{accuracy}%</p>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <article className="bg-white rounded-2xl border border-foreground/10 p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Notas clave</h2>
                <p className="text-text-secondary">Material breve para repasar antes de practicar.</p>
              </div>
              {detail.questionCount > 0 ? (
                <Link href={`/topics/${detail.topic.slug}/practice`} className="text-sm text-primary hover:text-secondary transition-colors">
                  Ir a práctica
                </Link>
              ) : null}
            </div>
            {detail.notes.length ? (
              <div className="space-y-4">
                {detail.notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-foreground/10 p-5">
                    <h3 className="font-semibold text-foreground mb-2">{note.title}</h3>
                    <MarkdownContent content={note.content_md} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-text-secondary">Este tema todavía no tiene notas publicadas.</div>
            )}
          </article>

          <div className="space-y-6">
            <article className="bg-white rounded-2xl border border-foreground/10 p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Mnemotecnias</h2>
              {detail.mnemonics.length ? (
                <div className="space-y-4">
                  {detail.mnemonics.map((mnemonic) => (
                    <div
                      key={mnemonic.id}
                      id={`mnemonic-${mnemonic.id}`}
                      className="rounded-2xl bg-background p-4 scroll-mt-28"
                    >
                      <h3 className="font-semibold text-foreground mb-2">{mnemonic.title}</h3>
                      <MarkdownContent content={mnemonic.content_md} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-text-secondary">No hay mnemotecnias publicadas todavía.</div>
              )}
            </article>

            <article className="bg-white rounded-2xl border border-foreground/10 p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Casos clínicos</h2>
              {detail.cases.length ? (
                <div className="space-y-4">
                  {detail.cases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      id={`case-${caseItem.id}`}
                      className="rounded-2xl bg-background p-4 scroll-mt-28"
                    >
                      <h3 className="font-semibold text-foreground mb-2">{caseItem.title}</h3>
                      <MarkdownContent content={caseItem.body_md} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-text-secondary">No hay casos clínicos publicados todavía.</div>
              )}
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
