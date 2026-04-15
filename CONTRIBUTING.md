# Contributing to OrbitBlocker

Thanks for helping improve OrbitBlocker.

## 1. Before You Start

1. Review the project direction in [README.md](README.md).
2. Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
3. Confirm your proposal does not conflict with project boundaries.

## 2. Contributor Application

Before opening a pull request, submit a Contributor Application issue:

1. Open GitHub Issues.
2. Choose Contributor Application.
3. Share your experience, planned contribution scope, and sample work.
4. Wait for maintainer approval before substantial implementation.

## 3. Development Setup

1. Fork and clone the repository.
2. Create a feature branch from `main`.
3. Run build tasks:

```bash
npm run build:icons
npm run build:rules
```

4. Load unpacked extension in Chrome/Edge and test manually.

## 4. Pull Request Checklist

- Keep the PR focused on one objective.
- Explain what changed and why it was necessary.
- Include validation evidence (screenshots, logs, or reproducible steps).
- Update markdown documentation when behavior or configuration changes.
- Mention any side effects, tradeoffs, or compatibility risks.

## 5. Quality Standards

- Prefer small, reviewable commits.
- Preserve established code style and naming.
- Avoid unrelated refactors.
- Keep scripts deterministic and reproducible.
- Do not introduce permission changes without explicit rationale.

## 6. Out of Scope

- Bypass features for platform access-control enforcement.
- Hidden behavior changes without documentation.
- Breaking changes without migration guidance.

## 7. Review and Release Flow

1. Maintainers review functionality, safety, and scope.
2. Requested revisions are addressed on the same branch.
3. Approved PRs are merged into `main`.
4. Release artifacts are generated only from tagged commits.
