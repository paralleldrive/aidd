# Quiz App Epic

**Status**: 📋 PLANNED
**Goal**: Build an interactive quiz app to teach AIDD fundamentals

## Overview

Users need a structured way to learn modern web development concepts through the AIDD framework. This quiz app provides explainer content for each topic followed by interactive quizzes that reinforce learning, with random question selection to encourage repeated practice.

---

## Create Module Data Structure

Define TypeScript types and data for all 6 modules with explainer content and question pools.

**Requirements**:
- Given a module slug, should return module metadata (title, description, slug)
- Given a module, should provide explainer content as markdown/JSX
- Given a module, should provide a pool of 15+ questions with correct answers
- Given a question pool, should support random selection of 10 questions

---

## Build Module Navigation Component

Create a reusable navigation component listing all available modules.

**Requirements**:
- Given the home page, should display all 6 modules as clickable cards
- Given a module card click, should navigate to that module's page
- Given the module page, should show breadcrumb navigation back to home

---

## Build Quiz Component

Create an interactive quiz component with question display, answer selection, and scoring.

**Requirements**:
- Given a set of questions, should display one question at a time
- Given answer options, should allow single selection per question
- Given an answer selection, should indicate correct/incorrect with visual feedback
- Given quiz completion, should display final score and option to retry

---

## Create Module Page Layout

Build the dynamic module page with explainer section followed by quiz.

**Requirements**:
- Given a module slug in URL, should render that module's content
- Given module content, should display explainer section first
- Given explainer completion, should transition to quiz section
- Given quiz completion, should offer navigation to next module

---

## Add Module Content - JavaScript Rules

Populate the JavaScript module with explainer content and quiz questions based on ai/rules/javascript.

**Requirements**:
- Given JavaScript module, should explain core principles (DOT, YAGNI, KISS, DRY)
- Given JavaScript module, should cover functional programming preferences
- Given JavaScript module, should include naming conventions and constraints

---

## Add Module Content - AIDD

Populate the AIDD module with explainer content and quiz questions.

**Requirements**:
- Given AIDD module, should explain difference between vibe coding and AIDD
- Given AIDD module, should cover the structured command workflow
- Given AIDD module, should explain TDD integration

---

## Add Module Content - SudoLang

Populate the SudoLang module with explainer content and quiz questions.

**Requirements**:
- Given SudoLang module, should explain purpose of SudoLang for AI communication
- Given SudoLang module, should cover basic syntax patterns
- Given SudoLang module, should include constraint and function examples

---

## Add Module Content - React

Populate the React module with explainer content and quiz questions.

**Requirements**:
- Given React module, should explain component-based architecture
- Given React module, should cover hooks and state management basics
- Given React module, should include JSX patterns

---

## Add Module Content - Next.js

Populate the Next.js module with explainer content and quiz questions.

**Requirements**:
- Given Next.js module, should explain app router and file-based routing
- Given Next.js module, should cover server vs client components
- Given Next.js module, should include data fetching patterns

---

## Add Module Content - AIDD Framework

Populate the aidd framework module with explainer content and quiz questions.

**Requirements**:
- Given aidd framework module, should explain available commands (/task, /execute, /review)
- Given aidd framework module, should cover the rules system
- Given aidd framework module, should explain TDD workflow integration

---

## Style and Accessibility Pass

Apply consistent styling and ensure accessibility compliance.

**Requirements**:
- Given any interactive element, should be keyboard navigable
- Given color choices, should meet WCAG AA contrast requirements
- Given quiz feedback, should be announced to screen readers
