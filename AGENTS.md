<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Crosslisting project instructions

These instructions apply to the entire repository. Keep the generated Next.js
rules above intact.

## Read before implementing

- Read the relevant documents in `docs/` before implementing or changing a
  feature:
  - `docs/PRODUCT_SPEC.md` for product behavior, terminology, and scope.
  - `docs/DESIGN_SYSTEM.md` for visual and interaction rules.
  - `docs/ARCHITECTURE.md` for domain boundaries and the intended future
    architecture.
  - `docs/ROADMAP.md` for the current implementation stage and deferred work.
- Treat those documents as the project source of truth. If a request conflicts
  with them, call out the conflict rather than silently inventing a new product
  direction.
- Read the relevant bundled Next.js guide named above before writing Next.js
  code. Do not assume conventions from an older Next.js version.

## Current product boundary

- The current implementation stage is an application shell backed by mock data.
- Do not add authentication, a database, Supabase, marketplace APIs, payments,
  or production backend infrastructure unless a task explicitly advances the
  roadmap to that stage.
- Clearly distinguish mock/demo behavior from real, persisted, or integrated
  functionality in both the UI and implementation notes. Never imply that a
  simulated publish, sale, sync, or delist operation reached a marketplace.
- Do not implement features outside the requested scope.

## Engineering rules

- Use TypeScript for application code and keep types explicit at important
  domain and component boundaries.
- Keep components reusable and reasonably scoped. Extract shared behavior when
  it has a real reuse case; do not create abstractions solely for abstraction's
  sake.
- Do not introduce a dependency without a concrete reason that the existing
  platform or dependencies cannot reasonably satisfy.
- Do not alter unrelated functionality, styling, configuration, or content.
- Preserve the separation between a master inventory item and its derived
  marketplace listings. Marketplace-specific overrides must not overwrite the
  master item.
- Keep marketplace validation and failures isolated: a problem with one
  marketplace must not block an otherwise-ready marketplace.

## Design rules

- Follow `docs/DESIGN_SYSTEM.md` instead of inventing a new visual language for
  each page.
- Favor a restrained, professional, information-dense SaaS interface with clear
  hierarchy and accessible interaction states.
- The desktop workflow is primary, but every implemented screen must remain
  usable at smaller responsive widths.
- Avoid gratuitous gradients, oversized marketing typography inside the app,
  excessive animation, decorative glass effects, and inconsistent radii or
  spacing.

## Integrations and security

- Prefer official, documented, and authorized marketplace APIs.
- Do not design or implement credential scraping, browser bots, or workflows
  that ask users for marketplace passwords outside an official authorization
  flow.
- Never expose, commit, log, or place secrets and API credentials in client-side
  code. Future tokens must be handled only by secure server-side infrastructure.

## Verification and handoff

- After meaningful code changes, run the checks appropriate to the change. The
  normal baseline is lint, TypeScript validation, and a production build.
- Report which checks were run and whether they passed. If a check could not be
  run, state why.
- Keep documentation aligned when a requested product decision changes a
  documented workflow, domain rule, architecture boundary, or roadmap stage.
