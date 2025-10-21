# Story Mapper Production Implementation Epic

**Status**: 🚧 IN PROGRESS
**Goal**: Build production-ready story mapping tool with React, Shadcn, TDD, Storybook, and GenAI integration

## Overview

Product teams need a fully functional user story mapping tool that leverages GenAI for story generation and refinement, built with production-quality React components, comprehensive test coverage, and a beautiful cyberglassmorphism design system documented in Storybook.

---

## Setup Project Dependencies

Install React, Shadcn UI, and necessary build tooling for ESM modules.

**Requirements**:
- Given the project uses native ESM modules, should install React 18+ with ESM support
- Given we need component library foundations, should install Shadcn UI and its dependencies (Radix UI, Tailwind)
- Given we need testing infrastructure, should ensure Vitest and Riteway are configured for React component testing
- Given components need rendering, should install @testing-library/react for component testing

---

## Install Storybook with ESM Support

Configure Storybook 8+ with native ESM module support.

**Requirements**:
- Given the project uses "type": "module", should install Storybook 8+ with ESM support
- Given we need component documentation, should configure Storybook with React support
- Given we use Vite for testing, should use @storybook/builder-vite for consistency
- Given we want design system docs, should install @storybook/addon-docs and @storybook/addon-a11y

---

## Extract Functional Requirements

Analyze prototype and define complete functional requirements for the story mapper.

**Requirements**:
- Given journeys are containers for steps, should create/read/update/delete journeys with name and description
- Given steps organize user stories, should create/read/update/delete steps within journeys
- Given stories are the atomic work units, should create/read/update/delete stories with title, description, priority, and points
- Given users need to visualize hierarchy, should display journeys → steps → stories in three-tier layout
- Given users edit content frequently, should provide inline editing for all elements
- Given teams collaborate, should persist changes to story map state
- Given AI assists with planning, should integrate with product manager data model for AI-generated suggestions

---

## Build Data Model Layer with TDD

Create pure functions for managing story map state following product manager schema.

**Requirements**:
- Given story maps need unique IDs, should generate cuid2 IDs for all entities
- Given journeys contain steps, should create journey objects with id, name, description, steps array
- Given steps contain stories, should create step objects with id, name, description, stories array
- Given stories have metadata, should create story objects with id, name, description, priority, points, status
- Given state must be immutable, should provide pure functions for adding/updating/removing entities
- Given nested updates are complex, should provide helper functions for deep updates without mutation

---

## Build StoryCard Component with TDD

Create glassmorphic story card component with click-to-edit.

**Requirements**:
- Given users scan many stories, should display story ID, title, description, priority, and points
- Given cards need visual hierarchy, should apply cyberglassmorphism styling with glass-surface class
- Given priority indicates urgency, should color-code priority tags (high=red, medium=orange, low=green)
- Given users edit stories, should show edit hint (pencil icon) on hover
- Given clicks trigger editing, should call onEdit callback with story data when clicked
- Given accessibility matters, should use semantic HTML and ARIA labels

---

## Build StepColumn Component with TDD

Create step column that contains stacked story cards.

**Requirements**:
- Given steps organize stories, should render step header with name and story count badge
- Given stories stack vertically, should render all stories in vertical stack with spacing
- Given users edit steps, should show edit hint on hover and call onEdit when clicked
- Given mobile users need touch targets, should ensure minimum 44px tap target size
- Given columns need consistent width, should apply responsive width (100% mobile, constrained desktop)

---

## Build JourneyRow Component with TDD

Create journey row that contains step columns.

**Requirements**:
- Given journeys span horizontally, should render journey header with name and neon border (cyan/magenta)
- Given journeys contain steps, should render all steps in horizontal/vertical grid (responsive)
- Given users edit journeys, should show edit hint on hover and call onEdit when clicked
- Given journeys have visual identity, should apply neon-border-cyan or neon-border-magenta class alternately
- Given mobile screens stack vertically, should render steps as vertical list on mobile, horizontal grid on desktop

---

## Build StoryMapCanvas Component with TDD

Create main canvas that orchestrates all journeys.

**Requirements**:
- Given story maps contain journeys, should render all journeys in vertical stack
- Given users add journeys, should show "Add Journey" button with dashed border
- Given canvas manages state, should maintain story map state and pass down to children
- Given users edit elements, should handle edit callbacks and update state immutably
- Given canvas needs scrolling, should apply proper overflow and contain: layout

---

## Build EditModal Component with TDD

Create glassmorphic modal for editing journeys, steps, and stories.

**Requirements**:
- Given different entities have different fields, should conditionally show fields based on entity type
- Given journeys and steps have name/description, should show text input and textarea
- Given stories have additional fields, should show priority select and points number input
- Given users cancel edits, should close modal without saving when cancel button clicked or ESC pressed
- Given users save edits, should validate required fields and call onSave with updated data
- Given modals need backdrop, should show dark overlay with blur and close on overlay click
- Given accessibility matters, should trap focus and return focus on close

---

## Build Design System Overview in Storybook

Create comprehensive design system documentation page.

**Requirements**:
- Given teams need design consistency, should document color palette with CSS custom properties
- Given glassmorphism is key aesthetic, should show glass surface examples with code snippets
- Given neon accents define brand, should display neon colors (cyan, magenta, blue) with hex values
- Given components reuse patterns, should show spacing scale and border radius tokens
- Given developers need copy-paste code, should provide code snippets for each design token
- Given accessibility matters, should document contrast ratios and WCAG compliance

---

## Integrate GenAI Features

Connect story mapper to product manager data model for AI-powered features.

**Requirements**:
- Given users want AI suggestions, should provide "Ask AI" button in UI
- Given AI needs context, should format current story map as product manager Project object
- Given AI generates content, should parse product manager responses into story map entities
- Given users refine with AI, should allow natural language requests (e.g., "Add mobile onboarding journey")
- Given AI updates state, should merge AI-generated entities with existing story map immutably
- Given errors may occur, should handle API errors gracefully with user-friendly messages

---

## Create Component Stories

Write Storybook stories for all components showing different states.

**Requirements**:
- Given StoryCard has priorities, should show stories for high/medium/low priority variants
- Given StoryCard can be editable, should show interactive story with hover and click states
- Given StepColumn varies by story count, should show empty, single, and multiple story variants
- Given JourneyRow has color variants, should show cyan and magenta border variants
- Given EditModal handles different types, should show stories for journey/step/story editing
- Given StoryMapCanvas is complex, should show story with full example data (2 journeys, multiple steps/stories)

---

## Write Integration Tests

Test full story map workflow end-to-end.

**Requirements**:
- Given users create journeys, should add new journey to canvas and display it
- Given users edit journeys, should open modal, save changes, and update display
- Given users create steps, should add step to journey and display it in correct position
- Given users create stories, should add story to step and display it with correct formatting
- Given users change priority, should update story tag color immediately
- Given users delete entities, should remove from canvas and maintain state consistency

---

## Ensure Test Coverage

Verify all functional requirements have passing unit tests.

**Requirements**:
- Given every component has requirements, should have passing test for each requirement
- Given data model has functions, should test all CRUD operations with edge cases
- Given tests must be isolated, should use factory functions for test data, not shared fixtures
- Given tests answer 5 questions, should clearly state given/should/actual/expected for each test
- Given Riteway assert is used, should use proper assert syntax with descriptive messages
- Given production quality matters, should achieve >90% code coverage on business logic

---
