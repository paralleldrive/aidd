# Jiron Support - Expert Panel Roundtable

## Expert Panel

### Dr. Helena Vasquez - Hypermedia Systems Architect
*20 years designing REST APIs, co-author of hypermedia patterns handbook*

**Viewpoint**: The Jiron approach is sound but the implementation must not repeat siren-resource's mistakes. That project was deprecated because it tried to do too much automatically. The aidd rules should guide agents to make explicit design decisions rather than auto-generating everything. Focus on teaching agents *how to think* about hypermedia, not just producing boilerplate.

**Critique of others**: Marcus overcomplicates the client. Web Components are the right call, but keep them thin - they should handle rendering and action submission, not complex state management. Let the server drive state through hypermedia.

---

### Marcus Chen - Web Components Specialist
*Lead architect on several major design systems, W3C community contributor*

**Viewpoint**: The client architecture needs careful thought. A single monolithic component won't work - we need a composition pattern: `<jiron-entity>`, `<jiron-link>`, `<jiron-action>`. Each handles its semantic role. The parent entity component discovers children and wires up navigation. This mirrors how Siren structures its JSON.

**Critique of others**: Helena is right about avoiding magic, but the components need *some* intelligence. At minimum: automatic link prefetching for performance, action validation before submission, and proper loading states. Pure thin wrappers won't provide good UX.

---

### Aisha Okonkwo - AI Agent Systems Engineer
*Built agent orchestration systems at two major AI labs*

**Viewpoint**: Token efficiency matters, but we're underselling the real paradigm shift. Current agent patterns (MCP) require explicit tool definitions per API - that doesn't scale. Jiron inverts this: APIs describe themselves. An agent needs ONE capability - fetch and parse Jiron - to interact with ANY Jiron API. No tool manifests, no upfront schemas, no per-API MCP implementations. This is how browsers work. You don't need a "tools.json" for amazon.com - you just browse, and each page tells you what actions are available. For AI agents interacting with web APIs, Jiron could replace MCP entirely.

**Critique of others**: Marcus's component architecture is good for browsers, but remember agents won't use those components. They'll parse the HTML directly. The semantic structure must be self-evident without relying on component behavior. Helena's right about avoiding magic, but we need to emphasize that the "one capability" model is the architectural win, not just token savings.

---

### Prof. David Thornton - Information Architecture
*Author of "Linked Data Patterns", former W3C Semantic Web lead*

**Viewpoint**: The URI-based entity ID concept deserves more emphasis. This is where Jiron can excel over plain Siren. By using HTML-style URIs (`#customer-123`, `/orders/456`), you get fragment-based linking within documents and cross-document references with the same syntax. This enables powerful composition patterns - a dashboard could sideline to multiple entity types, each resolvable.

**Critique of others**: Aisha underestimates rel="alternate". For SEO and proper web citizenship, the link header matters. Do both - HTML comment for agent fast-path, link for standards compliance.

---

## RTC Analysis (depth 10)

### Round 1-3: Establishing Core Tensions
- **Magic vs Explicit**: Panel divided on how much the system should auto-generate
- **Browser vs Agent optimization**: Different priorities lead to different designs
- **Standards compliance vs Pragmatism**: Link headers vs HTML comments

### Round 4-6: Convergence Points
- All agree HTML-as-format is correct (not JSON-in-HTML or vice versa)
- All agree sidelining is the key efficiency pattern
- Consensus: components should be composable, not monolithic
- Agreement: both discovery mechanisms (link + comment) should be implemented

### Round 7-9: Synthesis
- The implementation should produce *documentation and patterns*, not magic generators
- Client components: small, composable, semantic (`<jiron-entity>`, `<jiron-link>`, `<jiron-action>`)
- Server rules: guide agents through hypermedia design decisions, generate TDD specs
- The "one capability" model is the architectural win - agents browse rather than call predefined tools

### Round 10: Final Selection

**Top Insight #1**: One capability to rule them all. Jiron replaces explicit tool definitions (MCP) with self-describing APIs. Agents need ONE generic browse capability to interact with ANY Jiron API. No per-API tool manifests, no upfront schemas. The API itself tells agents what's possible at each state. This is how browsers work - and it scales infinitely better than predefined tool sets.

**Top Insight #2**: Sidelining (link references) vs embedding (inline data) is where token efficiency lives. Default to sidelining; let agents traverse links on-demand. Combined with self-describing actions, this makes Jiron both architecturally superior AND more token-efficient than MCP+JSON patterns.

---

## Panel Recommendations

### Recommendation 1: One Capability to Browse Any API
Jiron replaces explicit tool definitions (MCP) with self-describing APIs. Agents need ONE generic browse capability to interact with ANY Jiron API. No per-API tool manifests, no upfront schemas. The API itself tells agents what's possible at each state. This is how browsers work - and it scales infinitely better than predefined tool sets. For web API interactions, Jiron could eliminate the need for MCP entirely.

*Consensus: Aisha (primary), Helena, Marcus, David - unanimous*

### Recommendation 2: Sidelining + Self-Describing Actions
Token efficiency comes from two patterns working together: (1) sidelining - link references instead of embedded data, fetch on-demand; (2) self-describing actions - no separate tool schemas, fields embedded in action forms. Combined, these make Jiron both architecturally superior AND more token-efficient than MCP+JSON patterns.

*Consensus: Aisha, David (primary), Helena, Marcus - unanimous*

---

*Note: These recommendations appear in `jiron-support-epic-questions.md` under "Panel Answers"*
