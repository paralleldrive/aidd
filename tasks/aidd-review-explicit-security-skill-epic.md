# AIDD Review Explicit Security Skill Epic

**Status**: 📋 PLANNED
**Goal**: Mandatory checklist skill for `/aidd-review` so structural auth/secret failures surface on first pass—not only via OWASP Top 10.

## Overview

OWASP is too coarse for **policy** bugs (auth off by default, transport mismatch, secrets in URLs, implicit automation targets). This epic adds **`aidd-security-review`** (non-optional checklist + **PASS / FAIL / N/A+rationale** per item), wires it into **`aidd-review`**, and defines how **first-party**, **CI**, and **third-party** fit **least privilege** and **layered** controls: **scoped exceptions** only, with rotation, isolation, and docs—never weak defaults by default.

## Principles (copy into the new skill verbatim)

- **Least knowledge** — verify with **public** material where feasible; minimize what each component holds about peers’ secrets.
- **Least privilege** — minimum access, duration, scope per human, service, integration, CI job; broader access must be **time-bounded**, **revocable**, **documented**.
- **Security in layers** — TLS, network zone, localhost **do not** replace control-plane **authn/authz**; WebSocket, SSE, gRPC, IPC match HTTP for the **same** resource class unless **classified and justified**.
- **Prefer the safer option** — if a pattern is only *sometimes* safe and a better one exists (passkeys vs passwords, asymmetric vs duplicated symmetric keys, explicit vs implicit automation binding), **FAIL** the weaker choice unless the **epic/task** records an approved exception.

---

## Author the explicit security review skill

Add `.cursor/skills/aidd-security-review/SKILL.md` (mirror to `ai/skills/` if repo requires). Lead with the **Principles** block above, then a **checklist** for every security-relevant review. Run it **with** OWASP (not instead). Each checklist item: **PASS / FAIL / N/A + rationale** in the review artifact.

**Requirements**:

- Given **human** auth, should **FAIL** password-based login for new design; allow only with **task-documented** legacy exception; prefer **WebAuthn/passkeys** or **federated IdP**.
- Given **first-party** service-to-service auth, should require **asymmetric** or workload-bound trust (mTLS, OIDC exchange, per-service signing; verifier keeps **public** keys only); should **FAIL** long-lived symmetric keys **reused** across two services unless **N/A** (third-party-only constraint) with rationale.
- Given **CI** calling our APIs, should prescribe **OIDC / workload identity**, **short-lived** cloud tokens, **ephemeral** mTLS or **signed** requests; should **WARN or FAIL** **static repo secrets** and require a **migration** note, not silence.
- Given **third-party** webhooks or vendor APIs limited to **HMAC/bearer**, should allow **documented**, **boundary-scoped** exception with **per-integration** secret, **rotation**, **no cross-service reuse**.
- Given **HTTP**, should **FAIL** **unauthenticated** **writes** to **persisted** server state (config, spawn, schedule, skills, webhooks, etc.).
- Given **HTTP reads**, should **FAIL** **unauthenticated** access to **PII** or **persisted operational** data (sessions, agents, integrations, audit, logs, uploads) unless labeled **public metadata** with **justification**.
- Given **any channel** (WS, SSE, gRPC, IPC, browser, CLI, bus, webhook ingress), should **FAIL** **weaker** or **missing** auth vs HTTP for the same capability, or **bypass** of primary authZ (e.g. **`?token=`** bearer, unsigned callback, **IP-only** trust).
- Given **logs/metrics/traces/errors**, should **FAIL** credential emission (headers, cookies, `Authorization`, sensitive query); checklist must name **query keys to redact** when URIs are logged.
- Given **defaults / first boot**, should **FAIL** **fail-open** control plane (empty credential = full API, prod **dev** auth disable, **implicit** automation target).
- Given **compare / token shape**, should point to **`aidd-timing-safe-compare`** and **`aidd-jwt-security`**; should **FAIL** treating **ConstantTimeEq** alone as fixing **low-entropy** secrets.

---

## Integrate into `aidd-review`

Patch **Criteria** + **ReviewProcess** in `.cursor/skills/aidd-review/SKILL.md` and `ai/skills/aidd-review/SKILL.md`: **always** run **`aidd-security-review`** before calling the security pass done; state **OWASP is necessary but not sufficient** for merge-ready security review. Keep **pointers** to **`aidd-timing-safe-compare`** and **`aidd-jwt-security`** (no full duplicate of those skills).

**Requirements**:

- Given code touching **auth, listeners, persistence, or secrets**, should **not** mark security complete until **`aidd-security-review`** checklist is executed.

---

## References (bad vs good)

Under the new skill’s `references/` (or shared `aidd-review/references/`), add **one** insecure/secure pair per **checklist** row (empty default auth, WS≠HTTP auth, query `token`, webhook default agent, session token in JSON **and** cookie, `localStorage` API secret).

**Requirements**:

- Given the skill alone, should support **mechanical** first pass without prose improvisation.

---

## Cross-link entry points

Update `AGENTS.md`, `aidd-custom/AGENTS.md` (if used), and orchestrator/review listings so **`aidd-security-review`** is **mandatory** with **`aidd-review`** for security-sensitive work.

**Requirements**:

- Given `AGENTS.md`, should name **`aidd-security-review`** as required for `/review` when changes are security-sensitive.
