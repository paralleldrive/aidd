# App Discovery Framework Epic

**Status**: 📋 PLANNED
**Goal**: Enable apps to be discoverable by humans and AI agents through progressive enhancement

## Overview

Modern apps need to be discoverable not just by search engines, but by AI agents that can browse and interact with them programmatically. This epic provides a recipe for taking a vibe-coded prototype through progressive enhancement stages—from basic SEO to self-documenting hypermedia APIs—making your app discoverable by both humans and machines.

---

## Vibe Code Prototype

Rapid prototype to validate core concept.

**Requirements**:
- Given developers need to start quickly, should create minimal viable prototype focusing on core functionality

---

## Modularize with TDD

Use AIDD framework to add structure and tests to the prototype.

**Requirements**:
- Given a prototype exists, should use AIDD with TDD to refactor into modular, testable components
- Given code needs maintainability, should ensure each module has unit test coverage

---

## SEO & Social Cards

Add basic discoverability for traditional web.

**Requirements**:
- Given pages need social sharing, should add Open Graph and Twitter card meta tags
- Given pages need search visibility, should add basic SEO headers (title, description, canonical)

---

## User Feedback Loop

Get the app in front of real users and iterate.

**Requirements**:
- Given the app needs validation, should deploy to a testable environment
- Given users provide feedback, should iterate on core functionality before adding complexity

---

## Hypermedia HATEOAS APIs

Add self-documenting APIs for AI/agent browsing.

**Requirements**:
- Given AI agents need to discover API capabilities, should implement HATEOAS hypermedia controls
- Given front-end needs CMS content, should connect UI to hypermedia APIs as content source
- **Dependency**: Requires Jiron hypermedia HATEOAS features

---

## Full SSR & Agent Discovery

Make all content crawlable by search engines and AI agents.

**Requirements**:
- Given search engines need to index content, should add full SSR for front-end pages
- Given crawlers need navigation, should generate XML sitemaps
- Given AI agents need API discovery, should add agents discovery files (e.g., `/.well-known/ai-plugin.json`) pointing to hypermedia APIs

---

## Blog & RSS Feeds

Add content distribution channels for updates and marketing.

**Requirements**:
- Given users want updates, should add blog with RSS feed
- Given marketing needs distribution, should support changelogs and announcements via RSS

---

## Documentation

Document the discovery framework for AIDD users.

**Requirements**:
- Given users need to discover the discovery features, should create `docs/discovery.md` detailing the process, recipes, and AIDD features that enable discoverability
- Given users need to find the discovery docs, should add a paragraph to README explaining why discoverability matters and linking to `docs/discovery.md`
