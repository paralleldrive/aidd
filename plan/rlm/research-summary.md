# RLM Skill Research Summary

**Epic**: Recursive Language Model Skill for aidd Framework
**Date**: 2026-01-20
**Status**: Research Complete

## Overview

Research completed on Agent Skills specification and MIT's Recursive Language Models paper to build an RLM skill that enables AI agents to deeply understand complex codebases through hierarchical task decomposition.

## Key Research Areas

1. **Agent Skills Specification** (agentskills.io)
2. **MIT Recursive Language Models Paper** (arXiv 2512.24601)
3. **RLM Implementation Patterns** (alexzhang13/rlm)
4. **aidd Framework Integration Strategy**

## Core Findings

### Agent Skills Format

Agent Skills are simple, discoverable folders containing:
- **SKILL.md** file with YAML frontmatter + markdown instructions
- Optional scripts and resources
- Minimal required fields: `name` and `description`

Skills are auto-loaded by compatible agents (Claude Code, Cursor, VS Code Copilot) and provide specialized task guidance.

### Recursive Language Models Concept

RLMs enable language models to handle near-infinite context by:
- **Treating input as external environment** rather than stuffing into context window
- **Programmatic examination** through code execution
- **Recursive decomposition** of complex queries into sub-queries
- **Self-invocation** over smaller snippets
- **Result aggregation** back up the call stack

**Performance**: Handles inputs 2 orders of magnitude beyond context windows with dramatically better quality.

### aidd Adaptation Strategy

aidd framework already provides REPL-like capabilities through:
- Grep/Glob tools for programmatic search
- Read tool for snippet examination
- Built-in RAG for semantic search
- Bash tool for symbolic execution

**RLM Enhancement**: Add SQLite-based indexing + query tools to enable structured, recursive exploration of codebase metadata.

## Implementation Architecture

### Hybrid Approach

**JavaScript/Bun with TDD** (Symbolic Processing):
- Frontmatter extraction and indexing
- SQLite database management
- FTS5 full-text search
- Dependency graph traversal
- CLI query tools

**SudoLang Skill** (AI Intelligence):
- Recursive decomposition strategy
- Query planning and orchestration
- Semantic summarization
- Result aggregation

### Database Strategy

**SQLite with JSON + FTS5 extensions**:
- Document storage with JSON columns for flexible schema
- Full-text search for content exploration
- Recursive CTEs for graph traversal
- Lightweight, portable, TDD-friendly

## Next Steps

1. Create user journey mapping pain points and workflows
2. Build SQLite indexer with comprehensive tests
3. Implement query CLI tools
4. Write RLM skill in SudoLang
5. Update AGENTS.md with usage guidelines
6. Test recursive exploration patterns

## References

- [Agent Skills Specification](https://agentskills.io/specification)
- [Anthropic Skills GitHub](https://github.com/anthropics/skills)
- [Recursive Language Models Paper](https://arxiv.org/abs/2512.24601)
- [RLM GitHub Implementation](https://github.com/alexzhang13/rlm)
- [Agent Skills Overview](https://simonwillison.net/2025/Dec/19/agent-skills/)
