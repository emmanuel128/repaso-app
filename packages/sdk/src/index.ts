// Client utilities
export { makeClient } from "./client";

// Authentication
export { RepasoAuth } from "./repaso-auth";

// Types and interfaces
export type {
    LoginCredentials,
    SignUpCredentials,
    AuthResult,
    Membership,
    MembershipStatus,
    User,
    Session,
    AuthError
} from "./types";

// Topics
export { fetchTopics, fetchTopicsByArea } from "./topics";
export type { Topic } from "./topics";

// Topic content
export { fetchTopicBySlug, fetchTopicDetail } from "./topic-content";
export type { TopicDetail, TopicNote, Mnemonic, CaseStudy, UserTopicProgress } from "./topic-content";

// Membership
export { ACTIVE_MEMBERSHIP_STATUSES, fetchMemberships, fetchCurrentMembership, hasStudentAccess } from "./memberships";

// Practice
export {
    createPracticeSession,
    fetchTopicPracticeQuestions,
    fetchQuestionFlags,
    submitPracticeAttempt,
    fetchAttemptReview,
    setQuestionFlag,
} from "./practice";
export type {
    PracticeSession,
    PracticeQuestion,
    PracticeQuestionOption,
    UserQuestionFlag,
    SelectedAnswer,
    PracticeSubmissionSummary,
    AttemptReviewQuestion,
    AttemptReviewOption,
} from "./practice";

// Dashboard
export { fetchDashboardSnapshot } from "./dashboard";
export type { DashboardSnapshot, DashboardProgressRow, DashboardAttemptRow } from "./dashboard";

// React hooks
export { useAreasWithTopics } from "./hooks-areas";

// Areas
export { fetchAreas } from "./areas";
export type { Area } from "./areas";
