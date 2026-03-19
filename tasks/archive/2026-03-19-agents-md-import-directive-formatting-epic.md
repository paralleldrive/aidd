# agents-md Import Directive Formatting Epic

**Status**: ✅ COMPLETE
**Goal**: Ensure the import directive in agentsMdContent exactly matches the root AGENTS.md format.

## Overview

The `import aidd-custom/AGENTS.md` directive was recently added to the agentsMdContent template. This epic ensures the formatting of this directive in the template matches the root AGENTS.md file exactly, with no leading whitespace inconsistencies.

---

## Formatting Consistency Requirement

**Requirements**:
- Given the agentsMdContent template includes the import directive, should have NO leading space before "import" to exactly match the root AGENTS.md file format. ✅
- Given the agentsMdContent template is used to generate new AGENTS.md files, should produce output identical to the root AGENTS.md file for consistency. ✅

## Resolution

Investigation revealed that the code was already correct - line 77 of `lib/agents-md.js` has NO leading space before the import directive, matching the root AGENTS.md format exactly. Added comprehensive test coverage to ensure this formatting is maintained going forward.
