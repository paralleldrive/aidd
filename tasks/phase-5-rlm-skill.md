# Phase 5: Recursive Language Model Skill

**Status**: 📋 PLANNED
**Goal**: Create RLM agent skill that enables deep codebase exploration through recursive task decomposition and hierarchical queries
**Dependencies**: Phase 1 (SQLite Foundation), Phase 2 (Jiron Skills), Phase 3 (Frontmatter API), Phase 4 (ProductManager Skill)

## Epic Overview

Build the Recursive Language Model (RLM) skill that brings together all previous phases into a coherent recursive exploration capability. This skill enables AI agents to handle complex queries about large codebases by recursively decomposing tasks, fanning out searches, and aggregating results—extending effective context far beyond model window limits.

The RLM skill uses the MIT paper's strategies adapted for AI agent workflows, treating the codebase as an external environment to be programmatically explored through the Jiron APIs and query tools built in previous phases.

---

## Design User Journey for RLM Skill

Create comprehensive user journey following productmanager.mdc patterns.

**Requirements**:
- Given persona of developer using AI agent on complex project, should define pain points
- Given pain points around context limits and incomplete understanding, should quantify impact and frequency
- Given user goal of comprehensive repository understanding, should map journey steps
- Given steps, should identify where RLM strategies provide value
- Given journey map, should save to database using productmanager API
- Given productmanager schema, should follow established patterns

**User Story**:
"As a developer using an AI agent, I want my agent to have detailed command of my entire project repository, so that it can deliver contextually-aware results without missing critical dependencies or relationships."

**Pain Points**:
- Agent misses relevant files when answering questions (impact: 8, frequency: 9)
- Agent can't trace complex dependencies across modules (impact: 9, frequency: 7)
- Agent gives incomplete answers for architectural questions (impact: 10, frequency: 6)
- Agent struggles with codebases >100 files (impact: 9, frequency: 8)

**Success Criteria**:
- [ ] User journey documented and stored in database
- [ ] Pain points quantified
- [ ] Steps mapped to RLM capabilities
- [ ] Priority scores calculated

---

## Define Recursive Decomposition Strategy

Document how RLM breaks down complex queries hierarchically.

**Requirements**:
- Given complex query, should define decomposition patterns
- Given query types, should categorize (architectural, dependency, pattern-finding, flow-tracing)
- Given decomposition depth, should define recursion limits
- Given sub-queries, should define aggregation strategies
- Given termination conditions, should prevent infinite recursion
- Given examples, should illustrate common patterns

**Decomposition Patterns**:

```sudolang
// Pattern 1: Architectural Understanding
Query: "How does authentication work in this project?"

Decompose:
1. "Find all files related to authentication"
   → FTS5 search for "auth", "login", "session"
   → Metadata query for frontmatter tags
2. For each auth file:
   → "What are the dependencies of this file?"
   → Traverse dependency graph
3. For each dependency:
   → "What is the purpose of this module?" (recursive)
   → Extract frontmatter description or summarize
4. Aggregate:
   → Synthesize auth flow from all findings
   → Create architectural diagram (text)

// Pattern 2: Dependency Tracing
Query: "What would break if I change module X?"

Decompose:
1. "Find all files that import module X"
   → Reverse dependency query
2. For each dependent:
   → "Find files that import this dependent" (recursive to depth 3)
   → Build impact tree
3. For each impacted file:
   → "What functionality does this provide?"
   → Extract from frontmatter or code comments
4. Aggregate:
   → List of potentially affected features
   → Impact radius report

// Pattern 3: Pattern Finding
Query: "Find all implementations of the repository pattern"

Decompose:
1. "Search for files containing 'repository'"
   → FTS5 keyword search
2. For each candidate:
   → "Does this match the repository pattern?" (semantic)
   → Code structure analysis
3. For matches:
   → "What entities does this repository manage?" (recursive)
   → Extract interfaces or type definitions
4. Aggregate:
   → List of all repository implementations
   → Entities they manage
   → Common patterns and deviations
```

**Success Criteria**:
- [ ] Decomposition patterns documented
- [ ] Examples cover common query types
- [ ] Recursion limits defined
- [ ] Aggregation strategies clear

**Files**:
- plan/rlm/decomposition-patterns.md

---

## Create RLM Skill Specification

Write complete skill in SudoLang with recursive exploration functions.

**Requirements**:
- Given SKILL.md format, should follow Agent Skills specification
- Given skill description, should explain when to use RLM
- Given recursive strategy, should define exploration functions
- Given available tools, should document Jiron APIs and CLI tools
- Given decomposition patterns, should include in skill instructions
- Given constraints, should define recursion limits and termination
- Given examples, should demonstrate full recursive workflows
- Given always-surfaced activation, should set alwaysApply: true

**Skill Structure**:
```
ai/skills/rlm/
└── SKILL.md
```

**SKILL.md Content**:
```markdown
---
name: rlm
description: Use when needing deep project context through recursive codebase exploration. Enables hierarchical task decomposition to handle queries beyond context window limits.
alwaysApply: true
---

# Recursive Language Model (RLM) Skill

## When to Use

Use this skill when:
- Query requires understanding across multiple files or modules
- Need to trace complex dependencies or data flows
- Building architectural understanding of systems
- Finding all instances of a pattern across codebase
- Context window insufficient for complete understanding

Don't use when:
- Query targets single file or small scope
- Simple keyword search sufficient
- Already have relevant context loaded

## Recursive Exploration Strategy

fn exploreCodebase(query, depth = 0, maxDepth = 3) {
  Constraints {
    Stop if depth >= maxDepth
    Stop if query is simple (single-file scope)
    Stop if diminishing returns (new findings < threshold)
  }

  // 1. Assess query complexity
  if (isSimpleQuery(query)) {
    return directSearch(query)
  }

  // 2. Decompose into sub-queries
  subQueries = decomposeQuery(query)  // Use patterns from plan/rlm/decomposition-patterns.md

  // 3. Fan out parallel searches
  results = []
  for each (subQuery in subQueries) {
    parallel {
      // Keyword search via Jiron API
      keywordResults = GET /api/search?q=$subQuery

      // Semantic search (built-in RAG)
      semanticResults = semanticSearch(subQuery)

      // Metadata filtering via Jiron API
      metadataResults = GET /api/documents?frontmatter.tags[]=$tags

      // Dependency traversal if needed
      if (requiresTraversal(subQuery)) {
        depResults = GET /api/traverse/:path?depth=$depth
      }

      // Recursive exploration for complex sub-queries
      if (requiresDeeperContext(subQuery) && depth < maxDepth) {
        deepResults = exploreCodebase(subQuery, depth + 1)
      }
    }

    results.append(aggregateResults(keywordResults, semanticResults, metadataResults, depResults, deepResults))
  }

  // 4. Synthesize findings
  return synthesize(results, originalQuery)
}

## Available Tools

### Jiron APIs (Phase 3)
- GET /api/search - Fan-out search across FTS5, semantic, metadata
- GET /api/documents/:path - Get document with frontmatter
- GET /api/documents/:path/deps - Dependencies for document
- GET /api/traverse/:path - Recursive dependency traversal
- GET /api/dependencies/graph - Full dependency graph

### ProductManager API (Phase 4)
- GET /api/story-maps/summary - Project overview
- GET /api/journeys - User journeys and features
- GET /api/stories/high-priority - Important work items

### CLI Tools (Phase 1)
- bun ai/tools/query.js "$query" - Direct database queries
- bun ai/tools/find-related.js $path - Dependency traversal

### Built-in Agent Capabilities
- Grep - Pattern matching
- Glob - File discovery
- Read - File content examination
- RAG - Semantic search (already available)

## Query Decomposition Patterns

[Include patterns from decomposition-patterns.md]

## Example: Understanding Authentication Flow

Query: "Explain how authentication works in this project"

Step 1: Decompose
- "Find auth-related files"
- "Trace login dependencies"
- "Find session management"
- "Identify security rules"

Step 2: Fan out searches
parallel {
  GET /api/search?q=authentication&type=rule
  GET /api/search?q=login
  GET /api/documents?frontmatter.tags[]=security
  semanticSearch("authentication flow")
}

Step 3: Recursive exploration
For each auth file found:
  GET /api/documents/$path
  GET /api/traverse/$path?depth=2
  If complex: exploreCodebase("purpose of $dependency", depth+1)

Step 4: Synthesize
Aggregate:
- Auth entry points (login routes)
- Session management (cookies, tokens)
- Security rules (validation, CSRF)
- Dependency chain (auth → session → db)

Return: Comprehensive auth flow explanation

## Performance Considerations

### Recursion Limits
- Default maxDepth: 3
- Configurable via query parameter
- Prevent exponential explosion

### Caching
- SQLite acts as metadata cache
- Avoid re-fetching same files
- Reuse dependency graph results

### Parallel Execution
- Fan out independent searches
- Aggregate results efficiently
- Limit concurrent API calls

### Cost Management
- More API calls = higher cost
- But better quality for complex queries
- Agent decides trade-off based on query importance

## Integration with Other Skills

### With ProductManager
Use productmanager API to understand project structure:
GET /api/journeys → Learn what features exist
GET /api/stories → Understand user requirements
Context informs codebase exploration

### With Jiron Protocol
All APIs follow Jiron self-documenting format
Progressive discovery through hypermedia links
Navigate relationships without prior API knowledge

## Guidelines for Agents

1. **Assess before recursing**: Is this query truly complex?
2. **Decompose thoughtfully**: Break into logical, independent sub-queries
3. **Fan out aggressively**: Parallel searches are fast
4. **Recurse judiciously**: Only when sub-query needs deeper context
5. **Synthesize clearly**: User wants coherent answer, not raw data
6. **Monitor depth**: Respect maxDepth to prevent runaway recursion
7. **Cache results**: Don't re-query same data
8. **Explain reasoning**: Show decomposition strategy in response

## Success Metrics

RLM is working well when:
- Complex queries get comprehensive answers
- Agents find relevant files they would have missed
- Dependency traces are complete and accurate
- Large codebases (>100 files) handled smoothly
- Recursion terminates appropriately
- Response quality > cost of extra API calls
```

**Success Criteria**:
- [ ] SKILL.md complete and comprehensive
- [ ] Follows Agent Skills spec
- [ ] Recursive strategy well-defined
- [ ] Examples demonstrate capability
- [ ] Integration with Jiron APIs clear
- [ ] Guidelines help agents use effectively

**Files**:
- ai/skills/rlm/SKILL.md

---

## Update AGENTS.md with RLM Guidelines

Add RLM usage rules to agent guidelines.

**Requirements**:
- Given AGENTS.md, should add section on project context exploration
- Given RLM skill activation, should explain when to use
- Given alwaysApply: true, should note skill is always loaded
- Given agent decision-making, should explain how to choose RLM
- Given examples, should show before/after scenarios
- Given performance, should note trade-offs

**AGENTS.md Addition**:
```markdown
## Project Context Exploration with RLM

When you need comprehensive understanding of complex project areas:

### When to Activate RLM

The RLM (Recursive Language Model) skill is always loaded but you decide when to invoke it:

**Use RLM when**:
- Query spans multiple files or modules
- Need to trace dependencies or data flows
- Building architectural understanding
- Finding patterns across entire codebase
- Simple searches return incomplete results

**Don't use RLM when**:
- Query targets single file
- Answer in current context
- Simple keyword search sufficient

### How RLM Works

1. **Decompose**: Break complex query into sub-queries
2. **Fan out**: Search in parallel (keyword + semantic + metadata)
3. **Traverse**: Follow dependency graphs recursively
4. **Aggregate**: Synthesize findings into coherent answer

### Example Usage

**Before RLM** (incomplete answer):
User: "How does authentication work?"
Agent: *Searches "auth", finds login.js, reads it*
Response: "Login uses JWT tokens..." (misses session mgmt, CSRF, validation)

**With RLM** (comprehensive):
User: "How does authentication work?"
Agent: *Activates RLM skill*
1. Decomposes: [find auth files, trace deps, find security rules]
2. Fans out: API search + semantic + metadata queries
3. Traverses: Dependencies of each auth file
4. Synthesizes: Complete auth flow with all components
Response: "Authentication system has 3 layers:
   1. Login (login.js, session.js)
   2. Validation (auth-middleware.js, csrf.js)
   3. Session (cookie-handler.js, token-manager.js)
   Flow: User submits credentials → validates → creates session → sets cookie..."

### Available Tools

The RLM skill uses these tools:
- Jiron APIs (self-documenting, progressive discovery)
- SQLite queries (structured metadata)
- Dependency traversal (graph exploration)
- Built-in RAG (semantic search)
- Standard tools (Grep, Read, Glob)

### Performance Notes

- RLM makes more API calls (higher cost)
- But delivers better quality for complex queries
- You decide the trade-off based on query importance
- Recursion depth limited to prevent runaway costs
```

**Success Criteria**:
- [ ] AGENTS.md updated with clear guidelines
- [ ] Examples demonstrate value
- [ ] When to use / not use clear
- [ ] Integration with tools explained

---

## Test RLM with Real Queries

Validate RLM skill with actual aidd codebase queries.

**Requirements**:
- Given aidd codebase, should execute real complex queries
- Given test queries, should demonstrate recursive decomposition
- Given results, should validate comprehensiveness
- Given comparison, should show improvement over simple search
- Given performance, should measure API calls and time
- Given edge cases, should handle gracefully

**Test Queries**:

1. **Architectural**: "How does the task epic system work?"
   - Should find: task files, productmanager integration, YAML structure
   - Should trace: Dependencies between task creator and rules
   - Should synthesize: Complete workflow explanation

2. **Dependency**: "What would break if we change please.mdc?"
   - Should find: All files referencing please.mdc
   - Should traverse: Reverse dependencies
   - Should report: Impact radius

3. **Pattern**: "Find all SudoLang interface definitions"
   - Should search: FTS5 for interface patterns
   - Should identify: All .mdc files with interfaces
   - Should extract: Interface structures

4. **Flow**: "How do commands work end-to-end?"
   - Should trace: /command → ai/commands/*.md → ai/rules/*.mdc
   - Should explore: Command invocation flow
   - Should explain: Complete lifecycle

**Success Criteria**:
- [ ] All test queries answered comprehensively
- [ ] Recursive decomposition logical
- [ ] Results include all relevant files
- [ ] Synthesis coherent and accurate
- [ ] Performance acceptable

---

## Document RLM Skill Usage

Create comprehensive usage guide and examples.

**Requirements**:
- Given documentation, should explain RLM concepts clearly
- Given MIT paper findings, should relate to aidd implementation
- Given examples, should cover diverse query types
- Given troubleshooting, should address common issues
- Given best practices, should guide effective usage
- Given limitations, should be honest about constraints

**Success Criteria**:
- [ ] Documentation complete
- [ ] Examples cover common scenarios
- [ ] Troubleshooting helpful
- [ ] Best practices actionable

**Files**:
- docs/rlm-skill-guide.md

---

## Create RLM Demonstration

Build interactive demo showing RLM capabilities.

**Requirements**:
- Given demonstration, should use real aidd codebase
- Given complex query, should show decomposition steps visually
- Given API calls, should log and display
- Given recursion, should show depth levels
- Given aggregation, should show how results combine
- Given final answer, should compare to non-RLM approach

**Success Criteria**:
- [ ] Demo functional and impressive
- [ ] Clearly shows RLM value
- [ ] Can be shared with stakeholders
- [ ] Documents real-world effectiveness

**Files**:
- demos/rlm-exploration.md (transcript)

---

## Performance Optimization

Tune RLM for optimal performance and cost.

**Requirements**:
- Given API call patterns, should identify optimization opportunities
- Given caching, should avoid redundant queries
- Given parallelization, should maximize throughput
- Given recursion depth, should tune defaults
- Given termination conditions, should prevent unnecessary work
- Given cost monitoring, should track API usage

**Optimizations**:
- Cache API responses during single query session
- Deduplicate file fetches across sub-queries
- Limit fanout breadth based on result quality
- Early termination when confidence threshold met
- Adaptive depth based on query complexity

**Success Criteria**:
- [ ] Performance metrics documented
- [ ] Optimizations implemented
- [ ] Cost reasonable for value provided
- [ ] Monitoring in place

---

## Integration Testing

Test full RLM workflow across all phases.

**Requirements**:
- Given SQLite database (Phase 1), should query effectively
- Given Jiron APIs (Phase 2-4), should consume correctly
- Given recursive decomposition, should work end-to-end
- Given fan-out search, should aggregate properly
- Given real codebase, should handle scale
- Given edge cases, should gracefully degrade

**Success Criteria**:
- [ ] Integration tests comprehensive
- [ ] All phases work together
- [ ] Real codebase tested
- [ ] Performance validated

**Files**:
- ai/skills/rlm/integration.test.js

---

## Success Criteria (Phase 5)

- [ ] User journey documented with pain points and priorities
- [ ] Recursive decomposition strategy defined and documented
- [ ] RLM skill complete with comprehensive SKILL.md
- [ ] AGENTS.md updated with clear usage guidelines
- [ ] Real query testing validates effectiveness
- [ ] Usage documentation comprehensive
- [ ] Demonstration showcases capabilities
- [ ] Performance optimized for cost/quality trade-off
- [ ] Integration testing confirms all phases work together
- [ ] RLM skill ready for production use
- [ ] Agents can effectively explore complex codebases beyond context limits
- [ ] Delivers significant value over simple search approaches
