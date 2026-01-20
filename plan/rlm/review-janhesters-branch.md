# Review: janhesters' Claude Code Skills Branch

**Branch**: `2026-01-20-claude-code-skills`
**Commit**: b16610b "feat(skills): add Claude Code skills integration"
**Reviewer**: Claude (analyzing for compatibility with Phase 1-5 epics)

---

## What janhesters Built

### Structure Created

**New `.claude/` directory** for Claude Code-specific integration:
```
.claude/
├── CLAUDE.md                    # Project-wide AIDD principles
├── settings.local.json          # Claude Code settings
├── commands/                    # Slash commands
│   ├── commit.md
│   ├── discover.md
│   ├── execute.md
│   ├── init.md
│   ├── log.md
│   ├── review.md
│   ├── task.md
│   └── user-test.md
└── skills/                      # Agent Skills
    ├── aidd-commit/
    ├── aidd-discover/
    ├── aidd-execute/
    ├── aidd-init/
    ├── aidd-log/
    ├── aidd-review/
    ├── aidd-task/
    └── aidd-user-test/
```

### Key Characteristics

**1. Claude Code Specific**
- Uses `.claude/` directory (Claude Code convention)
- Does NOT create `ai/skills/` directory
- Leaves `ai/rules/` and `ai/commands/` untouched
- Additive, not replacement

**2. Skills Follow Agent Skills Spec**
- Proper frontmatter (name, description, allowed-tools)
- SKILL.md format
- Reference files for progressive discovery
- Examples: aidd-discover, aidd-task, aidd-execute, etc.

**3. ProductManager → aidd-discover**
- Mirrors `ai/rules/productmanager.mdc` functionality
- Formatted as Agent Skill
- Still uses **YAML storage** in `plan/story-map/`
- No database backing
- Reference file: `.claude/skills/aidd-discover/references/types.md`

**4. Commands Mirror ai/commands**
- `/discover` → uses aidd-discover skill
- `/task` → uses aidd-task skill
- `/commit` → uses aidd-commit skill
- etc.

---

## Compatibility Analysis

### ✅ Compatible Elements

**1. Directory Structure**
- `.claude/` is separate from our planned `ai/skills/`
- No conflicts - both can coexist
- Our phases focus on `ai/skills/` for framework-agnostic skills
- His `.claude/skills/` are Claude Code-specific

**2. Conceptual Alignment**
- Both use Agent Skills specification
- Both follow SKILL.md format
- Both include reference files for context
- Both recognize need for skills over rules

**3. Workflow Preservation**
- His work preserves existing `ai/rules/productmanager.mdc`
- Our Phase 4 keeps old productmanager.mdc during transition
- Both approaches maintain backward compatibility

### ⚠️ Incompatible Elements

**1. Storage Strategy - MAJOR DIFFERENCE**
```
janhesters approach:
  YAML in plan/story-map/ = source of truth
  No database
  Skills read/write YAML directly

Our Phase 1-4 approach:
  SQLite .aidd/index.db = source of truth (committed to git)
  YAML export on demand
  Skills use database + Jiron APIs
```

**Impact**: These are fundamentally different architectures
- Can coexist but serve different purposes
- His: Simple YAML-based workflow
- Ours: Rich querying, relationships, Jiron APIs

**2. API Layer**
```
janhesters approach:
  No API layer
  Direct file manipulation
  Skills interact with YAML

Our Phase 2-3 approach:
  Jiron APIs expose data
  SQLite backend
  Self-documenting, progressive discovery
  Agent Skills consume APIs
```

**Impact**: His skills are simpler but less queryable
- Our approach enables fan-out search, complex queries
- His approach is lighter weight, faster to ship

**3. Skill Scope**
```
janhesters approach:
  aidd-discover = productmanager functionality
  Focused on YAML workflows
  No recursive exploration

Our Phase 4-5 approach:
  productmanager skill = database-backed story maps
  RLM skill = recursive codebase exploration
  Uses Jiron APIs for rich queries
```

**Impact**: Different problem spaces
- His: Replicate existing YAML workflows in Claude Code
- Ours: Enable database-backed workflows + recursive exploration

---

## Missed Opportunities (Based on Our Context)

### 1. **Database Backing for Story Maps**

**What's Missing**:
- aidd-discover still uses YAML as source of truth
- No SQLite integration
- No rich querying capabilities
- Can't do: "Show all high-priority stories for persona X"

**Our Approach Advantage**:
- SQLite enables complex queries across personas, journeys, stories
- Foreign keys ensure data integrity
- Aggregations (AVG priority, COUNT stories by status)
- Better for large story maps

**Why It Matters**:
- YAML works for small projects
- Doesn't scale to complex products with 100+ stories
- Can't power dashboard or analytics

### 2. **Jiron API Layer**

**What's Missing**:
- No self-documenting API for story map data
- No progressive discovery
- Skills can't query data, only read/write YAML files
- No fan-out search across story maps

**Our Approach Advantage**:
- Jiron APIs enable AI agents to discover capabilities
- Hypermedia links guide navigation
- Can query: "Find stories related to authentication"
- Token-efficient for AI consumption

**Why It Matters**:
- Agents can explore story maps programmatically
- Enables integration with other tools
- Foundation for richer agent capabilities

### 3. **Fan-out Search Integration**

**What's Missing**:
- No integration with frontmatter indexing
- No way to search across codebase + story maps
- Can't answer: "What code implements this user story?"

**Our Approach Advantage**:
- Phase 3 frontmatter API connects code to requirements
- Can trace: story → code files → dependencies
- RLM skill uses fan-out to explore relationships

**Why It Matters**:
- Bridges gap between product artifacts and code
- Enables impact analysis
- Better for understanding system holistically

### 4. **Recursive Exploration (RLM)**

**What's Missing**:
- No skill for deep codebase exploration
- No recursive decomposition strategy
- Limited to simple YAML read/write operations

**Our Approach Advantage**:
- Phase 5 RLM skill handles complex queries
- Recursively explores beyond context limits
- Uses all previous phases (SQLite + Jiron + fan-out)

**Why It Matters**:
- Essential for large codebases (>100 files)
- Enables architectural understanding
- Core differentiator for aidd framework

### 5. **Skill Reusability**

**What's Missing**:
- Skills are Claude Code-specific (.claude/ directory)
- Not usable by Cursor, VS Code Copilot, or other Agent Skills tools
- Tied to YAML storage format

**Our Approach Advantage**:
- ai/skills/ is framework-agnostic
- Agent Skills spec works across tools
- Database backing enables any client

**Why It Matters**:
- Skills should work in any compatible tool
- AIDD framework should be tool-agnostic
- Maximizes skill investment ROI

---

## Recommendations

### Short Term: Both Approaches Complement Each Other

**Keep janhesters' work for:**
- Quick Claude Code integration (already done!)
- YAML-based workflows (simple projects)
- Users who want lightweight setup

**Proceed with our Phase 1-5 for:**
- Database-backed productmanager (Phase 4)
- Jiron API layer (Phase 2-3)
- RLM recursive exploration (Phase 5)
- Complex querying and analytics

**They serve different needs**:
```
.claude/skills/         → Claude Code users, YAML workflows
ai/skills/              → Framework-agnostic, database workflows
```

### Medium Term: Convergence Opportunities

**Option 1: Enhance .claude/skills with Database**
- Update aidd-discover to optionally use SQLite
- Keep YAML as export format
- Add Jiron API consumption to Claude Code skills

**Option 2: Create ai/skills and Reference from .claude**
- Build ai/skills/ as planned (framework-agnostic)
- Have .claude/skills/ reference ai/skills/ for shared logic
- .claude/ becomes thin wrapper

**Option 3: Parallel Evolution**
- Let both approaches mature independently
- .claude/ stays simple and YAML-based
- ai/ becomes advanced database + API layer
- Users choose based on needs

### Long Term: Unified Architecture

**Ideal State**:
```
ai/skills/productmanager/          # Database-backed, Jiron API
  ├── SKILL.md                     # Framework-agnostic skill
  ├── tools/
  │   ├── db-adapter.js            # SQLite interface
  │   ├── export-yaml.js           # Optional YAML export
  │   └── import-yaml.js           # Migrate from YAML

.claude/skills/aidd-discover/      # Claude Code wrapper
  └── SKILL.md                     # References ai/skills/productmanager
                                   # Adds Claude Code-specific guidance
```

**Benefits**:
- Single implementation (ai/skills)
- Claude Code gets enhancements automatically
- YAML export for those who need it
- Database power for those who want it

---

## Action Items

### 1. **Proceed with Phase 1-5 as Planned** ✅
No blocking conflicts with janhesters' work
- Build ai/skills/ directory structure
- Implement database layer
- Create Jiron APIs
- RLM skill on top

### 2. **Document Relationship**
Add to Phase 4 epic:
- Note: .claude/skills/aidd-discover exists for Claude Code
- Our ai/skills/productmanager is framework-agnostic
- Both can coexist serving different audiences

### 3. **Consider Migration Path**
In Phase 4, provide tool to:
- Import from YAML (janhesters' format + legacy)
- Export to YAML (for .claude/skills compatibility)
- Allow users to transition gradually

### 4. **Collaboration Opportunity**
Suggest to janhesters:
- ai/skills/ could power .claude/skills/ under the hood
- .claude/ becomes presentation layer
- Shared database backend
- But defer this conversation until Phase 4 complete

---

## Conclusion

### No Breaking Conflicts ✅
- janhesters worked in `.claude/` directory
- We're working in `ai/` directory
- Both can coexist peacefully

### Different Problem Spaces
- **His**: Claude Code integration with YAML workflows (done!)
- **Ours**: Database + Jiron + RLM for advanced capabilities (in progress)

### Missed Opportunities (Worth Building)
1. ✅ Database backing for rich queries
2. ✅ Jiron API layer for self-documentation
3. ✅ Fan-out search integration
4. ✅ RLM recursive exploration
5. ✅ Framework-agnostic skills (ai/skills)

### Recommendation: **Proceed with All 5 Phases**

janhesters' work validates the Agent Skills approach and proves demand for productmanager as a skill. Our phases build the database + API foundation that both .claude/ and ai/ can eventually share.

**No changes needed to our epics.** Proceed with implementation starting Phase 1.
