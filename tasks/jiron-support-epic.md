# Jiron Support Epic

**Status**: 📋 PLANNED
**Goal**: Enable self-describing APIs that agents browse with one generic capability - replacing explicit tool definitions

## Overview

Current agent patterns require predefined tool manifests (MCP) for every API interaction. Jiron inverts this: APIs describe themselves through hypermedia, embedding available actions and navigation in every response. Agents need ONE capability - fetch and parse Jiron - to interact with ANY Jiron-enabled API. No per-API tool definitions, no upfront schemas, no MCP server implementations. The API itself tells agents what's possible. This epic adds rules and commands for building self-describing Jiron APIs, client components that consume them, and dual-render patterns serving token-optimized views alongside standard HTML.

Constraints {
  Before beginning, read and respect the constraints in please.mdc.
  Remember to use the TDD process when implementing code.
  Follow existing ai/rules and ai/commands patterns.
  Requirements use "Given X, should Y" format.
  Use AIDD server framework (createRoute + asyncPipe), NOT Express.
  Streaming MUST use Web Streams API (ReadableStream) for portability.
}

---

## Jiron Server Rule

Create `ai/rules/jiron-server.mdc` to guide agents in designing Jiron-compliant APIs.

**Requirements**:
- Given functional requirements in Given/should format, should produce a Jiron API design with entities, properties, actions, and links
- Given a root endpoint (`/`), should expose all entry points for agent discovery - no separate manifest needed
- Given any response, should embed all available actions for current state (self-describing, not predefined)
- Given a state transition (action execution), should return updated resource with new available actions
- Given an entity design, should specify semantic CSS classes for machine parsing (`.entity`, `.property`, `.action`, `.link`)
- Given related resources, should default to sidelining (link references) over embedding for token efficiency
- Given an action requirement, should specify HTTP method, href, and required fields
- Given a collection, should include pagination links (prev, next, self)

---

## Jiron API Command

Create `ai/commands/jiron-api.md` to generate Jiron endpoint implementations.

**Requirements**:
- Given a Jiron API design, should generate route handlers using AIDD's `createRoute` + `asyncPipe` composition pattern
- Given entity properties, should render HTML with semantic class structure
- Given actions, should generate form elements with method and href attributes
- Given links, should render anchor elements with rel and href attributes
- Given chat/AI responses, should stream using Web Streams API (ReadableStream) for immediate partial results
- Given streaming response, should use standard TransformStream/TextEncoderStream for portability across Node.js, Deno, and edge runtimes
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
- Given a page design, should generate route handler using AIDD's `createRoute` pattern serving HTML by default
- Given .jiron extension request, should serve token-optimized Jiron format
- Given content negotiation, should respect Accept headers for format selection
- Given AI-generated content, should stream Jiron fragments using ReadableStream for progressive rendering
- Given implementation, should follow TDD with tests written first

---

## Streaming Middleware

Create `src/server/middleware/with-stream.js` for portable streaming responses.

**Requirements**:
- Given a generator function, should create a ReadableStream that yields chunks as they become available
- Given streaming response, should set appropriate headers (`Content-Type`, `Transfer-Encoding: chunked`)
- Given Jiron streaming, should support `text/html` content type with chunked entity/action delivery
- Given error during stream, should gracefully close stream and log error with requestId
- Given middleware composition, should integrate with existing `createRoute` + `asyncPipe` pattern
- Given portability needs, should use only Web Streams API (no Node.js-specific streams) for compatibility across Vercel, Netlify, AWS Lambda, Deno Deploy
- Given implementation, should follow TDD with tests written first

---

## Agent Navigation Rule

Create `ai/rules/jiron-agent.mdc` to guide AI agents in browsing Jiron APIs.

**Requirements**:
- Given a Jiron API root URL, should fetch and parse to discover available entry points
- Given a Jiron response, should extract entities, links, and actions using semantic CSS classes
- Given navigation needs, should follow links by rel attribute rather than hardcoding URLs
- Given a task requiring state change, should find and submit the appropriate embedded action
- Given an action response, should parse the returned resource for updated state and new available actions
- Given sidelined entities (links), should fetch on-demand only when entity data is needed
- Given unknown API structure, should explore via root → links → subresources (no predefined tool knowledge required)

---

## Supporting Files

- `jiron-support-epic-original-prompt.sudo` - Original task prompt as received
- `jiron-support-epic-enhanced-prompt.sudo` - Improved prompt with SudoLang structure
- `jiron-support-epic-questions.md` - Open questions with inferred answers
- `jiron-support-epic-roundtable.md` - Expert panel analysis and recommendations
