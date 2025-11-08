# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-11-08

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

## [1.13.0] - 2024-11-08

### Added
- AIDD Server Framework with production-ready middleware
- GitHub Actions CI workflow
- Comprehensive server framework documentation

### Fixed
- Flaky E2E tests now robust with git state verification
- Test redundancies removed for cleaner test suite

## [1.12.0] - 2024-10-20

### Added
- Release automation improvements
- Test suite enhancements

