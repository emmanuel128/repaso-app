"use client";

import type { ReactNode } from "react";
import { Access, Instructor, Student } from "@repaso/hooks";
import {
  browserInstructorRepository,
  browserStudentRepository,
  currentAccessDependencies,
} from "@/lib/repaso-dependencies";

export default function RepasoProviders({ children }: { children: ReactNode }) {
  return (
    <Access.CurrentAccessProvider dependencies={currentAccessDependencies}>
      <Instructor.InstructorDependenciesProvider repository={browserInstructorRepository}>
        <Student.StudentDependenciesProvider repository={browserStudentRepository}>
          {children}
        </Student.StudentDependenciesProvider>
      </Instructor.InstructorDependenciesProvider>
    </Access.CurrentAccessProvider>
  );
}
