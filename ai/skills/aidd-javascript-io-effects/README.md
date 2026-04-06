# aidd-javascript-io-effects

Isolates network I/O and side effects using the saga pattern with `call` and
`put`, enabling deterministic testing without mocking.

## Why

Sagas yield plain effect descriptions instead of executing side effects
directly. This makes async workflows deterministic and testable — drive a saga
with `iterator.next(value)` and assert on each yielded effect without running
real I/O.

## Usage

Use `call(fn, ...args)` to describe a side effect and `put(action)` to
describe a Redux dispatch:

```js
function* signInUser() {
  const user = yield call(fetchUser, "42");
  yield put(userLoaded(user));
}
```

Test by driving the generator manually and asserting on yielded values.

## When to use

- Making network requests or invoking side effects
- Implementing Redux sagas
- Testing async workflows without mocking
