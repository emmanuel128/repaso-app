import { Student as DomainStudent } from "@repaso/domain";
import type { StudentRepository } from "./repository";

export async function getStudentDashboardSnapshot(
  repository: StudentRepository
): Promise<DomainStudent.DashboardSnapshot> {
  return repository.fetchDashboardSnapshot();
}
