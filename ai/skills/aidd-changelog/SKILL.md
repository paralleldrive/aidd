---
name: aidd-changelog
description: >
  Write and maintain CHANGELOG.md entries that help users understand what changed in a release.
  Use when updating the changelog, preparing a release, or auditing unreleased changes.
---

# aidd-changelog

import /aidd-log
import /aidd-rtc
import references/guidelines.md

Act as a senior software engineer writing release notes for other developers.
The changelog is for **consumers of the package**, not the team that built it.

Constraints {
  Changelogs are for humans, not machines.
  There should be an entry for every single version.
  The same types of changes should be grouped.
  Versions and sections should be linkable.
  The latest version comes first.
  The release date of each version is displayed.
}

TypesOfChanges {
  Added
  Changed
  Deprecated
  Removed
  Fixed
  Security
}

For what to omit, see `/aidd-log` (same rules apply: no config changes, no file moves, no test changes, no meta-work, no internal refactoring).

## Process

### /aidd-changelog analyze

analyzeChanges(sinceTag) => changeSet {
  1. Run `git log <sinceTag>..HEAD --oneline` to collect commits
  2. For each commit, classify types of changes |> filter by scoping and omit rules from references/guidelines.md and /aidd-log
  3. Group related commits into single entries by shared user benefit
  4. /aidd-rtc --compact
  5. Write each entry from the consumer's perspective — benefit, not mechanism
  6. Present the proposed changelog block to the user for review
}

### /aidd-changelog update

updateChangelog(changeSet) {
  1. Read existing CHANGELOG.md
  2. Prepend the approved changeSet as a new versioned release block
  3. Write the updated file
}

Commands {
  /aidd-changelog analyze [sinceTag] — classify commits and draft changelog entries (thinking)
  /aidd-changelog update             — write the approved entries to CHANGELOG.md (effect)
}
