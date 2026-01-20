# TDD Patterns Reference

## Test Structure

```javascript
describe('UnitUnderTest', () => {
  test('category of behavior', async () => {
    assert({
      given: 'initial state',
      should: 'expected outcome',
      actual: result,
      expected: expectedValue
    })
  })
})
```

Use `describe` for unit name, `test` for behavior category.

## Factory Functions

Instead of shared fixtures, use factories:

```javascript
// Bad - shared mutable state
const user = { name: 'Test', id: 1 }

// Good - factory function
const createUser = (overrides = {}) => ({
  name: 'Test',
  id: 1,
  ...overrides
})

test('user behavior', () => {
  const user = createUser({ name: 'Custom' })
  // test with isolated data
})
```

## Async Testing

```javascript
test('async operation', async () => {
  const result = await asyncFn()
  assert({
    given: 'async call',
    should: 'resolve with data',
    actual: result,
    expected: expectedData
  })
})
```

## Error Testing

```javascript
test('error handling', async () => {
  const error = await asyncFn().catch(e => e)
  assert({
    given: 'invalid input',
    should: 'throw specific error',
    actual: error.message,
    expected: 'Expected error message'
  })
})
```

## Vitest Utilities

### Spies
```javascript
const spy = vi.fn()
spy('arg')
expect(spy).toHaveBeenCalledWith('arg')
```

### Module Mocking
```javascript
vi.mock('./module', () => ({
  fn: vi.fn()
}))
```

### Fake Timers
```javascript
vi.useFakeTimers()
vi.setSystemTime(new Date('2024-01-01'))
await vi.advanceTimersByTimeAsync(1000)
vi.useRealTimers()
```

## Redux Testing

Test selectors, not state directly:

```javascript
// Bad
expect(state.users.list).toEqual([...])

// Good
expect(selectUsers(state)).toEqual([...])
```
