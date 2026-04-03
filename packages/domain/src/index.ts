export type {
  AuthError,
  Session,
  User,
  AuthResult,
  CurrentAccess,
  LoginCredentials,
  SignUpCredentials,
} from "./shared/auth";
export {
  canEnterAdminArea,
  canEnterInstructorArea,
  canEnterStudentArea,
  getDefaultAuthenticatedRoute,
} from "./shared/access-policy";
export {
  ACTIVE_MEMBERSHIP_STATUSES,
  hasActiveMembership,
} from "./shared/membership";
export type { Membership, MembershipStatus } from "./shared/membership";
export {
  isAdminRole,
  isInstructorRole,
  isStudentRole,
} from "./shared/roles";
export type { RoleType, TenantContext, UserTenantRole } from "./shared/roles";
export type {
  Area,
  AreaWithTopics,
  CaseStudy,
  ContentStatus,
  Mnemonic,
  Topic,
  TopicDetail,
  TopicNote,
  UserTopicProgress,
} from "./student/content";
export type {
  DashboardAttemptRow,
  DashboardProgressRow,
  DashboardSnapshot,
} from "./student/dashboard";
export type {
  AttemptReviewOption,
  AttemptReviewQuestion,
  PracticeQuestion,
  PracticeQuestionOption,
  PracticeSession,
  PracticeSubmissionSummary,
  SelectedAnswer,
  StudentPracticeContent,
  UserQuestionFlag,
} from "./student/practice";
export type {
  GlobalSearchCategory,
  GlobalSearchGroup,
  GlobalSearchResult,
} from "./student/search";
