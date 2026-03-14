# Test Script Isolation Epic

**Status**: 🔄 IN PROGRESS
**Goal**: Ensure `npm test` only runs unit tests and lint — never e2e tests.

## Problem

`npm test` currently runs `vitest run` without any exclusion filters, which causes
e2e tests to be included alongside unit tests. E2e tests have side-effects, depend
on external processes, and can be slow — making them unsuitable to run as part of
the default `npm test` command.

## Requirements

- Given `npm test` is invoked, should only run unit tests and lint (not e2e tests)
- Given `npm run test:unit` is invoked, should only run unit tests and lint (not e2e tests)
- Given `npm run test:e2e` is invoked, should only run e2e tests

## References

- [Issue #149](https://github.com/paralleldrive/aidd/issues/149)
