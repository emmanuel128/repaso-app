import { Student as DomainStudent } from "@repaso/domain";
import type { StudentRepository } from "./repository";

export async function searchStudentContent(
  repository: StudentRepository,
  query: string,
  limitPerCategory?: number
): Promise<DomainStudent.GlobalSearchGroup[]> {
  return repository.searchContent(query, limitPerCategory);
}
