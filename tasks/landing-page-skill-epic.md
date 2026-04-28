# Landing Page Skill Epic

**Status**: 📋 PLANNED
**Goal**: Add an `aidd-landing-page` skill that guides agents to build high-converting landing pages with clear messaging, focused CTAs, and measurable performance

## Overview

Agents currently lack structured guidance for building landing pages. Without conversion-focused constraints, generated pages tend toward decorative layouts, vague headlines, and competing calls-to-action — all of which hurt conversion. This skill codifies proven landing page principles as machine-readable constraints so agents produce pages that convert by default.

---

## Skill File

Create the `aidd-landing-page` skill following the AgentSkills.io spec and the project's constraint-based programming style.

**Requirements**:
- Given an agent is asked to build a landing page, should have a discoverable skill file at `.cursor/skills/aidd-landing-page/SKILL.md` with valid AgentSkills.io frontmatter
- Given the skill is loaded, should define a role preamble, Capabilities block, and Constraints block that encode all ten landing page principles
- Given the skill defines commands, should expose `/landing-plan`, `/landing-build`, `/landing-review`, and `/audit-speed` subcommands

---

## Conversion Constraints

Encode the core landing page rules as enforceable constraints.

**Requirements**:
- Given a landing page headline, should explain what the product does so a visitor understands the value proposition within 3 seconds
- Given a landing page, should have exactly one conversion goal — no competing CTAs
- Given above-the-fold content, should contain the value proposition and primary CTA — not decorative imagery
- Given a landing page, should show real product screenshots or interface previews early in the page
- Given a CTA label, should describe the concrete next step rather than a generic phrase like "Get Started"
- Given social proof content, should include testimonials with measurable results — not logos alone
- Given page sections, should each directly advance the visitor toward the single conversion goal — remove any that don't
- Given a landing page, should visibly address common objections (pricing, integrations, security, support) without requiring the visitor to search
- Given design hierarchy, should use size, contrast, and whitespace to create a single visual path from headline to proof to CTA

---

## Performance Audit

Integrate a PageSpeed Insights audit step into the skill workflow.

**Requirements**:
- Given a deployed or locally-served landing page URL, should fetch a PageSpeed Insights report and extract Performance score, LCP, CLS, and TBT
- Given a Performance score below 90 or LCP above 2.5 s, should flag the metric and list specific remediation steps
- Given a page that is not publicly accessible, should fall back to Lighthouse CLI for local auditing
- Given an accessibility score below 90, should treat it as a blocking issue

---

## Discover and Plan Workflow

Define a structured discovery-to-plan flow before any implementation begins.

**Requirements**:
- Given a landing page brief, should produce a pageSpec covering: single conversion goal, target audience, value proposition, social proof inventory, and objection map
- Given an approved pageSpec, should produce a sectionPlan that maps the visual flow from headline through final CTA
- Given a sectionPlan, should validate that every section serves the single conversion goal and remove any that don't

---

## Build Workflow

Guide the agent through implementation with performance and accessibility guardrails.

**Requirements**:
- Given a sectionPlan, should scaffold and implement the page top-down using the project's framework and component library
- Given image assets, should optimize to next-gen formats, lazy-load below-the-fold images, and size hero images to rendered dimensions
- Given animations, should be CSS-only, respect `prefers-reduced-motion`, and never delay content visibility
- Given the build is complete, should automatically run the speed audit and iterate until performance targets are met

---

## Review Workflow

Provide a structured review checklist that validates all constraints.

**Requirements**:
- Given a completed landing page, should walk through as a first-time visitor and verify the value proposition lands in 3 seconds
- Given the review step, should count distinct primary CTAs and flag any page with more than one
- Given the review step, should verify objection coverage for pricing, integrations, security, and support
- Given the review step, should confirm social proof includes measurable results
- Given the review step, should run a final speed audit and resolve all findings before shipping
