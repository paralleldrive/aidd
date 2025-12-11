# Jiron Support - Questions

## Open Questions

### Q1: Should Jiron output pure HTML or HTML-in-JSON?

**Inferred Answer**: Pure HTML using Jade/Pug templating. Per the Jiron spec, it combines "Siren + Jade = HTML output" - the output is valid HTML that browsers render directly while remaining machine-parseable through semantic class attributes (`.property`, `.entity`, `.action`).

### Q2: How should the client discover entity relationships in Jiron responses?

**Inferred Answer**: Through Siren's `rel` attributes on links and sub-entities. The Siren spec requires embedded link sub-entities to have `rel` (relationship to parent) and `href`. Embedded representations also require `rel`. Links use RFC 5988 relation types.

### Q3: What distinguishes "sidelining" from "embedding" for entity references?

**Inferred Answer**: Sidelining = link reference (embedded link sub-entity with just `rel` and `href`); Embedding = full inline representation (embedded representation with all properties). Sidelining reduces payload size and enables lazy loading. The prompt suggests using HTML-style URIs for entity IDs to support this pattern.

### Q4: What file format should .jiron files use?

**Inferred Answer**: HTML with Jiron's semantic class structure. Though served with a custom extension, content is HTML that browsers can render. Suggest MIME type `application/jiron` or `text/html; profile=jiron` for agent detection.

### Q5: Should JironClient components be framework-agnostic?

**Inferred Answer**: Yes, use native Web Components (Custom Elements). This aligns with "dynamically build web components" in the spec - no framework dependency, works in any environment, progressive enhancement friendly.

### Q6: How should agents discover the .jiron alternative?

**Inferred Answer**: Two mechanisms: (1) `<link rel="alternate" type="application/jiron" href="page.jiron">` in HTML head, and (2) HTML comment near document start instructing agents to fetch the .jiron variant for token efficiency.

### Q7: What HTTP methods should Jiron actions support?

**Inferred Answer**: All REST methods: GET, POST, PUT, DELETE, PATCH. Both Siren and Jiron specs explicitly list these. HTML forms only support GET/POST natively, but Jiron's programmatic consumption enables full method support.

### Q8: Should the server rules generate actual implementation code or just API specifications?

**Inferred Answer**: Both, progressively. The rule should guide agents to first design the API structure (entities, actions, links), then generate implementation code following TDD. Consistent with existing aidd patterns like form-csrf.md.

---

## Panel Answers

### Top Insight #1: Embrace HTML as the Universal Format

Jiron's key innovation is recognizing HTML as the hypermedia format that already works everywhere. Rather than inventing new parsers, Jiron uses semantic CSS classes to make HTML machine-readable. The aidd implementation should fully embrace this - .jiron files are HTML, agents parse them with standard DOM APIs, and browsers render them without special handling. This dramatically simplifies implementation.

### Top Insight #2: Sidelining is the Token Efficiency Win

The real token savings for AI agents comes from sidelining vs embedding. When an agent fetches an order, they get the order properties plus *links* to customer and items, not the full embedded objects. Agents traverse links only when needed. The implementation must make sidelining the default pattern and provide clear affordances for link traversal.

---

## Unresolved

### U1: Jade/Pug dependency or alternative?

The Jiron spec references Jade syntax, but Jade is now Pug and may add unwanted dependencies. Need to decide: use Pug, use an alternative templating approach, or generate HTML directly. Requires implementation-time decision based on aidd's existing tooling preferences.

### U2: Authentication/Authorization handling in Jiron views?

How should .jiron endpoints handle auth? Should they mirror the HTML endpoint's auth requirements exactly, or have separate considerations for agent access? May need OAuth/API key patterns for agent consumption.

### U3: Caching strategy for dual-render views?

Should .html and .jiron variants share cache keys? Different TTLs? Need to consider CDN behavior and agent polling patterns.
