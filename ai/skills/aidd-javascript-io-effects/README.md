# aidd-javascript-io-effects — Saga Pattern Reference

`/aidd-javascript-io-effects` isolates network I/O and side effects using the
saga pattern with `call` and `put`, enabling deterministic testing of async
workflows without mocking.

## Why the saga pattern

Sagas yield plain effect descriptions instead of executing side effects directly.
This makes them deterministic and testable — you can drive a saga with
`iterator.next(value)` and assert on each yielded effect without running any
real I/O.

## Core functions

### `call(fn, ...args)` → `{ CALL: { fn, args } }`

Describes a side effect (network request, file read, etc.) without executing it.
The saga runtime handles actual execution.

### `put(action)` → `{ PUT: action }`

Describes a Redux store dispatch. The runtime dispatches the action.

## Example saga

```js
function* signInUser() {
  const user = yield call(fetchUser, "42");
  yield put(userLoaded(user));
}
```

## Testing sagas

Drive the generator manually and assert on each yielded value:

```js
describe("signInSaga happy path", async (assert) => {
  const gen = signInUser();

  assert({
    given: "load user triggered",
    should: "call fetchUser with id",
    actual: gen.next().value,
    expected: call(fetchUser, "42"),
  });

  const fakeUser = { id: "42", name: "Pup" };

  assert({
    given: "second yield",
    should: "put the user data into the store",
    actual: gen.next(fakeUser).value,
    expected: put(userLoaded(fakeUser)),
  });

  assert({
    given: "completion",
    should: "be done",
    actual: gen.next().done,
    expected: true,
  });
});
```

## When to use `/aidd-javascript-io-effects`

- Making network requests or invoking side effects
- Implementing Redux sagas
- Testing async workflows without mocking integrated components
