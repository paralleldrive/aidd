# Story Mapper UI Prototype

A mobile-first, interactive user story mapping tool with Avion-like UX, cyberglassmorphism dark mode design, and click-to-edit functionality.

## Overview

This prototype demonstrates the visual design, responsive layout, and interactive editing capabilities for a modern story mapping tool. It's built with mobile-first principles and features self-referential content (a story map about building the story mapper itself).

## Design Philosophy

### Three-Tier Hierarchy (Avion Pattern)

```
Journeys (Rows - Horizontal)
    └── Steps (Columns beneath journeys)
        └── User Stories (Cards stacked vertically beneath steps)
```

- **Journeys**: Long-lived, stable user paths (e.g., "User Onboarding", "Core Workflow")
- **Steps**: Sequential actions within a journey (e.g., "Discover Product", "Sign Up")
- **User Stories**: Specific features that contribute to a step (may evolve over time)

### Cyberglassmorphism Aesthetic

**What is Cyberglassmorphism?**
A fusion of glassmorphism (frosted glass effects) with cyberpunk-inspired neon accents and dark backgrounds.

**Key Visual Elements:**
- Deep blue/purple gradient backgrounds
- Frosted glass cards with `backdrop-filter: blur()`
- Neon accent colors (cyan, magenta, electric blue)
- Semi-transparent overlays with RGBA
- Subtle glow effects on interactive elements
- High-contrast white/cyan text for readability

## Features Demonstrated

### Mobile-First Responsive Design
- **Touch-friendly**: 44px+ minimum tap targets throughout
- **Adaptive layout**: Stacks vertically on mobile, flows horizontally on desktop
- **Breakpoints**: 768px (tablet), 1024px (desktop)
- **Performance**: CSS containment, will-change properties
- **Accessibility**: Focus-visible outlines, ARIA labels, semantic HTML

### Interactive Editing
- **Click-to-edit**: Click any journey, step, or story title to edit
- **Modal interface**: Glassmorphic modal with form fields for all properties
- **Edit hints**: Pencil (✏️) icons appear on hover
- **Live updates**: Changes reflect immediately without page refresh
- **Success feedback**: Green glow animation confirms saves
- **Keyboard support**: ESC to close modal, focus management

### Core Layout
- **Journey rows**: Horizontal bands with color-coded neon borders (cyan, magenta)
- **Step columns**: Responsive grid beneath each journey
- **Story cards**: Vertically stacked, touch-friendly cards
- **Add journey**: Dashed button to create new journeys

### UX Patterns
- Glassmorphic surfaces with depth and hierarchy
- Smooth hover transitions and elevation changes
- Color-coded priority tags (High=red, Medium=orange, Low=green)
- Story point estimation display
- Simplified header (no extraneous badges)
- Clean, focused interface

## Design System

### Color Palette

```css
/* Dark Backgrounds */
--bg-primary: linear-gradient(135deg, #0a0a1f, #1a0a2e, #16213e);
--bg-secondary: #0f0f23;

/* Neon Accents */
--neon-cyan: #00f5ff;
--neon-magenta: #ff00ff;
--neon-blue: #0084ff;

/* Text */
--text-primary: #ffffff;
--text-secondary: #b8b8d4;
```

### Glassmorphism Properties

```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.15);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
```

## File Structure

```
features/storymapper/prototype/
├── index.html          # Main prototype HTML with editable data attributes
├── styles.css          # Mobile-first cyberglassmorphism CSS
├── app.js              # Click-to-edit functionality and modal management
└── README.md           # This file
```

## Viewing the Prototype

Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

**Responsive across all screen sizes:**
- Mobile: 320px+ (optimized for touch)
- Tablet: 768px+ (hybrid layout)
- Desktop: 1024px+ (full horizontal layout)
- Browser with backdrop-filter support required (all modern browsers)

## Self-Referential Content

The prototype uses dogfooding content - a story map about building the story mapper itself!

### Journey 1: Product Discovery (4 stories)
- **Research Users**: Interview PMs, analyze Avion UX
- **Define Value Proposition**: Define GenAI integration points
- **Create Visual Design**: Design cyberglassmorphism theme

### Journey 2: Build UI Prototype (8 stories)
- **Build Three-Tier Layout**: Create journeys, steps, story cards
- **Optimize for Mobile**: Mobile-first layout, touch interactions
- **Add Editing Capabilities**: Click-to-edit for journeys, steps, stories

All stories follow proper user story format:
- **Format**: "As a [persona], I want [action], so that [benefit]"
- **Story IDs**: DSC-001, UI-001, etc.
- **Priority levels**: High (red), Medium (orange), Low (green)
- **Story points**: Fibonacci-style estimates (1, 2, 3, 5, 8, etc.)

## Design Decisions

### Why Glassmorphism?
- Creates depth and visual hierarchy without heavy shadows
- Modern, futuristic aesthetic matches GenAI-first positioning
- Allows background gradients to show through, creating cohesion
- High-contrast text ensures accessibility despite transparency

### Why Dark Mode?
- Reduces eye strain during long planning sessions
- Makes neon accents pop visually
- Aligns with developer/tech-savvy audience preferences
- Better for OLED displays (battery savings)

### Why Avion-Inspired Hierarchy?
- Proven UX pattern for story mapping
- Clear separation of concerns (journeys vs. steps vs. stories)
- Supports horizontal slicing for MVP/release planning
- Scales well for complex products

## Performance Optimizations

```css
/* CSS containment for large canvases */
contain: layout style paint;

/* Will-change for animated elements */
will-change: transform;

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

## Interactive Features

✅ **Implemented:**
- Click-to-edit journeys, steps, and stories
- Modal form interface for editing
- Live UI updates on save
- Mobile-responsive layout
- Touch-friendly interactions
- Keyboard shortcuts (ESC to close modal)
- Success feedback animations

## Next Steps (Future Iterations)

Additional features to enhance the prototype:

- [ ] Drag-and-drop story reorganization
- [ ] Persistence (LocalStorage or backend API)
- [ ] AI chat integration (functional GenAI assistance)
- [ ] Add/delete journeys, steps, and stories
- [ ] Real-time collaboration cursors
- [ ] Horizontal slicing lines for release planning
- [ ] Zoom/pan canvas controls
- [ ] Export to Jira/Linear/GitHub
- [ ] Story templates and AI generation
- [ ] Undo/redo history
- [ ] Bulk operations (multi-select, batch edit)

## Browser Support

- Chrome/Edge 76+ (backdrop-filter support)
- Firefox 103+ (backdrop-filter support)
- Safari 9+ (with -webkit-backdrop-filter)
- Modern mobile browsers

## Credits

**Design Inspiration:**
- Avion (user story mapping UX patterns)
- Glassmorphism trend (frosted glass effects)
- Cyberpunk aesthetics (neon accents, dark gradients)

**Built for:** SudoLang.ai GenAI-first story mapping tool
**Design System:** Custom cyberglassmorphism
**Framework:** Pure HTML/CSS (no dependencies for prototype)
