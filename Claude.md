# CLAUDE.md

## Project Defaults

- **Language**: [Your primary language, e.g., TypeScript, Python, Go]
- **Framework**: [e.g., React, FastAPI, Express]
- **Package manager**: [npm, yarn, pnpm, pip, poetry, etc.]

## Autonomous Behavior

- Make changes directly without asking for confirmation
- Run tests after making code changes
- Auto-fix linting errors when detected
- Commit with conventional commit messages (feat:, fix:, docs:, etc.)
- Create new files as needed without asking

## Code Style

- Use existing patterns in the codebase as reference
- Follow the project's established conventions
- Prefer functional/declarative style unless the codebase uses OOP
- Keep functions small and focused

## Commands
```bash
# Development
dev: [your dev command, e.g., npm run dev]
test: [your test command, e.g., npm test]
lint: [your lint command, e.g., npm run lint]
build: [your build command, e.g., npm run build]
```

## File Structure

- Components: `src/components/`
- Utils: `src/utils/`
- Tests: `__tests__/` or alongside source files as `*.test.ts`
- Types: `src/types/`

## Decision Making

When uncertain between approaches:
1. Check existing codebase for precedent
2. Choose the simpler solution
3. Prefer standard library over external dependencies
4. If still unclear, pick one and proceed (don't ask)

## Git Workflow

- Commit frequently with meaningful messages
- Branch naming: `feature/`, `fix/`, `chore/`
- Don't push unless explicitly asked

## Testing

- Write tests for new functionality
- Run existing tests before committing
- Fix broken tests immediately

## Error Handling

- If a command fails, try to fix the issue and retry
- If dependencies are missing, install them
- If types are missing, add them or install @types packages