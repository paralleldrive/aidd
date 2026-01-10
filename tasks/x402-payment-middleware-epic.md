# x402 Payment Middleware Epic

**Status**: 📋 PLANNED
**Goal**: Enable plug-n-play API monetization via x402 payment protocol middleware

## Overview

AI agents and automated systems need to access paid APIs without human intervention, but current payment flows require accounts, sessions, and manual approval. The x402 protocol enables instant, programmatic stablecoin payments embedded directly into HTTP using the long-dormant 402 Payment Required status code. This epic adds payment middleware to the AIDD server framework, allowing developers to monetize APIs with a single middleware addition to their route stack.

---

## createWithPayment Factory

Factory function that creates middleware requiring payment before granting access to protected resources.

```js
createWithPayment({
  recipient = process.env.X402_RECIPIENT,
  facilitatorUrl = process.env.X402_FACILITATOR,
  paymentNetwork = process.env.X402_PAYMENT_NETWORK,
  amount,
  currency = 'USDC',
  description,
})
```

**Requirements**:
- Given a request without valid payment proof, should respond with HTTP 402 and PaymentRequired header containing amount, currency, recipient, and supported networks
- Given a request with valid payment proof in X-PAYMENT header, should verify payment via configured facilitator
- Given successful payment verification, should attach payment receipt to `response.locals.payment` and allow request to proceed
- Given failed payment verification, should respond with HTTP 402 and appropriate error details
- Given named parameters, should accept `{ recipient, facilitatorUrl, paymentNetwork, amount, currency, description }`
- Given `recipient` parameter not provided, should fall back to `process.env.X402_RECIPIENT` via default parameter syntax
- Given `facilitatorUrl` parameter not provided, should fall back to `process.env.X402_FACILITATOR` via default parameter syntax
- Given `paymentNetwork` parameter not provided, should fall back to `process.env.X402_PAYMENT_NETWORK` via default parameter syntax
- Given `paymentNetwork` not configured anywhere, should default to Base network for lowest fees
- Given `amount` parameter, should require explicit value (price in smallest unit) with no env fallback
- Given `currency` parameter not provided, should default to 'USDC'
- Given response.locals.payment, should include `payer`, `amount`, `currency`, `network`, `transactionHash`, and `timestamp`

---

## Payment Verification

Middleware must verify payment proofs through a facilitator service.

**Requirements**:
- Given a payment proof, should validate signature and payment details against facilitator API
- Given facilitator verification success, should cache proof to avoid re-verification on retries
- Given facilitator verification failure, should return 402 with clear error message (insufficient funds, expired, invalid signature)
- Given facilitator unavailability, should return 503 Service Unavailable with retry-after header
- Given payment verification, should complete within 5 seconds under normal network conditions
- Given sensitive payment data, should sanitize wallet addresses and transaction hashes in error logs (show first/last 4 chars only)

---

## 402 Response Format

Standardized payment required response following x402 protocol specification.

**Requirements**:
- Given 402 response, should include `X-PAYMENT-REQUIRED` header with base64-encoded payment requirements
- Given payment requirements, should specify `recipient`, `amount`, `currency`, `network`, and `facilitator` URL
- Given payment requirements, should include `description` field for human-readable payment context
- Given payment requirements, should include `resource` field identifying the requested endpoint
- Given multiple supported networks, should list all in order of preference (lowest fees first)

---

## Test Utilities

Enable testing payment middleware without real blockchain transactions.

**Requirements**:
- Given test environment, should support `createMockFacilitator` that returns configurable verification results
- Given mock facilitator, should simulate success, insufficient funds, expired payment, and network errors
- Given test setup, should provide `createPaymentProof` helper to generate valid test proofs
- Given createServer test utility, should extend to support payment header injection

---

## Configuration Integration

Integrate with existing withConfig middleware for payment settings.

**Requirements**:
- Given environment variables, should support `X402_RECIPIENT`, `X402_FACILITATOR`, `X402_PAYMENT_NETWORK` configuration
- Given `recipient` not provided as parameter and `X402_RECIPIENT` not set, should throw descriptive ConfigurationError at middleware creation time
- Given `facilitatorUrl` not provided as parameter and `X402_FACILITATOR` not set, should throw descriptive ConfigurationError at middleware creation time
- Given production environment, should validate recipient address format before accepting requests

---

## Documentation

Update server framework documentation with payment middleware usage.

**Requirements**:
- Given docs/server/README.md, should add createWithPayment to API Reference section
- Given documentation, should include complete example with React/fetch client-side payment flow
- Given documentation, should explain facilitator concept and supported networks
- Given security section, should document payment-specific best practices (recipient validation, amount verification)

---

## Export Updates

Add payment middleware to server exports.

**Requirements**:
- Given src/server/middleware/index.js, should export `createWithPayment`
- Given src/server/middleware/index.js, should export `createMockFacilitator` for testing
- Given package.json, should add `@x402/core` as peer dependency

---

## References

- [x402 Protocol Specification](https://www.x402.org/)
- [x402 GitHub Repository](https://github.com/coinbase/x402)
- [Coinbase x402 Developer Docs](https://docs.cdp.coinbase.com/x402/welcome)
- [x402 Whitepaper](https://www.x402.org/x402-whitepaper.pdf)
