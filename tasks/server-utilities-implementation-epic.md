# Server Utilities Implementation Epic

**Status**: 📋 PLANNED
**Goal**: Implement production-ready server utilities with asyncPipe composition, complete unit tests, and proper exports

## Overview

The server utilities currently exist only as reference examples in tasks/api-route-handling-epic/context/. This epic implements them properly in src/server/ with comprehensive unit tests, proper exports, and integration with the aidd package. These utilities enable functional middleware composition for Node.js API routes using asyncPipe patterns.

---

## Create Server Directory Structure

Set up proper directory structure in src/server/ for utilities and middleware.

**Requirements**:
- Given package structure, should create src/server/ directory
- Given middleware organization, should create src/server/middleware/ subdirectory
- Given test organization, should colocate tests with source files
- Given exports, should create index.js files for clean imports

---

## Implement createRoute Utility

Create core route composition utility using asyncPipe pattern.

**Requirements**:
- Given middleware functions, should compose using asyncPipe
- Given middleware error, should catch and log with request context
- Given error, should return standardized 500 response with requestId
- Given successful execution, should allow middleware to set status and send response
- Given request/response objects, should pass through middleware chain
- Given convertMiddleware helper, should adapt traditional middleware

---

## Implement withCors Middleware

Create CORS middleware for cross-origin request handling.

**Requirements**:
- Given any request, should add Access-Control-Allow-Origin header
- Given any request, should add Access-Control-Allow-Headers
- Given OPTIONS request, should add Access-Control-Allow-Methods header
- Given middleware execution, should return { request, response }
- Given response object, should use setHeader method

---

## Implement withRequestId Middleware

Create request ID tracking middleware for logging correlation.

**Requirements**:
- Given incoming request, should generate unique CUID2 request ID
- Given response object, should attach requestId to response.locals
- Given response.locals missing, should create it
- Given middleware execution, should return { request, response }

---

## Implement withConfig Middleware

Create configuration injection middleware for environment settings.

**Requirements**:
- Given async config loading, should await configure() function
- Given response object, should attach config to response.locals
- Given response.locals missing, should create it
- Given middleware execution, should return { request, response }

---

## Implement withServerError Middleware

Create standardized error response helper middleware.

**Requirements**:
- Given response object, should attach serverError function to response.locals
- Given serverError call, should accept message, status, requestId parameters
- Given default parameters, should use status 500 and "Internal Server Error"
- Given response.locals missing, should create it
- Given error object shape, should match { error: { message, status, requestId } }

---

## Create Test Utilities

Implement test helpers for middleware testing.

**Requirements**:
- Given test scenario, should provide createServer helper
- Given createServer call, should accept optional request and response objects
- Given mocked objects, should return { request, response } shape
- Given test imports, should export from src/server/test-utils.js

---

## Write Unit Tests for createRoute

Test core route composition and error handling.

**Requirements**:
- Given multiple middleware, should execute in order
- Given middleware returning modified request, should pass to next middleware
- Given middleware error, should catch and return 500
- Given error logging, should include requestId, url, method, headers
- Given successful route, should allow response to be set by final handler
- Given asyncPipe composition, should await each middleware

---

## Write Unit Tests for withCors

Test CORS header middleware.

**Requirements**:
- Given request, should add Access-Control-Allow-Origin header
- Given request, should add Access-Control-Allow-Headers
- Given OPTIONS request, should add Access-Control-Allow-Methods
- Given non-OPTIONS request, should not add Allow-Methods header
- Given middleware execution, should return both request and response

---

## Write Unit Tests for withRequestId

Test request ID generation middleware.

**Requirements**:
- Given server object, should attach requestId to response.locals
- Given requestId, should be string type
- Given requestId, should be unique for each request
- Given response without locals, should create locals object
- Given middleware execution, should return both request and response

---

## Write Unit Tests for withConfig

Test configuration injection middleware.

**Requirements**:
- Given async config, should await configuration loading
- Given config result, should attach to response.locals.config
- Given response without locals, should create locals object
- Given middleware execution, should return both request and response

---

## Write Unit Tests for withServerError

Test error response helper middleware.

**Requirements**:
- Given response object, should attach serverError function to locals
- Given serverError call with custom params, should use provided values
- Given serverError call without params, should use defaults
- Given error shape, should match { error: { message, status, requestId } }
- Given middleware execution, should return both request and response

---

## Create Package Exports

Set up proper module exports in package.json and index files.

**Requirements**:
- Given package.json, should add exports field for fine-grained control
- Given main export, should point to root index.js
- Given server utilities, should export from ./server path
- Given middleware, should export individual middleware from ./server/middleware/*
- Given src directory, should include in files field for npm publish

---

## Create Root Index File

Create main entry point exporting core utilities.

**Requirements**:
- Given root index.js, should export asyncPipe from lib/
- Given future exports, should provide clean import path for users
- Given ES modules, should use export syntax

---

## Create Server Index File

Create server utilities entry point.

**Requirements**:
- Given src/server/index.js, should export createRoute
- Given src/server/index.js, should export asyncPipe
- Given src/server/index.js, should export convertMiddleware
- Given middleware exports, should not include in main server export
- Given clean imports, should allow import { createRoute } from 'aidd/server'

---

## Create Middleware Index File

Create middleware utilities entry point.

**Requirements**:
- Given src/server/middleware/index.js, should export all middleware
- Given middleware list, should export withCors, withRequestId, withConfig, withServerError
- Given clean imports, should allow import { withCors } from 'aidd/server/middleware'

---

## Update Package Files Configuration

Update package.json files field to include src directory.

**Requirements**:
- Given npm publish, should include src/**/* in published package
- Given existing files, should maintain ai/, bin/, lib/ includes
- Given package size, should exclude tests from published package unless needed
