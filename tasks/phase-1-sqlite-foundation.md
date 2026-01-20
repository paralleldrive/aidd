# Phase 1: SQLite Foundation + Indexing + Fan-out Search

**Status**: 📋 PLANNED
**Goal**: Build core database infrastructure, indexing tools, and fan-out search capabilities that all subsequent phases depend on
**Dependencies**: None (foundational phase)

## Epic Overview

Establish the SQLite database foundation with schema for documents, dependencies, and productmanager data. Build indexing tools with TDD for frontmatter extraction and dependency graph construction. Implement fan-out search capabilities that combine keyword, semantic, and structured queries for rich result aggregation.

This phase provides the data layer and search infrastructure that Jiron APIs, ProductManager skill, and RLM skill will build upon.

---

## Create SQLite Schema

Build complete database schema with JSON + FTS5 support.

**Requirements**:
- Given database location, should create .aidd/index.db
- Given schema version tracking, should support migrations
- Given documents table, should store path, type, frontmatter JSON, content, hash
- Given FTS5 virtual table, should enable full-text search on content and frontmatter
- Given dependencies table, should track file import relationships
- Given productmanager tables, should support personas, journeys, steps, stories, pain points, functional requirements
- Given foreign keys, should enforce referential integrity
- Given indexes, should optimize common query patterns
- Given schema creation, should be idempotent (safe to re-run)

**Success Criteria**:
- [ ] Schema creates all required tables
- [ ] FTS5 triggers sync with documents table
- [ ] Foreign keys validated
- [ ] Migrations system in place
- [ ] Tested with better-sqlite3

---

## Configure Git for SQLite

Set up git to commit and diff SQLite databases.

**Requirements**:
- Given .gitattributes, should mark *.db as binary
- Given git diff configuration, should use sqlite3 textconv
- Given .aidd/index.db, should be committed to repository
- Given git operations, should handle merges gracefully

**Success Criteria**:
- [ ] .gitattributes configured for *.db files
- [ ] Git diff shows SQL output for database changes
- [ ] Database committed and pushable

---

## Build Frontmatter Indexer

Extract YAML frontmatter from all .md/.mdc files and store in SQLite.

**Requirements**:
- Given markdown file with frontmatter, should parse YAML between --- delimiters
- Given frontmatter extraction, should store as JSON in database
- Given file content, should store without frontmatter
- Given file path, should determine type (rule, command, skill, task, story-map)
- Given file hash, should detect changes for incremental re-indexing
- Given batch processing, should use transactions for performance
- Given existing entry, should UPDATE instead of INSERT
- Given errors in YAML, should log and continue processing
- Given FTS5 sync, should populate full-text search automatically

**Success Criteria**:
- [ ] Unit tests pass (vitest + riteway)
- [ ] Handles 100+ files in <1 second
- [ ] Incremental updates work correctly
- [ ] FTS5 search finds indexed content
- [ ] Error handling robust

**Files**:
- ai/tools/index-frontmatter.js
- ai/tools/index-frontmatter.test.js

---

## Build Dependency Indexer

Parse file imports/requires and build dependency graph in SQLite.

**Requirements**:
- Given JavaScript file, should extract import and require statements
- Given import statement, should resolve relative paths to absolute
- Given dependency found, should store from_file, to_file, import_type, line_number
- Given batch processing, should use transactions
- Given existing dependencies, should clear and rebuild for changed files
- Given import types, should distinguish 'import', 'require', 'reference'

**Success Criteria**:
- [ ] Unit tests pass
- [ ] Correctly parses ES modules and CommonJS
- [ ] Graph traversal queries work
- [ ] Handles circular dependencies

**Files**:
- ai/tools/index-dependencies.js
- ai/tools/index-dependencies.test.js

---

## Implement Fan-out Search Core

Build query orchestration that combines multiple search strategies.

**Requirements**:
- Given search query, should determine appropriate strategies (keyword, semantic, structured)
- Given keyword search, should query SQLite FTS5
- Given semantic search, should use built-in RAG capabilities
- Given structured query, should generate SQL for metadata filters
- Given multiple strategies, should execute in parallel
- Given results from multiple sources, should deduplicate by path
- Given result ranking, should combine scores from different sources
- Given result aggregation, should return unified JSON response
- Given max results limit, should apply after aggregation

**Success Criteria**:
- [ ] Unit tests for each search strategy
- [ ] Parallel execution confirmed
- [ ] Deduplication works correctly
- [ ] Result ranking sensible
- [ ] Fast (<200ms for typical queries)

**Files**:
- ai/tools/fan-out-search.js
- ai/tools/fan-out-search.test.js

---

## Build Dependency Traversal Tool

Implement recursive graph traversal for finding related files.

**Requirements**:
- Given target file, should find all files that depend on it (reverse dependencies)
- Given target file, should find all files it depends on (forward dependencies)
- Given max depth parameter, should limit recursion
- Given traversal, should use recursive CTEs in SQLite
- Given results, should include depth level for each file
- Given circular dependencies, should handle gracefully
- Given path tracing, should show dependency chain

**Success Criteria**:
- [ ] Unit tests with sample dependency graphs
- [ ] Recursive CTE works correctly
- [ ] Depth limiting functional
- [ ] Circular dependencies don't cause infinite loops
- [ ] Performance reasonable (depth 5 in <100ms)

**Files**:
- ai/tools/find-related.js
- ai/tools/find-related.test.js

---

## Create Query CLI Interface

Build command-line interface for all query operations.

**Requirements**:
- Given query string, should execute fan-out search
- Given --type filter, should limit to specific document types
- Given --format option, should output JSON or readable text
- Given --limit parameter, should constrain result count
- Given dependency query, should support forward/reverse/both directions
- Given metadata query, should support JSON path expressions
- Given help flag, should show usage examples
- Given errors, should provide helpful messages

**Success Criteria**:
- [ ] CLI tests pass
- [ ] Help documentation clear
- [ ] JSON output valid
- [ ] Text output human-readable
- [ ] Error messages actionable

**Files**:
- ai/tools/query.js (unified CLI)
- ai/tools/query.test.js

---

## Create Indexing CLI Interface

Build command-line tools to trigger indexing operations.

**Requirements**:
- Given index-all command, should run frontmatter + dependencies indexers
- Given --watch flag, should re-index on file changes
- Given --incremental flag, should only process changed files
- Given --stats flag, should report indexing statistics
- Given errors, should log and continue
- Given completion, should report summary (files indexed, time taken)

**Success Criteria**:
- [ ] CLI functional
- [ ] Watch mode works
- [ ] Incremental indexing faster than full
- [ ] Statistics accurate
- [ ] Pre-commit hook integration possible

**Files**:
- ai/tools/index.js (unified indexing CLI)
- ai/tools/index.test.js

---

## Add Bun Scripts to package.json

Configure convenient npm/bun scripts for all tools.

**Requirements**:
- Given package.json scripts, should include index, query, find-related
- Given script execution, should use bun for performance
- Given script naming, should be intuitive and consistent

**Scripts**:
```json
{
  "aidd:index": "bun ai/tools/index.js",
  "aidd:index:watch": "bun ai/tools/index.js --watch",
  "aidd:query": "bun ai/tools/query.js",
  "aidd:find-related": "bun ai/tools/find-related.js"
}
```

**Success Criteria**:
- [ ] All scripts work
- [ ] Documentation in README

---

## Write Integration Tests

Test full workflow from file creation to query.

**Requirements**:
- Given new markdown file with frontmatter, should index and be queryable
- Given file modification, should re-index automatically
- Given file deletion, should remove from index
- Given fan-out search, should find results from multiple strategies
- Given dependency changes, should update graph correctly

**Success Criteria**:
- [ ] Integration tests pass
- [ ] Cover real aidd files
- [ ] Test data fixtures included
- [ ] CI-friendly (fast, no external deps)

**Files**:
- ai/tools/integration.test.js

---

## Success Criteria (Phase 1)

- [ ] SQLite database schema complete and committed to git
- [ ] Frontmatter indexer tested and functional
- [ ] Dependency indexer tested and functional
- [ ] Fan-out search combines multiple strategies effectively
- [ ] Dependency traversal handles complex graphs
- [ ] CLI tools intuitive and well-documented
- [ ] All unit tests pass (>90% coverage)
- [ ] Integration tests validate full workflow
- [ ] Performance meets targets (<1s indexing, <200ms queries)
- [ ] Ready for Jiron API layer (Phase 2)
