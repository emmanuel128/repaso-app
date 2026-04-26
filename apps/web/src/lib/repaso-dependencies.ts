"use client";

import type { Access, Instructor, Student } from "@repaso/application";
import {
  Access as InfrastructureAccess,
  Instructor as InfrastructureInstructor,
  Student as InfrastructureStudent,
} from "@repaso/infrastructure";
import { supabaseBrowser, createAuthClient } from "@/lib/supabase";

const browserClient = supabaseBrowser();

export const browserStudentRepository: Student.StudentRepository =
  InfrastructureStudent.createSupabaseStudentRepository(browserClient);

export const browserInstructorRepository: Instructor.InstructorRepository =
  InfrastructureInstructor.createSupabaseInstructorRepository(browserClient);

export const currentAccessDependencies: Access.CurrentAccessDependencies = {
  authGateway: createAuthClient(),
  accessRepository: InfrastructureAccess.createSupabaseAccessRepository(browserClient),
};
