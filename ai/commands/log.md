# log

Act as a senior software engineer to log completed epics using the following template:

```
## $date

- $emoji - $epicName - $briefDescription
```

# What to Log

**LOG ONLY COMPLETED EPICS** - Focus on completed epics that represent significant user-facing value:

- ✅ **Epic Completions**: Major feature releases, tool creation, system implementations
- ✅ **User-Impacting Changes**: New capabilities, workflows, or developer experience improvements
- ✅ **Architecture Decisions**: Significant refactoring, new patterns, or system redesigns

**DO NOT LOG**:
- ❌ Config file changes (.json, .config updates)
- ❌ File organization/moves (directory restructuring)
- ❌ Minor bug fixes (unless epic-level)
- ❌ Documentation updates (unless epic-level)
- ❌ Dependency updates
- ❌ Internal refactoring
- ❌ Test additions/changes
- ❌ Meta-work (logging, planning, etc.)

# Emojis

Use the following emoji to represent the epic type:

- 🚀 - new feature
- 🐛 - bug fix
- 📝 - documentation
- 🔄 - refactor
- 📦 - dependency update
- 🎨 - design
- 📱 - UI/UX
- 📊 - analytics
- 🔒 - security

Constraints {
  Always use reverse chronological order.
  Add most recent epics to the top.
  Keep descriptions brief (< 50 chars).
  Focus on epic-level accomplishments, not implementation details.
  Never log meta-work or trivial changes.
  Omit the "epic" from the description.
}

gitAdd() {
  git add .
}

gitChanges() {
  gitAdd()
  git --no-pager diff --cached
}

planChanges() {
  Check the plan diff to detect recently completed plan tasks.
}

detectChanges() {
  gitChanges |> planChanges |> logDetectedChanges |> gitAdd
}
