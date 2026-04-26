"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Instructor as ApplicationInstructor } from "@repaso/application";

const InstructorDependenciesContext =
  createContext<ApplicationInstructor.InstructorRepository | null>(null);

export function InstructorDependenciesProvider({
  repository,
  children,
}: {
  repository: ApplicationInstructor.InstructorRepository;
  children: ReactNode;
}) {
  return (
    <InstructorDependenciesContext.Provider value={repository}>
      {children}
    </InstructorDependenciesContext.Provider>
  );
}

export function useInstructorRepository(): ApplicationInstructor.InstructorRepository {
  const repository = useContext(InstructorDependenciesContext);

  if (!repository) {
    throw new Error(
      "InstructorDependenciesProvider is required to use instructor hooks."
    );
  }

  return repository;
}
