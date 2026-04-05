import { Student as DomainStudent } from "@repaso/domain";
import type { StudentRepository } from "./repository";

export async function getStudentAreasWithTopics(
  repository: StudentRepository
): Promise<DomainStudent.AreaWithTopics[]> {
  const [areas, topics] = await Promise.all([
    repository.fetchAreas(),
    repository.fetchTopics(),
  ]);

  const topicsByArea = new Map<string, typeof topics>();

  for (const topic of topics) {
    const list = topicsByArea.get(topic.area_id) ?? [];
    list.push(topic);
    topicsByArea.set(topic.area_id, list);
  }

  return areas.map((area) => ({
    ...area,
    topics: topicsByArea.get(area.id) ?? [],
  }));
}

export async function getStudentTopicDetail(
  repository: StudentRepository,
  slug: string
): Promise<DomainStudent.TopicDetail | null> {
  return repository.fetchTopicDetail(slug);
}
