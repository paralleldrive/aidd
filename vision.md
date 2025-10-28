# SudoLang.ai AIDD Vision

## Mission
The standard framework for AI Driven Development - production-ready, composable, and built for the future.

## Long-Term Vision

AIDD will be a comprehensive, tree-shakeable framework providing everything needed to build modern full-stack applications with AI-first development workflows.

### Core Modules (Planned)

**Reactive Programming**
- Observables API with pipeable operators
- Composable async operations

**State Management**
- Store provider working in both browsers and Node.js
- Auto-sync with Supabase
- ECS (Entity Component System) architecture similar to adobe/data
- Optimized for real-time collaboration and offline-first apps

**Side Effects & Async Workflows**
- Easy-to-use saga builder
- Declarative async operation management

**Developer Experience**
- DevTools similar to Redux DevTools
- Time-travel debugging
- State inspection and monitoring

**UI Components**
- Skinnable, accessible component library
- Authentication flows (sign in/sign out)
- User preferences (dark mode, settings)
- GDPR compliance (opt-outs, account deletion)
- Common app boilerplate solved

**Monetization**
- Integrated billing management
- Credit purchase systems
- Subscription handling
- Payment provider abstractions

**Web3 Ready**
- Integrated wallet (similar to magic.labs)
- Crypto-ready applications
- Seamless blockchain interactions

### Architecture Principles

1. **Tree-shakeable**: Every module independently importable
2. **Composable**: Mix and match what you need
3. **Type-safe**: Full TypeScript support throughout
4. **AI-first**: Optimized for AI code generation
5. **Production-ready**: Battle-tested patterns and comprehensive testing
6. **Zero lock-in**: Use what you want, replace what you don't

### Import Philosophy

No kitchen sink exports. Explicit subpath imports only:

```javascript
import { asyncPipe } from 'aidd/utils';
import { createRoute } from 'aidd/server';
import { createStore } from 'aidd/store';
import { Observable } from 'aidd/observables';
import { createSaga } from 'aidd/sagas';
import { Button, LoginForm } from 'aidd/components';
import { setupBilling } from 'aidd/billing';
import { createWallet } from 'aidd/wallet';
```

## Current Status

**Shipped:**
- AI agent orchestration system
- Server framework (Express alternative)
- Utility library (asyncPipe)
- TypeScript support

**In Progress:**
- Documentation improvements
- Framework positioning

**Next Steps:**
- Observables implementation
- Store with ECS architecture
- Saga builder
