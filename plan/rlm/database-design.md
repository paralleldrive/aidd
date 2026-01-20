# Database Design for RLM Skill

**Database**: SQLite 3 with JSON1 + FTS5 extensions
**Location**: `.aidd/index.db` (gitignored)
**Strategy**: Hybrid document + structured storage

## Design Rationale

### Why SQLite?

**Advantages**:
- ✅ **Zero infrastructure** - Single file, no servers
- ✅ **Hybrid flexibility** - SQL + JSON + FTS5 in one database
- ✅ **TDD-friendly** - In-memory mode for fast tests
- ✅ **Bun-native** - better-sqlite3 synchronous API
- ✅ **Portable** - Works everywhere, easy backups
- ✅ **Fast** - Millions of rows, <1ms queries
- ✅ **Recursive queries** - CTEs for graph traversal
- ✅ **Full-text search** - Built-in FTS5 extension

**vs Alternatives**:
- ❌ **LevelDB/RocksDB** - No query language, manual indexing
- ❌ **MongoDB** - Requires server, overkill for use case
- ❌ **JSON files** - No indexing, slow searches, full scans
- ❌ **Neo4j** - Graph DB overkill, server required

### Hybrid Strategy

**Document Storage** (JSON columns):
- Frontmatter from .md/.mdc files
- Flexible schema for different file types
- Preserves original structure

**Structured Tables**:
- ProductManager.mdc schemas (personas, journeys, stories)
- Normalized for complex queries
- Foreign keys for relationships

**Full-Text Search** (FTS5):
- Content search across all documents
- Frontmatter text search
- Weighted rankings

## Complete Schema

### 1. Documents Table (Frontmatter Index)

```sql
-- Main document index with flexible JSON storage
CREATE TABLE documents (
  path TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- 'rule' | 'command' | 'skill' | 'task' | 'story-map' | 'other'
  frontmatter JSON,    -- Full YAML frontmatter as JSON
  content TEXT,        -- Markdown content (without frontmatter)
  hash TEXT NOT NULL,  -- SHA256 for change detection
  indexed_at INTEGER NOT NULL,  -- Unix timestamp
  file_size INTEGER,
  modified_at INTEGER
);

-- Indexes for common queries
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_indexed_at ON documents(indexed_at);
CREATE INDEX idx_documents_modified_at ON documents(modified_at);

-- JSON field extraction for common frontmatter fields
-- These are computed columns for faster queries
CREATE INDEX idx_documents_description ON documents(
  json_extract(frontmatter, '$.description')
);
CREATE INDEX idx_documents_always_apply ON documents(
  json_extract(frontmatter, '$.alwaysApply')
);
```

### 2. Full-Text Search (FTS5)

```sql
-- Virtual table for full-text search
CREATE VIRTUAL TABLE documents_fts USING fts5(
  path UNINDEXED,      -- Don't index path for search (use for results)
  type,                -- Searchable type field
  content,             -- Primary search content
  frontmatter_text,    -- Flattened frontmatter for search
  tokenize='porter unicode61'  -- Better English stemming
);

-- Trigger to keep FTS5 in sync with documents table
CREATE TRIGGER documents_fts_insert AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(path, type, content, frontmatter_text)
  VALUES (
    new.path,
    new.type,
    new.content,
    json_extract(new.frontmatter, '$')  -- Flatten JSON to text
  );
END;

CREATE TRIGGER documents_fts_update AFTER UPDATE ON documents BEGIN
  UPDATE documents_fts
  SET
    type = new.type,
    content = new.content,
    frontmatter_text = json_extract(new.frontmatter, '$')
  WHERE path = old.path;
END;

CREATE TRIGGER documents_fts_delete AFTER DELETE ON documents BEGIN
  DELETE FROM documents_fts WHERE path = old.path;
END;
```

### 3. Dependencies Table (Import Graph)

```sql
-- Tracks file dependencies (imports, requires, references)
CREATE TABLE dependencies (
  from_file TEXT NOT NULL,
  to_file TEXT NOT NULL,
  import_type TEXT NOT NULL,  -- 'import' | 'require' | 'reference' | 'link'
  line_number INTEGER,         -- Where the import appears
  import_text TEXT,            -- Original import statement
  created_at INTEGER NOT NULL,
  PRIMARY KEY (from_file, to_file, import_type)
);

-- Indexes for graph traversal
CREATE INDEX idx_dependencies_from ON dependencies(from_file);
CREATE INDEX idx_dependencies_to ON dependencies(to_file);
CREATE INDEX idx_dependencies_type ON dependencies(import_type);

-- Recursive CTE for finding all dependencies
-- Example query:
/*
WITH RECURSIVE dep_tree(file, depth) AS (
  SELECT from_file, 0 FROM dependencies WHERE to_file = 'target.js'
  UNION ALL
  SELECT d.from_file, dt.depth + 1
  FROM dependencies d
  JOIN dep_tree dt ON d.to_file = dt.file
  WHERE dt.depth < 3  -- Max depth
)
SELECT DISTINCT file, depth FROM dep_tree ORDER BY depth;
*/
```

### 4. ProductManager Schema (Story Maps)

#### 4.1 Personas

```sql
CREATE TABLE personas (
  id TEXT PRIMARY KEY,  -- CUID2
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata JSON  -- Flexible storage for additional fields
);

CREATE INDEX idx_personas_name ON personas(name);
CREATE INDEX idx_personas_created_at ON personas(created_at);
```

#### 4.2 Journeys

```sql
CREATE TABLE journeys (
  id TEXT PRIMARY KEY,  -- CUID2
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata JSON  -- domain, owner, etc.
);

CREATE INDEX idx_journeys_name ON journeys(name);
CREATE INDEX idx_journeys_created_at ON journeys(created_at);

-- Many-to-many: journeys <-> personas
CREATE TABLE journey_personas (
  journey_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  PRIMARY KEY (journey_id, persona_id),
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
);

CREATE INDEX idx_journey_personas_journey ON journey_personas(journey_id);
CREATE INDEX idx_journey_personas_persona ON journey_personas(persona_id);
```

#### 4.3 Steps

```sql
CREATE TABLE steps (
  id TEXT PRIMARY KEY,  -- CUID2
  journey_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,  -- Step order in journey
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata JSON,
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);

CREATE INDEX idx_steps_journey ON steps(journey_id);
CREATE INDEX idx_steps_order ON steps(journey_id, order_index);
CREATE INDEX idx_steps_created_at ON steps(created_at);
```

#### 4.4 Pain Points

```sql
CREATE TABLE pain_points (
  id TEXT PRIMARY KEY,  -- CUID2
  name TEXT NOT NULL,
  description TEXT,
  impact INTEGER NOT NULL CHECK(impact BETWEEN 1 AND 10),
  frequency INTEGER NOT NULL CHECK(frequency BETWEEN 1 AND 10),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata JSON
);

CREATE INDEX idx_pain_points_impact ON pain_points(impact);
CREATE INDEX idx_pain_points_frequency ON pain_points(frequency);
CREATE INDEX idx_pain_points_priority ON pain_points(impact * frequency);  -- Computed
```

#### 4.5 Stories

```sql
CREATE TABLE stories (
  id TEXT PRIMARY KEY,  -- CUID2
  step_id TEXT,  -- Nullable - backlog stories may not be in a step yet
  pain_point_id TEXT,
  name TEXT NOT NULL,
  description TEXT,  -- "As a X, I want Y, so that Z"
  priority INTEGER,  -- Computed: pain_point.impact * pain_point.frequency
  status TEXT CHECK(status IN ('backlog', 'inProgress', 'released', 'cancelled')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata JSON,  -- Mockups, etc.
  FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE SET NULL,
  FOREIGN KEY (pain_point_id) REFERENCES pain_points(id) ON DELETE SET NULL
);

CREATE INDEX idx_stories_step ON stories(step_id);
CREATE INDEX idx_stories_pain_point ON stories(pain_point_id);
CREATE INDEX idx_stories_priority ON stories(priority DESC);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_created_at ON stories(created_at);
```

#### 4.6 Functional Requirements

```sql
CREATE TABLE functional_requirements (
  id TEXT PRIMARY KEY,  -- CUID2
  story_id TEXT NOT NULL,
  description TEXT NOT NULL,  -- "Given X, should Y"
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  metadata JSON,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

CREATE INDEX idx_requirements_story ON functional_requirements(story_id);
CREATE INDEX idx_requirements_order ON functional_requirements(story_id, order_index);
```

## Query Patterns

### 1. Full-Text Search

```sql
-- Search for documents containing "authentication"
SELECT
  d.path,
  d.type,
  json_extract(d.frontmatter, '$.description') as description,
  fts.rank
FROM documents_fts fts
JOIN documents d ON d.path = fts.path
WHERE documents_fts MATCH 'authentication'
ORDER BY rank
LIMIT 50;
```

### 2. Metadata Query

```sql
-- Find all rules with alwaysApply: true
SELECT
  path,
  json_extract(frontmatter, '$.description') as description
FROM documents
WHERE
  type = 'rule' AND
  json_extract(frontmatter, '$.alwaysApply') = 'true';
```

### 3. Dependency Traversal

```sql
-- Find all files that depend on 'src/auth.js' (direct and indirect)
WITH RECURSIVE dependents(file, depth, path_trace) AS (
  -- Base case: direct dependents
  SELECT
    from_file,
    1,
    to_file || ' <- ' || from_file
  FROM dependencies
  WHERE to_file = 'src/auth.js'

  UNION ALL

  -- Recursive case: indirect dependents
  SELECT
    d.from_file,
    dep.depth + 1,
    dep.path_trace || ' <- ' || d.from_file
  FROM dependencies d
  JOIN dependents dep ON d.to_file = dep.file
  WHERE dep.depth < 5  -- Max depth limit
)
SELECT DISTINCT file, MIN(depth) as depth, path_trace
FROM dependents
GROUP BY file
ORDER BY depth, file;
```

### 4. Story Priority Query

```sql
-- Find high-priority stories for a specific persona
SELECT
  s.id,
  s.name,
  s.description,
  s.priority,
  pp.impact,
  pp.frequency,
  step.name as step_name,
  j.name as journey_name
FROM stories s
JOIN pain_points pp ON s.pain_point_id = pp.id
LEFT JOIN steps step ON s.step_id = step.id
LEFT JOIN journeys j ON step.journey_id = j.id
LEFT JOIN journey_personas jp ON j.id = jp.journey_id
WHERE
  jp.persona_id = ? AND
  s.status = 'backlog' AND
  s.priority > 50
ORDER BY s.priority DESC
LIMIT 20;
```

### 5. Complex JSON Query

```sql
-- Find documents with specific frontmatter tags
SELECT
  path,
  json_extract(frontmatter, '$.description') as description,
  json_extract(frontmatter, '$.tags') as tags
FROM documents
WHERE
  json_type(frontmatter, '$.tags') = 'array' AND
  EXISTS (
    SELECT 1 FROM json_each(frontmatter, '$.tags')
    WHERE value IN ('security', 'authentication')
  );
```

## Indexing Implementation

### Change Detection

```javascript
// Only re-index changed files
import crypto from 'crypto';

function hashFile(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function needsReindex(path, content, db) {
  const existing = db
    .prepare('SELECT hash FROM documents WHERE path = ?')
    .get(path);

  if (!existing) return true;

  const currentHash = hashFile(content);
  return currentHash !== existing.hash;
}
```

### Batch Insertion

```javascript
// Fast bulk insert with transaction
function indexDocuments(files, db) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO documents
    (path, type, frontmatter, content, hash, indexed_at, file_size, modified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((docs) => {
    for (const doc of docs) {
      insert.run(
        doc.path,
        doc.type,
        JSON.stringify(doc.frontmatter),
        doc.content,
        doc.hash,
        Date.now(),
        doc.size,
        doc.modified
      );
    }
  });

  insertMany(files);
}
```

## Testing Strategy

### Unit Tests (In-Memory Database)

```javascript
import Database from 'better-sqlite3';
import { describe, test, beforeEach } from 'vitest';
import { equal } from 'riteway';

describe('Document indexing', async () => {
  let db;

  beforeEach(() => {
    // In-memory database for fast tests
    db = new Database(':memory:');
    createSchema(db);  // Apply schema
  });

  test('indexDocument() should store frontmatter as JSON', () => {
    const doc = {
      path: 'test.md',
      type: 'rule',
      frontmatter: { description: 'Test rule' },
      content: 'Content here',
      hash: 'abc123'
    };

    indexDocument(doc, db);

    const result = db
      .prepare('SELECT * FROM documents WHERE path = ?')
      .get('test.md');

    equal(
      JSON.parse(result.frontmatter).description,
      'Test rule',
      'Should store frontmatter as JSON'
    );
  });

  test('FTS5 search should find documents by content', () => {
    indexDocument({
      path: 'auth.md',
      type: 'rule',
      frontmatter: {},
      content: 'Authentication rules for login',
      hash: 'def456'
    }, db);

    const results = db
      .prepare(`
        SELECT d.path FROM documents_fts fts
        JOIN documents d ON d.path = fts.path
        WHERE documents_fts MATCH ?
      `)
      .all('authentication');

    equal(results.length, 1, 'Should find document by content');
    equal(results[0].path, 'auth.md', 'Should return correct path');
  });
});
```

### Integration Tests (Real Database)

```javascript
describe('Integration: Full indexing workflow', () => {
  test('Should index all aidd .mdc files', async () => {
    const db = new Database('.aidd/test-index.db');
    createSchema(db);

    // Index real aidd files
    await indexAllFiles('ai/**/*.mdc', db);

    // Verify expected files exist
    const count = db
      .prepare('SELECT COUNT(*) as count FROM documents')
      .get();

    assert(count.count > 10, 'Should index multiple files');

    // Verify FTS5 works
    const searchResults = db
      .prepare(`
        SELECT d.path FROM documents_fts fts
        JOIN documents d ON d.path = fts.path
        WHERE documents_fts MATCH ?
      `)
      .all('please.mdc');

    assert(searchResults.length > 0, 'Should find please.mdc via FTS5');
  });
});
```

## Performance Characteristics

### Indexing Performance

**Expected**:
- 100 files: ~100ms
- 1,000 files: ~1s
- 10,000 files: ~10s

**Optimizations**:
- Transaction batching (10x faster)
- Hash-based change detection (only re-index changed files)
- Parallel file reading (Bun is fast)

### Query Performance

**FTS5 Search**:
- Simple query: <10ms
- Complex query: <100ms
- With sorting/ranking: <200ms

**Dependency Traversal**:
- Depth 1: <10ms
- Depth 3: <50ms
- Depth 5: <100ms

**JSON Extraction**:
- Simple field: <1ms
- Complex nested query: <10ms

### Database Size

**Expected**:
- 100 files: ~500KB
- 1,000 files: ~5MB
- 10,000 files: ~50MB

FTS5 index adds ~30% overhead

## Migration Strategy

### Schema Versioning

```sql
-- Track schema version
CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

INSERT INTO schema_version (version, applied_at) VALUES (1, unixepoch());
```

### Future Migrations

```javascript
// Migration framework
const migrations = [
  {
    version: 2,
    up: (db) => {
      db.exec(`
        ALTER TABLE documents ADD COLUMN git_hash TEXT;
        CREATE INDEX idx_documents_git_hash ON documents(git_hash);
      `);
    }
  },
  // ... more migrations
];

function migrate(db) {
  const current = db
    .prepare('SELECT MAX(version) as v FROM schema_version')
    .get().v || 0;

  for (const migration of migrations) {
    if (migration.version > current) {
      db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)')
          .run(migration.version, Date.now());
      })();
    }
  }
}
```

## Future Enhancements

### 1. Vector Search (sqlite-vec)

```sql
-- Add vector embeddings for semantic search
CREATE VIRTUAL TABLE document_embeddings USING vec0(
  path TEXT PRIMARY KEY,
  embedding FLOAT[1536]  -- OpenAI ada-002 dimensions
);

-- Semantic search query
SELECT
  d.path,
  d.type,
  vec_distance_cosine(de.embedding, ?) as similarity
FROM document_embeddings de
JOIN documents d ON d.path = de.path
ORDER BY similarity DESC
LIMIT 10;
```

### 2. Code AST Analysis

```sql
-- Store parsed code structure
CREATE TABLE code_symbols (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  symbol_type TEXT NOT NULL,  -- 'function' | 'class' | 'variable' | 'import'
  name TEXT NOT NULL,
  line_start INTEGER NOT NULL,
  line_end INTEGER,
  scope TEXT,  -- 'global' | 'module' | 'local'
  signature TEXT,  -- Function/method signature
  metadata JSON,
  FOREIGN KEY (file_path) REFERENCES documents(path)
);

CREATE INDEX idx_code_symbols_file ON code_symbols(file_path);
CREATE INDEX idx_code_symbols_type ON code_symbols(symbol_type);
CREATE INDEX idx_code_symbols_name ON code_symbols(name);
```

### 3. Git History Integration

```sql
-- Track file change history
CREATE TABLE file_history (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  author TEXT,
  timestamp INTEGER NOT NULL,
  change_type TEXT,  -- 'add' | 'modify' | 'delete'
  lines_added INTEGER,
  lines_removed INTEGER,
  FOREIGN KEY (file_path) REFERENCES documents(path)
);

-- Find frequently changed files (hotspots)
SELECT
  file_path,
  COUNT(*) as change_count,
  SUM(lines_added + lines_removed) as churn
FROM file_history
WHERE timestamp > unixepoch() - 7776000  -- Last 90 days
GROUP BY file_path
ORDER BY change_count DESC
LIMIT 20;
```

## Summary

**Database design enables**:
- ✅ Fast full-text search across all documents
- ✅ Flexible JSON storage for varying schemas
- ✅ Structured queries for productmanager.mdc data
- ✅ Recursive dependency traversal
- ✅ Incremental indexing with change detection
- ✅ TDD-friendly in-memory testing
- ✅ Future extensibility (vectors, AST, git)

**Next steps**:
1. Implement schema creation script
2. Build indexer with tests
3. Create query CLI tools
4. Integrate with RLM skill
