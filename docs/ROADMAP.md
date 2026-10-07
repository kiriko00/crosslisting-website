# Crosslisting Roadmap

## Roadmap principles

- Stages describe sequence and scope, not committed calendar dates.
- Complete and validate the user experience with mock data before committing to
  production infrastructure.
- Do not pull authentication, persistence, payments, or marketplace integration
  work into an earlier stage for convenience.
- Each stage should preserve the domain boundaries in `ARCHITECTURE.md` and the
  behavior in `PRODUCT_SPEC.md`.
- Real integrations require official API access and a separate review of
  authorization, rate limits, policies, and failure modes.

## Stage 0 — Product foundation

**Goal:** Establish a stable shared understanding before feature implementation.

Scope:

- Product specification and terminology
- Design system and responsive UI principles
- Conceptual architecture and integration boundaries
- Implementation roadmap and repository instructions

Exit criteria:

- Core product decisions are documented.
- Future implementation tasks have clear scope and sources of truth.

## Stage 1 — Application shell and mock operational views

**Goal:** Build a coherent, responsive application experience using mock data
only.

Scope:

- Shared desktop-first responsive application shell
- Primary navigation for Dashboard, Inventory, Listings, Create Listing,
  Marketplaces, Sales, and Settings
- Reusable page headers, tables/lists, filters, metric cards, status badges,
  empty states, and error/attention patterns
- Typed mock inventory, marketplace listing, and sale data
- Dashboard with operational metrics and recent activity
- Inventory views for All Items, Drafts, and Sold
- Listings views for Live, Missing, and Errors
- Read-only or clearly simulated Marketplaces, Sales, and Settings experiences

Constraints:

- No authentication, database, Supabase, real APIs, payments, or production
  backend.
- Simulated behavior must be labeled as mock/demo behavior.
- Do not emphasize inventory value or monthly profit on the dashboard.

Exit criteria:

- Navigation and layouts work across intended responsive widths.
- Core records and independent marketplace statuses are understandable.
- Missing listings and errors have dedicated actionable views.
- Lint, type validation, and production build checks pass.

## Stage 2 — Mock master-item and listing-creation workflow

**Goal:** Validate the central master-first cross-listing workflow before adding
persistence or external integrations.

Scope:

- Create and edit a rich master inventory item
- Image selection/order UI using local mock previews where appropriate
- Marketplace selection
- Per-marketplace requirement review and validation
- Clear inheritance from master data
- Independent overrides for title, description, price, and permitted fields
- Per-marketplace Draft, Ready, Publishing, Live, Error, Sold, and Delisted
  simulations
- Independent save/publish outcomes so one incomplete marketplace does not block
  another
- Manual mark-as-sold demonstration and simulated delisting outcomes
- Clear reset behavior for non-persisted demo data

Constraints:

- Continue using typed mock/in-memory data only.
- Do not claim that simulated publish or delist actions reach marketplaces.
- Avoid choosing backend vendors through UI implementation shortcuts.

Exit criteria:

- A user can understand and complete the full hybrid workflow with mock data.
- Marketplace overrides remain separate from the master item.
- Partial readiness and partial failure are represented accurately.
- The workflow has been reviewed for responsive and accessible use.

## Stage 3 — Persistence, authentication, and media foundation

**Goal:** Replace mock persistence with secure seller-scoped application
infrastructure.

Prerequisite: explicit approval of the data model, provider choices, deployment
model, privacy requirements, and operational budget.

Scope:

- Authentication and account lifecycle
- Seller-scoped authorization
- Relational schema and migrations for inventory, marketplace listings,
  overrides, sales, and operation history
- Secure server-side data access
- Product image storage and lifecycle
- Persisted create/edit workflows
- Audit fields and safe concurrency handling
- Test strategy, backups, observability, and environment management

Not automatically included:

- Marketplace API connections
- Payments or subscriptions
- Complex accounting and profitability features

Exit criteria:

- Users can securely access only their own persisted data.
- Mock repositories are replaced without changing the product's domain model.
- Secrets and privileged operations remain server-side.
- Recovery, migration, and basic operational practices are documented.

## Stage 4 — Official eBay integration

**Goal:** Deliver the first authorized real marketplace connector and validate
the connector architecture.

Prerequisite: approved eBay API access and review of current eBay documentation,
policies, authorization, rate limits, listing requirements, webhook/event
options, and sandbox capabilities.

Scope:

- Official authorization flow and secure token lifecycle
- eBay capability, category, condition, attribute, shipping, and policy mapping
- Per-listing validation
- Create, publish, update, status synchronization, and delist operations supported
  by the official API
- Structured error normalization and retry behavior
- Official sale/order event handling where available
- Idempotent sale processing and cross-listing delist coordination
- Sandbox and production-readiness testing

Exit criteria:

- The UI distinguishes requested, attempted, and marketplace-confirmed states.
- Failures are actionable and do not corrupt the master item.
- Duplicate events and retries are safe.
- Operational monitoring and support procedures exist.

## Stage 5 — Additional official marketplace integrations

**Goal:** Expand marketplace coverage without weakening reliability or policy
compliance.

Each marketplace is evaluated separately for:

- Availability and suitability of an official API
- Authorized authentication model
- Listing creation, update, delisting, and sale-event capabilities
- Rate limits, approval requirements, platform policies, and ongoing maintenance
- Differences in categories, attributes, photos, shipping, and pricing

Scope for an approved marketplace:

- Implement the shared connector contract.
- Add marketplace-specific validation and mappings.
- Preserve independent status, errors, and overrides.
- Add connector tests and operational documentation.
- Update Missing and Errors workflows for the new capabilities.

Do not substitute credential scraping or browser bots when official access is
unavailable. The product may show a marketplace as planned, unavailable, or
manually tracked instead.

## Later candidates — Explicitly uncommitted

These ideas require separate product decisions and should not be assumed by
feature tasks:

- Team accounts and roles
- Bulk editing and bulk cross-listing
- Advanced automation rules
- Additional quantities or multi-unit inventory
- Shipping label workflows
- Deeper accounting, fees, expenses, profit, or tax reporting
- Payments and subscription billing
- Mobile-specific experiences beyond responsive web support

Operational inventory clarity and reliable official cross-listing remain higher
priority than expanding into unrelated seller tooling.
