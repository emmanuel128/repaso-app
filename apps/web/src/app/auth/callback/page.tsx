"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import { supabaseBrowser } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function finalizeAuth() {
      try {
        const client = supabaseBrowser();
        const code = new URL(window.location.href).searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        router.replace("/dashboard");
      } catch (callbackError) {
        if (!mounted) {
          return;
        }

        setError(callbackError instanceof Error ? callbackError.message : "No fue posible completar el acceso.");
      }
    }

    finalizeAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-foreground/10 p-8">
          <h1 className="text-2xl font-semibold text-foreground mb-3">Error de autenticación</h1>
          <p className="text-text-secondary leading-7">{error}</p>
        </div>
      </div>
    );
  }

  return <PageLoader label="Completando acceso..." />;
}
