# Jiron Support Epic

**Status**: 📋 PLANNED
**Goal**: Add Jiron hypermedia support for token-efficient AI agent interactions

## Overview

AI agents waste significant tokens parsing verbose HTML when they only need structural data. Jiron solves this by providing a hypermedia format that combines Siren semantics with HTML output - machine-parseable through semantic CSS classes while remaining browser-renderable. This epic adds rules and commands enabling agents to build Jiron APIs from requirements and generate client components that consume them, plus a dual-render pattern serving optimized .jiron views alongside standard HTML.

Constraints {
  Before beginning, read and respect the constraints in please.mdc.
  Remember to use the TDD process when implementing code.
  Follow existing ai/rules and ai/commands patterns.
  Requirements use "Given X, should Y" format.
}

---

## Jiron Server Rule

Create `ai/rules/jiron-server.mdc` to guide agents in designing Jiron-compliant APIs.

**Requirements**:
- Given functional requirements in Given/should format, should produce a Jiron API design with entities, properties, actions, and links
- Given an entity design, should specify semantic CSS classes for machine parsing (`.entity`, `.property`, `.action`, `.link`)
- Given related resources, should default to sidelining (link references) over embedding for token efficiency
- Given an action requirement, should specify HTTP method, href, and required fields
- Given a collection, should include pagination links (prev, next, self)

---

## Jiron API Command

Create `ai/commands/jiron-api.md` to generate Jiron endpoint implementations.

**Requirements**:
- Given a Jiron API design, should generate Express route handlers following existing middleware patterns
- Given entity properties, should render HTML with semantic class structure
- Given actions, should generate form elements with method and href attributes
- Given links, should render anchor elements with rel and href attributes
- Given implementation, should follow TDD with tests written first

---

## Jiron Client Rule

Create `ai/rules/jiron-client.mdc` to guide agents in building Jiron-consuming components.

**Requirements**:
- Given a Jiron endpoint URL, should design composable Web Components (`<jiron-entity>`, `<jiron-link>`, `<jiron-action>`)
- Given Siren entity semantics, should map class, properties, entities, links, and actions to component structure
- Given sub-entities, should distinguish embedded links (href-only) from embedded representations (full data)
- Given actions with fields, should generate form UI with proper input types
- Given link traversal, should handle navigation between related entities

---

## Jiron Component Command

Create `ai/commands/jiron-component.md` to generate Web Components from Jiron endpoints.

**Requirements**:
- Given a Jiron endpoint, should generate native Web Components (Custom Elements) with no framework dependency
- Given entity properties, should render property values with semantic markup
- Given embedded link sub-entities, should render as traversable links
- Given actions, should render as forms supporting GET, POST, PUT, DELETE, PATCH methods
- Given component generation, should follow TDD with tests written first

---

## Dual Render Rule

Create `ai/rules/dual-render.mdc` for SEO-friendly HTML with agent-optimized .jiron variants.

**Requirements**:
- Given a page route, should serve HTML to browsers and .jiron to agents requesting the alternate path
- Given HTML output, should include `<link rel="alternate" type="application/jiron" href="page.jiron">` for discovery
- Given HTML output, should include HTML comment near document start instructing agents to fetch .jiron variant
- Given .jiron output, should use sidelining for related resources to minimize token consumption
- Given both outputs, should represent the same semantic content with format-appropriate structure

---

## Dual View Command

Create `ai/commands/dual-view.md` to generate dual-render route handlers.

**Requirements**:
- Given a page design, should generate route handler serving HTML by default
- Given .jiron extension request, should serve token-optimized Jiron format
- Given content negotiation, should respect Accept headers for format selection
- Given implementation, should follow TDD with tests written first

---

## Supporting Files

- `jiron-support-epic-original-prompt.sudo` - Original task prompt as received
- `jiron-support-epic-enhanced-prompt.sudo` - Improved prompt with SudoLang structure
- `jiron-support-epic-questions.md` - Open questions with inferred answers
- `jiron-support-epic-roundtable.md` - Expert panel analysis and recommendations
