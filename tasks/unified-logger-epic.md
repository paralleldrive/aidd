# Unified Logger Epic

**Status**: 📋 PLANNED
**Goal**: Create event-driven logging framework for unified telemetry across client and server

## Overview

Developers need a unified logging solution that works consistently across client and server environments to enable reliable telemetry, debugging, and monitoring without coupling to specific dispatch implementations. This logger subscribes to framework events and handles sampling, sanitization, batching, and transport with built-in offline resilience and GDPR compliance.

---

## Core Logger Infrastructure

Create base logger types, interfaces, and event subscription mechanism.

**Requirements**:
- Given framework emits events via Observable, should subscribe and process matching events
- Given logger receives event, should apply global and per-event configuration
- Given serialization or sanitization fails, should log error to console and continue processing other events
- Given logger is created with invalid configuration, should throw descriptive error

---

## Client Logger Implementation

Implement browser-based logger with localStorage buffering and network resilience.

**Requirements**:
- Given browser is online, should flush batched events immediately in background
- Given browser is offline, should buffer events to localStorage without data loss
- Given browser reconnects after offline period, should auto-flush pooled buffers
- Given localStorage quota exceeded, should evict oldest events FIFO
- Given navigator.sendBeacon is available, should prefer it over fetch for reliability
- Given transport fails with retryable error, should retry with exponential backoff and jitter
- Given event batches reach size or time threshold, should flush automatically

---

## Server Logger Implementation

Implement Node.js logger with middleware integration.

**Requirements**:
- Given createLogger is called on server, should return logger with attach function
- Given attach is called with request and response, should set response.locals.logger
- Given server logger receives event, should process without localStorage buffering
- Given server environment, should support console and custom endpoint destinations

---

## Event Configuration System

Implement per-event sampling, sanitization, and serialization overrides.

**Requirements**:
- Given event type has custom sampler, should apply RxJS operator to event stream
- Given event type has custom sanitizer, should scrub payload before serialization
- Given event type has custom serializer, should use it instead of global serializer
- Given event type has no custom config, should fall back to global defaults
- Given event configuration includes invalid RxJS operator, should fail fast with clear error

---

## Security and Privacy Layer

Implement sanitizers, consent checking, and PII scrubbing utilities.

**Requirements**:
- Given payload contains headers, should apply headerSanitizer before logging
- Given payload contains request/response data, should apply payloadSanitizer before logging
- Given event is non-essential and consent denied, should skip logging
- Given event is essential, should log regardless of consent status
- Given PII detection patterns match, should redact before storage or transport
- Given developer uses logger, should have clear documentation on PII scrubbing requirements

---

## Transport Layer

Implement batching, retry logic, and idempotent delivery.

**Requirements**:
- Given batch reaches batchSizeMax events OR 64KB bytes, should flush immediately
- Given batch hasn't flushed in flushIntervalMs, should flush on timer
- Given POST to endpoint returns 4xx client error, should not retry
- Given POST to endpoint returns 5xx server error, should retry with backoff
- Given POST to endpoint returns network error, should retry up to max attempts
- Given server receives duplicate eventId, should respond 204 without processing
- Given client sends events to /api/events/[id], should validate origin, content-type, and schema
- Given request body exceeds maxByteLength, should reject with 413
- Given event timestamp is outside skewWindow, should reject with 400

---

## Schema Validation

Implement JSON schema validation for event types using Ajv.

**Requirements**:
- Given event is posted to server, should validate against registered schema
- Given event fails schema validation, should reject with detailed error
- Given event type has no schema, should apply default event schema
- Given schema uses Ajv validator, should compile schemas once at initialization
- Given developer registers event schema, should validate schema definition itself

---

## Testing Infrastructure

Create test utilities, mocks, and adapters for logger testing.

**Requirements**:
- Given tests need storage isolation, should provide mock storage adapter
- Given tests need dispatch isolation, should provide spy/mock dispatch
- Given tests need deterministic timing, should inject clock function
- Given tests run in parallel, should not share localStorage state
- Given logger is used in tests, should expose dispose/cleanup method

---

## Documentation and Examples

Document integration patterns, PII guidelines, and usage examples.

**Requirements**:
- Given developer integrates logger, should have clear client and server setup examples
- Given developer needs to scrub PII, should have comprehensive PII detection guidelines
- Given developer configures events, should have RxJS operator examples for common patterns
- Given developer handles retention, should have documentation referencing GDPR requirements
- Given developer needs JSON schemas, should have examples for Redux-style action objects

---

## Questions

### Framework Interfaces
- Should we create TypeScript definition files (.d.ts) for the framework interfaces (events$, dispatch, useDispatch) even though implementation is out of scope?

### JSON Schema Examples
- Would you like me to include Ajv schema examples for common event types in the task epic, or should that be part of the implementation documentation?

### Essential vs Non-Essential Events
- Should we add a marker field like `event.metadata.essential: boolean` to distinguish event types, or handle this purely through configuration?

### Error Handling
- For serialization/sanitization failures, should we provide a configurable `onError` callback, or always default to console.error?

