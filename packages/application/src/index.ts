export { resolveCurrentAccess } from "./student/access";
export type {
  AccessRepository,
  AuthGateway,
  CurrentAccessDependencies,
} from "./student/access";
export { getStudentAttemptReview } from "./student/attempts";
export { getStudentDashboardSnapshot } from "./student/dashboard";
export {
  getStudentPracticeContent,
  startStudentPracticeSession,
  submitStudentPracticeAttempt,
  updateStudentQuestionFlag,
} from "./student/practice";
export type { StudentRepository } from "./student/repository";
export { searchStudentContent } from "./student/search";
export {
  getStudentAreasWithTopics,
  getStudentTopicDetail,
} from "./student/topics";
