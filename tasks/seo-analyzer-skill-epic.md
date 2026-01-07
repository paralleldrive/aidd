# SEO Analyzer Skill Epic

**Status**: 📋 PLANNED
**Goal**: Create Agent Skill with CLI tool for automated SEO analysis and actionable improvement recommendations

## Overview

Developers need automated SEO analysis to identify critical issues before deployment, and AI agents need structured SEO expertise to provide actionable recommendations. This epic creates an Agent Skill with a CLI tool that combines JavaScript automation (technical SEO checks) and LLM analysis (content quality assessment) to generate comprehensive reports and prioritized improvement tasks.

---

## Create SEO Agent Skill Definition

Create SKILL.md following Open Agent Skills specification format.

**Requirements**:
- Given agent needs SEO expertise, should provide skill with name and description frontmatter
- Given skill is invoked, should instruct agent to use CLI tool for URL analysis
- Given analysis completes, should guide agent on interpreting YAML output and generating reports

---

## Build Automated SEO Checker

Implement JavaScript-based technical SEO checks without LLM dependency.

**Requirements**:
- Given URL input, should fetch and parse HTML with Cheerio
- Given HTML content, should extract title tag length and content
- Given HTML content, should validate H1 count and heading hierarchy
- Given HTML content, should detect missing image alt text
- Given HTML content, should identify HTTPS usage and mobile viewport meta tag
- Given HTML content, should extract schema.org markup types
- Given page load, should measure Core Web Vitals with Lighthouse
- Given parsed data, should detect broken internal and external links
- Given all checks complete, should return structured data object

---

## Add LLM-Enhanced Analysis

Integrate LLM to assess subjective SEO quality factors.

**Requirements**:
- Given page content and metadata, should analyze E-E-A-T signals (expertise, authoritativeness, trust)
- Given page content, should assess content originality and quality
- Given page topic, should identify YMYL classification (health, finance, legal, safety)
- Given page elements, should detect trust signals (contact info, about page, credentials)
- Given content analysis, should flag deceptive practices or red flags
- Given all assessments, should return scores and findings as structured data

---

## Generate YAML Output

Format analysis results as YAML for LLM consumption.

**Requirements**:
- Given automated checks and LLM analysis, should combine into single YAML structure
- Given YAML output, should include URL, timestamp, and all check results
- Given issues detected, should categorize as critical, warnings, or suggestions
- Given YAML format, should be concise yet complete for LLM interpretation

---

## Generate Markdown Report

Create human-readable SEO analysis report.

**Requirements**:
- Given analysis results, should generate markdown report at plan/reports/seo/YYYYMMDD-seo.md
- Given report structure, should include summary with overall score and issue counts
- Given automated checks, should present as checklist with pass/fail indicators
- Given LLM analysis, should include E-E-A-T scores and trust signals
- Given findings, should prioritize recommendations by impact

---

## Extract Improvement Epic

Generate minimal task epic from analysis findings.

**Requirements**:
- Given analysis findings, should identify actionable improvements
- Given multiple similar issues, should group into single task to deduplicate
- Given epic format, should include only overview and task requirements sections
- Given requirements, should use "Given X, should Y" format exclusively
- Given tasks, should prioritize by SEO impact and rank by value/effort ratio
- Given epic content, should minimize tokens while maintaining clarity

---

## Implement CLI Interface

Create command-line interface for SEO analysis tool.

**Requirements**:
- Given CLI invocation with URL argument, should execute full analysis pipeline
- Given analysis completion, should output YAML to stdout
- Given --report flag, should generate markdown report file
- Given --epic flag, should extract and save improvement epic
- Given errors during analysis, should provide clear error messages

---

## Add TDD Test Suite

Implement comprehensive test coverage following TDD methodology.

**Requirements**:
- Given Riteway + Vitest framework, should write tests before implementation
- Given each module, should colocate tests with source files
- Given test assertions, should answer the 5 TDD questions (unit, behavior, actual, expected, debugging)
- Given tests, should isolate units and avoid shared mutable state
- Given HTML parsing, should test with realistic page fixtures
- Given CLI interface, should test end-to-end URL analysis workflow
