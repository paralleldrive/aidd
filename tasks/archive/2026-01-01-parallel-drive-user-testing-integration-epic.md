# Parallel Drive User Testing Integration Epic

**Status**: ✅ COMPLETED (2026-01-01)  
**Goal**: Integrate Parallel Drive User Testing product purchase into aidd framework with accurate Nielsen Norman research and optimized messaging

## Overview

Users need a clear path to purchase professional user testing services after generating test scripts with aidd. The integration provides scientifically-backed recommendations for the optimal 3+3 batch approach (87.75% issue discovery) versus traditional 5+5 batches (97.75%), demonstrating that 6 users across two iterations provides superior cost-efficiency (0.068 vs 0.102 users per percentage point) while catching the vast majority of critical issues. Product messaging emphasizes iteration beats sample size, backed by mathematical proof that two 3-user batches find more issues than a single 5-user batch.

---

## Update Documentation with Purchase Information

Add Parallel Drive User Testing product information to user testing documentation with accurate research-backed messaging about the 3+3 approach.

**Requirements**:
- Given the user reads user-testing.md, should see clear explanation of why 3+3 approach is recommended
- Given the user views purchase section, should understand that 6 tests (two batches of 3) is the minimum
- Given the user reads the math, should see accurate calculation: 3+3 = 87.75%, 5+5 = 97.75%
- Given the user compares approaches, should understand 3+3 has better cost efficiency (0.068 vs 0.102 users per %)
- Given the user reaches purchase decision, should have clear link to Stripe checkout

---

## Add Purchase CTA to Generated Scripts

Implement in-console purchase offer that displays after /user-test command generates test scripts.

**Requirements**:
- Given the user runs /user-test command, should see purchase offer in console output (not in artifact files)
- Given the agent generates test scripts, should call offer() function to display CTA
- Given the CTA displays, should include product description, benefits, and purchase link
- Given the offer message appears, should emphasize Nielsen Norman research backing

---

## Update Command Documentation

Add purchase information to user-test command guide for agent reference.

**Requirements**:
- Given an agent reads user-test.md command, should understand the 3+3 vs 5+5 comparison
- Given the command documentation shows math, should accurately state 87.75% vs 97.75% coverage
- Given the agent needs to recommend testing, should have clear product messaging to share

---

## Validate Mathematical Accuracy

Verify all percentage calculations and efficiency metrics are mathematically correct.

**Requirements**:
- Given first batch finds 65% of issues, should calculate second batch as 65% × 35% = 22.75%
- Given two batches complete, should total 87.75% issue discovery
- Given 5+5 approach, should calculate 85% + (85% × 15%) = 97.75%
- Given cost efficiency comparison, should show 6/87.75 = 0.068 vs 10/97.75 = 0.102 users per %

---

## Remove Contradictory Messaging

Eliminate references to purchasing 3 tests or flexible batch sizes that conflict with 6-test minimum.

**Requirements**:
- Given the product sells 6 tests minimum, should not mention buying 3 tests
- Given the documentation discusses flexibility, should not imply users can purchase partial batches
- Given the messaging covers iteration, should consistently use 3+3 terminology not 3+3+3

---

## Update Stripe Payment URL

Replace old Stripe checkout URL with new production URL across all documentation.

**Requirements**:
- Given any file contains payment URL, should use https://buy.stripe.com/9B6fZ53M11jm6CqeCRcwg0a
- Given the user clicks purchase link, should direct to correct Stripe checkout
- Given documentation references purchase, should have consistent URL across all files

---

## Completed Changes

**Files Modified**:
- `/Users/eric/dev/code/aidd/docs/user-testing.md` - Updated with 3+3 approach, mathematical proof, purchase section
- `/Users/eric/dev/code/aidd/ai/commands/user-test.md` - Added purchase credits section
- `/Users/eric/dev/code/aidd/ai/rules/user-testing.mdc` - Implemented offer() function for in-console CTA
- `/Users/eric/dev/code/aidd/.cursor/commands/user-test.md` - Updated Stripe URL

**Key Outcomes**:
- Accurate Nielsen Norman research cited (3 users = 65%, 5 users = 85%)
- Mathematical proof that 3+3 = 87.75% > single batch of 5 (85%)
- Clear cost efficiency comparison showing 3+3 is 50% more efficient per percentage point
- Product description for checkout page delivered
- Purchase CTA properly separated from artifact files (console-only via offer() function)
- All documentation consistently promotes 6-test minimum (two 3-user batches)
