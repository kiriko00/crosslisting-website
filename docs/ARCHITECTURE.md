# Crosslisting Architecture

## Purpose and status

This document describes the intended architecture conceptually. It guides domain
boundaries and future implementation but does not authorize production
infrastructure during the current mock-data stage.

The immediate application should keep data contracts and UI boundaries clear
enough that mock repositories can later be replaced with real services without
rewriting the product model.

## Architectural principles

- The master inventory item is the canonical description of a physical item.
- Marketplace listings are separate records derived from, and linked to, the
  master item.
- Marketplace-specific overrides never overwrite canonical master data.
- Validation, publishing, synchronization, errors, and status are isolated by
  marketplace listing.
- External operations are asynchronous and may partially fail.
- Sale processing and delisting must be idempotent, observable, and honest about
  confirmed versus attempted outcomes.
- Integrations use official APIs and authorization mechanisms only.
- Secrets, tokens, and connector operations belong on trusted server-side
  infrastructure, never in browser code.

## Conceptual system boundaries

The future product can be understood as five cooperating areas:

1. **Web application** — inventory, listing, error, marketplace, and sales user
   experiences.
2. **Application services** — workflows such as creating an item, deriving a
   listing, publishing, recording a sale, and coordinating delisting.
3. **Persistence and storage** — relational product records, audit/history data,
   and object storage for images.
4. **Marketplace connectors** — adapters that translate the internal model to
   each authorized marketplace API.
5. **Background processing** — retries, webhook handling, polling where
   officially supported, synchronization, and delisting jobs.

In the current stage, typed mock data and in-memory behavior stand in for areas
2–5. UI code should not pretend those substitutes provide persistence or real
external communication.

## Domain model

### MasterInventoryItem

Represents one physical resale item.

Conceptual fields include:

- `id` and seller-scoped internal `sku`
- `category` and optional subcategory
- Canonical `title` and `description`
- Brand, condition, size, color, materials, style, and category attributes
- Measurements and product identifiers
- Ordered image references
- Default asking price and currency
- Internal notes and tags
- Inventory status such as draft, active, or sold
- Acquisition, creation, update, listing, and sold timestamps where known
- Optimistic concurrency or version metadata for safe future updates

The master item should not contain a single marketplace status because its
marketplace listings may be in different states simultaneously.

### MarketplaceListing

Represents one master item on one marketplace.

Conceptual fields include:

- `id`
- `inventoryItemId`
- Marketplace identifier
- External listing ID and URL when they exist
- Status: Draft, Ready, Publishing, Live, Error, Sold, or Delisted
- Field overrides for title, description, price, images, shipping, category, and
  other marketplace-permitted values
- Marketplace-specific attributes and selected policies
- Structured validation issues
- Last error code and safe user-facing message
- Last attempted, published, synchronized, and delisted timestamps
- External version or revision data where supported

A unique constraint should prevent accidental duplicate active records for the
same master item and marketplace unless a future product requirement explicitly
allows them.

### Effective listing data

Effective listing data is produced by combining:

1. Canonical master item fields.
2. Explicit marketplace overrides.
3. Marketplace mappings, defaults, and allowed values.

This combined representation is computed for validation and publishing. It does
not copy every inherited value back into the master or obscure which values are
overrides.

### Sale

Represents a confirmed marketplace sale or a manually recorded off-platform
sale. Conceptual fields include the master item, source, source event ID,
marketplace listing when applicable, sale amount and currency when known, sold
time, and processing state.

External event identifiers and idempotency keys should prevent duplicate sale
records when a webhook or job is retried.

### Operation and issue records

Publishing, updating, synchronizing, and delisting are asynchronous operations.
Future persistence should retain enough structured operation history to answer:

- What action was requested?
- Which marketplace listing was affected?
- Was it accepted, attempted, confirmed, retried, or failed?
- What safe error can the seller act on?
- When should the system try again?

Structured validation issues should remain separate from transient connector or
network failures.

## Marketplace connector/adapter concept

Each marketplace connector translates between Crosslisting's stable internal
model and one official marketplace API. Application workflows should depend on
a shared connector contract rather than marketplace-specific conditionals spread
through UI components.

A connector may conceptually provide:

- A capabilities description: supported categories, fields, overrides, image
  limits, shipping policies, and available operations.
- Marketplace-specific validation of effective listing data.
- Category and attribute mapping.
- Create, update, publish, and delist operations supported by the official API.
- Retrieval or synchronization of listing status.
- Authorized sale/order event handling through official webhooks or supported
  polling.
- Normalization of external responses into safe internal results and errors.

Connectors do not receive raw marketplace passwords. Future connections should
use the marketplace's official OAuth or equivalent authorization flow and store
encrypted tokens server-side. The UI receives connection state and capabilities,
not secrets.

eBay is the expected first real connector. Additional connectors should be added
only after confirming official API access, authorization terms, capabilities,
and operational constraints. A marketplace without appropriate official access
can remain visibly unsupported rather than being automated through scraping.

## Validation and independent publishing

Validation occurs per marketplace listing. A coordinator can request validation
for several selected marketplaces, but each result is stored and displayed
independently.

For example, if an item is ready for eBay but lacks a required attribute for
another marketplace, eBay may transition from Ready to Publishing while the
other listing remains Draft or Error. Batch UI must report a result for every
selected marketplace instead of reducing partial success to a single boolean.

## Future sale and delisting workflow

The conceptual marketplace-originated workflow is:

1. Receive an authenticated official webhook or fetch a supported sale event.
2. Deduplicate the event using its marketplace identity and idempotency data.
3. Record the sale and mark the source marketplace listing Sold.
4. Atomically mark the master inventory item Sold if it is not already sold.
5. Create independent delisting operations for every other Live listing.
6. Process each delisting operation through its connector.
7. Mark each listing Delisted only after marketplace confirmation; otherwise
   retain an actionable Error or retry state.
8. Notify or surface attention when another marketplace cannot be delisted.

A manual sale begins at step 3 with a manual/off-platform source, then follows
the same delisting coordination. The user should be warned that delisting is not
instant and that attempts can fail.

The workflow must handle retries, out-of-order events, duplicate webhooks, and
the possibility of nearly simultaneous sales. It cannot guarantee that an item
will never sell twice, but it should minimize the risk and make exceptions
visible.

## Future authentication, database, and storage

These are deferred from the current stage. When introduced, the architecture
should include:

- A supported authentication system with seller-scoped authorization.
- A relational database for users, inventory items, marketplace listings,
  overrides, sales, operations, connections, and audit history.
- Authorization enforced in server-side data access, not only through hidden UI.
- Object storage for original product images and generated derivatives.
- Secure server-side token storage with encryption and rotation/revocation
  handling.
- Background job execution with retry policies and dead-letter or attention
  handling.
- Authenticated webhook endpoints with signature verification where supported.
- Observability that avoids logging secrets or sensitive marketplace payloads.

No specific vendor is selected by this document. Supabase or any other database,
authentication, queue, or storage provider requires an explicit future decision.

## Suggested application boundaries

As implementation grows, prefer clear boundaries such as:

- Domain types and pure functions for inventory, listing statuses, inheritance,
  and validation results.
- Repository interfaces for inventory, listings, sales, and connections.
- Application services for multi-record workflows.
- Connector interfaces isolated from UI and domain presentation.
- Server-only modules for persistence, tokens, and external API operations.
- Presentation components that consume typed view models rather than raw
  marketplace payloads.

The exact folder structure should follow the installed Next.js version and can
evolve with demonstrated complexity. Do not build speculative infrastructure
before its roadmap stage.

## Mock-stage architecture

For the application shell and early workflows:

- Use typed, deterministic mock records that reflect realistic domain states.
- Include mixed listing statuses so Missing and Errors experiences can be built
  honestly.
- Keep mock access behind small modules or repository-shaped functions rather
  than embedding large datasets throughout components.
- Label simulated mutations and reset behavior clearly.
- Do not add fake API delays or elaborate mock servers unless a task has a
  concrete interaction need.
- Do not add credentials, external calls, authentication, database clients, or
  production service abstractions prematurely.
