# aidd-service

Enforces best practices for asynchronous data services with unidirectional data
flow: data down via `Observe`, actions up as void calls.

## Why

Separating service interfaces from implementations makes services portable,
inspectable, and swappable across process boundaries. The unidirectional
pattern keeps data flow predictable.

## Usage

Invoke `/aidd-service` when creating data services. Front-end services return
`Observe<Data>` and void actions; back-end services return `Promise<Data>` or
`AsyncGenerator<Data>`. Each function lives in its own file. Interface files
contain types only — no implementation. No classes.

## When to use

- Creating front-end or back-end data services
- Defining service interfaces or implementations
- Working with Observe patterns in the service layer
