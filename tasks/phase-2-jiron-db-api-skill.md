# Phase 2: Jiron DB API Skill

**Status**: 📋 PLANNED
**Goal**: Create a reusable agent skill that generates self-documenting Jiron APIs from SudoLang interface definitions and SQLite databases
**Dependencies**: Phase 1 (SQLite Foundation + Fan-out Search)

## Epic Overview

Build a generic skill that takes SudoLang interface definitions and automatically generates Jiron API endpoints with rich query capabilities. This skill will be the foundation for exposing both the frontmatter index (Phase 3) and productmanager data (Phase 4) as AI-friendly, self-documenting APIs.

Jiron APIs provide progressive discovery, hypermedia affordances, and token-efficient responses ideal for AI agents. The skill should integrate with aidd's server middleware utilities and support the fan-out aggregated search capabilities built in Phase 1.

---

## Research Jiron Protocol Patterns

Study Jiron protocol and identify patterns for AI agent integration.

**Requirements**:
- Given Jiron spec, should understand hypermedia affordances
- Given Jiron format (pug syntax), should understand rendering
- Given self-documentation requirements, should understand discovery pattern
- Given AI agent optimization, should understand token efficiency
- Given code-on-demand, should understand JavaScript delivery capability
- Given existing Jiron examples, should identify common patterns

**Success Criteria**:
- [ ] Document Jiron core concepts in plan/jiron-skill/
- [ ] Identify API endpoint patterns
- [ ] Understand progressive discovery model
- [ ] Document integration strategy with aidd middleware

---

## Create Jiron Protocol Skill

Build a foundational skill that teaches AI agents how to understand and use Jiron protocol.

**Requirements**:
- Given SKILL.md format, should follow Agent Skills specification
- Given skill description, should explain Jiron as self-documenting API protocol for AI agents
- Given Jiron concepts, should explain hypermedia affordances
- Given pug syntax, should provide examples and patterns
- Given progressive discovery, should explain navigation through links
- Given code-on-demand, should explain JavaScript delivery
- Given token efficiency, should compare to JSON and explain benefits
- Given usage patterns, should show how to consume Jiron APIs
- Given AI agent consumption, should explain programmatic traversal
- Given examples, should include common entity/collection/action patterns

**Skill Structure**:
```
ai/skills/jiron/
└── SKILL.md
```

**Success Criteria**:
- [ ] SKILL.md follows Agent Skills spec
- [ ] Explains Jiron core concepts clearly
- [ ] Provides concrete usage examples
- [ ] Shows how AI agents navigate Jiron APIs
- [ ] Agents can learn Jiron from skill alone
- [ ] Ready for agents to reference when using Jiron APIs

**Files**:
- ai/skills/jiron/SKILL.md

---

## Design SudoLang → Jiron Mapping

Define how SudoLang interfaces map to Jiron API endpoints.

**Requirements**:
- Given SudoLang interface definition, should map to Jiron entity structure
- Given SudoLang function definitions, should map to Jiron actions
- Given SudoLang constraints, should generate API validation
- Given nested interfaces, should create nested resource endpoints
- Given function parameters, should generate Jiron forms/fields
- Given return types, should define response structure

**Example Mapping**:
```sudolang
// SudoLang Interface
Persona {
  id: String
  name: String
  description: String
  metadata: Object
}

createPersona(name, description, metadata?): Persona

// Maps to Jiron API:
// GET /api/personas - list with links to each persona
// GET /api/personas/:id - single persona entity
// POST /api/personas - form with name, description, metadata fields
// PUT /api/personas/:id - update form
// DELETE /api/personas/:id - delete action
```

**Success Criteria**:
- [ ] Mapping rules documented
- [ ] Examples for common patterns
- [ ] Validation rules clear
- [ ] Nested resource handling defined

---

## Build SudoLang Interface Parser

Parse SudoLang definitions and extract API structure.

**Requirements**:
- Given SudoLang interface file, should parse interface definitions
- Given interface fields, should extract field names and types
- Given function definitions, should extract signatures
- Given constraints, should extract validation rules
- Given parse errors, should provide helpful messages
- Given parsed structure, should return JSON representation

**Success Criteria**:
- [ ] Unit tests with various SudoLang patterns
- [ ] Handles interfaces, functions, constraints
- [ ] Error messages actionable
- [ ] JSON output well-structured

**Files**:
- ai/skills/jiron-db-api/tools/parse-sudolang.js
- ai/skills/jiron-db-api/tools/parse-sudolang.test.js

---

## Build Jiron Endpoint Generator

Generate Jiron API endpoints from parsed SudoLang.

**Requirements**:
- Given parsed interface, should generate entity endpoints (GET /resource/:id)
- Given collection, should generate list endpoints (GET /resources)
- Given create function, should generate POST endpoint with form
- Given update function, should generate PUT endpoint
- Given delete function, should generate DELETE endpoint
- Given nested resources, should generate hierarchical routes
- Given Jiron format, should use pug syntax
- Given hypermedia links, should include navigation affordances

**Success Criteria**:
- [ ] Generates valid Jiron/pug markup
- [ ] Routes follow REST conventions
- [ ] Forms include all required fields
- [ ] Links enable progressive discovery
- [ ] Unit tests validate output

**Files**:
- ai/skills/jiron-db-api/tools/generate-endpoints.js
- ai/skills/jiron-db-api/tools/generate-endpoints.test.js

---

## Build SQLite Query Bridge

Connect Jiron endpoints to SQLite database operations.

**Requirements**:
- Given GET request, should query database by ID or filters
- Given POST request, should insert new record with validation
- Given PUT request, should update existing record
- Given DELETE request, should remove record
- Given foreign keys, should validate relationships
- Given transactions, should ensure atomicity
- Given query parameters, should support filtering, sorting, pagination
- Given JSON fields, should support JSON path queries
- Given errors, should return appropriate HTTP status codes

**Success Criteria**:
- [ ] CRUD operations functional
- [ ] Foreign key validation works
- [ ] Transactions rollback on error
- [ ] Query parameters parsed correctly
- [ ] Unit tests with in-memory database

**Files**:
- ai/skills/jiron-db-api/tools/db-bridge.js
- ai/skills/jiron-db-api/tools/db-bridge.test.js

---

## Integrate Fan-out Search with Jiron

Expose fan-out search capabilities via Jiron API endpoints.

**Requirements**:
- Given search query parameter, should trigger fan-out search
- Given search results, should return as Jiron collection
- Given result ranking, should order by relevance score
- Given multiple search strategies, should aggregate results
- Given search filters, should combine with fan-out
- Given pagination, should limit and offset results
- Given search endpoint, should provide self-documenting form

**Example Endpoint**:
```
GET /api/search?q=authentication&type=rule&limit=20
→ Fan out to: FTS5, semantic RAG, metadata filters
→ Returns: Jiron collection with ranked results
```

**Success Criteria**:
- [ ] Search endpoint functional
- [ ] Fan-out integration works
- [ ] Results properly formatted as Jiron
- [ ] Pagination works
- [ ] Performance acceptable (<500ms)

**Files**:
- ai/skills/jiron-db-api/tools/search-endpoints.js
- ai/skills/jiron-db-api/tools/search-endpoints.test.js

---

## Build Middleware Integration

Integrate with aidd server middleware utilities.

**Requirements**:
- Given aidd createRoute, should compose with Jiron handlers
- Given withRequestId, should include request tracking
- Given withCors, should enable cross-origin requests
- Given withServerError, should standardize error responses
- Given middleware chain, should use asyncPipe composition
- Given logging, should use aidd logger with scrubbing

**Success Criteria**:
- [ ] Middleware composition works
- [ ] Request IDs tracked
- [ ] CORS headers set
- [ ] Errors formatted consistently
- [ ] Logging functional

**Files**:
- ai/skills/jiron-db-api/tools/middleware.js
- ai/skills/jiron-db-api/tools/middleware.test.js

---

## Create Jiron DB API Skill

Write the complete skill specification with usage instructions.

**Requirements**:
- Given SKILL.md format, should include proper frontmatter
- Given skill description, should explain when to use
- Given usage instructions, should document SudoLang → Jiron workflow
- Given examples, should show common patterns
- Given tool references, should link to generated endpoints
- Given constraints, should document limitations

**Skill Structure**:
```
ai/skills/jiron-db-api/
├── SKILL.md
└── tools/
    ├── parse-sudolang.js
    ├── generate-endpoints.js
    ├── db-bridge.js
    ├── search-endpoints.js
    ├── middleware.js
    └── *.test.js
```

**Success Criteria**:
- [ ] SKILL.md follows Agent Skills spec
- [ ] Instructions clear and actionable
- [ ] Examples demonstrate full workflow
- [ ] Constraints documented
- [ ] Ready for use by agents

**Files**:
- ai/skills/jiron-db-api/SKILL.md

---

## Build Code Generation CLI

Create CLI tool to generate Jiron API from SudoLang.

**Requirements**:
- Given SudoLang file path, should parse and generate endpoints
- Given database path, should connect and validate schema
- Given output directory, should write generated API files
- Given validation mode, should check without generating
- Given verbose flag, should show detailed progress
- Given errors, should provide actionable feedback

**Usage**:
```bash
bun ai/skills/jiron-db-api/tools/generate.js \
  --schema path/to/schema.sudo \
  --db .aidd/index.db \
  --output src/api/
```

**Success Criteria**:
- [ ] CLI functional
- [ ] Help documentation clear
- [ ] Generated code valid
- [ ] Error handling robust

**Files**:
- ai/skills/jiron-db-api/tools/generate.js
- ai/skills/jiron-db-api/tools/generate.test.js

---

## Write Comprehensive Tests

Test full SudoLang → Jiron → SQLite workflow.

**Requirements**:
- Given sample SudoLang schema, should generate working API
- Given API requests, should perform CRUD operations
- Given search requests, should return fan-out results
- Given validation, should reject invalid inputs
- Given foreign keys, should enforce relationships
- Given concurrent requests, should handle safely

**Success Criteria**:
- [ ] Integration tests pass
- [ ] Sample schemas included
- [ ] API behavior validated
- [ ] Performance acceptable

**Files**:
- ai/skills/jiron-db-api/tools/integration.test.js

---

## Document Skill Usage

Create comprehensive documentation and examples.

**Requirements**:
- Given documentation, should explain SudoLang → Jiron workflow
- Given examples, should cover common patterns
- Given troubleshooting guide, should address common issues
- Given API reference, should document all generated endpoints
- Given middleware integration, should explain composition

**Success Criteria**:
- [ ] Documentation clear and complete
- [ ] Examples runnable
- [ ] Troubleshooting helpful
- [ ] Ready for Phase 3 usage

**Files**:
- plan/jiron-skill/usage-guide.md
- plan/jiron-skill/examples/

---

## Success Criteria (Phase 2)

- [ ] Jiron DB API skill functional and tested
- [ ] SudoLang interfaces map to Jiron endpoints correctly
- [ ] SQLite integration works with all CRUD operations
- [ ] Fan-out search exposed via Jiron API
- [ ] Middleware integration with aidd server utilities
- [ ] Code generation CLI operational
- [ ] Comprehensive tests pass (unit + integration)
- [ ] Documentation complete with examples
- [ ] Skill ready for use in Phase 3 (frontmatter API) and Phase 4 (productmanager API)
- [ ] Reusable for future database-backed APIs
