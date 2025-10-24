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
- Given transport fails with retryable error, should ignore (client telemetry is fire-and-forget)
- Given event batches reach size or time threshold, should flush automatically

---

## Server Logger Implementation

Implement Node.js logger with middleware integration.

**Requirements**:
- Given createLogger is called on server, should return logger
- Given withLogger is called with request and response, should set response.locals.logger
- Given server logger receives event after subscribing to `events$` observable, should call logger.log() or logger.error() which should internally dispatch to the transport logger (default: console.log/console.error)
- Given server environment, should support console and custom transport

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
Server:
- Given payload contains headers, should apply headerSanitizer before logging
- Given payload contains request/response data, should apply payloadSanitizer before logging

Client:
- Given telemetry consent denied, should skip logging

Server:
- Given PII detection patterns match, should redact (scrub) before storage or transport
- Given developer wants to use logger, should have clear documentation on PII GDPR-compliant scrubbing

---

## Client Transport Layer

Implement batching and idempotent delivery.

**Requirements**:
- Given we are online and queued events reaches batchSizeMax events, should flush immediately
- Given we are online and batch hasn't flushed in flushIntervalMs, should flush on timer
- Given POST fails, log error to client console and ignore (fire and forget client)

Server:
- Given server receives duplicate eventId, should respond 204 without processing
- Given client sends events to /api/events/[id], should validate origin, content-type, and schema
- Given request body exceeds maxByteLength, should reject with 413
- Given event timestamp is outside skewWindow, should reject with 400 (default skewWindow to 24 hours)
- Given event timestamp is outside the futureSkewWindow, should reject with 400 (default futureSkewWindow: 1h:5m)

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

## Testing Tips

- Spies and stubs: vi.fn and vi.spyOn
  Vitest ships tinyspy under the hood. Simple, fast, and no extra deps. 
- Module mocking: vi.mock with vi.importActual for partial mocks
  Works cleanly with ESM. Avoid require. 
- Timers: vi.useFakeTimers and vi.setSystemTime

---

## Documentation and Examples

Document integration patterns, PII guidelines, and usage examples.

**Requirements**:
- Given developer wants to use the logger, should have clear client and server setup examples
- Given developer needs to scrub PII, should have comprehensive PII detection guidelines
- Given developer configures events, should have RxJS operator examples for common patterns
- Given developer handles retention, should have documentation referencing GDPR requirements
- Given developer needs JSON schemas, should have examples for Redux-style action objects

---

### Framework Interfaces
- Out of scope.

---

Original issue:

# Feature Request: Unified Event Driven Logger for AIDD (`aidd/logger`)

## Summary
Create a unified event driven logging and telemetry framework for client and server in AIDD. 

The framework provides dispatch. Its implementation is out-of-scope for this issue.

On client use `aidd/client/useDispatch`. On server use `response.locals.dispatch`.  
The logger subscribes to the framework event stream and applies per event rules for sampling, sanitization, serialization, batching, and transport.

Client uses localStorage for write through buffering. When online it flushes immediately. When offline it pools buffers and auto flushes on reconnection.

---

## Core design

```sudo
// Provided by the broader aidd framework (implementation is out-of-scope)
events$            // rxjs Observable of all dispatched events
useDispatch()      // client hook
response.locals.dispatch  // server per request

// Provided by the logger
createLogger(options)
```

All logging originates from framework `dispatch(event)`.  
The logger subscribes to `events$` and routes matching events to storage and transport.

---

## Client API

```js
import { createLogger } from 'aidd/logger/client.js';
import { useDispatch } from 'aidd/client/use-dispatch.js';

const { log, withLogger } = createLogger(options);

// dev code uses the framework dispatch
const dispatch = useDispatch();

dispatch(reportPageview({ page: 'home' });
```

Behavior
- Monitor online and offline state
- Write through to localStorage on every log
- If online then flush immediately in background
- If offline then append to pooled buffers and auto flush on reconnection
- Batch events for network efficiency
- Prefer navigator.sendBeacon with fetch POST fallback
- Retry with backoff and jitter
- Evict oldest when storage cap reached

---

## Server API

```sudo
import { createLogger } from 'aidd/logger/server.js'

const withLogger = createLogger(options)

// withLogger attaches `logger` to
response.locals.dispatch
```

Behavior
- No client buffering logic on the server side.

---

## Configuration

```sudo
createLogger(options)

options
  endpoint            // POST target or internal queue
  payloadSanitizer    // (any) => any
  headerSanitizer     // (headers) => headers
  serializer                // (any) => string
  batchSizeMax = 50
  flushIntervalMs    // background flush tick when online
  consentProvider     // () => { analytics: bool }
  getIds              // () => { userPseudoId requestId }
  level               // default info
  sampler = takeEveryglobal default sampler # Feature Request: Unified Event Driven Logger for AIDD (`aidd/logger`)

## Summary
Create a unified event driven logging and telemetry framework for client and server in AIDD.  
The logger does not create `dispatch`. The framework provides dispatch.  
On client use `aidd/client/useDispatch`. On server use `response.locals.dispatch`.  
The logger subscribes to the framework event stream and applies per event rules for sampling, sanitization, serialization, batching, and transport.  
Client uses localStorage for write through buffering. When online it flushes immediately. When offline it pools buffers and auto flushes on reconnection.

---

## Core design

```sudo
// Provided by the framework
events$            // rxjs Observable of all dispatched events
useDispatch()      // client hook
response.locals.dispatch  // server per request

// Provided by the logger
createLogger(options)
```

All logging originates from framework `dispatch(event)`.  
The logger subscribes to `events$` and routes matching events to storage and transport.

---

## Client API

```sudo
import { createLogger } from 'aidd/logger/client.js'
import { useDispatch } from 'aidd/client/useDispatch.js'

const { log, withLogger } = createLogger(options)

// dev code uses the framework dispatch
const dispatch = useDispatch()

dispatch({ type: 'page_view', payload: { message: 'home', timeStamp: Date.now() } })
log('client ready')
```

Behavior
- Monitor online and offline state
- Write through to localStorage on every log
- If online then flush immediately in background
- If offline then append to pooled buffers and auto flush on reconnection
- Batch events for network efficiency
- Prefer navigator.sendBeacon with fetch POST fallback
- Retry with backoff and jitter
- Evict oldest when storage cap reached

---

## Server API

```sudo
import { createLogger } from 'aidd/logger/server.js'

const { log, attach } = createLogger(options)

// attach adds logger to response.locals.logger
// per request dispatch is at response.locals.dispatch
```

Behavior
- Mirror client API for parity
- `attach({ request, response })` sets `response.locals.logger`

---

## Configuration

```sudo
createLogger(options)

options
  endpoint            // POST target or internal queue
  payloadSanitizer    // (any) => any
  headerSanitizer     // (headers) => headers
  serializer          // (any) => string
  batchSizeMin        // default 10
  batchSizeMax        // default 50 or 64k bytes
  flushIntervalMs     // background flush tick when online
  maxLocalBytes       // cap for localStorage pool
  consentProvider     // () => { analytics: bool }
  getIds              // () => { sessionId userPseudoId requestId? }
  clock               // () => Date.now()
  level               // default info
  sampler: observablePipableOperator = takeEvery
  events?              // per event overrides, see below
```

---

## Per event configuration

```sudo
createLoggerMiddleware({
  events: {
    [type]: {
      shouldLog = true
      sampler = takeEvery                 // rxjs pipeable operator
      sanitizer = standardSanitizer       // (payload) => payload
      serializer = standardSerializer     // (payload) => string
      level = info
    }
  }
})
```

Notes
- `sampler` can be any rxjs pipeable operator such as takeEvery sampleTime throttleTime bufferTime
- `sanitizer` runs before serialization
- `serializer` outputs a compact string
- Missing entries use global defaults

---

## Event envelope and log payload

```sudo
LogPayload
  timeStamp        // Date.now() at creation
  message          // string
  logLevel         // debug info warn error fatal
  sanitizer        // optional override
  serializer       // optional override
  context          // key map of contextual fields
  props            // additional structured dat
  createdAt? // Time of server injestion

Event
  type             // string
  payload          // LogPayload | any
```

Client and server enrich with

```sudo
Enrichment
  schemaVersion = 1
  eventId = cuid2()
  userPseudoId
  requestId
  appVersion
  route
  locale
```
---

## Security and privacy

```
Privacy {
  collect minimum required
  no passwords tokens credit cards or sensitive pii
  apply payloadSanitizer and headerSanitizer
  check consentProvider before logging any "non-essential" tracking events, which implies we need a way to mark events essential
  opt out disables non-essential logging

Security (Server side)

POST $eventsRoute[enevtId]
  require method is POST
  require contentType is application/json
  require origin in AllowedOrigins
  require referer origin matches origin
  parse body
  require byteLength <= maxByteLength
  for each event in body.events
    require eventId
    require client timeStamp within skewWindow
    require schema validation
  idempotent by eventID
  enqueue
  respond 204
```
---

## Example usage

```
// client
const logger = createLogger({
  endpoint: '/api/events', // versioning is built into the metadata
  events: {
    pageViewed: { sampler: takeEvery, level: info },
    mouseMoved: { sampler: sampleTime(500), level: info },
    error: { sampler: takeEvery, level: error, sanitizer: scrubError }
  }
});

const dispatch = useDispatch();

dispatch({
  type: 'pageViewed',
  payload: { route:  '/'
});

// server
const serverLogger = createLogger({
  endpoint: 'console', // default
  events: {
    httpRequest: { sampler: takeEvery, level: info, sanitizer: scrubRequest },
    httpResponse: { sampler: takeEvery, level: info, sanitizer: scrubResponse },
    error: { sampler: takeEvery, level: error, sanitizer: scrubError }
  }
})

// in route handler
request.locals.dispatch(action creator(action))
```

---

## Best practices

Structured logs: stable JSON keys for aggregation

Correlation: requestId userPseudoId


# Agent instructions

Before implementing, /review this issue description for adherence to best practices (including repo, logging, gdpr compliance, security)

Create a /task epic and save it

Make sure there's a questions section in the task epic if you have any questions

