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

### Q9: How does Jiron compare to MCP for agent API interactions?

**Inferred Answer**: They represent fundamentally different paradigms:

| MCP | Jiron |
|-----|-------|
| Tools predefined in manifests | Actions discovered in responses |
| Agent needs tool definitions per API | Agent needs ONE browse capability for all APIs |
| Server implements MCP protocol | Server serves semantic HTML |
| Schema declared upfront | Fields embedded in action forms |
| Static capabilities | Dynamic capabilities per state |

Jiron could replace MCP for web API interactions. Instead of defining 50 tools, expose one Jiron root endpoint. The agent fetches, parses, discovers what's available, executes actions, and the response tells them what's next. This is how browsers work - no manifest of "all things you can do on a website."

Key insight: MCP = explicit tool definitions. Jiron = self-describing APIs. For browsable web resources, Jiron eliminates the need for per-API tool implementations.

---

## Panel Answers

### Top Insight #1: One Capability to Browse Any API

Jiron replaces explicit tool definitions (MCP) with self-describing APIs. Agents need ONE generic browse capability to interact with ANY Jiron API. No per-API tool manifests, no upfront schemas. The API itself tells agents what's possible at each state. This is how browsers work - and it scales infinitely better than predefined tool sets. For web API interactions, Jiron could eliminate the need for MCP entirely.

### Top Insight #2: Sidelining + Self-Describing Actions

Token efficiency comes from two patterns working together: (1) sidelining - link references instead of embedded data, fetch on-demand; (2) self-describing actions - no separate tool schemas, fields embedded in action forms. Combined, these make Jiron both architecturally superior AND more token-efficient than MCP+JSON patterns.

---

## Unresolved

### U1: Jade/Pug dependency or alternative?

The Jiron spec references Jade syntax, but Jade is now Pug and may add unwanted dependencies. Need to decide: use Pug, use an alternative templating approach, or generate HTML directly. Requires implementation-time decision based on aidd's existing tooling preferences.

### U2: Authentication/Authorization handling in Jiron views?

How should .jiron endpoints handle auth? Should they mirror the HTML endpoint's auth requirements exactly, or have separate considerations for agent access? May need OAuth/API key patterns for agent consumption.

### U3: Caching strategy for dual-render views?

Should .html and .jiron variants share cache keys? Different TTLs? Need to consider CDN behavior and agent polling patterns.

---

## Resolved (from refinement)

### R1: What server framework should Jiron use?

**Answer**: AIDD's custom functional composition framework using `createRoute` + `asyncPipe`, NOT Express. Middleware signature: `({ request, response }) => Promise<{ request, response }>`. Data passed via `response.locals`.

### R2: How should streaming work without Vercel vendor lock-in?

**Answer**: Use Web Streams API exclusively (ReadableStream, TransformStream, TextEncoderStream). This is the portable standard that works across:
- Node.js 18+
- Deno
- Vercel Edge Functions
- Netlify Edge
- AWS Lambda (with response streaming)
- Cloudflare Workers

Avoid Node.js-specific streams (fs.ReadStream, etc.) which don't work in edge runtimes. Pattern: generator function → ReadableStream → chunked HTTP response.

Sources:
- [How to stream data over HTTP using NextJS](https://dev.to/bsorrentino/how-to-stream-data-over-http-using-nextjs-1kmb)
- [MDN ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
