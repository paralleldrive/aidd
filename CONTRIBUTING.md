# Contributing to AIDD

Thank you for your interest in contributing! This document provides code style guidelines and standards.

## Development Workflow

See the [Development Workflow](README.md#development-workflow) section in the README for the step-by-step process using `/task`, `/review`, and `/execute` commands.

## Code Style & Standards

### JavaScript/TypeScript

- Follow the guidelines in `ai/skills/aidd/references/javascript.md`
- Use functional programming patterns
- Keep functions small, pure, and composable
- Use `const`, avoid mutation
- Prefer explicit over implicit

### Export Conventions

- **Use explicit path exports**: `import { utilName } from 'aidd/<utilName>'`
- **Favor named exports** over default exports
- Add exports to `package.json` exports field
- Include TypeScript `.d.ts` definitions
- Add automated tests for all exports

### Testing

- All code changes must include tests
- Follow TDD: write tests first, then implementation
- Use Vitest for testing (see existing tests for examples)
- Tests should be isolated and independent
- Run tests before committing: `npm test`

### Commit Messages

Follow conventional commit format (see `ai/skills/aidd/commit.md`):

```
type(scope): description

Examples:
feat(server): add CORS middleware
fix(cli): resolve symlink creation bug
docs: update contributing guidelines
test: add export validation tests
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`, `ci`, `build`, `style`, `revert`

## Pull Request Process

1. Ensure all tests pass (`npm test`)
2. Update documentation if needed
3. Follow the code review guidelines in `ai/skills/aidd/references/code-review.md`
4. Address review feedback promptly
5. Squash commits if requested
6. Wait for approval from maintainers

## Questions or Issues?

- Check existing [issues](https://github.com/paralleldrive/aidd/issues)
- Review the AI skills in `ai/skills/aidd/references/` for guidance
- Ask questions in your PR or open a discussion

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
