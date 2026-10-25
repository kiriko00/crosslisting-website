# Crosslisting Architecture

## Purpose and status

This document describes the domain boundaries and intended architecture.
The project owner reports that the initial PostgreSQL schema has been applied.
The first backend MVP now implements Supabase email/password sessions, protected
routes, private photo uploads, atomic draft persistence, owned Inventory/detail
pages, and live database dashboard metrics. New migrations are prepared but are
not automatically run. Marketplace integrations remain unavailable. Deployment
instructions and limitations are in `BACKEND_SETUP.md`.

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

Inventory reads/writes and media use Supabase; marketplace connectors and
background processing remain deferred. Marketplace readiness still uses
illustrative local rules, not verified connector capabilities.

## Initial PostgreSQL schema

The proposed schema lives in
`supabase/migrations/20261022001313_initial_crosslisting_schema.sql`. It targets
Supabase PostgreSQL 15 or later. Creating this file alone does not create remote
tables. The project owner reports it applied successfully; this implementation
does not reconnect to or reapply it.

```text
auth.users                     Supabase's existing user accounts
    |
    +-- inventory_items        The seller's master physical items
            |
            +-- marketplace_listings   One row per item per marketplace
            +-- item_photos            Ordered photo metadata
            +-- sales                  Simple sale records
```

`auth.users` already belongs to Supabase Auth; this migration does not create or
modify that table. Each `inventory_items.user_id` points to its owner's account.
Each child table uses `item_id` to point back to the physical inventory item.
For example, one vintage jacket can have separate eBay, Depop, and Vinted listing
rows while remaining one master item. Those rows have independent statuses and
overrides. A unique constraint permits at most one listing for the same item and
marketplace, including draft or delisted listings; relisting reuses that row.

### Table responsibilities

- **inventory_items:** canonical product details, free-form measurements, status,
  pricing, quantity, weight, and dates. A nonblank title and owner are required.
  Other product fields may be NULL so drafts can be incomplete. The existing
  workflow's required description/category/condition/price checks still apply
  before publishing; database nullability does not declare a listing ready.
  Quantity defaults to 1 and must be positive. Monetary amounts are finite,
  non-negative `numeric(12, 2)` values using the current UI's USD convention.
  Optional weight is a positive `numeric(12, 3)` value measured in pounds.
- **marketplace_listings:** the item's selected marketplace, independent status,
  external listing reference, overrides, and readiness/error information. A NULL
  override inherits the master value. `missing_fields` is a text array of field
  identifiers, while `marketplace_specifics` is a JSON object for values such as
  parcel size. Neither is a credential store. Credentials, OAuth tokens, and
  passwords are excluded from the schema.
- **item_photos:** a Storage path and non-negative order number for each photo.
  No binary images are stored in PostgreSQL. The lowest order number is the
  Preview photo. Duplicate order numbers within one item are forbidden; a
  future transactional reorder can defer that uniqueness check until commit.
  The new private bucket and upload implementation are described below.
- **sales:** a sale channel, amount, optional fees/shipping, and date for an item.
  `marketplace_listing_id` is optional so a local or other off-platform sale can
  be recorded. When present, a composite foreign key requires the listing to
  belong to the same inventory item, preventing mismatched sale attribution.
  This is operational sale history, not a full accounting ledger or a multi-unit
  stock reconciliation system.

All four tables use generated UUID primary keys and `timestamptz` dates. Item
statuses are `draft`, `active`, `sold`, and `archived`. Listing statuses are
`draft`, `ready`, `publishing`, `live`, `error`, `sold`, and `delisted`.

### Mapping from the current form

Persistence code maps the UI's display categories and conditions to
the migration's lowercase values (for example, `Clothing` to `clothing` and
`New with tags` to `new_with_tags`). The UI ID `facebook` maps to the database
value `facebook_marketplace`. Empty optional numeric fields become NULL rather
than empty strings. `lib/listing/submission.ts` validates and maps these fields
on the server before saving. A draft with an empty title cannot be persisted
as a database item, because the database requires a nonblank title.

### Ownership, RLS, and Data API access

Row Level Security is enabled on every application table. There are separate
SELECT, INSERT, UPDATE, and DELETE policies, each explicitly restricted to the
`authenticated` role. For inventory items, `auth.uid()` must match `user_id`.
For children, an ownership check follows `item_id` back to the master item.
UPDATE policies check both the current row and its proposed new parent/owner,
so moving a row to someone else's inventory is also rejected.

Grants and RLS do different jobs: grants let authenticated users reach these
four tables through the Data API, while RLS limits which rows they can use.
The migration explicitly grants schema usage and only SELECT, INSERT, UPDATE,
and DELETE on these four tables. It removes public/anonymous table access and
does not depend on automatic table exposure or a service-role client. No
public-read policy is created. This does not turn on a disabled Data API or
change the project's schema exposure settings.

The owner lookup is indexed by `inventory_items.user_id`. The unique indexes on
`(item_id, marketplace)` and `(item_id, sort_order)` also cover their item foreign
keys, avoiding duplicate indexes. Sales has an item index and a partial index
for non-null listing references to support ownership queries and safe deletion.

### Deletion and timestamps

Deleting a user cascades to their inventory items. Deleting an item cascades to
its listings, photo metadata, and sales; there are no orphan application rows.
Deleting only a marketplace listing retains the sale record and clears its
optional listing reference, keeping `item_id` and the recorded sale channel.
Removing photo metadata does not delete a future Storage object automatically;
that file lifecycle remains deferred.

A small invoker-rights trigger function updates `updated_at` for inventory items
and marketplace listings. It uses an empty search path and has no direct
public/anonymous/authenticated execute grant. There is no automatic sale event
processing, delisting, or marketplace synchronization in this migration.

## Conceptual domain model

### Backend MVP implementation

- `app/(workspace)` groups personal pages under an authenticated shell without
  changing their URLs. Root `proxy.ts` refreshes cookie sessions and redirects
  unauthenticated page requests. Each data query and write separately verifies
  identity with `getClaims()`; the layout/proxy is not the sole authorization.
- `lib/supabase/database.types.ts` is a hand-maintained database contract. Clients
  use the publishable key and user's session, never a service-role key.
- `POST /api/inventory` checks same-origin requests, verified identity, bounded
  form data, numeric/category/condition values, photo MIME types and signatures.
  The server maps form values; user ownership never comes from submitted JSON.
- The `item-photos` bucket is private, with a 10 MB image limit. Separate CRUD
  policies use the first path segment: `USER_UUID/ITEM_UUID/random-name.ext`.
  Upload/delete operations use Storage APIs, not table writes. Photo display uses
  owner-authorized signed URLs valid for 15 minutes, never public bucket URLs.
- An invoker-rights `create_inventory_item` RPC atomically inserts the master,
  selected marketplace rows, and photo metadata. Existing RLS remains enforced.
  A transaction-scoped lock and stable item UUID make concurrent retries
  idempotent. It accepts only Draft/Ready listing states and generates no
  external IDs. All newly saved master items remain Draft.
- Storage is outside the database transaction. Upload failure triggers cleanup
  before any item is created. A failed/ambiguous commit is checked against owned
  item/photo rows before deleting unreferenced uploads, preventing loss of photos
  from a save whose response was lost. Cleanup uncertainty is reported explicitly.
- Inventory filters and dashboard counts use owner-scoped database reads.
  Attention means a listing has an error or nonempty `missing_fields`. Recent
  activity shows latest item update dates, not invented marketplace events or a
  full audit trail. Marketplace connection displays remain placeholders.
- Setup requires the two new SQL migrations to be applied by the project owner;
  see `BACKEND_SETUP.md`. Saved-draft editing, sale mutations, automatic delisting,
  and automated abandoned-file cleanup are not implemented.

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

Supabase now provides the first authentication, inventory persistence, and
private-media implementation. Further production hardening and supporting
services remain future work. The eventual architecture should include:

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

Queue execution, deployment practices, and other supporting services still
require explicit future implementation decisions.

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

## Remaining mock boundaries

For future marketplace demonstrations and unimplemented workflows:

- Use typed, deterministic mock records that reflect realistic domain states.
- Include mixed listing statuses so Missing and Errors experiences can be built
  honestly.
- Keep mock access behind small modules or repository-shaped functions rather
  than embedding large datasets throughout components.
- Label simulated mutations and reset behavior clearly.
- Do not add fake API delays or elaborate mock servers unless a task has a
  concrete interaction need.
- Do not add marketplace credentials, external connector calls, or additional
  production service abstractions without an explicit task.
