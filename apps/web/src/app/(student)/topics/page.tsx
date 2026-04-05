"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Access, Student } from "@repaso/hooks";
import AppHeader from "@/components/AppHeader";
import AccessNotice from "@/components/AccessNotice";
import PageLoader from "@/components/PageLoader";

const MIN_QUERY_LENGTH = 2;

export default function TopicsPage() {
  const access = Access.useCurrentAccess();
  const accessLoading = access.loading;
  const allowed = access.isStudent && access.hasActiveMembership;
  const accessError = allowed
    ? null
    : access.error ?? "Tu membresía no tiene acceso activo al contenido de estudio.";
  const { areas, loading, error } = Student.useAreasWithTopics();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const trimmedQuery = query.trim();
  const hasActiveSearch = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
  } = Student.useGlobalSearch(debouncedQuery, allowed && !accessLoading && hasActiveSearch);
  const totalResults = useMemo(
    () => searchResults.reduce((sum, group) => sum + group.results.length, 0),
    [searchResults]
  );

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
      <AppHeader
        title="Temas"
        subtitle="Explora el contenido disponible para la Reválida"
        backHref="/dashboard"
        backLabel="Dashboard"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-white rounded-2xl border border-foreground/10 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca entre temas, casos clínicos y mnemotecnias"
              className="flex-1 rounded-2xl border border-foreground/10 bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex items-center justify-center rounded-full border border-foreground/10 bg-white px-5 py-3 font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-background"
              >
                Limpiar
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            La búsqueda no distingue mayúsculas de minúsculas y muestra resultados agrupados por categoría.
          </p>
        </section>

        {loading ? <div className="text-text-secondary">Cargando temas...</div> : null}
        {error ? <div className="bg-error/10 border border-error rounded-lg p-4 text-error">{error}</div> : null}
        {searchError ? <div className="bg-error/10 border border-error rounded-lg p-4 text-error">{searchError}</div> : null}

        {hasActiveSearch ? (
          <>
            {searchLoading ? <PageLoader label="Buscando contenido..." /> : null}

            {!searchLoading ? (
              <section className="space-y-6">
                <div className="bg-white rounded-2xl border border-foreground/10 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">Resultados</p>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {totalResults} coincidencia{totalResults === 1 ? "" : "s"} para “{trimmedQuery}”
                  </h2>
                </div>

                {searchResults.map((group) => (
                  <article key={group.category} className="bg-white rounded-2xl border border-foreground/10 p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">{group.label}</p>
                    <h3 className="text-xl font-semibold text-foreground mb-5">{group.results.length} resultados</h3>

                    {group.results.length ? (
                      <div className="space-y-4">
                        {group.results.map((result) => (
                          <Link
                            key={`${result.category}-${result.id}`}
                            href={result.href}
                            className="block rounded-2xl border border-foreground/10 px-5 py-4 transition-colors hover:border-primary/40 hover:bg-background"
                          >
                            <p className="text-lg font-semibold text-foreground mb-2">{result.title}</p>
                            <p className="text-text-secondary leading-7">
                              {result.snippet || "Coincidencia encontrada en este contenido."}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-text-secondary">No hubo coincidencias en esta categoría.</div>
                    )}
                  </article>
                ))}
              </section>
            ) : null}
          </>
        ) : null}

        {!loading && !error && !hasActiveSearch ? (
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
                        <div className="mt-6 flex items-center justify-end gap-4">
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
