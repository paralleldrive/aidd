---
name: service
description: Enforces asynchronous data service authoring best practices. Use when creating front-end or back-end services, service interfaces, Observe patterns, AsyncDataService, or when the user asks about service layer, data flow, unidirectional UI, or action/observable design.
---

# Service authoring

Asynchronous data services. Live in the `services/` layer per [structure](../structure/SKILL.md). Adhere to [namespace](../namespace/SKILL.md) for type and function organization.

**Data** = readonly JSON values or Blobs.

---

## Front-end vs back-end services

**Front-end services** — called directly from UI components. Support unidirectional control flow.

| Allowed | Not allowed |
|---------|-------------|
| `Observe<Data>` | Promise or AsyncGenerator return |
| Other services (sub-Services) | |
| Void-returning action functions | |

**Back-end services** — usually stateless. Functions typically return `Promise<Data>` or `AsyncGenerator<Data>`. Not called directly from UI; front-end services call them.

This separation keeps UI components on a strict unidirectional path: data down via void actions, data up via Observe.

---

## Front-end service constraints

`Service` interfaces for UI consumption may only contain:
- **`Observe<Data>`** — observable properties or factories.
- **Sub-Service**s — nested service interfaces
- **Action functions** — zero or more `Data` arguments, return `void` only
- **Factory functions** — create observables or sub-Services

**Observables** may only observe `Data` or `Service` interfaces.

Compile-time check: `Assert<AsyncDataService.IsValid<ServiceInterface>>`.

## Benefits

- **Unidirectional flow** — data down via actions, data up via Observe
- **Async isolation** — view and service decoupled
- **Inspectability** — action/observable data serializable
- **Portability** — implementation swappable across process boundaries
- **Lazy Loading** - can use AsyncDataService.createLazy to wrap with lazy load on first actual usage.

---

## Folder structure

| Path | Purpose |
|------|---------|
| `services/<name>-service/<name>-service.ts` | Service interface only |
| `services/<name>-service/<function-name>.ts` | One file per function; re-export from public |
| `services/<name>-service/<implementation>-<name>-service.ts` | Implementation factory |
| `services/<name>-service/<implementation>-<name>-service/` | Implementation folder if multi-file |

Per [namespace](../namespace/SKILL.md), each function lives in its own file — not a single `-service-functions.ts`.

**Interface file** — types and optionally JSON schemas only. No implementation-specific code. Follow [namespace](../namespace/SKILL.md) for type re-exporting (single import surface for consumers).

**Implementation** — factory function or static plain object. Export only that. **No classes** — brittle `this` bindings, violate pure functional design, block recomposing higher-order services from functions.

**Namespace** — `export * as ServiceName from './public.js'`; public.ts re-exports create and helpers. Or `export * as ServiceName from './functions/index.js'` when using a functions module. Per [namespace](../namespace/SKILL.md).

---

## Execute

When creating or modifying a service:
1. Place in `services/<name>-service/` per [structure](../structure/SKILL.md).
2. Interface in `<name>-service.ts` — types only, extend `Service`, add `Assert<AsyncDataService.IsValid<>>`. Re-export types per [namespace](../namespace/SKILL.md).
3. Export `export * as ServiceName from './public.js'` (or from `./functions/index.js` if using functions namespace).
4. In public.ts, re-export create and all public helpers.
5. Implementation in `<implementation>-<name>-service.ts` or folder — factory or static instance only.
6. For front-end services (UI-called): actions return void only; observables observe Data or Service only. For back-end services: functions return Promise<Data> or AsyncGenerator<Data>.

## Additional resources

- [observe](../observe/SKILL.md) — Observe pattern and helper functions
