# Recursive Language Model Skill Epic

**Status**: 📋 PLANNED
**Goal**: Build an AI agent skill that applies Recursive Language Model strategies to provide deep, contextually-aware understanding of complex software projects

## Overview

AI agents working on complex software projects often struggle with context limits and incomplete understanding of large codebases. This skill implements Recursive Language Model (RLM) strategies from the MIT paper to enable agents to recursively decompose complex queries, fan out searches across the codebase, and build comprehensive understanding through hierarchical exploration. By treating the project repository as an external environment that can be programmatically examined and recursively explored, agents can deliver more accurate, contextually-aware results regardless of project size.

---

## Research Recursive Language Models

Study the MIT Recursive Language Models paper and implementation patterns to understand core concepts.

**Requirements**:
- Given the MIT RLM paper (arxiv.org/html/2512.24601v1), should extract core concepts of recursive decomposition
- Given RLM methodology, should understand how to break down complex tasks hierarchically
- Given RLM implementation examples, should identify patterns for handling long context beyond model windows
- Given RLM strategies, should document how recursive calling and task decomposition work
- Given practical applications, should identify how RLMs apply to code understanding and repository exploration

---

## Define User Journey

Create a comprehensive user journey for an end user driving an environment-aware AI agent.

**Requirements**:
- Given persona as end user with complex project, should define pain points around context awareness
- Given user goal of comprehensive repository understanding, should map journey steps
- Given existing productmanager.mdc patterns, should create user journey following project conventions
- Given user journey steps, should identify where RLM strategies provide value
- Given journey map, should save to plan/story-map/ following project structure

---

## Design Skill Architecture

Design the RLM skill structure using SudoLang syntax and agent skills patterns.

**Requirements**:
- Given agentskills.io specification, should understand skill structure and invocation patterns
- Given SudoLang syntax from ai/rules/sudolang/, should design skill using proper syntax
- Given RLM decomposition strategy, should define interfaces for recursive exploration
- Given fan-out search requirements, should design search orchestration functions
- Given SQLite indexing needs, should design data storage and retrieval interfaces
- Given skill should integrate with existing ai/rules/ and ai/commands/ patterns
- Given skill complexity, should define clear function signatures and constraints

---

## Implement Fan-Out Search Tools

Build search tools that combine ripgrep with semantic context for comprehensive code discovery.

**Requirements**:
- Given text search needs, should implement rg (ripgrep) integration
- Given file discovery needs, should implement file pattern matching
- Given semantic search needs, should design RAG (retrieval-augmented generation) approach
- Given search results, should aggregate and rank by relevance
- Given multiple search strategies, should fan out searches in parallel
- Given search orchestration, should use SudoLang function composition patterns

---

## Implement SQLite Indexing System

Build SQLite-based system for indexing and retrieving arbitrary project data aligned with user queries.

**Requirements**:
- Given large tabular data needs, should use SQLite for storage
- Given project context, should index relevant code metadata (files, functions, dependencies)
- Given user queries, should generate SQL for contextual retrieval
- Given query results, should format for agent consumption
- Given indexing strategy, should support incremental updates
- Given database schema, should document structure and query patterns

---

## Create RLM Skill Specification

Build the complete skill file in SudoLang syntax with all RLM functions and orchestration.

**Requirements**:
- Given skill structure, should create ai/rules/rlm.mdc file
- Given RLM decomposition, should implement recursive task breakdown functions
- Given fan-out search, should integrate search tools into skill functions
- Given SQLite system, should integrate data retrieval into skill
- Given skill invocation, should define clear entry points and command interface
- Given SudoLang constraints, should use proper syntax (interfaces, functions, constraints)
- Given markdown formatting, should prefer lists and SudoLang over tables
- Given existing please.mdc patterns, should follow similar structure and style
- Given alwaysApply frontmatter, should set appropriately for skill activation

---

## Create Command Interface

Build /rlm command for easy skill invocation.

**Requirements**:
- Given existing ai/commands/ patterns, should create ai/commands/rlm.md
- Given command structure, should reference ai/rules/rlm.mdc
- Given command invocation, should provide clear usage instructions
- Given please.mdc commands list, should integrate into command ecosystem
- Given command help, should document parameters and options

---

## Document and Test

Create comprehensive documentation and validate skill functionality.

**Requirements**:
- Given skill complexity, should create usage examples and documentation
- Given SudoLang syntax guide from user, should save to ai/rules/sudolang/sudolang-syntax.mdc
- Given skill functions, should document expected inputs and outputs
- Given RLM strategies, should provide examples of recursive decomposition in action
- Given test scenarios, should validate skill can handle complex repository queries
- Given documentation, should explain when and how to use RLM skill vs standard approaches

---
