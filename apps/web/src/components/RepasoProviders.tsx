"use client";

import type { ReactNode } from "react";
import { Access, Student } from "@repaso/hooks";
import {
  browserStudentRepository,
  currentAccessDependencies,
} from "@/lib/repaso-dependencies";

export default function RepasoProviders({ children }: { children: ReactNode }) {
  return (
    <Access.CurrentAccessProvider dependencies={currentAccessDependencies}>
      <Student.StudentDependenciesProvider repository={browserStudentRepository}>
        {children}
      </Student.StudentDependenciesProvider>
    </Access.CurrentAccessProvider>
  );
}
