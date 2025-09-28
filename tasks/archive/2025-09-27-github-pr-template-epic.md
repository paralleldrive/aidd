# GitHub PR Template Epic

**Status**: ✅ COMPLETED (2025-09-28)  
**Goal**: Create `.github/pull_request_template.md` with AI review instructions in HTML comments

## Epic Overview

Created a standardized GitHub pull request template that instructs reviewers to use the project's AI-powered code review system with proper style guide references.

## Task Breakdown

### Task 1: Create GitHub Directory Structure ✅

**Context**: Ensure `.github` directory exists for GitHub templates  
**Requirements**:

- Given no `.github` directory exists, should create it
- Given template needs a proper location, should follow GitHub conventions

**Success Criteria**:

- [x] `.github` directory exists in project root
- [x] Directory structure follows GitHub conventions

**Result**: Successfully created `.github` directory structure

### Task 2: Create Pull Request Template ✅

**Context**: Create standardized PR template with AI review instructions  
**Requirements**:

- Given reviewers need guidance, should include clear AI review instructions in HTML comments
- Given project uses JavaScript, should reference `ai/rules/javascript/javascript.mdc` style guide
- Given AI review system exists, should reference `ai/rules/review` command path

**Success Criteria**:

- [x] `pull_request_template.md` created in `.github` directory
- [x] Template includes reviewer instructions for AI review command in HTML comments
- [x] Template explicitly mentions `ai/rules/javascript/javascript.mdc` style guide
- [x] Template provides clear, actionable guidance for reviewers
- [x] Instructions are hidden from PR authors but visible to reviewers

**Result**: Created comprehensive PR template with hidden reviewer instructions

### Task 3: Validate Template ✅

**Context**: Ensure template content is accurate and functional  
**Requirements**:

- Given template references file paths, should verify paths exist
- Given template provides instructions, should ensure clarity and correctness

**Success Criteria**:

- [x] Referenced file paths are accurate (`ai/rules/review` and `ai/rules/javascript/javascript.mdc`)
- [x] Template format follows GitHub markdown standards
- [x] Instructions are clear and actionable

**Result**: Validated all file paths exist and template follows proper format

## Key Accomplishments

1. **Standardized Review Process**: Established consistent AI-powered code review workflow
2. **Hidden Reviewer Guidance**: Used HTML comments to provide instructions visible only to reviewers
3. **Proper File References**: Ensured accurate paths to project's AI review system and style guides
4. **Comprehensive Template**: Created full-featured PR template with standard sections and checklists

## Files Created

- `.github/pull_request_template.md` - GitHub pull request template with AI review instructions

## Impact

- **Consistency**: All future PRs will have standardized format and review process
- **Quality**: Reviewers will be guided to use AI review system with proper style guides
- **Efficiency**: Automated template reduces manual work for PR authors
- **Standards**: Enforces adherence to project's JavaScript style guide and review criteria
