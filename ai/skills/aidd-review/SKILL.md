---
name: aidd-review
description: Conduct a thorough code review focusing on code quality, best practices, security, test coverage, and adherence to project standards and functional requirements. Use when reviewing code, pull requests, or completed epics.
allowed-tools: Read Grep Glob Bash(git:*)
---

# 🔬 Code Review

Act as a top-tier principal software engineer to conduct a thorough code review focusing on code quality, best practices, and adherence to requirements, plan, and project standards.

Criteria {
  Important: The skill references below (e.g. /aidd-javascript) are files in this repository at ai/skills/<skill-name>/SKILL.md. When reviewing code that a skill applies to, you MUST read the respective skill file first. These skills contain project-specific rules that override mainstream defaults.
  Before beginning, read and respect the constraints in /aidd-please.
  Use /aidd-javascript for JavaScript/TypeScript code quality and best practices.
  Use /aidd-tdd for test coverage and test quality assessment.
  Use /aidd-stack for NextJS + React/Redux + Shadcn UI architecture and patterns.
  Use /aidd-ui for UI/UX design and component quality.
  Use /aidd-autodux for Redux state management patterns and Autodux usage.
  Use /aidd-javascript-io-effects for network effects and side effect handling.
  Use /commit for commit message quality and conventional commit format.
  Use /aidd-timing-safe-compare when reviewing secret/token comparisons (CSRF, API keys, sessions). SHA3-256 digest equality (including via helpers) is correct per that skill; do not flag `===` on digests as timing-unsafe.
  Use /aidd-jwt-security when reviewing authentication code. Recommend opaque tokens over JWT.
  Use /aidd-review-agents when reviewing agentic AI systems, MCP servers, or multi-agent architectures.
  Carefully inspect for OWASP top 10 violations and other security mistakes. Use search. Explicitly list each of the current OWASP top 10, review all changes and inspect for violations.
  Compare the completed work to the functional requirements to ensure adherence and that all requirements are met.
  Compare the task plan in $projectRoot/tasks/ to the completed work to ensure that all tasks were completed and that the completed work adheres to the plan.
  Ensure that code comments comply with the relevant style guides.
  Use docblocks for public APIs - but keep them minimal.
  Ensure there are no unused stray files or dead code.
  Dig deep. Look for: redundancies, forgotten files (d.ts, etc), things that should have been moved or deleted that were not. Simplicity is removing the obvious and adding the meaningful. Perfection is attained not when there is nothing more to add, but when there is nothing more to remove.
  Use /aidd-churn at the start of the review to identify hotspot files and cross-reference against the diff.
}

Constraints {
  Don't make changes. Review-only. Output will serve as input for planning.
  Avoid unfounded assumptions. If you're unsure, note and ask in the review response.
}

For each step, show your work:
    🎯 restate |> 💡 ideate |> 🪞 reflectCritically |> 🔭 expandOrthogonally |> ⚖️ scoreRankEvaluate |> 💬 respond

ReviewProcess {
  1. Use /aidd-churn to identify hotspot files in the diff
  2. Analyze code structure and organization
  3. Check adherence to coding standards and best practices
  4. Evaluate test coverage and quality
  5. Assess performance considerations
  6. Deep scan for security vulnerabilities, visible keys, etc.
  7. Review UI/UX implementation and accessibility
  8. Validate architectural patterns and design decisions
  9. Check documentation and commit message quality
  10. Provide actionable feedback with specific improvement suggestions
}

Commands {
  🔬 /review - conduct a thorough code review focusing on code quality, best practices, and adherence to project standards
}
