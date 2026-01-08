# Vibe Command Integration Epic

**Status**: 📋 PLANNED  
**Goal**: Add `aidd --vibe` command to generate and publish vibes to Vibecodr using AI-driven development

## Overview

Users need a seamless way to create and publish interactive React applications ("vibes") directly from the aidd CLI. Currently, vibe creation requires manual code writing and separate publish scripts. This epic integrates the full vibe generation and publish pipeline into a single `aidd --vibe --title "..." --prompt "..."` command, enabling AI agents to generate optimal applications using Jiron contract discovery, then automatically publish them to Vibecodr.

---

## Task 1: Add Vibe Command Option to CLI

Add `--vibe` flag and related options (`--title`, `--prompt`, `--entry`, `--runner`, `--visibility`) to `bin/aidd.js`.

**Requirements**:
- Given `--vibe` flag is passed, should branch to vibe generation/publish flow instead of clone flow
- Given `--vibe` without `--title`, should display error requiring title
- Given `--vibe` without `--prompt`, should display error requiring prompt
- Given `--vibe` with valid options, should proceed to vibe generation flow
- Given `--help`, should display vibe-related options with clear documentation

---

## Task 2: Create Vibe Core Module

Create `lib/vibe-core.js` with the main orchestration logic for vibe generation and publishing.

**Requirements**:
- Given valid title and prompt, should return structured result with success/failure status
- Given missing authentication, should return error with code `AUTH_REQUIRED` and helpful message
- Given dry-run mode, should display what would happen without making API calls
- Given verbose mode, should log detailed progress at each step
- Given network failure, should return error with cause chain for debugging

---

## Task 3: Create Jiron Discovery Module

Create `lib/jiron-discovery.js` to fetch and parse the Vibecodr Jiron contract.

**Requirements**:
- Given valid API base URL, should fetch Jiron contract from `/agent/vibe`
- Given Jiron response, should extract OAuth configuration (issuer, client_id, redirect_uri, scopes)
- Given Jiron response, should extract API endpoints (capsule create, file upload, publish)
- Given network timeout, should retry with exponential backoff (1s, 2s, 4s, max 3 retries)
- Given cached contract within TTL (1 hour), should return cached version without network call
- Given malformed Jiron response, should throw structured error with parsing details

---

## Task 4: Create Vibe Generation Prompt Module

Create `lib/vibe-prompt.js` to construct the AI generation prompt from user input.

**Requirements**:
- Given user prompt, should wrap with Vibecodr platform constraints from `vibe-generation-prompt.md`
- Given prompt, should inject forbidden patterns (no localStorage direct access, no API keys, etc.)
- Given prompt, should include code structure templates for React components
- Given prompt, should specify file limits (5MB target, 100 files max)
- Given prompt, should request specific output format (complete, runnable TSX code)

---

## Task 5: Create AI Code Generation Module

Create `lib/vibe-generate.js` to invoke AI for code generation.

**Requirements**:
- Given wrapped prompt, should generate complete React/TSX application code
- Given generation result, should parse into file structure (main component, additional files, styles)
- Given generation failure, should return structured error with generation context
- Given large prompt, should handle token limits gracefully
- Given ambiguous requirements, should generate sensible defaults following Vibecodr patterns

---

## Task 6: Create Authentication Integration Module

Create `lib/vibe-auth.js` to handle Vibecodr authentication within aidd context.

**Requirements**:
- Given no existing credentials, should prompt user to run auth flow
- Given valid stored credentials, should validate token expiry before use
- Given expiring token (within 2 minutes), should attempt automatic refresh
- Given refresh failure, should prompt user to re-authenticate
- Given auth error during publish, should retry once after token refresh

---

## Task 7: Create Publish Pipeline Module

Create `lib/vibe-publish.js` to handle the capsule create/upload/publish flow.

**Requirements**:
- Given generated files, should create empty capsule with title/entry/runner
- Given capsule created, should upload each file with proper path encoding
- Given files uploaded, should call publish endpoint with visibility setting
- Given publish success, should return player URL and postId
- Given publish failure, should return structured error with API response details
- Given large file set, should display upload progress (file X of Y)

---

## Task 8: Create File Collection and Filtering

Create `lib/vibe-files.js` to handle generated file collection and ignore patterns.

**Requirements**:
- Given generated code structure, should create proper file entries with paths and content
- Given file entries, should validate against forbidden file names (entry.tsx, _vibecodr__*, etc.)
- Given file entries, should calculate total bundle size and warn if > 5MB
- Given file entries, should count files and error if > 100 (free tier)
- Given binary assets in generation, should handle as raw bytes

---

## Task 9: Add Unit Tests for Vibe Core

Create comprehensive unit tests following TDD/Riteway patterns.

**Requirements**:
- Given each module, should have co-located `*.test.js` file
- Given tests, should use Riteway `{ given, should, actual, expected }` format
- Given tests, should mock network calls using Vitest mocks
- Given tests, should cover success paths and all error conditions
- Given tests, should achieve >80% code coverage for new modules

---

## Task 10: Add E2E Test for Vibe Command

Create `bin/vibe-e2e.test.js` for end-to-end testing.

**Requirements**:
- Given CLI with `--vibe --help`, should display vibe options
- Given CLI with `--vibe` but missing required options, should display helpful error
- Given dry-run mode, should simulate full flow without network calls
- Given valid options (with mocked AI/API), should complete full flow

---

## Task 11: Add TypeScript Type Definitions

Create `.d.ts` files for all new public APIs.

**Requirements**:
- Given new modules, should have matching type definition files
- Given type definitions, should export proper function signatures
- Given type definitions, should pass `npm run typecheck`

---

## Task 12: Update Documentation and Help Text

Update CLI help text and create user documentation.

**Requirements**:
- Given `--help`, should show complete vibe command documentation
- Given README.md, should include vibe command usage examples
- Given ai/commands/, should add `/vibe` command reference if applicable

---

## Implementation Constraints

1. **Code Style**: Follow existing aidd patterns - ES Modules, functional programming, error-causes library
2. **Testing**: TDD with Riteway format, co-located tests, >80% coverage
3. **Error Handling**: Use `error-causes` with structured error codes
4. **Dependencies**: Minimize new dependencies; reuse existing vibecodr-*.js patterns
5. **Security**: Never log tokens, validate all API responses, use PKCE for auth
6. **Performance**: Cache Jiron contract, show progress for file uploads

---

## Success Criteria

1. `aidd --vibe --title "Cool Vibe" --prompt "build a photo editor that specializes in removing acne"` successfully:
   - Fetches Jiron contract for API discovery
   - Generates complete React/TSX application
   - Authenticates with Vibecodr (prompting if needed)
   - Publishes to Vibecodr
   - Returns player URL
2. All tests pass (`npm test`)
3. Type checking passes (`npm run typecheck`)
4. Code follows aidd style guidelines
5. Error messages are actionable and include troubleshooting hints

---

## Agent Assignment

| Task | Recommended Agent | Rationale |
|------|------------------|-----------|
| Task 1 | CLI/Commander.js expert | Extending existing CLI structure |
| Task 2-3 | Network/API specialist | HTTP clients, caching, retries |
| Task 4-5 | AI/Prompt engineering | Prompt construction, output parsing |
| Task 6-7 | Auth/Security specialist | OAuth PKCE, token management |
| Task 8 | File system specialist | Path handling, ignore patterns |
| Task 9-10 | TDD specialist | Test coverage, mocking |
| Task 11-12 | Documentation/Types | TypeScript, technical writing |

---

## Dependencies

- Existing `cli-vibes/vibecodr-auth.js` and `cli-vibes/vibecodr-publish.js` for reference implementation
- `cli-vibes/vibe-generation-prompt.md` for AI prompt constraints
- `cli-vibes/aidd-integration.md` for API contract details
- `cli-vibes/vibe-publish.jiron.pug` for Jiron format reference
