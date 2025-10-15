## 🧙 Start Wizard

Launch interactive wizard for guided AIDD workflow with multiple choice navigation.

**Usage:** `/start` or `/wizard`

**Aliases:** `/begin`, `/guide`

---

## Command Description

Provides guided step-by-step workflow with numbered options at each decision point. Suitable for:
- First-time AIDD users learning the system
- Complex features requiring careful planning
- Situations where guidance is preferred over direct commands

**Implementation:** Uses aidd-core-wizard.mdc for state management and menu logic.

---

## Wizard Features

- **Multiple Choice Navigation** - Numbered options [1], [2], [3] at each step
- **Smart Defaults** - Suggests likely choice based on context
- **Progress Indicators** - Visual feedback showing completion percentage
- **Context-Aware Menus** - Options adapt to current project state
- **Help at Every Step** - Press ? for explanations
- **Auto-Save Progress** - Never lose work if interrupted
- **Mode Switching** - Beginner/Expert/Quick modes available

---

## Entry Points

**From fresh start:**
```
/start → Main menu
```

**From specific workflow:**
```
/start task → Jump to task creation wizard
/start discover → Jump to product discovery
/start execute → Jump to execution picker
```

---

## Navigation Shortcuts

**During wizard:**
- Type `1-9` - Select numbered option
- Type `?` - Help for current step
- Type `<` - Go back to previous step
- Type `!` - Skip optional step
- Type `@` - Show detailed explanation
- Type `/menu` - Return to main menu
- Type `/exit` - Exit wizard

---

## Constraints

Before beginning:
- Read and respect constraints in aidd-always-please.mdc
- Use aidd-core-wizard.mdc for state management
- Present options in consistent format
- Always show numbered choices
- Provide recommendations
- Save progress after each decision
- Allow both wizard and command workflows to coexist
