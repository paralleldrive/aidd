# User Testing with AIDD

A comprehensive guide to video user testing for app feature validation using AI agents.

## What is User Testing?

User testing reveals how real people interact with your application by watching them attempt realistic tasks. Unlike automated integration tests that verify code behavior, user testing validates the **user experience** — whether people can actually figure out how to use your features.

### Why User Testing Matters

You can build a technically perfect feature that users find completely unusable. User testing catches:

- **Navigation confusion** - Users can't find what they're looking for
- **Unclear UI** - Buttons or actions that aren't obvious
- **Unexpected workflows** - Users approach tasks differently than you designed
- **Hidden assumptions** - Features that require domain knowledge users don't have
- **Friction points** - Steps that cause hesitation or abandonment

### The Nielsen Norman Group Research

Jakob Nielsen and Tom Landauer's research shows that [testing with just 5 users reveals 85% of usability problems](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/). Their mathematical model demonstrates:

- **1 user** finds ~31% of issues
- **3 users** find ~65% of issues
- **5 users** find ~85% of issues
- **15 users** approach 100% issue detection

The key insight: **iteration beats sample size**. Testing with 5 users, fixing issues, then testing with 5 more users yields better results than testing with 10 users once.

**Important caveat**: This applies to **qualitative usability testing** (finding UX issues), not quantitative metrics (measuring conversion rates, etc.). For quantitative studies, you need [30+ participants for statistical significance](https://www.nngroup.com/articles/5-test-users-qual-quant/).

## AIDD's Dual-Output Approach

AIDD generates **two test scripts** from a single user journey:

### 1. Human Test Script
For manual testing with real people:
- Think-aloud protocol instructions
- Video recording for later analysis
- Open-ended observation of natural behavior

### 2. AI Agent Test Script
For automated testing with AI using **real browsers**:
- Drives browser like a human, discovers UI by looking (no source code access)
- Screenshots at checkpoints, persona-based behavior

**Why not Playwright/Puppeteer?** Those frameworks require pre-existing knowledge of selectors (`page.click('#submit')`). AI agents discover the UI the same way users do - validating that your UI is actually discoverable.

Both scripts test the **same journey** with **identical success criteria**, allowing you to:
- Compare human vs. AI agent behavior
- Scale testing across multiple personas
- Iterate faster with AI agents between human test cycles

## Getting Started

### 1. Define Your User Journey

Create a user journey using the `/discover` command or manually:

```yaml
journey:
  name: "First-time checkout"
  persona:
    name: "Sarah"
    role: "Busy professional"
    techLevel: "intermediate"
    patience: 7
    goals: ["Quick purchase", "Save payment info"]

  steps:
    - action: "Add product to cart"
      intent: "Purchase winter jacket"
      success: "Item appears in cart"

    - action: "Proceed to checkout"
      intent: "Complete purchase"
      success: "Checkout form loads"

    - action: "Enter payment details"
      intent: "Pay with credit card"
      success: "Payment accepted"

    - action: "Confirm order"
      intent: "Finalize purchase"
      success: "Order confirmation displayed"
      checkpoint: true
```

### 2. Generate Test Scripts

```bash
/user-test checkout-journey.yaml
```

This outputs:
- `checkout-journey-human.md` - Script for human testers
- `checkout-journey-agent.md` - Script for AI agents

### 3. Run Human Tests

Recruit participants matching your persona:

1. **Setup**: Screen recording software, test environment
2. **Brief**: Explain think-aloud protocol (say what you're thinking)
3. **Observe**: Don't help or guide, just watch and listen
4. **Record**: Capture video, note timestamps of friction points
5. **Debrief**: Ask post-test questions from the script

### 4. Run AI Agent Tests

```bash
/run-test checkout-journey-agent.md
```

Agents discover what to click by looking (no source code access), execute the journey with persona-based behavior, and capture screenshots at checkpoints/failures. This validates UI discoverability, not just technical functionality.

### 5. Compare & Iterate

- **Review human videos** for genuine confusion and unexpected behavior
- **Review agent reports** for systematic failures and patterns
- **Fix the highest-impact issues** (severity × frequency)
- **Test again**

## Best Practices

### Writing Good Test Steps

**Bad**:
```yaml
- action: "Click the blue button"
  intent: "Submit form"
```

**Good**:
```yaml
- action: "Submit your registration"
  intent: "Create a new account"
  success: "Welcome email confirmation shown"
```

Why? Users should accomplish **goals**, not follow **instructions**. If they can't find "the blue button," that's valuable data.

### Think-Aloud Protocol

Instruct human testers:

> "As you use the app, please say out loud what you're thinking, what you're trying to do, and what you expect to happen. There are no wrong answers — we're testing the app, not you."

This reveals mental models and assumptions.

### Persona-Based Testing

Create personas representing different user types:

- **Novice**: Low tech literacy, needs explicit guidance
- **Intermediate**: Familiar with similar apps, expects standard patterns
- **Expert**: Power user, wants keyboard shortcuts and efficiency

Map persona traits to agent behavior:
- **Patience** → Retry attempts before giving up
- **Tech level** → Retry strategy (immediate vs. exponential backoff)
- **Goals** → What success looks like for this user

### Embracing Variability

**Anti-pattern**: AI agents that follow identical paths every time.

**Goal**: AI agents that approach tasks differently, like real users:
- Different starting assumptions
- Multiple paths to the same goal
- Varied patience levels
- Diverse interpretations of UI elements

This variability reveals edge cases that deterministic tests miss.

## Common Pitfalls

### 1. Leading the Witness
**Bad**: "Click the checkout button in the top-right"
**Good**: "Complete your purchase"

### 2. Testing Only the Happy Path
**Bad**: Journey assumes user knows exactly what to do
**Good**: Journey tests realistic scenarios where users might get stuck

### 3. Ignoring Small Friction
"Users figured it out eventually" ≠ good UX. Every moment of hesitation is friction.

### 4. Testing Too Late
User testing should happen **during** development, not after launch. Test early, test often.

### 5. Confusing Qualitative with Quantitative
- **Qualitative** (3-5 users): Find UX issues, understand mental models
- **Quantitative** (30+ users): Measure metrics, compare variants

Don't draw statistical conclusions from 5 users. Do identify issues to fix.

## Advanced Usage

### Multi-Persona Testing

Generate separate test scripts for different personas:

```bash
/user-test --persona novice checkout-journey.yaml
/user-test --persona expert checkout-journey.yaml
```

Compare how different user types experience the same flow.

### Iterative Testing Cycles

```
Week 1: Test with 5 users → Identify top 5 issues
Week 2: Fix issues → Deploy
Week 3: Test with 5 new users → Verify fixes, find next issues
Week 4: Fix → Deploy
```

This cadence beats testing with 20 users once.

### Combining Human + Agent Tests

1. **Initial discovery**: Human tests to find major issues
2. **Verify fixes**: AI agent tests after each fix
3. **Regression testing**: AI agents test all journeys before releases
4. **Validation**: Human tests to confirm fixes landed

## Resources

- [Why You Only Need to Test with 5 Users - Nielsen Norman Group](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)
- [How Many Test Users in a Usability Study? - Nielsen Norman Group](https://www.nngroup.com/articles/how-many-test-users/)
- [User Testing: Why & How (Jakob Nielsen) - Nielsen Norman Group](https://www.nngroup.com/videos/user-testing-jakob-nielsen/)

## Next Steps

1. Create your first user journey with `/discover`
2. Generate test scripts with `/user-test`
3. Run human tests
4. Fix the highest-impact issues
5. Validate fixes with AI agent tests
6. Iterate

Remember: **Small, frequent testing beats large, infrequent testing.**
