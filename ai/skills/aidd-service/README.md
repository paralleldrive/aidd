# aidd-service — Data Service Authoring Reference

`/aidd-service` enforces best practices for asynchronous data services, covering
the front-end / back-end split, service interfaces, folder structure, and
unidirectional data flow.

## Front-end vs back-end services

| Type | Returns | Called by |
| --- | --- | --- |
| **Front-end** | `Observe<Data>`, void actions, sub-Services | UI components |
| **Back-end** | `Promise<Data>`, `AsyncGenerator<Data>` | Front-end services only |

UI components follow a unidirectional path: **data down** via `Observe`, **actions
up** as void calls.

## Front-end service interface

A front-end service interface may contain:

- `Observe<Data>` — observable properties or factories
- Sub-Services — nested service interfaces
- Action functions — zero or more Data arguments, **return void only**
- Factory functions — create observables or sub-Services

Validate with `Assert<AsyncDataService.IsValid<ServiceInterface>>`.

## Folder structure

```
services/<name>-service/
  <name>-service.ts              # Interface: types only, no implementation
  <function-name>.ts             # One file per function
  <impl>-<name>-service.ts       # Implementation factory
  public.ts                      # Re-exports create and helpers
```

- Each function lives in its own file — not a single `-service-functions.ts`
- Interface file: types and optional JSON schemas only
- Implementation: factory function or static plain object — **no classes**
- Namespace: `export * as ServiceName from './public.js'`

## Benefits

- **Unidirectional flow** — data down via actions, data up via Observe
- **Async isolation** — view and service decoupled
- **Inspectability** — action/observable data is serializable
- **Portability** — implementation swappable across process boundaries
- **Lazy loading** — `AsyncDataService.createLazy` for deferred initialization

## When to use `/aidd-service`

- Creating front-end or back-end data services
- Defining service interfaces or implementations
- Working with Observe patterns in the service layer
