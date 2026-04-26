import type { Instructor as DomainInstructor } from "@repaso/domain";

export interface InstructorRepository {
  fetchDashboardSnapshot(): Promise<DomainInstructor.DashboardSnapshot>;
}
