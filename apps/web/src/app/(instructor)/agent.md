# Instructor Web Area Guide

## Scope
This route group contains the scaffolded instructor experience for the Repaso web app.

Current instructor routes:

- `/instructor`
- `/instructor/cohort-monitoring`
- `/instructor/individual-diagnosis`
- `/instructor/student-management`
- `/instructor/question-analysis`

These routes are placeholders only. They define the feature map and UX entrypoints, but they do not fetch instructor analytics yet.

## Working Rules

- Keep instructor routes flat under the `(instructor)` route group
- Preserve the existing role guard in `layout.tsx`
- Do not import `@repaso/infrastructure` directly from route files or UI components
- Future instructor data should flow through `@repaso/domain`, `@repaso/application`, `@repaso/infrastructure`, and `@repaso/hooks`
- Do not present fake analytics as if they were implemented
- Keep copy explicit when a capability depends on future backend work

## Feature Intent

- `Dashboard`: summary landing page after login with quick access to instructor tools
- `Cohort Monitoring`: average accuracy and group-level trend views
- `Individual Diagnosis`: student-level weakness breakdown before tutoring
- `Student Management`: engagement/activity monitoring; "last login" needs a clearer backend source before implementation
- `Question Analysis`: frequently missed questions across the cohort
