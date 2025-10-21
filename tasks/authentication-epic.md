# Authentication Epic

**Status**: 📋 PLANNED
**Goal**: Enable secure user authentication with passkeys and magic links, providing seamless sign in/sign up flows with welcome onboarding

## Overview

Users need a secure, passwordless way to access the application using modern authentication methods. This epic implements WebAuthn passkey authentication and email magic links, reducing friction while maintaining security. New users will be welcomed with an onboarding flow that introduces them to specification-driven development with AIDD.

---

## API Interface Definitions

Define authentication data models and API interfaces in SudoLang format for communication between client and Supabase.

**Requirements**:
- Given authentication system, should define User type with email, name, id, created timestamp
- Given passkey support, should define Passkey type with device name, credential id, public key, user id, created timestamp
- Given magic link auth, should define MagicLink type with token, user id, expires timestamp, used boolean
- Given user activity, should define ActivityLog type with user id, event type, timestamp, metadata
- Given API endpoints, should define request/response interfaces for /api/auth/signin, /api/auth/signup, /api/auth/verify, /api/passkey/create, /api/passkey/list, /api/passkey/authenticate

---

## Sign In Form Component

Create sign in form with passkey list and email magic link option.

**Requirements**:
- Given existing user, should display "Sign in with a passkey" heading
- Given user has passkeys, should display list of passkeys with device names
- Given passkey selection, should initiate WebAuthn authentication flow
- Given user prefers email, should display email input field with placeholder "user@example.com"
- Given email input, should provide "Send Signin Link" button
- Given button click with valid email, should call /api/auth/signin endpoint
- Given successful request, should display confirmation message
- Given email doesn't exist, should suggest sign up instead

---

## Sign Up Form Component

Create sign up form for new user registration with email and name collection.

**Requirements**:
- Given new user, should display "Your email" field with placeholder "user@example.com"
- Given new user, should display "Your name" field with placeholder "Alex Archer"
- Given form submission, should validate email format
- Given valid inputs, should call /api/auth/signup endpoint with email and name
- Given successful signup, should send magic link via /sendemail API
- Given magic link sent, should display confirmation message with instructions

---

## Magic Link Generation API

Create serverless function to generate cryptographically secure magic links with expiration.

**Requirements**:
- Given signin/signup request, should generate cryptographically random token (minimum 32 bytes)
- Given token generation, should store in single slot per user (replacing any existing link)
- Given storage, should set expiration to 1 hour from creation
- Given link creation, should compose URL with token as query parameter
- Given composed URL, should return to caller for email delivery

---

## Magic Link Verification API

Create serverless function to verify and consume magic links securely.

**Requirements**:
- Given magic link click, should extract token from URL
- Given token, should query database for matching unused link
- Given link not found, should return error "Invalid or expired link"
- Given link expired (> 1 hour old), should return error "Link has expired"
- Given valid unused link, should mark as used immediately
- Given successful verification, should create authenticated session
- Given session creation, should return user data and session token

---

## Email Magic Link Delivery

Create email template and send magic link via /sendemail endpoint.

**Requirements**:
- Given magic link, should compose minimal HTML email using design system
- Given email composition, should include clear call-to-action button
- Given button, should link to magic link URL
- Given email ready, should call /sendemail API with authenticated request
- Given unauthenticated /sendemail request, should reject with 401
- Given successful send, should return confirmation to client

---

## WebAuthn Passkey Registration

Create passkey registration flow after magic link authentication for users without passkeys.

**Requirements**:
- Given user lacks passkeys after signin, should prompt to create passkey
- Given user accepts, should initiate WebAuthn registration ceremony
- Given registration start, should call /api/passkey/create for challenge
- Given challenge, should invoke navigator.credentials.create() with WebAuthn options
- Given successful creation, should extract credential data including device name if available
- Given credential data, should send to /api/passkey/create to store
- Given storage complete, should confirm passkey added successfully

---

## WebAuthn Passkey Authentication

Create passkey authentication flow for returning users with registered passkeys.

**Requirements**:
- Given passkey selection from list, should call /api/passkey/authenticate for challenge
- Given challenge, should invoke navigator.credentials.get() with WebAuthn options
- Given successful authentication, should send signed response to server
- Given server verification, should create authenticated session
- Given session created, should redirect to appropriate page based on user state

---

## Passkey List API

Create endpoint to retrieve user's registered passkeys with device information.

**Requirements**:
- Given authenticated user request, should query passkeys by user id
- Given passkeys found, should return array with device names and created timestamps
- Given device name available, should display human-readable name
- Given no device name, should generate fallback like "Passkey 1", "Passkey 2"
- Given no passkeys, should return empty array

---

## Welcome Page

Create onboarding page for new users introducing AIDD and specification-driven development.

**Requirements**:
- Given new user (welcome not dismissed), should redirect to /welcome after signin
- Given /welcome page, should display brief introduction to user story mapping
- Given introduction, should explain specification-driven development with AIDD
- Given page content, should highlight key software features
- Given user ready, should provide "Get Started" button to dismiss welcome
- Given dismiss action, should call API to add "welcome dismissed" event to activity log
- Given successful dismiss, should redirect to main application

---

## Activity Logging

Create activity log system to track user events including welcome dismissal.

**Requirements**:
- Given user event (signin, signup, passkey created, welcome dismissed), should append to activity log
- Given log entry, should include user id, event type, timestamp, and optional metadata
- Given activity log API, should accept POST requests with event data
- Given authenticated request, should store log entry in database
- Given storage success, should return confirmation
- Given welcome dismissed event, should persist so welcome doesn't show again

---

## Authentication State Management

Create Redux state management for authentication using autodux pattern.

**Requirements**:
- Given authentication flow, should create auth-dux.sudo with user, session, loading states
- Given auth-dux, should define actions for signin, signup, verify, signout
- Given actions, should define selectors for isAuthenticated, currentUser, hasPasskeys
- Given state changes, should persist session token to secure storage
- Given page load with session, should validate and restore authentication state
- Given expired session, should clear state and require re-authentication

---

## Route Protection

Create navigation guards to protect authenticated routes and handle redirects.

**Requirements**:
- Given unauthenticated user accessing protected route, should redirect to /signin
- Given authenticated user accessing /signin or /signup, should redirect to main app
- Given new user after signin, should check if welcome dismissed
- Given welcome not dismissed, should redirect to /welcome
- Given welcome dismissed, should proceed to requested route or home
- Given passkey prompt dismissed, should not prompt again in same session

---

## Security Implementation

Implement security best practices for authentication system.

**Requirements**:
- Given magic link token, should use crypto.randomBytes() or equivalent for generation
- Given passkey credentials, should validate challenge signatures on server
- Given authentication APIs, should implement CSRF protection
- Given session tokens, should use httpOnly secure cookies
- Given database queries, should use parameterized queries to prevent SQL injection
- Given user input, should sanitize and validate all fields
- Given error responses, should avoid leaking sensitive information
- Given rate limiting requirement, should document reliance on Cloudflare protection
