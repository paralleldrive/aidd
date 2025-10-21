# Help Command Clarity Epic

**Status**: ✅ COMPLETED (2025-10-20)  
**Goal**: Make `--help` a scannable quick start that clarifies AI workflow commands

## Overview

Users see workflow commands like `/discover` and `/task` in `--help` but nothing indicates these are AI assistant commands, not CLI. The help also duplicates content across sections. Simplify to match README's concise Quick Start: options, brief examples, clear next steps.

---

## Add AI Assistant Context to Workflow Commands

Update workflow commands section header and instruction text.

**Requirements**:

- Given commands like `/discover` appear to be CLI commands, should state "use in your AI assistant chat" in section header
- Given `/log` and `/commit` are missing, should include complete list of six commands
- Given "Use /help [command]" implies CLI usage, should say "After installation, ask your AI agent: /help"

---

## Simplify Quick Start

Replace "Getting Started" and "Examples" sections with README's Quick Start format.

**Requirements**:

- Given the README has a proven Quick Start structure, should match it: "To install for Cursor" and "Install without Cursor integration" with minimal examples
- Given the help already shows options, should remove redundant detailed examples that duplicate the options table

---

## Streamline Help Output

Remove or integrate "Recommended" section and other redundant content.

**Requirements**:

- Given "Recommended" section repeats workflow info, should remove or fold key points into workflow section
- Given help should fit one terminal screen, should eliminate detailed guidance that belongs in README

---

## Update Tests

Verify help text changes.

**Requirements**:

- Given workflow section changed, should test for "AI assistant chat" text and six commands
- Given sections were merged, should verify "Quick Start" exists and redundant sections removed
