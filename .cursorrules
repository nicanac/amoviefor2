# Opencode Agent Instructions

## Core Rules

- Always read `.vibe/nexus.md`, `.vibe/logbook.json` and `.vibe/architecture.md` before starting any task.
- Follow the B.L.A.S.T. protocol and A.N.T. 3-layer architecture.
- No guessing: if business logic is ambiguous, halt and ask for clarification.

## Required Skills

Load these skills automatically when working on relevant tasks:

- **Next.js work**: Load `next-best-practices` skill
- **UX/UI work** (layouts, components, styling, accessibility): Load `ui-ux-pro-max` skill  
- **Git commits**: Use the `git-commit` skill for all commit operations

## Engineering Standards

### 1. TypeScript & Code Quality
- Use strict typing. Avoid `any`. Prefer interfaces over types for public APIs.
- Optimize for performance. Use asynchronous patterns correctly.
- Never commit credentials or secrets.

### 2. Styling
- Use Tailwind CSS (adhere to established Design System).
- No hardcoded hex values - use theme variables.
- Mobile-first responsive design.

### 3. Git Workflow
- **Convention**: Use `type/description`. Valid types: `feat`, `fix`, `chore`, `refactor`, `perf`.
- Use the `git-commit` skill for all commit operations.
- **Messages**: Always provide context on *why* a change was made if the logic is non-trivial.
- **Quality**: Prohibit "WIP" commits. Ensure no `console.log` or debug statements remain.
- **Conflict Resolution**: Suggest `git rebase` over `git merge` to maintain linear history.

### 4. Linting & Type Checking
- Always run `npm run lint` and type checking after completing code changes.
- Fix all lint errors before considering a task complete.

## UX/UI Visual Source of Truth

- The UI must follow the Stitch mockup: https://stitch.withgoogle.com/projects/12556289865273809072
- Local mockups are available in `.vibe/mokeup`:
  - `home.html`
  - `quizz.html`
  - `top-match.html`

## Documentation Priority

- Update SOPs in `.vibe/architecture.md` BEFORE changing any logic.
- Keep data schemas in `.vibe/nexus.md` as the canonical source.
- **Update `.vibe/task_plan.md` checkboxes**: When you complete tasks, update the `[ ]` to `[x]` in task_plan.md and update the "Last Updated" date.

## Testing

- Verify your solution with tests when available.
- Never assume specific test framework - check README or search codebase first.
- Only commit when explicitly asked by the user.
