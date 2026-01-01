# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-01-01

### Added
- AGENTS.md installer with `--index` command for progressive AI context discovery
- Error-causes rule for structured error handling patterns
- SHA3-256 hashing security rule for CSRF token validation
- Timing-safe comparison security rule

### Changed
- Renamed "SudoLang AIDD" to "AIDD Framework" throughout documentation
- Enhanced JWT security guidelines with stronger recommendations
- Updated security review guidelines for JWT and comparison operations

### Fixed
- Review.mdc file path references corrected

## [2.3.0] - 2025-12-15

### Added
- Form handling middleware (`handleForm`) with TypeBox validation
- CSRF protection middleware (`withCSRF`) with SHA3-256 token validation
- Timing-safe comparison for CSRF tokens
- Comprehensive documentation for form, CSRF, and auth middleware
- TypeScript type checking in test scripts

### Changed
- Replaced ajv with TypeBox for form validation
- Enhanced CSRF and form middleware with logging and configuration

### Fixed
- CSRF bypass allowing form processing after rejection
- CSRF token regeneration on every GET request
- js-sha3 import compatibility for Node.js ESM
- Critical bugs in form/CSRF middleware
- File path inconsistencies in AI configuration files

## [2.2.0] - 2025-12-01

### Added
- Auth middleware wrapping better-auth for session management
- Parallel Drive badge to README
- Table of Contents section to README

### Changed
- Made better-auth a peer dependency (optional)

### Fixed
- File path patterns for agent files
- Agent orchestrator file path references

## [2.1.0] - 2025-11-15

### Added
- Component overview in README and CLI help text
- AIDD definition in documentation

### Changed
- Updated CLI help text with improved structure and clarity
- Consistent bullet format in CLI help text

### Fixed
- Brand name in tests changed to "SudoLang AIDD"
- Badge link for SudoLang AIDD
- Markdown formatting removed from CLI help text
- Server docs link restored in CLI help
- Release dates corrected in CHANGELOG
- Repository URLs corrected
- Test files excluded and docs included in npm package
- Latest tag now pushed to origin in release hook

## [2.0.0] - 2025-11-08

### Added
- New `aidd/utils` barrel export with composition utilities
- `pipe` function for left-to-right synchronous composition
- `compose` function for right-to-left synchronous composition
- `sideEffects: false` in package.json for optimal tree-shaking

### Changed
- **BREAKING**: Import path changed from `aidd/asyncPipe` to `aidd/utils`
  - Before: `import { asyncPipe } from 'aidd/asyncPipe'`
  - After: `import { asyncPipe } from 'aidd/utils'`

### Migration Guide
To migrate to v2.0.0, update your imports:
```javascript
// Old (v1.x)
import { asyncPipe } from 'aidd/asyncPipe';

// New (v2.0.0+)
import { asyncPipe } from 'aidd/utils';
```

## [1.13.0] - 2025-11-06

### Added
- AIDD Server Framework with production-ready middleware
- GitHub Actions CI workflow
- Comprehensive server framework documentation

### Fixed
- Flaky E2E tests now robust with git state verification
- Test redundancies removed for cleaner test suite

## [1.12.0] - 2025-10-21

### Added
- Release automation improvements
- Test suite enhancements

