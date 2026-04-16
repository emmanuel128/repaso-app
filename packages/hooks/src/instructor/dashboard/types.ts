import type { Instructor as DomainInstructor } from "@repaso/domain";

export interface UseInstructorDashboardResult {
  readonly snapshot: DomainInstructor.DashboardSnapshot | null;
  readonly loading: boolean;
  readonly error: string | null;
}
