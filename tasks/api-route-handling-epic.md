# API Route Handling Epic

**Status**: 📋 PLANNED
**Goal**: Implement secure, composable API route handling using functional middleware patterns with asyncPipe

## Overview

API routes require a different architecture than Express middleware chains. We need composable, testable middleware using functional programming patterns with asyncPipe for request/response handling. This epic establishes secure API route infrastructure with CSRF protection, authentication, input validation, and comprehensive error handling following the project's functional programming principles.

**Important**: These utilities should be public exports from the aidd module and documented in ai/rules so AI can use them automatically when users are building Node.js server routes.

---

## Public API Exports & AI Rules

Export server utilities from aidd module and create AI guidance for automatic usage.

**Requirements**:
- Given aidd module, should export createRoute, asyncPipe, convertMiddleware
- Given aidd module, should export all middleware utilities (withCors, withRequestId, etc.)
- Given Node.js server project, should create ai/rules/server/api-routes.mdc guide
- Given API route implementation, should direct AI to use aidd server utilities
- Given server rules guide, should follow same pattern as frameworks/redux rules
- Given package.json, should include server utilities in files field for npm publish

---

## API Route Infrastructure

Create core route handling utilities using asyncPipe composition pattern.

**Requirements**:
- Given route handler, should use asyncPipe instead of Express middleware chain
- Given middleware functions, should compose via createRoute helper
- Given middleware error, should catch and format with request ID and proper logging
- Given OPTIONS request, should handle CORS preflight
- Given middleware, should follow { request, response } object pattern
- Given error, should return 500 with standardized error shape including requestId

---

## CORS Middleware

Create CORS middleware for cross-origin requests.

**Requirements**:
- Given any request, should add Access-Control-Allow-Origin header
- Given any request, should add Access-Control-Allow-Headers for common headers
- Given OPTIONS request, should add Access-Control-Allow-Methods header
- Given middleware composition, should return { request, response } object
- Given security requirements, should support configurable origin whitelist

---

## Request ID Middleware

Create request ID tracking middleware for logging and debugging.

**Requirements**:
- Given incoming request, should generate unique CUID2 request ID
- Given response object, should attach requestId to response.locals
- Given error response, should include requestId in error payload
- Given successful response, should include requestId in headers
- Given logging, should include requestId in all log entries

---

## Server Error Middleware

Create standardized error response middleware.

**Requirements**:
- Given response object, should attach serverError helper to response.locals
- Given error, should format with message, status, requestId
- Given unhandled error, should default to 500 status
- Given error response, should use consistent shape across all endpoints
- Given security requirements, should not leak stack traces in production

---

## CSRF Validation Middleware

Create CSRF token validation middleware for POST requests.

**Requirements**:
- Given POST request, should validate X-CSRF-Token header
- Given missing CSRF token, should return 403 Forbidden
- Given invalid CSRF token, should return 403 Forbidden
- Given valid CSRF token, should allow request to proceed
- Given GET request, should skip CSRF validation
- Given token validation, should use constant-time comparison to prevent timing attacks

---

## Authentication Middleware

Create session validation middleware for protected routes.

**Requirements**:
- Given request with session token, should validate token format
- Given valid session token, should attach user data to request.locals
- Given expired session, should return 401 Unauthorized
- Given missing session, should return 401 Unauthorized
- Given invalid token, should return 401 Unauthorized
- Given authenticated request, should include userId in response.locals for logging

---

## Input Validation Middleware

Create request body and query parameter validation middleware.

**Requirements**:
- Given request body, should validate against schema
- Given invalid input, should return 400 Bad Request with field-specific errors
- Given valid input, should sanitize and normalize data
- Given string input, should trim whitespace
- Given email input, should validate format and normalize to lowercase
- Given SQL-injectable input, should reject with clear error message
- Given XSS attempt, should sanitize HTML entities

---

## Rate Limiting Middleware

Create rate limiting middleware as defense-in-depth (Cloudflare handles primary limiting).

**Requirements**:
- Given IP address, should track request count per time window
- Given rate limit exceeded, should return 429 Too Many Requests
- Given rate limit info, should include Retry-After header
- Given authenticated user, should use userId for rate limiting
- Given public endpoint, should use stricter limits than authenticated endpoints
- Given Cloudflare primary protection, should serve as backup layer only

---

## Security Headers Middleware

Create middleware to add security-related HTTP headers.

**Requirements**:
- Given response, should add Content-Security-Policy header
- Given response, should add X-Content-Type-Options: nosniff
- Given response, should add X-Frame-Options: DENY
- Given response, should add X-XSS-Protection: 1; mode=block
- Given response, should add Strict-Transport-Security for HTTPS
- Given API response, should add X-Robots-Tag: noindex

---

## Config Injection Middleware

Create configuration injection middleware for environment-based settings.

**Requirements**:
- Given environment, should load appropriate config
- Given response object, should attach config to response.locals
- Given async config loading, should handle errors gracefully
- Given missing required config, should fail fast with clear error
- Given secrets, should never log sensitive config values

---

## Logging Middleware

Create structured logging middleware for request/response tracking.

**Requirements**:
- Given incoming request, should log method, URL, headers
- Given request completion, should log response status and duration
- Given error, should log full error details with stack trace
- Given log entry, should include requestId for correlation
- Given production environment, should use JSON log format
- Given sensitive data, should redact from logs (passwords, tokens)

---

## Request Parsing Middleware

Create middleware to parse and validate request content types.

**Requirements**:
- Given JSON content-type, should parse body as JSON
- Given invalid JSON, should return 400 Bad Request
- Given missing content-type, should return 415 Unsupported Media Type
- Given large payload, should enforce size limits
- Given parsed body, should attach to request.body
- Given query string, should parse to request.query object

---

## Response Helper Middleware

Create response helper functions for common response patterns.

**Requirements**:
- Given success response, should provide json() helper with 200 default
- Given created resource, should provide created() helper with 201 status
- Given no content, should provide noContent() helper with 204 status
- Given validation error, should provide badRequest() helper with 400 status
- Given unauthorized, should provide unauthorized() helper with 401 status
- Given forbidden, should provide forbidden() helper with 403 status

---

## Middleware Composition Tests

Create comprehensive tests for middleware composition patterns.

**Requirements**:
- Given multiple middleware, should execute in order via asyncPipe
- Given middleware error, should stop execution and catch in createRoute
- Given middleware returning modified request, should pass to next middleware
- Given middleware test, should use createServer test helper
- Given middleware test, should verify response.locals modifications
- Given integration test, should verify full middleware chain behavior

---

## Route Handler Examples

Create example route handlers demonstrating middleware patterns.

**Requirements**:
- Given public route, should use minimal middleware (CORS, requestId, logging)
- Given authenticated route, should compose auth middleware
- Given POST route, should include CSRF validation
- Given route with validation, should demonstrate input validation middleware
- Given error-prone route, should demonstrate error handling
- Given route documentation, should include middleware composition examples
