---
description: "Analyze staged/unstaged changes and create conventional commit messages"
argument-hint: "Optional: scope or context hint (e.g. 'auth', 'migration', 'ui')"
agent: "agent"
tools: [get_changed_files, run_in_terminal]
---

Analyze the current git changes in this repository and produce one or more conventional commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Steps

1. Run `git diff --cached` to inspect staged changes. If nothing is staged, run `git diff` for unstaged changes. Also run `git status` for the full picture.
2. Group logically related changes together. Each group should become one commit.
3. For each group, output a commit message using the format below.

## Commit Message Format

```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer — e.g. BREAKING CHANGE, closes #issue]
```

### Allowed types

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Maintenance, dependency updates, tooling |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting, whitespace, no logic change |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `db` | Database migration or seed changes |

### Scope guidelines (this repo)

- Use the affected area: `web`, `mobile`, `infra`, `domain`, `application`, `infrastructure`, `hooks`, `auth`, or a feature name (e.g. `instructor-dashboard`, `student-progress`).
- Omit scope only when the change is truly cross-cutting.
- Branch naming convention: `feature/<desc>`, `fix/<issue>`, `chore/<task>`.

## Output

For each proposed commit, output:

1. The ready-to-use commit message (fenced in a code block).
2. A one-sentence rationale for the chosen type and scope.

If the changes should be a single commit, output one message. If they should be split, explain the split and provide a message per logical group.

> If `$args` was provided, use it as an additional hint for the scope or context.
