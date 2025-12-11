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

**Viewpoint**: The token efficiency argument is the real win here. Current agent patterns waste 80%+ of tokens on boilerplate HTML. A well-structured .jiron view could reduce a typical page from 50k tokens to 2k. But the discovery mechanism is critical - agents need reliable, fast ways to find the .jiron endpoint. I'd prioritize the HTML comment approach over rel="alternate" because agents often don't parse full HTML headers.

**Critique of others**: Marcus's component architecture is good for browsers, but remember agents won't use those components. They'll parse the HTML directly. The semantic structure must be self-evident without relying on component behavior.

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
- Token efficiency: structure .jiron for minimal parsing overhead

### Round 10: Final Selection

**Top Insight #1**: HTML is already the universal hypermedia format - Jiron's innovation is making it machine-readable through semantic classes while remaining browser-renderable. Don't fight HTML, embrace it. The .jiron files should be valid HTML that works in browsers AND is easy for agents to parse.

**Top Insight #2**: Sidelining (link references) vs embedding (inline data) is where token efficiency lives. Default to sidelining; let agents traverse links on-demand. This single pattern could reduce agent token consumption by an order of magnitude on complex pages.

---

## Panel Recommendations

### Recommendation 1: HTML as Universal Format
Jiron's key innovation is recognizing HTML as the hypermedia format that already works everywhere. Rather than inventing new parsers, Jiron uses semantic CSS classes to make HTML machine-readable. The aidd implementation should fully embrace this - .jiron files are HTML, agents parse them with standard DOM APIs, and browsers render them without special handling. This dramatically simplifies implementation.

*Consensus: Helena, Marcus, Aisha, David - unanimous*

### Recommendation 2: Sidelining as Default Pattern
The real token savings for AI agents comes from sidelining vs embedding. When an agent fetches an order, they get the order properties plus *links* to customer and items, not the full embedded objects. Agents traverse links only when needed. The implementation must make sidelining the default pattern and provide clear affordances for link traversal.

*Consensus: Aisha (primary), David (strong support), Helena, Marcus - unanimous*

---

*Note: These recommendations appear in `jiron-support-epic-questions.md` under "Panel Answers"*
