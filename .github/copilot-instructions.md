# GitHub Copilot Project Instructions

## Core Rules

- Always read .vibe/nexus.md and .vibe/logbook.json before starting any task.
- Follow the B.L.A.S.T. protocol and A.N.T. 3-layer architecture.
- No guessing: if business logic is ambiguous, halt and ask for clarification.

## Required Skills

- For any Next.js-related work, load and follow the `next-best-practices` skill.
- For any UX/UI-related work (layouts, components, styling, accessibility), load and follow the `ui-ux-pro-max` skill.
- For any code committing tasks, use the `git-commit` skill.

## Engineering Standards & PR Management

### 1. Branching & Commits
- **Convention**: Use `type/description`. Valid types: `feat`, `fix`, `chore`, `refactor`, `perf`.
- **Commits**: For any code committing tasks, use the `git-commit` skill.
- **Messages**: Always provide context on *why* a change was made if the logic is non-trivial.
- **Quality**: Prohibit "WIP" commits. Ensure no `console.log` or debug statements remain.

### 2. Technical Execution
- **TypeScript**: Use strict typing. Avoid `any`. Prefer interfaces over types for public APIs.
- **SCSS**: Adhere strictly to the established Design System variables. No hardcoded hex values.
- **Node.js**: Optimize for performance. Use asynchronous patterns correctly.
- **Credentials**: never commit credentials

### 3. PR Management
- **Description Generation**: When asked to summarize changes for a PR, use a structured table or bullet points.
- **Structure**: 
  - **Problem**: What is the bottleneck or bug?
  - **Solution**: How does this code resolve it?
  - **Impact**: Any side effects on CI/CD or library consumers?
- **Review**: Suggest relevant reviewers based on the file scope (e.g., UI/UX for SCSS, DevOps for YAML).

### 4. Conflict Resolution
- **Rebase**: Always suggest `git rebase` over `git merge` to maintain linear history.
- **Cleanliness**: Suggest deleting remote branches immediately after a successful squash-merge.


## UX/UI Visual Source of Truth

- The UI must follow the Stitch mockup: https://stitch.withgoogle.com/projects/12556289865273809072
- Local mockups are available in .vibe/mokeup:
  - home.html
  - quizz.html
  - top-match.html

## Documentation Priority

- Update SOPs in .vibe/architecture.md BEFORE changing any logic.
- Keep data schemas in .vibe/nexus.md as the canonical source.

