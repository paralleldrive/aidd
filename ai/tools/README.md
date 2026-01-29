# AIDD Indexing & Search Tools

SQLite-based indexing and search tools for fast codebase exploration.

## Overview

These tools create a queryable index of your project's markdown files (`.md`, `.mdc`), enabling:

- **Full-text search** using SQLite FTS5
- **Metadata filtering** by frontmatter fields
- **Dependency graph traversal** for understanding file relationships
- **Fan-out search** combining multiple strategies for comprehensive results

The index is stored in `.aidd/index.db` and can be committed to git for instant availability after clone.

## Quick Start

```bash
# Index your project
npm run aidd:index

# Search for content
npm run aidd:query "authentication"

# Find related files
npm run aidd:find-related ai/rules/tdd.mdc
```

## CLI Commands

### Indexing

```bash
# Full reindex with dependency scanning
npm run aidd:index

# Incremental update (only changed files)
npm run aidd:index:incremental

# With options
node ai/tools/cli/index-cli.js --help
node ai/tools/cli/index-cli.js --full --deps --stats
```

**Options:**
| Option | Description |
|--------|-------------|
| `--full` | Rebuild entire index (default is incremental) |
| `--deps` | Also index file dependencies |
| `--stats` | Show detailed statistics |
| `--db <path>` | Database path (default: `.aidd/index.db`) |
| `--root <path>` | Root directory to index |
| `--quiet` | Suppress output |

### Querying

```bash
# Basic search
npm run aidd:query "search term"

# With options
node ai/tools/cli/query-cli.js "TDD" --type rule --limit 10
node ai/tools/cli/query-cli.js "security" --json
node ai/tools/cli/query-cli.js "error handling" --snippets
```

**Options:**
| Option | Description |
|--------|-------------|
| `--type <type>` | Filter by document type (rule, command, task, etc.) |
| `--limit <n>` | Maximum results (default: 20) |
| `--json` | Output as JSON |
| `--snippets` | Include content snippets |
| `--fts-only` | Use only full-text search |

### Finding Related Files

```bash
# Find dependencies and dependents
npm run aidd:find-related path/to/file.js

# With options
node ai/tools/cli/find-related-cli.js ai/tools/index.js --direction forward
node ai/tools/cli/find-related-cli.js ai/tools/db/connection.js --direction reverse
node ai/tools/cli/find-related-cli.js ai/tools/index.js --depth 5 --json
```

**Options:**
| Option | Description |
|--------|-------------|
| `--direction` | `forward` (imports), `reverse` (imported by), or `both` |
| `--depth <n>` | Maximum traversal depth (default: 3) |
| `--json` | Output as JSON |

## Document Types

Files are automatically categorized based on their path:

| Type | Path Pattern |
|------|--------------|
| `rule` | `ai/rules/**` |
| `command` | `ai/commands/**` |
| `skill` | `ai/skills/**` |
| `task` | `tasks/**` |
| `story-map` | `plan/story-map/**` |
| `other` | Everything else |

## Database Schema

### Documents Table

Stores file metadata and content:

```sql
CREATE TABLE documents (
  path TEXT PRIMARY KEY,      -- Relative file path
  type TEXT,                  -- Document type (rule, command, etc.)
  frontmatter TEXT,           -- YAML frontmatter as JSON
  content TEXT,               -- File content without frontmatter
  hash TEXT,                  -- SHA3-256 hash for change detection
  file_size INTEGER,
  modified_at INTEGER,
  indexed_at INTEGER
);
```

### FTS5 Virtual Table

Full-text search index:

```sql
CREATE VIRTUAL TABLE fts_documents USING fts5(
  path, frontmatter, content
);
```

### Dependencies Table

File import relationships:

```sql
CREATE TABLE dependencies (
  from_file TEXT,             -- File containing the import
  to_file TEXT,               -- File being imported
  import_type TEXT,           -- 'import', 'require', 'dynamic-import', 'reference'
  line_number INTEGER,
  import_text TEXT            -- Original import statement
);
```

## Programmatic API

Import functions directly for custom tooling:

```javascript
import {
  // Database
  createDatabase,
  closeDatabase,
  initializeSchema,

  // Indexing
  indexDirectory,
  indexIncremental,
  indexAllDependencies,

  // Search
  fanOutSearch,
  searchFts5,
  searchMetadata,

  // Graph traversal
  findRelated,
  getForwardDeps,
  getReverseDeps,
} from 'aidd/tools';

// Example: Custom search
const db = createDatabase('.aidd/index.db');
const results = await fanOutSearch(db, 'authentication', {
  type: 'rule',
  limit: 10,
});
closeDatabase(db);
```

## Fan-out Search

The fan-out search combines multiple strategies:

1. **FTS5 Search** - Full-text keyword matching
2. **Metadata Search** - Filter by frontmatter fields
3. **Semantic Search** - (Stub for future RAG integration)

Results are deduplicated by path and ranked by:
- Strategy weight (FTS5 > metadata > semantic)
- Position within each strategy's results
- Boost for documents found by multiple strategies

## Git Integration

The database is configured for git:

```gitattributes
# .gitattributes
*.db binary diff=sqlite3
.aidd/index.db binary diff=sqlite3
```

To enable SQL diffs (optional):

```bash
git config diff.sqlite3.textconv 'sqlite3 $1 .dump'
```

## Pre-commit Hook

Add automatic indexing before commits:

```bash
# .husky/pre-commit
#!/bin/sh
node ai/tools/cli/index-cli.js --deps --stats
git add .aidd/index.db
```

## Architecture

```
ai/tools/
├── db/
│   ├── connection.js      # Database factory (WAL mode, foreign keys)
│   └── schema.js          # Table definitions, FTS5 triggers
├── indexers/
│   ├── frontmatter.js     # YAML extraction, incremental updates
│   └── dependencies.js    # Import/require parsing
├── search/
│   ├── fts5.js            # Full-text search
│   ├── metadata.js        # JSON field filtering
│   └── fan-out.js         # Multi-strategy orchestration
├── graph/
│   └── traverse.js        # Recursive CTE traversal
├── cli/
│   ├── index-cli.js       # Indexing command
│   ├── query-cli.js       # Search command
│   └── find-related-cli.js # Graph traversal command
└── index.js               # Public API exports
```

## Performance

- **Indexing**: ~68 files in ~50ms
- **Search**: <50ms for typical queries
- **Graph traversal**: <100ms for depth 5

## Testing

```bash
# Run all tools tests
npx vitest run ai/tools/

# Run specific module tests
npx vitest run ai/tools/search/
npx vitest run ai/tools/indexers/
```

## Direct Database Access

Query the database directly with SQLite:

```bash
# Document counts by type
sqlite3 .aidd/index.db "SELECT type, COUNT(*) FROM documents GROUP BY type;"

# FTS search
sqlite3 .aidd/index.db "SELECT path FROM fts_documents WHERE fts_documents MATCH 'security';"

# View dependencies
sqlite3 .aidd/index.db "SELECT from_file, to_file FROM dependencies LIMIT 10;"

# Find files with specific frontmatter
sqlite3 .aidd/index.db "SELECT path FROM documents WHERE json_extract(frontmatter, '$.alwaysApply') = 1;"
```
