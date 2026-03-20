# next-shadcn

The default AIDD scaffold for bootstrapping a Next.js project with shadcn/ui.

## What this scaffold sets up

- **Next.js** — React framework with App Router
- **shadcn/ui** — accessible, composable component library
- **Tailwind CSS** — utility-first CSS framework
- **TypeScript** — static type checking
- **Vitest** — fast unit test runner
- **Playwright** — end-to-end browser testing

## Usage

```sh
npx aidd create next-shadcn my-app
```

Or simply (next-shadcn is the default):

```sh
npx aidd create my-app
```

## How it works

No local clone of the aidd repository is required. Named scaffolds ship inside
the `aidd` npm package itself, so `npx aidd create my-app` fetches and runs this
scaffold entirely through npm — the scaffold files are copied from the installed
package into the new project folder before any steps run.

The manifest follows the required ordering rule: the first step runs `npx aidd .`
to install the AIDD framework in the new project, ensuring it is available before
the AI agent `prompt:` step executes.
