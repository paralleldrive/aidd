# RLM Implementation Architecture for aidd

**Goal**: Adapt Recursive Language Model strategies for aidd framework to enable deep codebase understanding through hierarchical exploration.

## Core Architecture Principles

### Hybrid Approach

**Symbolic Processing** (Bun/JavaScript with TDD):
- Frontmatter extraction and indexing
- Database management
- Structured queries
- Graph traversal
- CLI tool orchestration

**AI Intelligence** (SudoLang Skill):
- Recursive decomposition strategy
- Query planning
- Semantic summarization
- Result synthesis
- Decision-making

### Division of Labor

| Task Type | Implementation | Example |
|-----------|---------------|---------|
| Extract structured data | JavaScript/Bun | Parse YAML frontmatter |
| Index metadata | JavaScript/Bun | Build SQLite FTS5 index |
| Execute queries | JavaScript/Bun | SQL + FTS5 search |
| Trace dependencies | JavaScript/Bun | Graph traversal algorithm |
| Plan decomposition | AI/SudoLang | Break complex query into sub-queries |
| Semantic search | AI/RAG | "Find files related to authentication" |
| Summarize findings | AI/SudoLang | Synthesize results into coherent answer |
| Decide recursion depth | AI/SudoLang | "Is this complex enough to decompose?" |

## RLM Concept Translation

### From REPL to aidd Tools

**RLM Pattern → aidd Implementation**

1. **Load input as variable in REPL**
   - aidd: Index codebase in SQLite
   - Result: Queryable metadata database

2. **Programmatic examination**
   - aidd: CLI query tools + existing Grep/Glob
   - Result: Structured search capabilities

3. **Recursive decomposition**
   - aidd: SudoLang functions that fan out searches
   - Result: Hierarchical exploration

4. **Self-invocation over snippets**
   - aidd: Agent makes multiple targeted queries
   - Result: Focused context gathering

5. **Result aggregation**
   - aidd: AI synthesizes findings
   - Result: Coherent answers from distributed data

## Component Architecture

### 1. Indexing Layer (JavaScript/Bun)

**Purpose**: Transform codebase into queryable database

**Tools**:
- `ai/tools/index-frontmatter.js` - Extract YAML from all .md/.mdc files
- `ai/tools/index-dependencies.js` - Build import graph
- `ai/tools/index-story-maps.js` - Parse productmanager.mdc data

**Workflow**:
```bash
# Run on pre-commit hook or manual trigger
bun ai/tools/index-frontmatter.js
bun ai/tools/index-dependencies.js
bun ai/tools/index-story-maps.js

# Result: .aidd/index.db with searchable metadata
```

**Testing**:
- Unit tests with vitest
- In-memory SQLite for fast tests
- Fixture files for test data
- TDD approach for all indexers

### 2. Query Layer (JavaScript/Bun)

**Purpose**: Provide CLI tools for structured searches

**Tools**:
- `ai/tools/query-codebase.js` - SQL + FTS5 search
- `ai/tools/find-related.js` - Dependency traversal
- `ai/tools/get-metadata.js` - Extract frontmatter fields

**Interface**:
```bash
# Text search
bun ai/tools/query-codebase.js "authentication rules"

# Metadata query
bun ai/tools/get-metadata.js --type=rule --tag=security

# Dependency trace
bun ai/tools/find-related.js src/auth/login.js --depth=3

# Result: JSON output for agent consumption
```

**Testing**:
- Unit tests for query logic
- Integration tests with sample database
- Output format validation

### 3. RLM Skill Layer (SudoLang)

**Purpose**: Provide AI with recursive exploration strategy

**Location**: `ai/skills/rlm/SKILL.md`

**Structure**:
```markdown
---
name: rlm
description: Use when needing deep project context through recursive codebase exploration
---

# Recursive Language Model Skill

## Recursive Decomposition Strategy

fn exploreCodebase(query, depth = 0, maxDepth = 3) {
  Constraints {
    Stop recursion if depth >= maxDepth
    Stop if query is simple enough for direct answer
  }

  // 1. Analyze query complexity
  if (isSimpleQuery(query)) {
    return directSearch(query)
  }

  // 2. Decompose into sub-queries
  subQueries = decomposeQuery(query)

  // 3. Fan out parallel searches
  results = []
  for each (subQuery in subQueries) {
    parallel {
      // Symbolic queries
      keywordResults = bun ai/tools/query-codebase.js "$subQuery"

      // Semantic search (built-in RAG)
      semanticResults = semanticSearch(subQuery)

      // Recursive exploration if needed
      if (requiresDeeperContext(subQuery)) {
        deepResults = exploreCodebase(subQuery, depth + 1)
      }
    }
    results.append(aggregateResults(...))
  }

  // 4. Synthesize findings
  return synthesize(results)
}

## Available Tools

### Symbolic Tools (CLI)
- query-codebase.js - SQLite FTS5 keyword search
- find-related.js - Dependency graph traversal
- get-metadata.js - Frontmatter field extraction

### Built-in Tools
- Grep - Pattern matching across files
- Glob - File discovery by pattern
- Read - Examine specific files
- RAG - Semantic search (built-in)

### When to Use

Use RLM skill when:
- Query spans multiple files or modules
- Need to understand complex flows
- Tracing dependencies or call chains
- Building architectural understanding
- Finding all instances of a pattern

Don't use RLM when:
- Query targets single file
- Simple keyword search sufficient
- Already have small relevant context
```

### 4. AGENTS.md Integration

**Purpose**: Provide agents with usage guidelines

**Addition to AGENTS.md**:
```markdown
## Project Context Exploration

When you need comprehensive understanding of complex project areas:

1. **Assess complexity**: Can this be answered with simple search?

2. **Use RLM skill**: For complex queries requiring deep exploration
   - Skill is always loaded (alwaysApply: true)
   - You decide when to activate based on query needs

3. **Recursive strategy**:
   - Decompose query into sub-queries
   - Fan out searches using available tools
   - Recursively explore areas needing deeper context
   - Aggregate findings into coherent answer

4. **Tools available**:
   - `bun ai/tools/query-codebase.js "keywords"` - Structured search
   - `bun ai/tools/find-related.js <file>` - Dependency traversal
   - Built-in Grep/Glob/Read - File exploration
   - Built-in RAG - Semantic search

Example: "How does authentication work?"
→ Decompose: ["Find auth files", "Trace login flow", "Find session management"]
→ Fan out searches for each sub-query
→ Recursively explore dependencies
→ Synthesize into complete auth flow explanation
```

## File Structure

```
aidd/
├── ai/
│   ├── skills/
│   │   └── rlm/
│   │       └── SKILL.md              # RLM skill specification
│   ├── tools/
│   │   ├── index-frontmatter.js      # Indexing tools
│   │   ├── index-frontmatter.test.js
│   │   ├── index-dependencies.js
│   │   ├── index-dependencies.test.js
│   │   ├── query-codebase.js         # Query tools
│   │   ├── query-codebase.test.js
│   │   ├── find-related.js
│   │   └── find-related.test.js
│   └── rules/
│       └── ... (existing)
├── plan/
│   └── rlm/
│       ├── research-summary.md
│       ├── agent-skills-spec.md
│       ├── rlm-paper-findings.md
│       ├── implementation-architecture.md (this file)
│       └── database-design.md
├── .aidd/
│   └── index.db                      # SQLite database (gitignored)
├── AGENTS.md                         # Updated with RLM guidelines
└── package.json                      # Updated with bun scripts
```

## Database Architecture

See: `database-design.md` for complete schema details

**Overview**:
- SQLite with JSON1 + FTS5 extensions
- Hybrid structure: documents + structured tables
- Full-text search for content
- Normalized tables for productmanager.mdc schemas
- Dependency graph storage

## Skill Activation Strategy

**Decision**: Always-surfaced with agent self-direction

**Rationale**:
- ✅ Skill always loaded (alwaysApply: true in frontmatter)
- ✅ AGENTS.md provides explicit usage rule
- ✅ Agent decides when to invoke based on query complexity
- ✅ No user friction - automatic and intelligent
- ✅ Agent learns patterns through experience

**vs On-Demand**:
- ❌ On-demand requires user to remember `/rlm` command
- ❌ Adds friction to workflow
- ❌ Agent can't proactively use when needed

## Development Workflow

### Phase 1: Database Foundation
1. Create SQLite schema
2. Build frontmatter indexer with tests
3. Test with real aidd .md/.mdc files
4. Validate FTS5 search quality

### Phase 2: Query Tools
1. Build CLI query interface
2. Implement dependency traversal
3. Add metadata extraction
4. Test with real queries

### Phase 3: RLM Skill
1. Write SKILL.md in SudoLang
2. Document decomposition patterns
3. Provide usage examples
4. Test with agent self-prompting

### Phase 4: Integration
1. Update AGENTS.md
2. Add npm/bun scripts
3. Create pre-commit hook for indexing
4. Document for users

## Testing Strategy

### JavaScript/Bun (Unit Tests)
```javascript
// Vitest with riteway assertions
import { describe, test } from 'vitest';
import { equal } from 'riteway';

test('indexFrontmatter() should extract YAML from markdown', async () => {
  const input = `---
description: test
---
# Content`;

  const result = await indexFrontmatter(input);

  equal(result.frontmatter.description, 'test');
});
```

### SudoLang (Self-Prompting)
```
Test: "Can you explain how the productmanager.mdc workflow works?"

Expected behavior:
1. Agent recognizes complexity
2. Decomposes into sub-queries
3. Uses query tools to find related files
4. Synthesizes explanation from findings
```

## Performance Considerations

### Indexing
- **Frequency**: Pre-commit hook + manual trigger
- **Speed**: ~100ms for 100 files (SQLite is fast)
- **Storage**: ~1MB per 1000 files
- **Incremental**: Hash-based change detection

### Querying
- **FTS5 Search**: ~10ms for typical queries
- **Dependency Traversal**: O(n*d) where n=nodes, d=depth
- **Result Size**: Limit to top 50 results per query

### Recursive Exploration
- **Max Depth**: 3 levels (configurable)
- **Parallelization**: Fan out searches in parallel
- **Cost**: More API calls but better quality
- **Caching**: SQLite acts as cache for metadata

## Extension Points

### Future Enhancements

**1. Semantic Embeddings**:
- Add vector search for better semantic matching
- Use sqlite-vec extension
- Generate embeddings for code snippets

**2. Code Analysis**:
- Parse JavaScript/TypeScript AST
- Index function signatures
- Track variable usage

**3. Test Coverage**:
- Map tests to source files
- Identify untested code
- Suggest test improvements

**4. Change Impact**:
- Track git history in database
- Identify frequently-changed files
- Predict change impact radius

## Success Criteria

**RLM skill is successful when**:

1. **Agent uses it appropriately**
   - Activates for complex queries
   - Doesn't use for simple questions
   - Correctly decomposes problems

2. **Query quality improves**
   - Better answers for complex questions
   - Handles large codebase exploration
   - Finds relevant context efficiently

3. **Developer productivity**
   - Faster onboarding to codebase
   - Better architectural understanding
   - Reduced context switching

4. **System performance**
   - Indexing completes in <5 seconds
   - Queries return in <1 second
   - Reasonable API call costs

## Next Steps

1. Create user journey (Task 2 from epic)
2. Build database schema (see database-design.md)
3. Implement indexer with TDD
4. Build query tools
5. Write RLM skill
6. Update AGENTS.md
7. Test and iterate
