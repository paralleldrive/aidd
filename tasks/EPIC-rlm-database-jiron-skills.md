# RLM + Database + Jiron Skills: Master Epic

**Status**: 📋 PLANNED
**Start Date**: 2026-01-20
**Goal**: Transform aidd into a database-backed framework with self-documenting APIs and recursive codebase exploration capabilities

---

## 🎯 Executive Summary

Build a comprehensive skill ecosystem that enables AI agents to deeply understand and work with complex codebases through:

1. **SQLite Foundation** - Queryable database for all project metadata
2. **Jiron APIs** - Self-documenting, AI-friendly API layer
3. **Rich Querying** - Fan-out search combining keyword, semantic, and structured queries
4. **Database-Backed Story Maps** - ProductManager skill with SQL power
5. **Recursive Exploration** - RLM skill for handling codebases beyond context limits

**Key Innovation**: Treat the codebase as an external environment that agents can programmatically explore through recursive decomposition, extending effective context by 100x.

---

## 📊 Phase Overview

### Phase Dependencies

```
Phase 1: SQLite Foundation + Indexing + Fan-out Search
├─ No dependencies (foundational)
├─ Deliverable: Database schema, indexers, query tools
└─ Duration: Foundation for all phases

    ├─→ Phase 2: Jiron DB API Skill
    │   ├─ Depends on: Phase 1
    │   ├─ Deliverable: Generic API generation from SudoLang → Jiron
    │   └─ Duration: Reusable for any database-backed API
    │
    │       ├─→ Phase 3: Frontmatter Index Jiron API
    │       │   ├─ Depends on: Phase 1, Phase 2
    │       │   ├─ Deliverable: Self-documenting codebase query API
    │       │   └─ Duration: Powers RLM exploration
    │       │
    │       └─→ Phase 4: ProductManager Skill Conversion
    │           ├─ Depends on: Phase 1, Phase 2
    │           ├─ Deliverable: Database-backed story maps with Jiron API
    │           └─ Duration: Rich querying for product data
    │
    └─→ Phase 5: RLM Skill
        ├─ Depends on: All phases (1, 2, 3, 4)
        ├─ Deliverable: Recursive codebase exploration skill
        └─ Duration: Capstone bringing everything together
```

### Implementation Order

**Sequential with parallel opportunities:**

1. **Phase 1** - Start immediately (no blockers)
2. **Phase 2** - Start after Phase 1 database operational
3. **Phase 3 & 4** - Can proceed in parallel (both need Phase 1 + 2)
4. **Phase 5** - Final integration (needs all previous phases)

---

## 🔍 Phase Details

### Phase 1: SQLite Foundation + Indexing + Fan-out Search

**What**: Core database infrastructure and search capabilities

**Deliverables**:
- SQLite schema (documents, dependencies, productmanager tables)
- Frontmatter indexer with FTS5 full-text search
- Dependency graph indexer and traversal
- Fan-out search (keyword + semantic + structured)
- CLI tools for indexing and querying
- Git configuration for committing SQLite databases

**Key Files**:
- `.aidd/index.db` - SQLite database (committed to git)
- `ai/tools/index-frontmatter.js` - Frontmatter extraction
- `ai/tools/index-dependencies.js` - Import graph builder
- `ai/tools/query.js` - Unified query CLI
- `ai/tools/fan-out-search.js` - Multi-strategy search

**Why This Matters**:
- Foundation for all subsequent phases
- Enables rich querying impossible with YAML
- Database committed to git (clone and go)
- Change detection for incremental updates

**Success Criteria**:
- [ ] Schema creates all tables with indexes
- [ ] Indexers handle 100+ files in <1 second
- [ ] FTS5 search finds relevant content
- [ ] Fan-out search aggregates multiple strategies
- [ ] All unit tests pass (>90% coverage)

**Epic Document**: [`tasks/phase-1-sqlite-foundation.md`](../tasks/phase-1-sqlite-foundation.md)

---

### Phase 2: Jiron DB API Skill

**What**: Generic skill for generating self-documenting APIs from SudoLang schemas

**Deliverables**:
- `ai/skills/jiron/SKILL.md` - Teaches agents Jiron protocol
- `ai/skills/jiron-db-api/` - API generation skill and tools
- SudoLang interface parser
- Jiron endpoint generator (pug syntax)
- SQLite query bridge
- Middleware integration with aidd server utilities

**Key Capabilities**:
- Parse SudoLang interface definitions
- Generate Jiron API endpoints with hypermedia links
- Connect to SQLite for CRUD operations
- Expose fan-out search via Jiron endpoints
- Self-documenting, progressive discovery

**Why This Matters**:
- Reusable for any database-backed API (not just aidd)
- AI-friendly token-efficient protocol
- Hypermedia enables agent navigation
- Foundation for Phase 3 and 4 APIs

**Success Criteria**:
- [ ] SudoLang → Jiron generation works
- [ ] Generated APIs functional with SQLite
- [ ] Fan-out search exposed via endpoints
- [ ] Middleware integration complete
- [ ] Skills follow Agent Skills spec

**Epic Document**: [`tasks/phase-2-jiron-db-api-skill.md`](../tasks/phase-2-jiron-db-api-skill.md)

---

### Phase 3: Frontmatter Index Jiron API

**What**: Apply Jiron skill to expose frontmatter index as self-documenting API

**Deliverables**:
- SudoLang schema for documents and dependencies
- Generated Jiron API for codebase queries
- Search endpoint with fan-out capabilities
- Dependency traversal API
- API server and documentation

**Key Endpoints**:
- `GET /api/documents` - List/filter documents
- `GET /api/documents/:path` - Document detail
- `GET /api/search` - Fan-out search
- `GET /api/traverse/:path` - Recursive dependencies
- `GET /api/dependencies/graph` - Full dep graph

**Why This Matters**:
- Programmatic codebase exploration
- Self-documenting for AI agents
- Foundation for RLM recursive queries
- Progressive discovery through links

**Success Criteria**:
- [ ] SudoLang schema complete
- [ ] Jiron API generated and functional
- [ ] Search integrates fan-out capabilities
- [ ] Traversal navigates dependency graph
- [ ] API server operational

**Epic Document**: [`tasks/phase-3-frontmatter-jiron-api.md`](../tasks/phase-3-frontmatter-jiron-api.md)

---

### Phase 4: ProductManager Skill Conversion

**What**: Convert productmanager from rule to full skill with database backing

**Deliverables**:
- `ai/skills/productmanager/SKILL.md` - Full Agent Skill
- SudoLang schema for all productmanager entities
- Generated Jiron API for story maps
- SQLite as source of truth (YAML export optional)
- Import tool for existing YAML data

**Key Capabilities**:
- Rich queries: "High-priority stories for persona X"
- Aggregations: AVG priority, story counts by status
- Foreign keys ensure data integrity
- Complex joins across personas, journeys, steps, stories
- YAML export for stakeholder review

**Why This Matters**:
- YAML doesn't scale to complex products (100+ stories)
- SQL enables dashboard, analytics, impact analysis
- Database-backed workflows more robust
- Foundation for connecting code to requirements

**Success Criteria**:
- [ ] SudoLang schema complete
- [ ] Jiron API functional
- [ ] Existing YAML imported successfully
- [ ] Validates against original productmanager.mdc
- [ ] YAML export works on demand

**Epic Document**: [`tasks/phase-4-productmanager-skill.md`](../tasks/phase-4-productmanager-skill.md)

---

### Phase 5: RLM Skill

**What**: Recursive Language Model skill for deep codebase exploration

**Deliverables**:
- `ai/skills/rlm/SKILL.md` - Complete recursive exploration skill
- Decomposition patterns documentation
- Integration with all Jiron APIs
- AGENTS.md usage guidelines
- User journey with pain points

**Key Capabilities**:
- Recursive task decomposition
- Fan-out search orchestration
- Dependency graph traversal
- Result aggregation and synthesis
- Handles codebases 100x beyond context limits

**Decomposition Example**:
```
Query: "How does authentication work?"
├─ Decompose: ["Find auth files", "Trace deps", "Extract logic"]
├─ Fan out: Parallel searches (keyword + semantic + metadata)
├─ Traverse: Dependencies of each auth file
├─ Recurse: Deep dive on complex dependencies
└─ Synthesize: Complete auth flow explanation
```

**Why This Matters**:
- Solves context window limitations
- Enables architectural understanding
- AI agents become more effective on large codebases
- Differentiator for aidd framework

**Success Criteria**:
- [ ] User journey documented
- [ ] Decomposition strategy defined
- [ ] SKILL.md complete with examples
- [ ] AGENTS.md updated
- [ ] Real query testing validates effectiveness

**Epic Document**: [`tasks/phase-5-rlm-skill.md`](../tasks/phase-5-rlm-skill.md)

---

## 🎨 Architecture Decisions

### 1. SQLite as Source of Truth
**Decision**: Commit `.aidd/index.db` to git, YAML export optional

**Rationale**:
- No sync issues (single source)
- Rich queries, relationships, aggregations
- Git-friendly with proper config
- Clone repo → everything works

**Trade-offs**:
- Binary file in git (mitigated by textconv)
- Learning curve for SQL queries
- Worth it for query power

### 2. Jiron Protocol for APIs
**Decision**: Use Jiron for all database-backed APIs

**Rationale**:
- Self-documenting (agents discover capabilities)
- Token-efficient vs JSON
- Progressive discovery via hypermedia
- Pug syntax is terse and expressive

**Trade-offs**:
- Newer protocol (less tooling)
- Learning curve for developers
- But massive benefit for AI agents

### 3. Hybrid Implementation
**Decision**: SudoLang for AI logic, JavaScript/Bun for symbolic processing

**Rationale**:
- SudoLang for decision-making, decomposition, synthesis
- JS/Bun for indexing, queries, graph traversal
- TDD for all symbolic code
- Right tool for each job

### 4. Skills Location: `ai/skills/`
**Decision**: Framework-agnostic location, not `.claude/`

**Rationale**:
- Works with any Agent Skills tool
- Consistent with `ai/rules/`, `ai/commands/`
- Not tied to Claude Code
- Better for aidd framework users

### 5. Always-Surfaced RLM
**Decision**: RLM skill has `alwaysApply: true`, agent decides when to use

**Rationale**:
- Proactive context gathering
- No user friction
- Agent learns when deep exploration valuable
- AGENTS.md provides usage guidance

---

## 💡 Value Proposition

### Problems Solved

**1. Context Window Limitations**
- Current: Agents struggle with codebases >100 files
- With RLM: Handle projects 100x beyond context limits
- Value: Better answers, fewer hallucinations

**2. YAML Doesn't Scale**
- Current: Complex story maps become unmanageable YAML
- With SQLite: Rich queries, aggregations, relationships
- Value: Product data becomes analyzable

**3. Manual Code Discovery**
- Current: Agents miss relevant files, incomplete answers
- With Fan-out + Jiron: Comprehensive search, dependency traversal
- Value: Complete context for better decisions

**4. No API Layer**
- Current: Direct file manipulation, no self-documentation
- With Jiron: Progressive discovery, hypermedia affordances
- Value: Agents navigate data programmatically

### Quantified Benefits

**Performance**:
- Indexing: 100 files in <1 second
- Queries: <200ms for typical searches
- Context scaling: 100x beyond model limits

**Developer Experience**:
- Faster onboarding to complex codebases
- Better architectural understanding
- Reduced context switching
- More accurate agent responses

**Framework Capabilities**:
- Foundation for future enhancements (vector search, AST analysis)
- Reusable patterns (Jiron skill works for any DB)
- Extensible architecture

---

## 🚧 Implementation Strategy

### Incremental Delivery

**Each phase ships independently**:
- Phase 1: Database + tools usable immediately
- Phase 2: Jiron skill reusable for other projects
- Phase 3: Frontmatter API enables codebase queries
- Phase 4: ProductManager skill upgrade
- Phase 5: RLM brings it all together

### Testing Approach

**Per Phase**:
- Unit tests for all JavaScript (TDD with vitest + riteway)
- Integration tests with real aidd data
- Performance benchmarks
- SudoLang validation through agent self-prompting

**Phase 5 Final**:
- End-to-end recursive exploration tests
- Real-world query validation
- Performance optimization
- User acceptance testing

### Risk Mitigation

**Database Adoption**:
- Import existing YAML to ease transition
- Export tools for YAML workflows
- Backward compatible approach

**Complexity Management**:
- Incremental phases reduce risk
- Each phase valuable on its own
- Can stop at any phase if needed

**Agent Effectiveness**:
- Clear guidelines in AGENTS.md
- Examples for common patterns
- Self-documenting APIs help discovery

---

## 📈 Success Metrics

### Phase 1
- [ ] Index all aidd .md/.mdc files successfully
- [ ] FTS5 search finds relevant content
- [ ] Dependency graph complete and queryable
- [ ] Performance: <1s for 100 files

### Phase 2
- [ ] Generate working Jiron API from SudoLang
- [ ] API supports CRUD on SQLite
- [ ] Fan-out search exposed via endpoints
- [ ] Reusable for other projects

### Phase 3
- [ ] Codebase queryable via Jiron API
- [ ] Search returns comprehensive results
- [ ] Dependency traversal works at depth 5
- [ ] API documentation complete

### Phase 4
- [ ] All productmanager workflows in database
- [ ] Complex queries work (joins, aggregations)
- [ ] Validates against original productmanager.mdc
- [ ] YAML import/export functional

### Phase 5
- [ ] RLM handles complex architectural queries
- [ ] Recursive decomposition logical and complete
- [ ] Results better than simple search
- [ ] Agents use skill appropriately

### Overall
- [ ] All 5 phases complete and integrated
- [ ] Documentation comprehensive
- [ ] Tests pass (unit + integration)
- [ ] Real-world validation successful
- [ ] Ready for production use

---

## 📚 Documentation

### Research Documentation (`plan/rlm/`)
- [`research-summary.md`](../plan/rlm/research-summary.md) - Overview
- [`agent-skills-spec.md`](../plan/rlm/agent-skills-spec.md) - Agent Skills specification
- [`rlm-paper-findings.md`](../plan/rlm/rlm-paper-findings.md) - MIT RLM paper analysis
- [`implementation-architecture.md`](../plan/rlm/implementation-architecture.md) - Technical architecture
- [`database-design.md`](../plan/rlm/database-design.md) - Complete SQLite schema
- [`review-janhesters-branch.md`](../plan/rlm/review-janhesters-branch.md) - Compatibility analysis

### Phase Epics (`tasks/`)
- [`phase-1-sqlite-foundation.md`](../tasks/phase-1-sqlite-foundation.md)
- [`phase-2-jiron-db-api-skill.md`](../tasks/phase-2-jiron-db-api-skill.md)
- [`phase-3-frontmatter-jiron-api.md`](../tasks/phase-3-frontmatter-jiron-api.md)
- [`phase-4-productmanager-skill.md`](../tasks/phase-4-productmanager-skill.md)
- [`phase-5-rlm-skill.md`](../tasks/phase-5-rlm-skill.md)

---

## 🤝 Relationship to Existing Work

### janhesters' Claude Code Skills (`.claude/skills/`)
**Status**: Compatible, complementary

**His Approach**:
- YAML-based workflows
- Claude Code specific (`.claude/` directory)
- Lightweight, quick to use

**Our Approach**:
- Database-backed workflows
- Framework-agnostic (`ai/skills/` directory)
- Rich querying and APIs

**Coexistence**:
- Both can exist side-by-side
- Different use cases and audiences
- Potential future convergence: `ai/skills/` powers both

**Recommendation**: Suggest moving `.claude/skills/` → `ai/skills/` for broader compatibility

### Existing AIDD Framework
**Integration Points**:
- Extends existing `ai/rules/` and `ai/commands/`
- Adds `ai/skills/` for Agent Skills spec
- Preserves backward compatibility
- Enhances, doesn't replace

---

## 🚀 Getting Started

### Phase 1 First Steps
1. Create `.aidd/` directory
2. Implement SQLite schema creation script
3. Build frontmatter indexer with TDD
4. Test with real aidd files
5. Validate performance targets

### For Contributors
1. Read this overview
2. Review specific phase epic for details
3. Check research docs for context
4. Start with Phase 1 if implementing
5. Reach out with questions

### For Reviewers
1. Review this overview for big picture
2. Validate phase dependencies make sense
3. Check value proposition aligns with goals
4. Review technical decisions
5. Provide feedback on approach

---

## 📅 Timeline Estimate

**Note**: Focus on what needs doing, not when (per AIDD principles)

**Rough Sequence**:
- Phase 1: Foundational (start immediately)
- Phase 2: After Phase 1 operational
- Phase 3 & 4: Parallel after Phase 2
- Phase 5: Integration after all phases

**Incremental Delivery**: Each phase ships as completed, providing value immediately

---

## ✅ Next Actions

1. **Review this overview** - Ensure big picture clear
2. **Start Phase 1** - Begin implementation
3. **Coordinate with janhesters** - Discuss skill directory location
4. **Document as we go** - Update this overview with learnings
5. **Celebrate milestones** - Each phase completion is progress

---

**Questions? Start with this overview, then dive into specific phase epics for details.**
