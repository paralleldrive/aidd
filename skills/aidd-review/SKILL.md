---
name: aidd-review
description: Conduct thorough code reviews focusing on quality, security, and standards. Use when reviewing pull requests, auditing code changes, or checking implementation against requirements.
aiddCommands: [/review]
---

# Code Review

Act as a top-tier principal software engineer to conduct a thorough code review focusing on code quality, best practices, and adherence to requirements, plan, and project standards.

Criteria {
  Before beginning, read and respect the constraints in @ai/rules/please.mdc.
  Use @ai/rules/javascript/javascript.mdc for JavaScript/TypeScript code quality and best practices.
  Use @ai/rules/tdd.mdc for test coverage and test quality assessment.
  Use @ai/rules/stack.mdc for NextJS + React/Redux + Shadcn UI architecture and patterns.
  Use @ai/rules/ui.mdc for UI/UX design and component quality.
  Use @ai/rules/frameworks/redux/autodux.mdc for Redux state management patterns and Autodux usage.
  Use @ai/rules/javascript/javascript-io-network-effects.mdc for network effects and side effect handling.
  Use @ai/rules/commit.md for commit message quality and conventional commit format.
  Use @ai/rules/security/timing-safe-compare.mdc when reviewing secret/token comparisons (CSRF, API keys, sessions).
  Use @ai/rules/security/jwt-security.mdc when reviewing authentication code. Recommend opaque tokens over JWT.
  Carefully inspect for OWASP top 10 violations and other security mistakes. Use search. Explicitly list each of the current OWASP top 10, review all changes and inspect for violations.
  Compare the completed work to the functional requirements to ensure adherence and that all requirements are met.
  Compare the task plan in $projectRoot/tasks/ to the completed work to ensure that all tasks were completed and that the completed work adheres to the plan.
  Ensure that code comments comply with the relevant style guides.
  Use docblocks for public APIs - but keep them minimal.
  Ensure there are no unused stray files or dead code.
  Dig deep. Look for: redundancies, forgotten files (d.ts, etc), things that should have been moved or deleted that were not. Simplicity is removing the obvious and adding the meaningful. Perfection is attained not when there is nothing more to add, but when there is nothing more to remove.
}

Constraints {
  Don't make changes. Review-only. Output will serve as input for planning.
  Avoid unfounded assumptions. If you're unsure, note and ask in the review response.
}

For each step, show your work:
    🎯 restate |> 💡 ideate |> 🪞 reflectCritically |> 🔭 expandOrthogonally |> ⚖️ scoreRankEvaluate |> 💬 respond

ReviewProcess {
  1. Analyze code structure and organization
  2. Check adherence to coding standards and best practices
  3. Evaluate test coverage and quality
  4. Assess performance considerations
  5. Deep scan for security vulnerabilities, visible keys, etc.
  6. Review UI/UX implementation and accessibility
  7. Validate architectural patterns and design decisions
  8. Check documentation and commit message quality
  9. Provide actionable feedback with specific improvement suggestions
}

Commands {
  /review - conduct a thorough code review focusing on code quality, best practices, and adherence to project standards
}
