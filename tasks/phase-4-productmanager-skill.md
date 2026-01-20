# Phase 4: ProductManager Skill Conversion

**Status**: 📋 PLANNED
**Goal**: Convert ai/rules/productmanager.mdc to a full Agent Skill with Jiron API backing and SQLite as source of truth
**Dependencies**: Phase 1 (SQLite Foundation), Phase 2 (Jiron DB API Skill)

## Epic Overview

Transform the existing productmanager.mdc rule into a complete Agent Skill with database-backed workflows. Use the Jiron DB API skill to expose story map data through self-documenting APIs. Migrate existing YAML data, provide export capabilities, and enable rich querying of personas, journeys, steps, and stories.

The old ai/rules/productmanager.mdc will remain temporarily for validation until the new skill is proven equivalent or superior.

---

## Analyze Existing ProductManager Implementation

Study current productmanager.mdc to understand workflows and data patterns.

**Requirements**:
- Given ai/rules/productmanager.mdc, should document all type definitions
- Given existing workflows, should identify key operations
- Given YAML structure, should map to database schema
- Given current usage, should identify what to preserve
- Given limitations, should identify improvements to make

**Success Criteria**:
- [ ] Current capabilities documented
- [ ] Type definitions extracted
- [ ] Workflow patterns identified
- [ ] Migration plan created

**Files**:
- plan/productmanager-conversion/analysis.md

---

## Define SudoLang Schema for ProductManager

Create comprehensive SudoLang interfaces for all productmanager entities.

**Requirements**:
- Given productmanager types, should define SudoLang interfaces
- Given relationships, should define foreign key links
- Given computed fields, should define calculation logic
- Given CRUD operations, should define functions
- Given constraints, should define validation rules
- Given priority calculation, should define impact * frequency

**SudoLang Schema**:
```sudolang
type id = String(cuid2)
type timestamp = Number(64-bit epoch)
type statusState = "backlog" | "inProgress" | "released" | "cancelled"

Persona {
  id: id(primary key)
  name: String(required)
  description: String
  createdAt: timestamp
  updatedAt: timestamp
  metadata: Object
}

PainPoint {
  id: id(primary key)
  name: String(required)
  description: String
  impact: Number(1..10, required)
  frequency: Number(1..10, required)
  createdAt: timestamp
  updatedAt: timestamp
  metadata: Object
}

Journey {
  id: id(primary key)
  name: String(required)
  description: String
  personaIds: id[](foreign key -> Persona)
  createdAt: timestamp
  updatedAt: timestamp
  metadata: Object
}

Step {
  id: id(primary key)
  journeyId: id(foreign key -> Journey, required)
  name: String(required)
  description: String
  orderIndex: Number(required)
  createdAt: timestamp
  updatedAt: timestamp
  metadata: Object
}

Story {
  id: id(primary key)
  stepId: id(foreign key -> Step, nullable)
  painPointId: id(foreign key -> PainPoint, nullable)
  name: String(required)
  description: String  // "As a X, I want Y, so that Z"
  priority: Number(computed: painPoint.impact * painPoint.frequency)
  status: statusState
  createdAt: timestamp
  updatedAt: timestamp
  metadata: Object  // mockups, etc.
}

FunctionalRequirement {
  id: id(primary key)
  storyId: id(foreign key -> Story, required)
  description: String(required)  // "Given X, should Y"
  orderIndex: Number(required)
  createdAt: timestamp
  metadata: Object
}

// CRUD Functions
createPersona({ name, description, metadata }): Persona
updatePersona(id, updates): Persona
deletePersona(id): Boolean
getPersona(id): Persona
listPersonas(filters?): Persona[]

createPainPoint({ name, description, impact, frequency, metadata }): PainPoint
updatePainPoint(id, updates): PainPoint
getPainPoint(id): PainPoint
listPainPoints(filters?): PainPoint[]

createJourney({ name, description, personaIds, metadata }): Journey
updateJourney(id, updates): Journey
deleteJourney(id): Boolean
getJourney(id): Journey
listJourneys(personaId?): Journey[]

createStep({ journeyId, name, description, orderIndex, metadata }): Step
updateStep(id, updates): Step
deleteStep(id): Boolean
getStep(id): Step
listSteps(journeyId): Step[]

createStory({ name, description, painPointId, stepId, status, metadata }): Story
updateStory(id, updates): Story
deleteStory(id): Boolean
getStory(id): Story
listStories(filters?): Story[]
getHighPriorityStories(threshold, personaId?): Story[]

createRequirement({ storyId, description, orderIndex, metadata }): FunctionalRequirement
updateRequirement(id, updates): FunctionalRequirement
deleteRequirement(id): Boolean
listRequirements(storyId): FunctionalRequirement[]

// Complex Queries
getStoryMapSummary(): Object
findIncompleteJourneys(): Journey[]
getStoriesByPersona(personaId): Story[]
generatePRD(storyId): FeaturePRD
```

**Success Criteria**:
- [ ] All productmanager types covered
- [ ] Relationships defined correctly
- [ ] Functions match current workflows
- [ ] Ready for Jiron generation

**Files**:
- ai/schemas/productmanager.sudo

---

## Generate Jiron API from ProductManager Schema

Use Jiron DB API skill to create productmanager API endpoints.

**Requirements**:
- Given SudoLang schema, should generate Jiron endpoints
- Given all entities, should create CRUD routes
- Given relationships, should create nested resource routes
- Given complex queries, should create custom endpoints
- Given forms, should include validation
- Given hypermedia links, should enable navigation

**Generated Endpoints**:
```
GET  /api/personas              - List personas
POST /api/personas              - Create persona
GET  /api/personas/:id          - Get persona
PUT  /api/personas/:id          - Update persona
DELETE /api/personas/:id        - Delete persona

GET  /api/journeys              - List journeys
POST /api/journeys              - Create journey
GET  /api/journeys/:id          - Get journey
PUT  /api/journeys/:id          - Update journey
DELETE /api/journeys/:id        - Delete journey
GET  /api/journeys/:id/steps    - Steps in journey

GET  /api/stories               - List stories
POST /api/stories               - Create story
GET  /api/stories/:id           - Get story
PUT  /api/stories/:id           - Update story
DELETE /api/stories/:id         - Delete story
GET  /api/stories/high-priority - High priority stories

GET  /api/story-maps/summary    - Summary statistics
GET  /api/story-maps/incomplete - Incomplete journeys
POST /api/story-maps/prd        - Generate PRD from story
```

**Success Criteria**:
- [ ] All CRUD endpoints generated
- [ ] Nested routes functional
- [ ] Complex query endpoints included
- [ ] Jiron format valid

**Files**:
- src/api/productmanager/ (generated)

---

## Import Existing YAML Data

Migrate existing story map YAML to SQLite database.

**Requirements**:
- Given plan/story-map/*.yaml files, should parse all data
- Given YAML structure, should map to database schema
- Given existing IDs, should preserve them
- Given relationships, should link correctly
- Given migration errors, should report clearly
- Given duplicate data, should handle gracefully
- Given validation, should ensure data integrity

**Success Criteria**:
- [ ] All existing YAML imported
- [ ] Relationships preserved
- [ ] IDs maintained
- [ ] Data validated
- [ ] No data loss

**Files**:
- ai/skills/productmanager/tools/import-yaml.js
- ai/skills/productmanager/tools/import-yaml.test.js

---

## Build YAML Export Tool

Create tool to export database to YAML for human review.

**Requirements**:
- Given database export, should generate YAML files
- Given file structure, should match original plan/story-map/ layout
- Given formatting, should be human-readable
- Given relationships, should use IDs consistently
- Given export path, should write to specified directory
- Given existing files, should prompt before overwriting

**Success Criteria**:
- [ ] Export generates valid YAML
- [ ] Structure matches original
- [ ] Human-readable output
- [ ] Relationships clear

**Files**:
- ai/skills/productmanager/tools/export-yaml.js
- ai/skills/productmanager/tools/export-yaml.test.js

---

## Create ProductManager Skill

Write comprehensive skill specification for AI agents.

**Requirements**:
- Given SKILL.md format, should follow Agent Skills spec
- Given skill description, should explain product management workflows
- Given usage instructions, should document all operations
- Given database backing, should explain SQLite as source of truth
- Given YAML export, should document optional export
- Given API endpoints, should reference Jiron API
- Given examples, should show common workflows
- Given constraints, should document validation rules
- Given existing productmanager.mdc, should preserve key concepts

**Skill Structure**:
```
ai/skills/productmanager/
├── SKILL.md
└── tools/
    ├── import-yaml.js
    ├── export-yaml.js
    └── *.test.js
```

**Success Criteria**:
- [ ] SKILL.md complete and clear
- [ ] All workflows documented
- [ ] Examples demonstrate usage
- [ ] Constraints explained
- [ ] Ready for agent use

**Files**:
- ai/skills/productmanager/SKILL.md

---

## Validate Against Original ProductManager

Compare new skill behavior with original productmanager.mdc.

**Requirements**:
- Given original workflows, should support equivalent operations
- Given original type definitions, should match database schema
- Given original constraints, should enforce same rules
- Given original outputs, should produce compatible results
- Given differences, should document improvements
- Given gaps, should address before deprecating original

**Validation Tests**:
- Create persona → Same fields, same validation
- Create journey → Same workflow, better queries
- Create story → Same structure, computed priority
- Generate PRD → Same output format

**Success Criteria**:
- [ ] All original workflows supported
- [ ] Type definitions compatible
- [ ] Constraints equivalent or better
- [ ] No regressions
- [ ] Improvements documented

---

## Build Integration Tests

Test full productmanager workflow with database and API.

**Requirements**:
- Given API server, should support all CRUD operations
- Given relationships, should maintain foreign key integrity
- Given priority calculation, should compute correctly
- Given story map queries, should return accurate results
- Given concurrent operations, should handle safely
- Given validation, should reject invalid data

**Success Criteria**:
- [ ] All CRUD operations tested
- [ ] Relationships validated
- [ ] Queries return correct results
- [ ] Validation works
- [ ] Performance acceptable

**Files**:
- ai/skills/productmanager/integration.test.js

---

## Document Migration Path

Create guide for users to migrate from old to new productmanager.

**Requirements**:
- Given migration guide, should explain benefits of new version
- Given steps, should provide clear migration instructions
- Given YAML data, should document import process
- Given validation, should explain how to verify migration
- Given deprecation timeline, should set expectations
- Given rollback, should explain how to revert if needed

**Success Criteria**:
- [ ] Migration guide clear
- [ ] Steps actionable
- [ ] Verification process defined
- [ ] Timeline communicated

**Files**:
- docs/productmanager-migration.md

---

## Update AGENTS.md

Add guidelines for using productmanager skill.

**Requirements**:
- Given AGENTS.md, should add productmanager skill usage
- Given workflows, should explain when to use skill
- Given database backing, should explain SQLite source of truth
- Given API access, should reference Jiron endpoints
- Given examples, should show common patterns

**Success Criteria**:
- [ ] AGENTS.md updated
- [ ] Usage guidelines clear
- [ ] Examples helpful

---

## Success Criteria (Phase 4)

- [ ] SudoLang schema complete for productmanager
- [ ] Jiron API generated and functional
- [ ] Existing YAML data imported successfully
- [ ] YAML export tool operational
- [ ] ProductManager skill complete and documented
- [ ] Validated against original productmanager.mdc
- [ ] Integration tests pass
- [ ] Migration guide published
- [ ] AGENTS.md updated
- [ ] Ready for production use
- [ ] Original productmanager.mdc can be deprecated after validation period
