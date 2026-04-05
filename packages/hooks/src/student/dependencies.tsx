"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Student as ApplicationStudent } from "@repaso/application";

const StudentDependenciesContext = createContext<ApplicationStudent.StudentRepository | null>(null);

export function StudentDependenciesProvider({
  repository,
  children,
}: {
  repository: ApplicationStudent.StudentRepository;
  children: ReactNode;
}) {
  return (
    <StudentDependenciesContext.Provider value={repository}>
      {children}
    </StudentDependenciesContext.Provider>
  );
}

export function useStudentRepository(): ApplicationStudent.StudentRepository {
  const repository = useContext(StudentDependenciesContext);

  if (!repository) {
    throw new Error("StudentDependenciesProvider is required to use student hooks.");
  }

  return repository;
}
