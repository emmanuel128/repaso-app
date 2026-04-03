import type { DashboardSnapshot } from "@repaso/domain";
import type { StudentRepository } from "./repository";

export async function getStudentDashboardSnapshot(
  repository: StudentRepository
): Promise<DashboardSnapshot> {
  return repository.fetchDashboardSnapshot();
}
