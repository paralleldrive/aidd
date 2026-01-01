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

### The Research: Nielsen Norman Group

Jakob Nielsen and Tom Landauer's research shows that [testing with just 5 users reveals 85% of usability problems](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/). Their mathematical model demonstrates:

- **1 user** finds ~31% of issues
- **3 users** find ~65% of issues
- **5 users** find ~85% of issues
- **15 users** approach 100% issue detection

The key insight: **iteration beats sample size**. Testing with 5 users, fixing issues, then testing with 5 more users yields better results than testing with 10 users once.

### AIDD's Recommended Approach: 3+3 (Two Batches of 3)

In practice, we've found that **two batches of 3 users** (6 total) is the most cost-effective approach:

**The Math:**

- **3+3**: 87.75% with 6 users (0.068 users per %)
- **5+5**: 97.75% with 10 users (0.102 users per %)

**The 3+3 Advantage:**

- **Better ROI**: 88% coverage with 40% fewer users than 5+5
- **Optimal efficiency**: Best cost-per-issue ratio (0.068 vs 0.102 users per %)
- **Less duplication**: Smaller batches reduce redundant findings
- **Faster iteration**: Test → fix → test in days, not weeks
- **Good enough**: 88% catches the vast majority of critical issues

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

- Discovers UI by looking (no source code access)
- Screenshots at checkpoints, persona-based behavior

**Why not Playwright/Puppeteer?** Those frameworks require pre-existing selectors. This validates real UI discoverability.

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

Executes journey with persona-based behavior, captures screenshots at checkpoints/failures. Validates UI discoverability.

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

- **Qualitative** (3 users per batch): Find UX issues, understand mental models, iterate quickly
- **Quantitative** (30+ users): Measure metrics, compare variants, statistical significance

Don't draw statistical conclusions from small qualitative batches. Do identify issues to fix and iterate.

## Advanced Usage

### Multi-Persona Testing

Create separate journey files for different personas and generate their test scripts:

```bash
/user-test checkout-journey-novice.yaml
/user-test checkout-journey-expert.yaml
```

Compare how different user types experience the same flow.

### Iterative Testing Cycles

```
Day 1: Test with 3 users → Identify top issues
Day 2: Fix issues → Deploy
Day 3: Test with 3 new users → Verify fixes, find next issues
Day 4: Fix → Deploy
```

This cadence beats testing with 6 users once.

### Combining Human + Agent Tests

1. **Initial discovery**: Human tests to find major issues
2. **Verify fixes**: AI agent tests after each fix
3. **Regression testing**: AI agents test all journeys before releases
4. **Confirm resolution**: Human tests to verify fixes actually resolved the reported issues

## Resources

- [Why You Only Need to Test with 5 Users - Nielsen Norman Group](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)
- [How Many Test Users in a Usability Study? - Nielsen Norman Group](https://www.nngroup.com/articles/how-many-test-users/)
- [User Testing: Why & How (Jakob Nielsen) - Nielsen Norman Group](https://www.nngroup.com/videos/user-testing-jakob-nielsen/)

## Purchase Professional User Testing

While AI agent tests and self-conducted testing provide valuable insights, professional user testing with real people delivers the most authentic feedback. Parallel Drive offers professionally moderated user testing sessions:

### Parallel Drive User Tests (6 Tests Per Purchase)

Each purchase includes 6 human user testing sessions (two batches of 3) with:

- **Complete video recordings** of user test sessions
- **Running commentary** as testers navigate your app
- **Pre-triaged AI summary** of all encountered issues

**Why 6 tests (3+3)?** The math is compelling: 3 users find 65% of issues, then 3 more find 65% of the remaining 35% (22.75%), totaling **87.75%** issue discovery. That's better ROI than 5+5 (97.75% with 10 users) while maintaining faster iteration cycles. Two batches of 3 is the minimum to validate that your fixes worked and catch the most critical issues cost-effectively.

**[Purchase Professional User Tests](https://buy.stripe.com/9B6fZ53M11jm6CqeCRcwg0a)**

## Next Steps

1. Create your first user journey with `/discover`
2. Generate test scripts with `/user-test`
3. Run human tests
4. Fix the highest-impact issues
5. Validate fixes with AI agent tests
6. Iterate

Remember: **Small, frequent testing beats large, infrequent testing.**
