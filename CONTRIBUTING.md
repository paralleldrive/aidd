# Contributing to AIDD

Thank you for your interest in contributing to AIDD! This document provides guidelines for contributing to the project.

## Getting Started

If you haven't already, please read the [README](README.md) for an overview of the project, installation instructions, and how to use the AIDD CLI.

## Development Workflow

For new features or bug fixes spanning more than a few lines of code, we use an AI-driven development workflow:

1. **Create a semantically named branch**
   ```bash
   git checkout -b fix-exports
   # or
   git checkout -b feature-add-logging
   ```

2. **Create a plan using the `/task` command**
   - Use the `/task` command in your AI assistant to create a structured epic
   - The epic should follow the template in `ai/rules/task-creator.mdc`
   - Include clear "Given X, should Y" requirements

3. **Review the plan using `/review`**
   - Use `/review` to eliminate duplication and simplify
   - Ensure no key requirements are lost
   - Keep the epic concise and focused

4. **Execute the plan using `/execute` with TDD**
   - Use `/execute` to implement the plan
   - Follow Test-Driven Development (TDD) - see `ai/rules/tdd.mdc`
   - Implement one requirement at a time
   - Get approval before moving to the next requirement

5. **Push the branch and wait for reviews**
   ```bash
   git push origin your-branch-name
   ```
   - Open a Pull Request
   - Wait for code review and feedback

## Code Style & Standards

### JavaScript/TypeScript

- Follow the guidelines in `ai/rules/javascript/javascript.mdc`
- **Favor named exports over default exports**
- Use functional programming patterns
- Keep functions small, pure, and composable
- Use `const`, avoid mutation
- Prefer explicit over implicit

### Export Conventions

When adding new utilities to the library:

- **Use explicit path exports**: `import { utilName } from 'aidd/<utilName>'`
- **Favor named exports** over default exports
- Add exports to `package.json` exports field
- Include TypeScript `.d.ts` definitions
- Add automated tests for all exports

Example:
```javascript
// lib/myUtil.js
export const myUtil = () => { /* ... */ };

// package.json
{
  "exports": {
    "./myUtil": "./lib/myUtil.js"
  }
}

// Usage
import { myUtil } from 'aidd/myUtil';
```

### Testing

- All code changes must include tests
- Follow TDD: write tests first, then implementation
- Use Vitest for testing (see existing tests for examples)
- Tests should be isolated and independent
- Run tests before committing: `npm test`

### Commit Messages

Follow conventional commit format (see `ai/commands/commit.md`):

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
3. Follow the code review guidelines in `ai/rules/review.mdc`
4. Address review feedback promptly
5. Squash commits if requested
6. Wait for approval from maintainers

## Questions or Issues?

- Check existing [issues](https://github.com/paralleldrive/aidd/issues)
- Review the AI rules in `ai/rules/` for guidance
- Ask questions in your PR or open a discussion

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

