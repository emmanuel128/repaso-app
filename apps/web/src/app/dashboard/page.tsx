"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DashboardSnapshot } from "@repaso/sdk";
import { fetchDashboardSnapshot } from "@repaso/sdk";
import AppHeader from "@/components/AppHeader";
import AccessNotice from "@/components/AccessNotice";
import PageLoader from "@/components/PageLoader";
import { createAuthClient, supabaseBrowser } from "@/lib/supabase";
import { useStudentAccess } from "@/lib/student-access";

export default function DashboardPage() {
  const router = useRouter();
  const { loading: accessLoading, user, membership, allowed, error: accessError } = useStudentAccess();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessLoading || !allowed) {
      return;
    }

    const client = supabaseBrowser();
    let mounted = true;

    async function loadSnapshot() {
      setLoadingSnapshot(true);
      try {
        const data = await fetchDashboardSnapshot(client);
        if (!mounted) {
          return;
        }

        setSnapshot(data);
        setError(null);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar tu progreso.");
      } finally {
        if (mounted) {
          setLoadingSnapshot(false);
        }
      }
    }

    loadSnapshot();

    return () => {
      mounted = false;
    };
  }, [accessLoading, allowed]);

  async function handleSignOut() {
    const auth = createAuthClient();
    await auth.signOut();
    router.replace("/login");
  }

  if (accessLoading) {
    return <PageLoader label="Validando acceso..." />;
  }

  if (!allowed) {
    return (
      <AccessNotice
        title="Acceso restringido"
        message={accessError ?? "Necesitas una membresía activa o en prueba para continuar estudiando."}
      />
    );
  }

  if (loadingSnapshot) {
    return <PageLoader label="Cargando tu dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Dashboard"
        subtitle="Tu centro de práctica para la Reválida de Psicología"
        rightSlot={
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-primary hover:text-secondary transition-colors"
          >
            Cerrar sesión
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-gradient-to-r from-primary to-accent rounded-3xl p-8 text-white">
          <p className="text-sm uppercase tracking-[0.25em] opacity-80 mb-3">Student MVP</p>
          <h2 className="text-3xl font-bold mb-3">
            {user?.user_metadata?.full_name ? `Hola, ${user.user_metadata.full_name}` : `Hola, ${user?.email}`}
          </h2>
          <p className="text-white/90 max-w-2xl">
            Tu membresía está en estado <span className="font-semibold">{membership?.status ?? "desconocido"}</span>. Continúa practicando por tema, revisa tus resultados y detecta en qué áreas necesitas más repaso.
          </p>
        </section>

        {error ? (
          <div className="bg-error/10 border border-error rounded-2xl p-4 text-error">{error}</div>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="bg-white rounded-2xl shadow-sm border border-foreground/10 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-3">Preguntas respondidas</p>
            <p className="text-4xl font-bold text-foreground">{snapshot?.completedQuestions ?? 0}</p>
          </article>
          <article className="bg-white rounded-2xl shadow-sm border border-foreground/10 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-3">Precisión</p>
            <p className="text-4xl font-bold text-success">{snapshot?.accuracy ?? 0}%</p>
          </article>
          <article className="bg-white rounded-2xl shadow-sm border border-foreground/10 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-3">Temas trabajados</p>
            <p className="text-4xl font-bold text-accent">{snapshot?.topicsStudied ?? 0}</p>
          </article>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <article className="bg-white rounded-2xl shadow-sm border border-foreground/10 p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Progreso por tema</h3>
                <p className="text-text-secondary">Tu desempeño reciente según los intentos ya corregidos.</p>
              </div>
              <Link href="/topics" className="text-sm font-medium text-primary hover:text-secondary transition-colors">
                Ver todos los temas
              </Link>
            </div>

            {snapshot?.progressByTopic.length ? (
              <div className="space-y-4">
                {snapshot.progressByTopic.map((row) => {
                  const total = row.total_correct + row.total_incorrect;
                  const accuracy = total > 0 ? Math.round((row.total_correct / total) * 100) : 0;

                  return (
                    <div key={row.topic_id} className="rounded-2xl border border-foreground/10 p-4">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{row.topics?.name ?? "Tema"}</p>
                          <p className="text-sm text-text-secondary">
                            {row.total_correct} correctas · {row.total_incorrect} incorrectas
                          </p>
                        </div>
                        {row.topics?.slug ? (
                          <Link href={`/topics/${row.topics.slug}`} className="text-sm text-primary hover:text-secondary transition-colors">
                            Abrir tema
                          </Link>
                        ) : null}
                      </div>
                      <div className="h-3 rounded-full bg-background overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${accuracy}%` }} />
                      </div>
                      <p className="text-sm text-text-secondary mt-2">
                        Precisión acumulada: <span className="font-medium text-foreground">{accuracy}%</span>
                        {row.last_score != null ? ` · Último intento ${Math.round(row.last_score)}%` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-foreground/15 p-6 text-text-secondary">
                Aún no has completado intentos. Empieza por un tema para generar tu primer resultado.
              </div>
            )}
          </article>

          <article className="bg-white rounded-2xl shadow-sm border border-foreground/10 p-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">Actividad reciente</h3>
            <p className="text-text-secondary mb-6">Tus últimos intentos corregidos y listos para revisar.</p>

            {snapshot?.recentAttempts.length ? (
              <div className="space-y-4">
                {snapshot.recentAttempts.map((attempt) => {
                  const percentage = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;

                  return (
                    <div key={attempt.id} className="rounded-2xl border border-foreground/10 p-4">
                      <p className="font-semibold text-foreground">
                        {attempt.practice_sessions?.topics?.name ?? "Práctica"}
                      </p>
                      <p className="text-sm text-text-secondary mb-3">
                        Resultado: {percentage}% · {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString("es-PR") : "Sin fecha"}
                      </p>
                      <div className="flex items-center gap-4">
                        <Link href={`/attempts/${attempt.id}`} className="text-sm font-medium text-primary hover:text-secondary transition-colors">
                          Revisar respuestas
                        </Link>
                        {attempt.practice_sessions?.topics?.slug ? (
                          <Link href={`/topics/${attempt.practice_sessions.topics.slug}/practice`} className="text-sm text-text-secondary hover:text-foreground transition-colors">
                            Repetir tema
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-foreground/15 p-6 text-text-secondary">
                Todavía no hay intentos recientes para mostrar.
              </div>
            )}
          </article>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="bg-white rounded-2xl shadow-sm border border-foreground/10 p-6">
            <h3 className="text-xl font-semibold text-foreground mb-3">Comenzar práctica por tema</h3>
            <p className="text-text-secondary mb-5">
              Entra a un tema para repasar notas, ver casos clínicos y resolver preguntas con retroalimentación inmediata.
            </p>
            <Link href="/topics" className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-secondary text-white px-5 py-3 font-medium transition-colors">
              Explorar temas
            </Link>
          </article>

          <article className="bg-white rounded-2xl shadow-sm border border-foreground/10 p-6">
            <h3 className="text-xl font-semibold text-foreground mb-3">Qué ya implementa este MVP</h3>
            <p className="text-text-secondary leading-7">
              Acceso de estudiante, navegación por temas, práctica corregida, revisión de explicaciones y métricas reales de progreso a partir de tus intentos.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
