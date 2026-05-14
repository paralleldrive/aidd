# AIDD Review Explicit Security Skill Epic

**Status**: 📋 PLANNED
**Goal**: **Require** a checklist skill on `/aidd-review` so structural auth/secret bugs show up on first pass—OWASP alone is not enough.

## Overview

OWASP misses **policy** failures—e.g. **auth off by default**, **HTTP vs WebSocket auth split**, …. This epic ships **`aidd-security-review`**: a **required** checklist; each line gets **PASS / FAIL / N/A + rationale** in the review. Wire it into **`aidd-review`**. Spell out how **first-party**, **CI**, and **third-party** map to **least privilege** and **layers**: **scoped exceptions** only—rotate, isolate, document—no silent weak defaults.

## Principles (copy into the new skill verbatim)

- **Least knowledge** — Prefer verify-with-**public** material. Hold less of peers’ secrets.
- **Least privilege** — Minimize access, duration, scope for every human, service, integration, CI job. Widen only with **time bounds**, **revocation**, **docs**.
- **Security in layers** — TLS, zone, localhost **≠** control-plane **authn/authz**. Match **WS / SSE / gRPC / IPC** to HTTP for the **same** capability unless you **classify and justify** a difference.
- **Prefer the safer option** — **FAIL** the weaker pattern when a better one fits (passkeys over passwords, asymmetric over duplicated symmetric keys, explicit binding over implicit defaults). **Epic/task** must record any approved exception.

---

## Author the explicit security review skill

Add `.cursor/skills/aidd-security-review/SKILL.md` (mirror to `ai/skills/` if repo requires). Open with **Principles**, then the **checklist**. Run **next to** OWASP—OWASP does not replace this list. Emit **PASS / FAIL / N/A + rationale** per row in the review artifact.

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

Patch **Criteria** + **ReviewProcess** in `.cursor/skills/aidd-review/SKILL.md` and `ai/skills/aidd-review/SKILL.md`. **Finish `aidd-security-review` before** you call the security pass complete. Say clearly: OWASP **supplements** this checklist; it **does not** replace it. Link **`aidd-timing-safe-compare`** and **`aidd-jwt-security`**—do not fork their bodies here.

**Requirements**:

- Given code touching **auth, listeners, persistence, or secrets**, should **not** mark security complete until **`aidd-security-review`** checklist is executed.

---

## References (bad vs good)

Under the new skill’s `references/` (or shared `aidd-review/references/`), add **one** insecure/secure pair per **checklist** row (empty default auth, WS≠HTTP auth, query `token`, webhook default agent, session token in JSON **and** cookie, `localStorage` API secret).

**Requirements**:

- Given the skill alone, should support **mechanical** first pass without prose improvisation.

---

## Cross-link entry points

Update `AGENTS.md`, `aidd-custom/AGENTS.md` (if used), and orchestrator/review listings: **`aidd-security-review`** is **required** alongside **`aidd-review`** for security-sensitive work.

**Requirements**:

- Given `AGENTS.md`, should list **`aidd-security-review`** as **required** for `/review` on security-sensitive changes.
