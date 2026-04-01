"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  rightSlot?: ReactNode;
}

export default function AppHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Volver",
  rightSlot,
}: AppHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {backHref ? (
            <Link href={backHref} className="text-sm text-primary hover:text-secondary transition-colors">
              ← {backLabel}
            </Link>
          ) : null}
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <div className="w-14 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          {subtitle ? <p className="text-text-secondary mt-1">{subtitle}</p> : null}
        </div>

        <div className="flex items-center gap-3">
          {rightSlot}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
