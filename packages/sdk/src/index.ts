// Client utilities
export { makeClient } from "./client";

// Authentication
export { RepasoAuth } from "./repaso-auth";

// Types and interfaces
export type {
    LoginCredentials,
    SignUpCredentials,
    AuthResult,
    User,
    Session,
    AuthError
} from "./types";

// Topics
export { fetchTopics, fetchTopicsByArea } from "./topics";
export type { Topic } from "./topics";

// React hooks
export { useAreasWithTopics } from "./hooks-areas";

// Areas
export { fetchAreas } from "./areas";
export type { Area } from "./areas";