# Story Mapper UI Prototype

A GenAI-first user story mapping tool with Avion-like UX and cyberglassmorphism dark mode design.

## Overview

This prototype demonstrates the visual design and layout for a modern story mapping tool that integrates AI assistance naturally into the product planning workflow.

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

### Core Layout
- Horizontal journey rows with color-coded neon borders
- Responsive grid of step columns
- Vertical stacking of user story cards
- Mini-map for large canvas navigation

### GenAI Integration Points
- AI-generated story indicators (sparkle badges)
- AI Assistant panel (bottom-right)
- Suggested journey creation
- Hover states showing AI refinement availability

### UX Patterns
- Glassmorphic surfaces with depth and hierarchy
- Smooth hover transitions and elevation changes
- Color-coded priority tags
- Story point estimation display
- Real-time collaboration indicators (placeholder)
- Horizontal slicing for MVP planning (placeholder)

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
├── index.html          # Main prototype HTML
├── styles.css          # Cyberglassmorphism CSS
└── README.md           # This file
```

## Viewing the Prototype

Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

**Best viewed at:**
- Desktop: 1440px+ width
- Browser with backdrop-filter support (all modern browsers)

## Mock Data

The prototype includes two complete user journeys:

1. **User Onboarding** (5 steps, 12 stories)
   - Discover Product → Sign Up → Complete Profile → Take Tour → First Action

2. **Core Workflow** (4 steps, 8 stories)
   - Navigate Dashboard → Create Story Map → Collaborate → Plan Release

Stories are tagged with:
- Story IDs (e.g., USR-001, WRK-003)
- Priority levels (High/Medium/Low)
- Story point estimates
- AI-generated indicators

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

## Next Steps (Not Implemented in Prototype)

This is a **static visual prototype**. Future iterations would add:

- [ ] Drag-and-drop story reorganization
- [ ] Inline editing of journeys/steps/stories
- [ ] AI chat integration (functional)
- [ ] Real-time collaboration cursors
- [ ] Horizontal slicing lines for release planning
- [ ] Zoom/pan canvas controls
- [ ] Export to Jira/Linear/GitHub
- [ ] Story templates and AI generation
- [ ] Keyboard shortcuts
- [ ] Undo/redo history

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
