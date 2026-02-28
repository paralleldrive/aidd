# Unified Logger Epic

**Status**: 📋 PLANNED
**Goal**: Create event-driven logging framework for unified telemetry across client and server

## Overview

Developers need a unified logging solution that works consistently across client and server environments to enable reliable telemetry, debugging, and monitoring without coupling to specific dispatch implementations. This logger subscribes to framework events and handles sampling, sanitization, batching, and transport with built-in offline resilience and GDPR compliance.

---

## Interfaces

```sudo
// Base types
type ID = string(cuid2)
type Timestamp = number(epoch ms)
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal"
type Sanitizer = (payload: any) => any
type Serializer = (payload: any) => string
type RxJSOperator = function(Observable) => Observable

// Framework interfaces (out of scope - mocked for testing)
type Dispatch = (event: Event) => void  // synchronous, returns nothing
type Events$ = Observable<Event>         // RxJS Observable

// Event structures (Redux-compatible action objects)
Event {
  type: string
  payload: any  // typically LogPayload but can be any
}

LogPayload {
  timestamp: Timestamp        // Date.now() at creation
  message: string
  logLevel: LogLevel
  sanitizer?: Sanitizer       // optional override
  serializer?: Serializer     // optional override
  context?: Record<string, any>  // contextual fields
  props?: Record<string, any>    // additional structured data
}

EnrichedEvent {
  ...Event
  schemaVersion: number       // = 1
  eventId: ID                 // cuid2()
  userPseudoId: string
  requestId?: ID
  sessionId?: ID
  appVersion?: string
  route?: string
  locale?: string
  createdAt?: Timestamp       // server ingestion time
}

// Configuration
LoggerOptions {
  endpoint?: string           // POST target (client: '/api/events', server: 'console')
  payloadSanitizer?: Sanitizer   // (any) => any
  headerSanitizer?: (headers: Record<string, string>) => Record<string, string>
  serializer?: Serializer        // (any) => string (default: JSON.stringify)
  batchSizeMin?: number          // default 10
  batchSizeMax?: number          // default 50 events OR 64KB bytes, whichever first
  flushIntervalMs?: number       // timer for auto-flush when online
  maxLocalBytes?: number         // cap for localStorage pool
  maxByteLength?: number         // max request body size (server)
  skewWindow?: number            // acceptable timestamp skew (default: 24h in ms)
  futureSkewWindow?: number      // acceptable future timestamp skew (default: 1h5m in ms)
  consentProvider?: () => { analytics: boolean }
  getIds?: () => {
    sessionId?: ID
    userPseudoId?: string
    requestId?: ID
  }
  clock?: () => Timestamp        // default: Date.now
  level?: LogLevel               // default: 'info'
  sampler?: RxJSOperator         // default: takeEvery (pass-through)
  events?: Record<string, EventConfig>  // per-event overrides
}

EventConfig {
  shouldLog?: boolean            // default: true
  sampler?: RxJSOperator         // rxjs pipeable operator
  sanitizer?: Sanitizer          // (payload) => payload
  serializer?: Serializer        // (payload) => string
  level?: LogLevel               // default: 'info'
}

// Return types
Logger {
  log: (message: string, context?: Record<string, any>) => void
  info: (message: string, context?: Record<string, any>) => void
  warn: (message: string, context?: Record<string, any>) => void
  error: (message: string | Error, context?: Record<string, any>) => void
  debug: (message: string, context?: Record<string, any>) => void
  fatal: (message: string | Error, context?: Record<string, any>) => void
  dispose?: () => void           // cleanup subscriptions
}

ClientLogger {
  ...Logger
  withLogger: (Component: any) => any  // HOC for React components
}

ServerLogger {
  ...Logger
  withLogger: ({ request, response }: {
    request: any
    response: any
  }) => Promise<{ request: any, response: any }>
}

// Storage adapter (for testing)
StorageAdapter {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
  keys: () => Promise<string[]>
}
```

---

## Core Logger Infrastructure

Create base logger factory, event subscription mechanism, and error handling.

**Requirements**:
- Given createLogger is called with LoggerOptions, should return Logger with all methods
- Given framework emits Event via events$ Observable, should subscribe and process matching events
- Given logger receives Event, should apply global LoggerOptions and per-event EventConfig
- Given serializer or sanitizer throws error, should log to console.error and continue processing
- Given logger is created with invalid LoggerOptions, should throw descriptive TypeError
- Given logger.dispose is called, should unsubscribe from events$ and clean up resources

---

## Client Logger Implementation

Implement browser-based logger with localStorage buffering and network resilience.

**Requirements**:
- Given createLogger is called in browser, should return ClientLogger
- Given browser is online and Event received, should batch to localStorage and flush in background
- Given browser is offline and Event received, should append to localStorage without flushing
- Given browser reconnects (online event), should auto-flush all pooled buffers from localStorage
- Given localStorage exceeds maxLocalBytes quota, should evict oldest EnrichedEvent FIFO
- Given navigator.sendBeacon is available and batch ready, should prefer sendBeacon over fetch
- Given navigator.sendBeacon unavailable, should fallback to fetch POST
- Given batch reaches batchSizeMax events OR 64KB bytes, should flush immediately
- Given batch not flushed within flushIntervalMs, should flush on timer
- Given POST to endpoint fails, should log error to console and ignore (fire-and-forget)
- Given consentProvider returns analytics false, should skip logging non-essential events
- Given Event payload, should enrich with schemaVersion, eventId, userPseudoId, sessionId from getIds

---

## Server Logger Implementation

Implement Node.js logger with middleware integration.

**Requirements**:
- Given createLogger is called on server, should return ServerLogger
- Given withLogger called with request and response, should set response.locals.logger to Logger
- Given server logger receives Event via events$, should call appropriate logger method (log/error/etc)
- Given logger method called, should dispatch to transport (default: console.log/console.error)
- Given endpoint is 'console', should log to console with appropriate level
- Given endpoint is custom function, should call function with EnrichedEvent
- Given Event payload, should enrich with schemaVersion, eventId, requestId from response.locals

---

## Event Configuration System

Implement per-event sampling, sanitization, and serialization overrides.

**Requirements**:
- Given EventConfig has custom sampler RxJSOperator, should pipe events$ through operator
- Given EventConfig has custom sanitizer, should apply before global payloadSanitizer
- Given EventConfig has custom serializer, should use instead of global serializer
- Given Event type not in events map, should use global LoggerOptions defaults
- Given EventConfig includes invalid RxJSOperator, should fail fast with TypeError

---

## Security and Privacy Layer

Implement sanitizers, consent checking, and PII scrubbing utilities.

**Requirements**:
- Given server receives Event with headers, should apply headerSanitizer before logging
- Given server receives Event with request/response data, should apply payloadSanitizer before logging
- Given client consentProvider returns analytics false, should skip all telemetry events
- Given payload matches PII detection patterns, should redact before storage or transport
- Given developer integrates logger, should have documentation on GDPR-compliant PII scrubbing

---

## Client Transport Layer

Implement batching and idempotent delivery to /api/events/[id] endpoint.

**Requirements**:
- Given client online and queued events reach batchSizeMax, should flush immediately
- Given client online and flushIntervalMs elapsed, should flush on timer
- Given POST to /api/events/[id] fails, should log error to console and ignore (fire-and-forget)
- Given batch to flush, should POST to /api/events/[eventId] with Content-Type application/json
- Given multiple events to flush, should batch into single POST body with events array

---

## Server Event Endpoint

Implement POST /api/events/[id] handler with validation and idempotency.

**Requirements**:
- Given request method is not POST, should reject with 405 Method Not Allowed
- Given Content-Type is not application/json, should reject with 415 Unsupported Media Type
- Given request origin not in allowedOrigins, should reject with 403 Forbidden
- Given request referer origin does not match origin header, should reject with 400 Bad Request
- Given request body exceeds maxByteLength, should reject with 413 Payload Too Large
- Given Event timestamp outside skewWindow (past), should reject with 400 Bad Request
- Given Event timestamp outside futureSkewWindow (future), should reject with 400 Bad Request
- Given duplicate eventId received, should respond 204 No Content without processing
- Given Event passes all validations, should enqueue and respond 204 No Content

---

## Schema Validation

Implement JSON schema validation for Event types using Ajv.

**Requirements**:
- Given Event posted to server, should validate Event.payload against registered JSON schema
- Given Event fails schema validation, should reject with 400 Bad Request and detailed error
- Given Event type has no registered schema, should validate against default Event schema
- Given schemas defined at initialization, should compile with Ajv once on startup
- Given developer registers EventConfig with schema, should validate schema is valid JSON Schema Draft 7

---

## Testing Infrastructure

Create test utilities, mocks, and adapters for isolated testing.

**Requirements**:
- Given tests need storage isolation, should provide mock StorageAdapter
- Given tests need dispatch spy, should provide vi.fn mock for Dispatch
- Given tests need events$ stub, should provide Subject from rxjs for controllable event emission
- Given tests need deterministic time, should inject clock function returning fixed Timestamp
- Given tests run in parallel, should not share localStorage state between test suites
- Given logger created in test, should expose dispose method for cleanup

---

## Documentation and Examples

Document integration patterns, PII guidelines, and usage examples.

**Requirements**:
- Given developer integrates logger, should have clear client setup example with createLogger
- Given developer integrates logger, should have clear server middleware example with withLogger
- Given developer needs PII scrubbing, should have comprehensive guidelines with examples
- Given developer configures events, should have RxJS operator examples (takeEvery, sampleTime, throttleTime)
- Given developer handles retention, should have documentation referencing GDPR Article 5 and Article 17
- Given developer creates Event schemas, should have Ajv JSON Schema examples for Redux action objects
