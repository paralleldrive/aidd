#!/bin/bash

# Pre-Flight Validation Gate for AIDD Task Definitions
# Validates task files against framework requirements
# Usage: bash cursor/aidd-validate-task.sh aidd-planning/task-1.md

set -e

TASK_FILE=$1

if [ -z "$TASK_FILE" ]; then
  echo "Usage: $0 <task-file>"
  exit 1
fi

if [ ! -f "$TASK_FILE" ]; then
  echo "Error: Task file not found: $TASK_FILE"
  exit 1
fi

ERRORS=0

echo "🚀 AIDD Pre-Flight Validation Gate"
echo "Task: $TASK_FILE"
echo ""

# Check 1: Mandatory Sections
echo "✓ Check 1: Mandatory Sections"
for section in "CodeContext" "StyleGuides" "Validation Scripts"; do
  if grep -q "## $section" "$TASK_FILE"; then
    echo "  ✅ $section"
  else
    echo "  ❌ MISSING: $section"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check for Storybook Strategy if UI component task
if grep -qi "component\|ui\|card\|button\|widget" "$TASK_FILE"; then
  if grep -q "## Storybook Strategy" "$TASK_FILE"; then
    echo "  ✅ Storybook Strategy (UI component)"
  else
    echo "  ⚠️  Storybook Strategy missing (recommended for UI components)"
  fi
fi

# Check 2: Subjective Language
echo ""
echo "✓ Check 2: Subjective Language"
SUBJECTIVE=$(grep -A 100 "## Success Criteria" "$TASK_FILE" | \
  grep -i -E "distinct|clean|proper|appropriate|nice|elegant|suitable|good|better" | \
  wc -l || true)

if [ $SUBJECTIVE -gt 0 ]; then
  echo "  ❌ Found $SUBJECTIVE subjective terms"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ No subjective language"
fi

# Check 3: ValidationScripts Format
echo ""
echo "✓ Check 3: ValidationScripts Format"
if grep -q "## Validation Scripts" "$TASK_FILE"; then
  echo "  ✅ Section exists"
else
  echo "  ❌ Missing ValidationScripts section"
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ VALIDATION PASSED"
  exit 0
else
  echo "❌ VALIDATION FAILED ($ERRORS errors)"
  exit 1
fi
