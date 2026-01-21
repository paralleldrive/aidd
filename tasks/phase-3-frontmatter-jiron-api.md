# Phase 3: Frontmatter Index Jiron API

**Status**: 📋 PLANNED
**Goal**: Apply Jiron DB API skill to expose frontmatter index and codebase queries as self-documenting API with rich fan-out search
**Dependencies**: Phase 1 (SQLite Foundation), Phase 2 (Jiron DB API Skill)

## Epic Overview

Use the Jiron DB API skill to generate a comprehensive API for the frontmatter index. Expose documents, dependencies, and fan-out search capabilities through AI-friendly, self-documenting Jiron endpoints. Enable agents to discover and query codebase metadata programmatically with progressive discovery.

This API will be the foundation for RLM skill's recursive exploration capabilities and general codebase understanding.

---

## Define SudoLang Schema for Frontmatter Index

Create SudoLang interface definitions for documents and dependencies.

**Requirements**:
- Given documents table, should define Document interface
- Given frontmatter JSON, should define flexible metadata structure
- Given dependencies table, should define Dependency interface
- Given search capabilities, should define Search interface
- Given query parameters, should define filter interfaces
- Given relationships, should define document → dependencies links

**SudoLang Schema**:
```sudolang
Document {
  path: String(primary key)
  type: "rule" | "command" | "skill" | "task" | "story-map" | "other"
  frontmatter: Object
  content: String
  hash: String
  indexedAt: Timestamp
  fileSize: Number
  modifiedAt: Timestamp
}

Dependency {
  fromFile: String
  toFile: String
  importType: "import" | "require" | "reference" | "link"
  lineNumber: Number
  importText: String
}

SearchQuery {
  q: String              // Search query
  type?: String          // Filter by document type
  limit?: Number = 20    // Result limit
  offset?: Number = 0    // Pagination offset
}

SearchResult {
  document: Document
  relevanceScore: Number
  matchType: "keyword" | "semantic" | "metadata"
  snippet: String
}

DependencyQuery {
  file: String           // Target file
  direction: "forward" | "reverse" | "both"
  depth?: Number = 3     // Traversal depth
}

// Functions
getDocument(path: String): Document
listDocuments(type?: String, limit?: Number): Document[]
searchDocuments(query: SearchQuery): SearchResult[]
getDependencies(query: DependencyQuery): Dependency[]
getRelatedFiles(path: String, depth?: Number): Document[]
```

**Success Criteria**:
- [ ] Schema complete and well-documented
- [ ] Covers all frontmatter index features
- [ ] Includes search and traversal operations
- [ ] Ready for Jiron generation

**Files**:
- ai/schemas/frontmatter-index.sudo

---

## Generate Jiron API from Schema

Use Jiron DB API skill to generate endpoints from SudoLang schema.

**Requirements**:
- Given SudoLang schema, should generate Jiron endpoints
- Given Document interface, should create /api/documents/* routes
- Given Dependency interface, should create /api/dependencies/* routes
- Given search operations, should create /api/search endpoint
- Given traversal operations, should create /api/traverse endpoint
- Given pug syntax, should generate valid Jiron markup
- Given hypermedia links, should enable progressive discovery

**Generated Endpoints**:
```
GET  /api/documents              - List all documents with filters
GET  /api/documents/:path        - Single document detail
GET  /api/documents/:path/deps   - Dependencies for document
GET  /api/dependencies           - List dependencies
GET  /api/dependencies/graph     - Full dependency graph
GET  /api/search                 - Fan-out search
POST /api/search                 - Rich query with filters
GET  /api/traverse/:path         - Recursive dependency traversal
```

**Success Criteria**:
- [ ] All endpoints generated correctly
- [ ] Jiron format valid
- [ ] Links enable navigation
- [ ] Forms include proper fields

**Files**:
- src/api/frontmatter/ (generated)

---

## Implement Search Endpoint with Fan-out

Connect search endpoint to Phase 1 fan-out search capabilities.

**Requirements**:
- Given search query, should trigger fan-out across strategies
- Given keyword search, should query FTS5
- Given semantic search, should use built-in RAG
- Given metadata filters, should query JSON fields
- Given parallel execution, should aggregate results
- Given relevance scoring, should rank unified results
- Given pagination, should support limit/offset
- Given Jiron response, should format as discoverable collection

**Success Criteria**:
- [ ] Fan-out integration works
- [ ] All search strategies active
- [ ] Results properly ranked
- [ ] Pagination functional
- [ ] Response time <500ms

---

## Implement Traversal Endpoint

Expose dependency graph traversal via Jiron API.

**Requirements**:
- Given target file path, should find related files
- Given direction parameter, should traverse forward/reverse/both
- Given depth parameter, should limit recursion
- Given traversal results, should include path traces
- Given Jiron response, should link to related documents
- Given circular dependencies, should handle gracefully

**Success Criteria**:
- [ ] Traversal works in all directions
- [ ] Depth limiting functional
- [ ] Path traces included
- [ ] Jiron links navigate to documents

---

## Add Frontmatter Metadata Queries

Enable rich querying of frontmatter JSON fields.

**Requirements**:
- Given JSON path query, should extract specific fields
- Given comparison operators, should filter by metadata values
- Given array fields, should support array operations
- Given nested objects, should support deep queries
- Given multiple conditions, should combine with AND/OR
- Given Jiron response, should highlight matched fields

**Example Queries**:
```
/api/documents?frontmatter.alwaysApply=true
/api/documents?frontmatter.tags[]=security
/api/documents?frontmatter.description~=authentication
```

**Success Criteria**:
- [ ] JSON path queries work
- [ ] Operators functional (=, !=, ~=, >, <)
- [ ] Array operations correct
- [ ] Complex queries supported

---

## Integrate with aidd Server Middleware

Wire up generated Jiron API with aidd middleware stack.

**Requirements**:
- Given generated endpoints, should compose with createRoute
- Given requests, should include withRequestId
- Given CORS needs, should apply withCors
- Given errors, should use withServerError
- Given logging, should use aidd logger
- Given middleware chain, should use asyncPipe

**Success Criteria**:
- [ ] Middleware composition works
- [ ] Request tracking functional
- [ ] CORS headers set
- [ ] Errors standardized
- [ ] Logging operational

---

## Create API Server Entry Point

Build server that hosts frontmatter Jiron API.

**Requirements**:
- Given server start, should initialize database connection
- Given routes, should mount all Jiron endpoints
- Given port configuration, should use environment variable
- Given graceful shutdown, should close database
- Given health check, should expose /health endpoint
- Given documentation, should expose API explorer at root

**Success Criteria**:
- [ ] Server starts successfully
- [ ] All routes accessible
- [ ] Configuration via env vars
- [ ] Graceful shutdown works
- [ ] Health check responds

**Files**:
- src/api/frontmatter-server.js

---

## Write API Documentation

Document frontmatter Jiron API for users and agents.

**Requirements**:
- Given API endpoints, should document all routes
- Given query parameters, should explain filters and options
- Given examples, should show common use cases
- Given Jiron navigation, should explain progressive discovery
- Given authentication (if needed), should document
- Given rate limits (if any), should document

**Success Criteria**:
- [ ] Documentation complete
- [ ] Examples runnable
- [ ] Jiron concepts explained
- [ ] Ready for agent consumption

**Files**:
- docs/api/frontmatter-index.md

---

## Build Integration Tests

Test full API workflow with real queries.

**Requirements**:
- Given running API server, should respond to all endpoints
- Given search queries, should return relevant results
- Given traversal queries, should navigate dependencies correctly
- Given metadata queries, should filter accurately
- Given pagination, should handle large result sets
- Given concurrent requests, should handle safely
- Given error conditions, should return appropriate status codes

**Success Criteria**:
- [ ] All endpoints tested
- [ ] Real aidd data tested
- [ ] Performance acceptable
- [ ] Error handling validated

**Files**:
- src/api/frontmatter/integration.test.js

---

## Add API to RLM Skill Documentation

Document how RLM skill uses frontmatter API.

**Requirements**:
- Given RLM exploration needs, should reference API endpoints
- Given examples, should show API usage in recursive queries
- Given fan-out search, should explain API integration
- Given progressive discovery, should demonstrate navigation

**Success Criteria**:
- [ ] RLM documentation updated
- [ ] Examples clear
- [ ] Integration patterns documented

---

## Success Criteria (Phase 3)

- [ ] SudoLang schema complete for frontmatter index
- [ ] Jiron API generated and functional
- [ ] Search endpoint integrated with fan-out capabilities
- [ ] Traversal endpoint navigates dependency graph
- [ ] Metadata queries support rich filtering
- [ ] Middleware integration with aidd server utilities
- [ ] API server operational and documented
- [ ] Integration tests pass
- [ ] Ready for RLM skill consumption (Phase 5)
- [ ] Provides foundation for codebase exploration
