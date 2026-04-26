import type { Instructor as DomainInstructor } from "@repaso/domain";
import type { InstructorRepository } from "./repository";

export async function getInstructorDashboardSnapshot(
  repository: InstructorRepository
): Promise<DomainInstructor.DashboardSnapshot> {
  return repository.fetchDashboardSnapshot();
}
