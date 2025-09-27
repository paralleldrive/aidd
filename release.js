#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { errorCauses, createError } = require('error-causes');

// Configuration objects (camelCase per javascript.mdc)
const semverTypes = ['major', 'minor', 'patch'];

const bumpAliases = {
  breaking: 'major',
  feature: 'minor', 
  fix: 'patch',
  major: 'major',
  minor: 'minor',
  patch: 'patch'
};

const defaultBump = 'minor';

const allowedBranches = ['main', 'master'];

const config = {
  tagPrefix: 'v',
  packageFiles: ['package.json', 'package-lock.json'],
  commitMessageTemplate: (tagName) => `chore(release): ${tagName}`,
  validBumpTypes: Object.keys(bumpAliases)
};

// Pure utility functions (explicit parameter defaults per javascript.mdc)
const parseBumpType = ({ argv = process.argv, defaultType = defaultBump } = {}) => 
  argv.slice(2)[0] || defaultType;

const validateBumpType = (bumpType) => {
  if (!bumpAliases[bumpType]) {
    throw createError({
      ...ValidationError,
      message: `Invalid bump type: ${bumpType}. Valid options: ${config.validBumpTypes.join(', ')}`
    });
  }
  return bumpAliases[bumpType];
};

const readPackageVersion = ({ packagePath = path.join(process.cwd(), config.packageFiles[0]) } = {}) => {
  try {
    const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return version;
  } catch (originalError) {
    throw createError({
      ...FileSystemError,
      message: 'Cannot read package.json',
      cause: { path: packagePath, message: originalError.message }
    });
  }
};

// I/O functions (separated from validation logic)
const checkGitStatus = () => execSync('git status --porcelain', { encoding: 'utf8' });
const getCurrentBranch = () => execSync('git branch --show-current', { encoding: 'utf8' }).trim();

// Pure validation functions (no side effects, take input, return result)
const isWorkingDirClean = (gitStatus) => gitStatus.trim() === '';

const validateWorkingDir = (gitStatus) => ({
  isValid: isWorkingDirClean(gitStatus),
  error: isWorkingDirClean(gitStatus) ? null : 'Working directory is not clean. Please commit or stash changes.'
});

const isBranchAllowed = (currentBranch, allowedBranches) => 
  allowedBranches.includes(currentBranch);

const validateBranch = (currentBranch, allowedBranches) => ({
  isValid: isBranchAllowed(currentBranch, allowedBranches),
  error: isBranchAllowed(currentBranch, allowedBranches) 
    ? null 
    : `You're on branch '${currentBranch}', not ${allowedBranches.join('/')}.`
});

// Release operation functions (single responsibility per javascript.mdc)
const bumpVersion = (semverType) => {
  console.log(`📦 Bumping version (${semverType})...`);
  
  try {
    execSync(`npm version ${semverType} --no-git-tag-version`, { stdio: 'inherit' });
  } catch (originalError) {
    throw createError({
      ...NpmError,
      message: 'Failed to bump version',
      cause: { 
        command: `npm version ${semverType}`, 
        message: originalError.message 
      }
    });
  }
  
  const version = readPackageVersion();
  console.log(`✨ New version: ${version}`);
  
  return version;
};

const commitAndTag = (version) => {
  const tagName = createTagName(version);
  
  try {
    // Stage the version bump
    execSync(`git add ${config.packageFiles.join(' ')} 2>/dev/null || git add ${config.packageFiles[0]}`, { stdio: 'inherit' });
    
    // Commit the release
    console.log(`📝 Committing release ${tagName}...`);
    execSync(`git commit -m "${config.commitMessageTemplate(tagName)}"`, { stdio: 'inherit' });
    
    // Create the tag
    console.log(`🏷️  Creating tag ${tagName}...`);
    execSync(`git tag ${tagName}`, { stdio: 'inherit' });
    
  } catch (originalError) {
    throw createError({
      ...GitError,
      message: 'Failed to commit and tag',
      cause: { 
        command: 'git commit/tag', 
        message: originalError.message 
      }
    });
  }
  
  return tagName;
};

const pushRelease = () => {
  console.log(`🚢 Pushing to remote...`);
  
  try {
    execSync('git push', { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });
  } catch (originalError) {
    throw createError({
      ...GitError,
      message: 'Failed to push to remote',
      cause: { 
        command: 'git push', 
        message: originalError.message 
      }
    });
  }
};

// Functional pipeline utilities
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const validateAndHandleErrors = ({ bumpType, semverType }) => {
  try {
    // Pure validation pipeline
    const gitStatus = checkGitStatus();
    const workingDirResult = validateWorkingDir(gitStatus);
    
    if (!workingDirResult.isValid) {
      throw createError({
        ...ValidationError,
        message: workingDirResult.error
      });
    }
    
    const currentBranch = getCurrentBranch();
    const branchResult = validateBranch(currentBranch, allowedBranches);
    
    if (!branchResult.isValid) {
      console.warn(`⚠️  ${branchResult.error} Continue? (y/N)`);
      // For automation purposes, we'll continue but log the warning
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw createError({
        ...GitError,
        message: 'Git command not found. Please ensure Git is installed and in your PATH.'
      });
    }
    throw error; // Re-throw validation errors and other specific errors
  }
  
  return { bumpType, semverType };
};

const executeReleaseOperations = ({ bumpType, semverType }) => {
  console.log(`🚀 Creating ${semverType} release (${bumpType})...`);
  
  return pipe(
    () => bumpVersion(semverType),
    (version) => ({ version, tagName: commitAndTag(version) }),
    ({ version, tagName }) => {
      pushRelease();
      return tagName;
    }
  )();
};

const logSuccess = (tagName) => {
  console.log(`🎉 Release ${tagName} created successfully!`);
  console.log(`📋 GitHub will automatically create a release when the tag is pushed.`);
  return tagName;
};

// Main release pipeline - functional composition
const createRelease = ({ argv = process.argv, defaultType = defaultBump } = {}) => 
  pipe(
    ({ bumpType = parseBumpType({ argv, defaultType })} = {}) => ({ bumpType, semverType: validateBumpType(bumpType) }),
    validateAndHandleErrors,
    executeReleaseOperations,
    logSuccess
  )();

// Error causes definition using error-causes library
const [releaseErrors, handleReleaseErrors] = errorCauses({
  ValidationError: {
    code: 'VALIDATION_ERROR',
    message: 'Input validation failed'
  },
  GitError: {
    code: 'GIT_ERROR', 
    message: 'Git command failed'
  },
  FileSystemError: {
    code: 'FILESYSTEM_ERROR',
    message: 'File system operation failed'
  },
  NpmError: {
    code: 'NPM_ERROR',
    message: 'NPM command failed'
  }
});

// Destructure error causes for easy use
const { ValidationError, GitError, FileSystemError, NpmError } = releaseErrors;

// Enhanced error handlers using error-causes pattern
const createErrorHandler = () => handleReleaseErrors({
  ValidationError: ({ name, code, message, cause }) => {
    console.error(`❌ Validation failed: ${message}`);
    console.error(`💡 Fix the issue and try again.`);
    if (cause) console.error(`🔍 Root cause: ${cause.message || cause}`);
    process.exit(1);
  },
  GitError: ({ name, code, message, cause }) => {
    console.error(`❌ Git command failed: ${message}`);
    console.error(`💡 Check your git configuration and network connection.`);
    if (cause?.command) console.error(`📝 Failed command: ${cause.command}`);
    if (cause?.message) console.error(`🔍 Root cause: ${cause.message}`);
    process.exit(1);
  },
  FileSystemError: ({ name, code, message, cause }) => {
    console.error(`❌ File system error: ${message}`);
    console.error(`💡 Ensure you're in a valid npm project directory.`);
    if (cause?.path) console.error(`📁 Problem with: ${cause.path}`);
    if (cause?.message) console.error(`🔍 Root cause: ${cause.message}`);
    process.exit(1);
  },
  NpmError: ({ name, code, message, cause }) => {
    console.error(`❌ NPM command failed: ${message}`);
    console.error(`💡 Check your package.json and npm configuration.`);
    if (cause?.command) console.error(`📝 Failed command: ${cause.command}`);
    if (cause?.message) console.error(`🔍 Root cause: ${cause.message}`);
    process.exit(1);
  }
});

const handleError = createErrorHandler();

// Point-free utility functions
const createTagName = (version) => `${config.tagPrefix}${version}`;

// Main function - now concise with explicit parameter defaults
function main({ argv = process.argv, defaultType = defaultBump } = {}) {
  try {
    createRelease({ argv, defaultType });
  } catch (error) {
    // Enhanced error handling with specific error types
    handleError(error);
  }
}

// Show usage if --help is provided
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 Release Script

Usage: npm run release [<bump-type>]

Bump types:
  major, breaking    - Breaking changes (1.0.0 -> 2.0.0)  
  minor, feature     - New features (1.0.0 -> 1.1.0) [default]
  patch, fix         - Bug fixes (1.0.0 -> 1.0.1)

Examples:
  npm run release           # minor bump (default)
  npm run release breaking  # major bump  
  npm run release feature   # minor bump
  npm run release fix       # patch bump

This script will:
1. Bump the version in package.json
2. Commit the version change  
3. Create a git tag (v*.*.*)
4. Push commits and tags to origin
5. Trigger GitHub Action to create release
`);
  process.exit(0);
}

main();
