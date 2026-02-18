# Scaffold Authoring Guide

A scaffold is a small repository that teaches `npx aidd create` how to bootstrap a new project. This guide covers the file layout, manifest format, how to validate your scaffold locally, and how to publish it as a GitHub release so consumers can reference it by URL.

---

## File layout

```
my-scaffold/
├── SCAFFOLD-MANIFEST.yml   # required — list of steps to execute
├── README.md               # optional — displayed to the user before steps run
├── bin/
│   └── extension.js        # optional — Node.js script run after all steps
└── package.json            # required for publishing — see below
```

---

## SCAFFOLD-MANIFEST.yml

The manifest is a YAML file with a single `steps` key containing an ordered list of step objects. Each step must have exactly one of:

| Key | Type | Description |
|-----|------|-------------|
| `run` | string | Shell command executed in the project directory |
| `prompt` | string | Sent to the configured AI agent CLI (default: `claude`) |

```yaml
steps:
  - run: npm init -y
  - run: npm pkg set scripts.test="vitest run"
  - run: npm pkg set scripts.release="release-it"
  - run: npm install --save-dev vitest@latest release-it@latest
  - prompt: Set up a basic project structure with src/ and tests/
```

### Validation rules

`npx aidd create` validates the manifest before executing any steps. Your manifest will be rejected with a clear error if:

- `steps` is not an array (e.g. a string or plain object)
- Any step is not a plain object (e.g. a bare string or `null`)
- Any step has no recognized keys (`run` or `prompt`)

Run `npx aidd verify-scaffold <name-or-uri>` at any time to check your manifest without executing it:

```bash
# Verify a named built-in scaffold
npx aidd verify-scaffold scaffold-example

# Verify a local scaffold by file URI
npx aidd verify-scaffold file:///path/to/my-scaffold
```

---

## The `package.json` `files` array vs GitHub release assets

These two concepts are independent:

### `files` in `package.json` → controls npm publishing

When you run `npm publish`, npm reads the `files` array to decide which paths are included in the package tarball uploaded to the npm registry. Files not listed here are excluded from `npm install`.

```json
{
  "files": [
    "SCAFFOLD-MANIFEST.yml",
    "README.md",
    "bin/**/*"
  ]
}
```

### GitHub release assets → controlled by git + release workflow

A GitHub release contains:

1. **Auto-generated source tarballs** (`Source code (zip)` / `Source code (tar.gz)`) — these are snapshots of everything in the git repository at the tagged commit. The `files` array in `package.json` has **no effect** on this.
2. **Manually uploaded release assets** — anything you explicitly upload via the GitHub UI or a release workflow step.

For scaffold distribution, consumers download the source tarball from a GitHub release. This means every file you commit to the repository at the release tag will be available. The `files` array only matters if you also publish the scaffold to npm.

---

## Adding a release command to your scaffold's `package.json`

Include `release-it` as a dev dependency and wire up a `release` script:

```json
{
  "name": "my-aidd-scaffold",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "release": "release-it"
  },
  "files": [
    "SCAFFOLD-MANIFEST.yml",
    "README.md",
    "bin/**/*"
  ],
  "devDependencies": {
    "release-it": "latest"
  }
}
```

Running `npm run release` will:

1. Bump the version
2. Create a git tag (`v1.0.0`)
3. Push the tag to GitHub
4. Create a GitHub release with auto-generated release notes

Scaffold consumers can then reference your scaffold by its GitHub release tarball URL:

```bash
npx aidd create https://github.com/your-org/my-scaffold my-project
```

---

## Distributing via GitHub releases (recommended) vs git clone

| | GitHub release tarball | git clone |
|---|---|---|
| **Versioned** | Yes — pinned to a tag | No — always HEAD |
| **Reproducible** | Yes | No |
| **Download size** | Small — source only | Large — includes git history |
| **No git required on consumer** | Yes (HTTP download) | No (requires git) |

The AIDD resolver will download and extract the release tarball rather than cloning the repository, giving users a fast, versioned, reproducible scaffold install.

---

## Testing your scaffold locally

Use a `file://` URI to test your scaffold without publishing:

```bash
npx aidd verify-scaffold file:///path/to/my-scaffold
npx aidd create file:///path/to/my-scaffold my-test-project
```
