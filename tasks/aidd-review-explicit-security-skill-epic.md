# AIDD Review Explicit Security Skill Epic

**Status**: 📋 PLANNED
**Goal**: Add a mandatory, checklist-driven security skill so `/aidd-review` catches structural auth and secret-handling failures on the first pass—without relying on OWASP enumeration alone.

## Overview

OWASP Top 10 is a useful backstop but it is too coarse to catch **policy-level** failures that keep showing up in real systems (optional global auth off, transport-inconsistent gates, secrets in URLs, implicit automation targets). Reviewers need **explicit, project-agnostic rules** that force a **first-pass** search for those patterns. This epic adds a dedicated **AIDD security review** skill with a **non-optional checklist**, wires it into **`aidd-review`**, and spells out how **first-party** service trust, **CI**, and **third-party** boundaries fit **least privilege** and **layered** controls—not as a waiver for weak defaults, but as **scoped exceptions** with rotation, isolation, and documentation.

## Principles (anchor the new skill and every review pass)

- **Principle of least knowledge** — components should not receive or retain more about peers’ secrets than they need to verify or authorize; prefer verify-with-public-material where feasible.
- **Principle of least privilege** — every principal (human, service, integration, CI job) gets the **minimum** access, duration, and scope required; document any broader access as **time-bounded** and **revocable**.
- **Security in layers** — no single control (TLS, network zone, “it’s localhost”) substitutes for **authn/authz** on the control plane; alternate transports and side-channels get the **same** bar unless explicitly classified and justified.
- **Prefer the safer option** — if a mechanism is **sometimes** dangerous and a **strictly better** pattern exists for the context (passkeys vs passwords, asymmetric vs duplicated symmetric keys, explicit binding vs implicit defaults), the review should **default to the better option** and treat the weaker one as **FAIL** unless the epic/task documents an approved exception.

---

## Author the explicit security review skill

Create `.cursor/skills/aidd-security-review/SKILL.md` (and mirror to `ai/skills/` if required by repo conventions for sync) containing a **numbered or structured checklist** the reviewer must walk on every security-relevant review. Open the skill with the **Principles** block from this epic (least knowledge, least privilege, security in layers, prefer the safer option). The skill must **not** replace OWASP but **must** run **before** or **in addition to** OWASP, and must require **explicit PASS/FAIL (or N/A + rationale)** per item in the written review output.

**Requirements**:

- Given human authentication, should **reject password-based login** as acceptable unless the task explicitly documents a legacy exception; should require **WebAuthn/passkeys** or **federated IdP** patterns for new design.
- Given **first-party** service-to-service auth, should require **asymmetric** trust (mTLS, workload identity, OIDC token exchange, per-service signing keys) where the verifier holds **public** material only; should flag long-lived symmetric API keys copied into two services as **FAIL** unless N/A is justified (e.g. third-party constraint).
- Given **CI/CD** calling our APIs, should explain **practical** patterns: **OIDC** (`GITHUB_TOKEN` / cloud workload identity), **short-lived** cloud tokens, **ephemeral** mTLS or **signed** requests—versus storing a **static repo secret**; should mark **static shared secrets in CI** as **WARN or FAIL** with migration path, not hand-wave.
- Given **third-party** inbound webhooks or vendor APIs that only offer **shared HMAC/bearer** secrets, should allow **documented exception** scoped to **that boundary** and require **per-integration** rotation, **least privilege**, and **no reuse** across services.
- Given HTTP APIs, should require **no unauthenticated state-changing** methods on any route that mutates **server-side** persisted state (including side effects: spawn, schedule, config write, skill install, webhook trigger).
- Given read APIs, should require **no unauthenticated** access to **PII** or **persisted operational state** (sessions, agents, integrations, audit, logs, uploads) unless explicitly classified as **non-sensitive public metadata** with justification.
- Given **alternate transports** (WebSocket, SSE, gRPC, subprocess IPC), should verify they **do not** use **relaxed** or **missing** authentication compared to HTTP for the **same** resource class.
- Given **channels** (browser tabs, extensions, webhooks, message buses, CLIs), should flag any path that **bypasses** the primary authZ layer or accepts **weaker** proof (e.g. query `token=`, unsigned callbacks, trust-client IP alone).
- Given logging, tracing, metrics, and error reporting, should require **no credential logging** (headers, cookies, query `token`, `Authorization`, raw URLs with secrets); should list **query keys** that must be redacted when full URIs are captured.
- Given **default configuration** or **first boot**, should flag **fail-open** behavior (serve full API with empty credential, “dev mode” flags that disable auth in production builds, implicit targets for automation).
- Given **token or session compare**, should reference **`aidd-timing-safe-compare`** (hash-then-compare for symmetric material) and **`aidd-jwt-security`** where JWT appears; should not treat “we used ConstantTimeEq” as sufficient for **entropy** problems.

---

## Integrate the skill into `aidd-review`

Update `.cursor/skills/aidd-review/SKILL.md` and `ai/skills/aidd-review/SKILL.md` so **`/aidd-review` always invokes** **`aidd-security-review`** for the security phase: add to **Criteria**, add a **ReviewProcess** step, and state that **OWASP alone is insufficient** for merge-ready security review.

**Requirements**:

- Given a `/aidd-review` run on code that touches auth, network listeners, persistence, or secrets, should **load and follow** `aidd-security-review` **before** claiming the security pass is complete.
- Given the updated review skill, should still reference **`aidd-timing-safe-compare`** and **`aidd-jwt-security`** where applicable without duplicating their full text.

---

## Add references and examples for first-pass coverage

Add `references/` under the new skill (or extend `aidd-review/references/`) with **concrete pattern examples**: insecure vs secure for **empty default auth**, **WS/HTTP split**, **query token**, **webhook default target**, **session in JSON + cookie**, **localStorage API secret**.

**Requirements**:

- Given a reviewer reading only the skill, should find **at least one** “bad pattern / good pattern” pair per **non-negotiable** checklist line so first pass is **mechanical**, not inspirational.

---

## Validate and cross-link agent entry points

Ensure `AGENTS.md`, `aidd-custom/AGENTS.md` (if present), and any **orchestrator** or **review** docs that list skills mention the new **mandatory** security pass.

**Requirements**:

- Given a new contributor following `AGENTS.md` to run `/review`, should discover **`aidd-security-review`** as a **required** companion to **`aidd-review`** for security-sensitive changes.
