"use client";

import type { CurrentAccessDependencies } from "@repaso/application";
import type { StudentRepository } from "@repaso/application";
import { createSupabaseAccessRepository, createSupabaseStudentRepository } from "@repaso/infrastructure";
import { supabaseBrowser, createAuthClient } from "@/lib/supabase";

const browserClient = supabaseBrowser();

export const browserStudentRepository: StudentRepository =
  createSupabaseStudentRepository(browserClient);

export const currentAccessDependencies: CurrentAccessDependencies = {
  authGateway: createAuthClient(),
  accessRepository: createSupabaseAccessRepository(browserClient),
};
