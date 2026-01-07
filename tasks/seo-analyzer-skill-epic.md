# SEO Analyzer Skill Epic

**Status**: 📋 PLANNED
**Goal**: Create automated SEO checker and agent command for comprehensive analysis with actionable recommendations

## Overview

Developers need automated SEO analysis before deployment, and agents need structured expertise to provide actionable recommendations. This epic creates a JavaScript tool for automated technical SEO checks (no LLM) that outputs YAML, plus an agent command that orchestrates the full analysis workflow including LLM-based content quality assessment.

---

## Build Automated SEO Checker Module

Create pure JavaScript module for technical SEO analysis without LLM dependency.

**Requirements**:
- Given URL input, should fetch and parse HTML with Cheerio
- Given HTML content, should extract title tag length and content
- Given HTML content, should validate H1 count and heading hierarchy structure
- Given HTML content, should detect missing image alt text with image URLs
- Given page URL, should verify HTTPS usage
- Given HTML head, should detect mobile viewport meta tag
- Given HTML content, should extract schema.org JSON-LD types
- Given page, should measure Core Web Vitals with Lighthouse headless
- Given HTML links, should identify broken internal and external links
- Given Open Graph meta tags, should extract og:title, og:description, og:image
- Given all checks complete, should return structured data object with findings

---

## Generate YAML Output

Format automated analysis results as YAML for agent consumption.

**Requirements**:
- Given analysis results, should output YAML to stdout
- Given YAML structure, should include URL, timestamp, and all automated check results
- Given issues detected, should categorize as critical, warnings, or suggestions
- Given YAML format, should be concise and parseable by js-yaml

---

## Integrate into AIDD CLI

Add SEO analyzer as option to existing aidd command.

**Requirements**:
- Given aidd command with --seo-analyze flag and URL argument, should execute analysis
- Given analysis completion, should output YAML to stdout
- Given --verbose flag, should show detailed progress
- Given errors during fetch or analysis, should provide clear error messages with causes
- Given module structure, should import separately like index-generator.js

---

## Create Agent Command

Create /seo-analyze command that orchestrates full analysis workflow.

**Requirements**:
- Given agent receives /seo-analyze command with URL, should run aidd --seo-analyze to get automated data
- Given YAML output from tool, should analyze content with LLM for E-E-A-T signals and trust indicators
- Given automated and LLM findings, should generate markdown report at plan/reports/seo/YYYYMMDD-seo.md
- Given report findings, should extract improvement epic with deduplicated tasks
- Given epic format, should include only overview and requirements using "Given X, should Y" format
- Given epic tasks, should prioritize by SEO impact and group similar issues

---

## Add TDD Test Suite

Implement comprehensive test coverage following TDD methodology.

**Requirements**:
- Given Riteway + Vitest framework, should write tests before implementation
- Given each module, should colocate tests with source files
- Given test assertions, should answer the 5 TDD questions per tdd.mdc
- Given tests, should isolate units with no shared mutable state
- Given HTML parsing tests, should use realistic page fixtures
- Given CLI integration, should test end-to-end with mock URL responses
