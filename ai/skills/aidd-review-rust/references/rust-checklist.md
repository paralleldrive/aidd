# Rust Review Checklist

Grep-based detection patterns and expanded guidance for each review priority.

## Quick Grep Checks

Run these against non-test source files to surface candidates for review:

```
.unwrap()           — potential panic in production code
.expect(            — verify it documents a programmer invariant, not user input
unsafe {            — must have // SAFETY: comment above
.lock().            — check if guard is held across .await
.read().            — check if RwLock guard is held across .await
.write().           — check if RwLock guard is held across .await
std::fs::           — should use runtime's async fs in async code
std::thread::sleep  — should use runtime's async sleep in async code
== "               — check if comparing secrets (needs constant-time)
&Vec<              — should be &[T] in function params
&String            — should be &str in function params
&PathBuf           — should be &Path in function params
&Box<              — should be &T in function params
.clone()            — verify borrow would not suffice
Err(_) =>          — check for silently swallowed errors
format!(.* user     — check for injection via user input interpolation
password            — verify not logged or included in error messages
token               — verify not logged or included in error messages
secret              — verify not logged or included in error messages
api_key             — verify not logged or included in error messages
```

## Priority 1: Safety & Correctness

### unwrap/expect in production code

`.unwrap()` panics without context. `.expect()` is only for invariants that represent programmer bugs, not runtime conditions.

Deterministic rule:
- `.unwrap()` on I/O, network, parsing, or user input => always wrong
- `.expect()` on I/O, network, parsing, or user input => always wrong
- `.unwrap()` on `Some(literal)` or infallible operations => acceptable

Fixes: `?` operator, `.unwrap_or()`, `.unwrap_or_default()`, `match`, `if let`

### Error propagation without context

Bare `?` on operations where the caller cannot distinguish which step failed.

```rust
// Ambiguous: which step failed?
let file = File::open(path)?;
let data = serde_json::from_reader(file)?;

// Clear: caller knows exactly what failed
let file = File::open(path).map_err(|e| AppError::FileOpen { path, source: e })?;
let data = serde_json::from_reader(file).context("parsing config")?;
```

### Silently swallowed errors

`Err(_) => {}`, `Err(_) => ()`, or `.ok()` on a Result whose error carries actionable information. Silent discard hides bugs.

Deterministic rule:
- Empty `Err(_)` match arms => always wrong
- `.ok()` discarding I/O, network, or parse errors => always wrong
- `let _ = tx.send(...)` in shutdown/cleanup paths => acceptable (receiver may be dropped)

```rust
// ALWAYS WRONG: error silently ignored
match do_work() {
    Ok(v) => v,
    Err(_) => {}
}

// CORRECT: log, propagate, or convert
match do_work() {
    Ok(v) => v,
    Err(e) => return Err(e.into()),
}
```

## Priority 2: Security

### Constant-time comparison

Any `==` or `!=` comparing secrets, tokens, API keys, HMAC digests, or session identifiers is a timing side-channel.

Correct approaches:
- `subtle::ConstantTimeEq` for byte-level comparison
- Hash both inputs to fixed-width digest (SHA-256), then compare digests with `ct_eq`
- `ring::constant_time::verify_slices_are_equal`

### Unsafe blocks

Every `unsafe {}` must have a `// SAFETY:` comment directly above explaining why the invariants are upheld. No exceptions.

### Sensitive data exposure

Grep for `password`, `token`, `secret`, `api_key`, `credential` in:
- `tracing::info!`, `tracing::debug!`, `log::info!`, `println!`
- Error message strings in `format!`, `.context()`, `thiserror` display attributes
- HTTP response bodies (JSON error responses)

## Priority 3: Ownership

### Slice types in APIs

Deterministic rule with no exceptions in function signatures:
- `&Vec<T>` => `&[T]`
- `&String` => `&str`
- `&PathBuf` => `&Path`
- `&Box<T>` => `&T`

The owned type in params forces callers to allocate unnecessarily. The borrowed form accepts any compatible source via Deref coercion.

### Clone vs borrow

Flag `.clone()` when the value is only read after the clone. If the cloned value is not mutated or moved into a struct/return, a borrow suffices.

## Priority 4: Async

### Locks across await

`std::sync::Mutex` guard across `.await` => deadlock. Always wrong.
`tokio::sync::Mutex` guard across `.await` => blocks other tasks. Wrong unless the critical section requires the await (rare).

Fix: extract needed data from the lock scope, release the guard, then await.

### Blocking in async

`std::fs::*`, `std::thread::sleep`, CPU-heavy computation in async context blocks the tokio runtime thread pool.

Fixes:
- Runtime's async fs (`tokio::fs::*`, `async_std::fs::*`) for file I/O
- Runtime's async sleep (`tokio::time::sleep`, `async_std::task::sleep`) for delays
- `tokio::task::spawn_blocking` for CPU-heavy work

## Priority 5: Type Design

### Enums over booleans

Two or more boolean fields that represent mutually exclusive states should be an enum.

```rust
// Wrong: impossible state (both true)
struct Connection { is_connected: bool, is_connecting: bool }

// Correct: impossible states are unrepresentable
enum ConnectionState { Disconnected, Connecting, Connected }
```

### Newtypes for distinct identifiers

Bare `u64` or `String` used as different kinds of IDs (user ID, order ID) that should not be interchangeable.

## Priority 6: Testing

### Async test macros

`#[test]` on an async fn does not execute the future. Must use a runtime-specific macro (e.g. `#[tokio::test]`, `#[async_std::test]`).

### Environment mutation

`std::env::set_var` and `std::env::remove_var` are unsound in multi-threaded programs since Rust 1.66. In multi-threaded async test runtimes (e.g. `#[tokio::test]`), this is a data race.

## Code Examples

### unwrap on network result

```rust
// ALWAYS WRONG: unwrap on network result
let body = response.json::<User>().await.unwrap();
// CORRECT:
let body = response.json::<User>().await?;
```

### Slice type in API

```rust
// ALWAYS WRONG: owned type in API params
fn process(items: &Vec<String>) { ... }
// CORRECT:
fn process(items: &[String]) { ... }
```

### std mutex guard across await

```rust
// ALWAYS WRONG: lock held across await
let guard = data.lock().unwrap();
do_work().await;
guard.push(item);
// CORRECT: extract, release, then await
let val = { data.lock().unwrap().last().copied() };
let result = do_work(val).await;
data.lock().unwrap().push(result);
```

### String equality for secrets

```rust
// ALWAYS WRONG: timing side-channel
if provided_token == expected_token { grant_access(); }
// CORRECT:
use subtle::ConstantTimeEq;
if provided_token.as_bytes().ct_eq(expected_token.as_bytes()).into() { grant_access(); }
```

## Sources

- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Clippy Lint Documentation](https://rust-lang.github.io/rust-clippy/stable/)
- [Rust Performance Book](https://nnethercote.github.io/perf-book/)
- Crate documentation: `subtle`, `argon2`, `tokio`, `axum`
