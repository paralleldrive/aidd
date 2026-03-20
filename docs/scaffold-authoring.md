# Scaffold Authoring Guide

A scaffold is a small repository that teaches `npx aidd create` how to bootstrap a new project. This guide covers the file layout, manifest format, how to validate your scaffold locally, and how to publish it as a GitHub release so consumers can reference it by URL.

---

## File layout

```
my-scaffold/
├── SCAFFOLD-MANIFEST.yml   # required — list of steps to execute
├── README.md               # optional — displayed to the user before steps run
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
- Any step has both `run` and `prompt` keys (ambiguous — use two separate steps instead)
- Any `prompt:` step appears before a `run:` step that invokes the `aidd` CLI

**The `aidd` ordering rule:** every manifest that contains a `prompt:` step must first install the AIDD framework with a `run:` step such as `run: npx aidd .`. This ensures the AI agent has access to AIDD's prompts and skills when it runs. Valid invocation forms include `npx aidd`, `bunx aidd`, `yarn dlx aidd`, `pnpm dlx aidd`, and `npx -y aidd`.

    steps:
      - run: npx aidd .      # ← required before any prompt: step
      - prompt: Set up the project structure

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
    "README.md"
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
    "README.md"
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

Scaffold consumers reference your scaffold by its bare GitHub repo URL — `npx aidd create` automatically resolves it to the latest release tarball via the GitHub API:

```bash
npx aidd create https://github.com/your-org/my-scaffold my-project
```

---

## Distributing via GitHub releases

The AIDD resolver downloads a release tarball from GitHub rather than cloning the repository. This gives consumers a fast, versioned, reproducible install with no git tooling required. Git clone is not a supported consumer path — `npx aidd create` only accepts HTTP/HTTPS tarball URLs, named scaffolds bundled in the package, and `file://` URIs for local testing.

---

## Testing your scaffold locally

Use a `file://` URI to test your scaffold without publishing:

```bash
npx aidd verify-scaffold file:///path/to/my-scaffold
npx aidd create file:///path/to/my-scaffold my-test-project
```

### Downloaded scaffold files

When `npx aidd create` downloads a scaffold from a remote URL (HTTP/HTTPS), the temporary files in `~/.aidd/scaffold/` are removed automatically after the scaffold finishes — whether it succeeds or fails. There is no manual cleanup step required.

---

## Using named scaffolds (no local clone required)

The built-in scaffolds (`next-shadcn`, `scaffold-example`) are bundled inside the `aidd` npm package. When you run `npx aidd create my-app` or `npx aidd create next-shadcn my-app`, the CLI:

1. Locates the scaffold in the installed package (`<package>/ai/scaffolds/next-shadcn/`)
2. Copies the scaffold files into your new project directory
3. Executes the manifest steps inside that directory

No local clone of the `paralleldrive/aidd` repository is needed. The scaffold is fetched and run entirely through npm.

### Using `next-shadcn` (the default)

```bash
# Uses next-shadcn by default
npx aidd create my-app

# Equivalent — explicit scaffold name
npx aidd create next-shadcn my-app

# After scaffolding, kick off an agent in the new project automatically
npx aidd create my-app --prompt "Add authentication using NextAuth.js"
```

### Building a custom scaffold based on next-shadcn

Reference a GitHub release to create a versioned, shareable scaffold:

```bash
npx aidd create https://github.com/your-org/my-next-scaffold my-app
```

See _Distributing via GitHub releases_ above for packaging instructions.
