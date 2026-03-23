"use client";

import Link from "next/link";
import { useAreasWithTopics } from "@repaso/sdk";
import AppHeader from "@/components/AppHeader";
import AccessNotice from "@/components/AccessNotice";
import PageLoader from "@/components/PageLoader";
import { supabaseBrowser } from "@/lib/supabase";
import { useStudentAccess } from "@/lib/student-access";

export default function TopicsPage() {
  const { loading: accessLoading, allowed, error: accessError } = useStudentAccess();
  const client = supabaseBrowser();
  const { areas, loading, error } = useAreasWithTopics(client);

  if (!allowed) {
    if (accessLoading) {
      return <PageLoader label="Cargando temas..." />;
    }

    return (
      <AccessNotice
        title="Sin acceso a los temas"
        message={accessError ?? "Necesitas una membresía activa o en prueba para estudiar."}
      />
    );
  }

  if (accessLoading) {
    return <PageLoader label="Cargando temas..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Temas" subtitle="Explora el contenido disponible para la Reválida" backHref="/dashboard" backLabel="Dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? <div className="text-text-secondary">Cargando temas...</div> : null}
        {error ? <div className="bg-error/10 border border-error rounded-lg p-4 text-error">{error}</div> : null}

        {!loading && !error ? (
          <div className="space-y-10">
            {areas.map((area) => (
              <section key={area.id}>
                <div className="mb-5">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold text-foreground">{area.name}</h2>
                    <div className="w-14 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                  </div>
                  {area.description ? <p className="text-text-secondary">{area.description}</p> : null}
                </div>

                {area.topics.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {area.topics.map((topic) => (
                      <article key={topic.id} className="bg-white rounded-2xl border border-foreground/10 shadow-sm p-6 flex flex-col">
                        <p className="text-xs uppercase tracking-[0.2em] text-text-secondary mb-3">{area.name}</p>
                        <h3 className="text-xl font-semibold text-foreground mb-3">{topic.name}</h3>
                        <p className="text-text-secondary leading-7 flex-1">
                          {topic.description ?? "Contenido de repaso y práctica guiada para este tema."}
                        </p>
                        <div className="mt-6 flex items-center justify-between gap-4">
                          <span className="text-sm text-text-secondary">Slug: {topic.slug}</span>
                          <Link href={`/topics/${topic.slug}`} className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-secondary text-white px-4 py-2 text-sm font-medium transition-colors">
                            Abrir tema
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="text-text-secondary">No hay temas publicados en esta área.</div>
                )}
              </section>
            ))}

            {areas.length === 0 ? <div className="text-text-secondary">No hay áreas disponibles.</div> : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
