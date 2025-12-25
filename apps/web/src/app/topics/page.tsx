"use client";

import { useAreasWithTopics } from '@repaso/sdk';
import { supabaseBrowser } from '@/lib/supabase';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function TopicsPage() {
  const client = supabaseBrowser();
  const { areas, loading, error } = useAreasWithTopics(client);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-sm border-b border-foreground/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground">Temas</h1>
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent ml-2 rounded-full"></div>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-text-secondary">Cargando temas...</div>
        )}
        {error && (
          <div className="bg-error/10 border border-error rounded-lg p-4 text-error">{error}</div>
        )}
        {!loading && !error && (
          <div className="space-y-8">
            {areas.map((a) => (
              <section key={a.id}>
                <div className="flex items-center mb-4">
                  <h2 className="text-xl font-semibold text-foreground">{a.name}</h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-primary to-accent ml-2 rounded-full"></div>
                </div>
                {a.description && (
                  <p className="text-text-secondary mb-3">{a.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {a.topics.map((t) => (
                    <div key={t.id} className="bg-background border border-foreground/10 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
                      <p className="text-sm text-text-secondary">{t.slug}</p>
                    </div>
                  ))}
                  {a.topics.length === 0 && (
                    <div className="text-text-secondary">No hay temas en esta área.</div>
                  )}
                </div>
              </section>
            ))}
            {areas.length === 0 && (
              <div className="text-text-secondary">No hay áreas disponibles.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
