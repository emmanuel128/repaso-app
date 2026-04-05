"use client";

import type { Access, Student } from "@repaso/application";
import { Access as InfrastructureAccess, Student as InfrastructureStudent } from "@repaso/infrastructure";
import { supabaseBrowser, createAuthClient } from "@/lib/supabase";

const browserClient = supabaseBrowser();

export const browserStudentRepository: Student.StudentRepository =
  InfrastructureStudent.createSupabaseStudentRepository(browserClient);

export const currentAccessDependencies: Access.CurrentAccessDependencies = {
  authGateway: createAuthClient(),
  accessRepository: InfrastructureAccess.createSupabaseAccessRepository(browserClient),
};
