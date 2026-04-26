"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Access, Student } from "@repaso/hooks";
import AccessNotice from "@/components/AccessNotice";
import AppHeader from "@/components/AppHeader";
import PageLoader from "@/components/PageLoader";

const MIN_QUERY_LENGTH = 2;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const access = Access.useCurrentAccess();
  const accessLoading = access.loading;
  const allowed = access.isStudent && access.hasActiveMembership;
  const accessError = allowed
    ? null
    : access.error ?? "Tu membresía no tiene acceso activo al contenido de estudio.";
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const trimmedQuery = initialQuery.trim();
  const {
    results,
    loading,
    error,
  } = Student.useGlobalSearch(trimmedQuery, allowed && !accessLoading && trimmedQuery.length >= MIN_QUERY_LENGTH);

  const totalResults = useMemo(
    () => results.reduce((sum, group) => sum + group.results.length, 0),
    [results]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    router.push(trimmedQuery ? `/student/search?q=${encodeURIComponent(trimmedQuery)}` : "/student/search");
  }

  if (!allowed) {
    if (accessLoading) {
      return <PageLoader label="Preparando búsqueda..." />;
    }

    return (
      <AccessNotice
        title="Búsqueda no disponible"
        message={accessError ?? "Necesitas una membresía activa o en prueba para buscar contenido."}
      />
    );
  }

  if (accessLoading) {
    return <PageLoader label="Preparando búsqueda..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Búsqueda global"
        subtitle="Busca rápidamente entre temas, casos clínicos y mnemotecnias"
        backHref="/student"
        backLabel="Dashboard"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-2xl border border-foreground/10 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej. ansiedad, trastorno bipolar, memoria"
              className="flex-1 rounded-2xl border border-foreground/10 bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-secondary text-white px-6 py-3 font-medium transition-colors"
            >
              Buscar
            </button>
          </form>
          <p className="mt-3 text-sm text-text-secondary">
            La búsqueda no distingue entre mayúsculas y minúsculas y muestra el fragmento donde aparece la palabra clave.
          </p>
        </section>

        {error ? <div className="bg-error/10 border border-error rounded-2xl p-4 text-error">{error}</div> : null}

        {trimmedQuery.length < MIN_QUERY_LENGTH ? (
          <section className="bg-white rounded-2xl border border-foreground/10 p-6 text-text-secondary">
            Escribe al menos {MIN_QUERY_LENGTH} caracteres para buscar en todo el contenido publicado.
          </section>
        ) : null}

        {loading ? <PageLoader label="Buscando contenido..." /> : null}

        {!loading && trimmedQuery.length >= MIN_QUERY_LENGTH ? (
          <section className="space-y-6">
            <div className="bg-white rounded-2xl border border-foreground/10 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">Resultados</p>
              <h2 className="text-2xl font-semibold text-foreground">
                {totalResults} coincidencia{totalResults === 1 ? "" : "s"} para “{trimmedQuery}”
              </h2>
            </div>

            {results.map((group) => (
              <article key={group.category} className="bg-white rounded-2xl border border-foreground/10 p-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-text-secondary mb-2">{group.label}</p>
                    <h3 className="text-xl font-semibold text-foreground">{group.results.length} resultados</h3>
                  </div>
                </div>

                {group.results.length ? (
                  <div className="space-y-4">
                    {group.results.map((result) => (
                      <Link
                        key={`${result.category}-${result.id}`}
                        href={result.href}
                        className="block rounded-2xl border border-foreground/10 px-5 py-4 transition-colors hover:border-primary/40 hover:bg-background"
                      >
                        <p className="text-lg font-semibold text-foreground mb-2">{result.title}</p>
                        <p className="text-text-secondary leading-7">{result.snippet || "Coincidencia encontrada en este contenido."}</p>
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
      </main>
    </div>
  );
}
