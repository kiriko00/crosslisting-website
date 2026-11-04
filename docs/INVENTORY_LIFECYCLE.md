# Inventory lifecycle and connector foundation

## Scope and rollout

Authentication and initial inventory persistence are reported working by the
project owner. This milestone adds real edits, archive/delete, manual sales,
Sales/Listings reads, explicit destination selection, and connector contracts.
No remote migrations, live data mutations, marketplace calls, or credentials
were used to implement/test it. A local isolated PostgreSQL test is not a remote
deployment test. No npm dependency was added to the application.

New migration:
`supabase/migrations/20261026195800_inventory_lifecycle.sql`.

From the repository root, after reviewing the SQL and confirming the intended
project is linked:

```sh
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase db push --linked
```

The dry-run must propose only the new lifecycle migration if the first backend
milestone is already applied. Do not re-run older migrations or repair history
without verifying it. If linking is needed first:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

No additional Auth/dashboard setting or service-role key is required. The existing
private bucket, Data API grants, email settings, and normal user cookies remain.
The new queue table and RPC functions have explicit authenticated grants/RLS.

## User workflows

- Edit from `/inventory/[id]/edit` reuses the six-step form. All master fields,
  ordered signed-photo previews, selected destinations, title/description/price
  overrides, and specifics are restored. Stored listing statuses/missing fields
  are shown separately from recomputed illustrative readiness.
- Save changes updates the same master and retains existing marketplace row IDs
  through upserts. Add/remove internal destinations; selected destinations with
  external IDs, Live/Publishing/Sold states, or delisting history cannot silently
  be removed. The endpoint and SQL both protect ownership; SQL is authoritative.
- New photo files upload privately; retained paths must already belong to this
  item. The submitted order becomes `sort_order` beginning at zero. Photo metadata
  replacement and item/listing changes commit atomically. Old metadata IDs may
  change, but retained object paths/files are not re-uploaded.
- Save changes does not reset Sold/Archived/Active master status or overwrite
  historical/external listing states with Ready. No edit publishes externally.
- Archive retains item/photos/listing/sale history and excludes the master from
  normal inventory. `/inventory/archived` shows archived and deletion-pending
  records. Archive does not externally remove a listing; relevant rows are flagged.
- Permanent deletion is secondary and requires typing `DELETE`. It removes item,
  listings, photo metadata, and sales history. The UI recommends archive instead.
  Live/Publishing or unresolved externally identified listings block deletion.
- Mark sold records one whole-item sale, including the entire quantity when
  quantity is greater than one; partial-unit reconciliation remains unsupported.
  Choose a selected listing or local/manual/off-platform/custom channel, price,
  optional fees/shipping, and UTC sold date. Future dates are rejected.
- Sale record, master Sold/sold_at, source listing Sold, and other Ready/Live/
  Publishing delisting requirements commit together. Other listing statuses stay
  unchanged. Internal Ready rows might never have existed externally: the UI
  explicitly requires manual verification, not a claim of external removal.
- Sales reads real owned records, including archived masters. Approximate net is
  sale price minus fees and shipping (integer-cent calculation). Missing costs
  are treated as zero for that estimate; acquisition cost/tax/profit are excluded.
- Listings > Live filters stored `live` rows; no current connector can verify
  them externally. Missing scans selected destinations on Draft/Active items for
  absent records, missing information, or no stored Live state. Errors displays
  `error` rows and their stored message. All views link to the owned master.
- Missing pagination scans 24 master items per page before deriving rows. A page
  may have no missing destinations even if another page does; it is labelled as
  an inventory scan, not an exact missing-listing count.

## Schema, concurrency, and retries

- `inventory_items.revision` is advanced by a small BEFORE UPDATE trigger.
  `last_mutation_id` makes retries of the same edit idempotent. A row lock and
  expected revision reject stale concurrent edits/archive/sales rather than
  silently overwriting another operation. Reload before starting a fresh edit.
- `selected_marketplaces` records intended destinations separately from listing
  rows, so missing rows are detectable. Existing selections are backfilled from
  current listings; new creates/edits explicitly maintain the array. A missing
  destination is restored on edit/save without inventing external status.
- Sales use a stable UUID request ID. Retrying that ID returns the same sale;
  another sale for an already-sold/master-with-sale record is rejected. Legacy
  duplicate sale rows are not destructively changed by this migration.
- `marketplace_listings.delisting_status` is None/Required/Pending/Succeeded/Error
  in persisted lowercase values, with `delisting_error`. Required is durable work,
  not a completed operation. This is a minimal state boundary, not a job worker.
- Existing table/storage RLS remains intact. All new functions use invoker rights
  and an empty search path, with execution granted only to authenticated users.
  No service-role bypass or anonymous reads are introduced.

## Photo cleanup and permanent deletion

Removed-photo paths are written to `photo_cleanup_jobs` inside the edit
transaction before metadata is replaced. Jobs are directly seller-owned, path-
constrained, and RLS-protected. They intentionally have no FK to the item so
cleanup can outlive metadata. The server checks retained photo references before
removing objects through Storage APIs, then removes completed jobs. Failure keeps
jobs durable and visible on item details with a Retry photo cleanup action.

Permanent deletion has three steps:

```text
Mark deletion_pending under item lock
    -> list/remove every file under USER_UUID/ITEM_UUID/ using Storage APIs
    -> database verifies no Storage object metadata remains, then deletes item
```

Edits/sales are blocked while deletion is pending. Normal inventory excludes the
item, but Archived / deletion pending retains a retry link. Listing/removal errors,
unexpected nested folders, or a non-progressing Storage API response stop before
deleting database records. Retrying resumes cleanup. The final RPC reads Storage
metadata but never writes `storage.objects`; the application uses Storage APIs.

Storage is not a PostgreSQL transaction. In-flight requests, process crashes,
ambiguous responses, account deletion outside the app, or cleanup outages can
still require administrator attention. Failed new uploads are compensated where
safe; uncertain edit outcomes preserve files until reconciliation. There is no
scheduled orphan-file worker. Auth account deletion, global cleanup management,
archive restoration, refunds/reopening sales, and partial sales remain follow-up.
Never delete `storage.objects` rows directly on the real project.

## Connector architecture

```text
Master inventory item
    -> marketplace listing records (overrides, status, external ID)
    -> MarketplaceConnector (only approved implemented capabilities)
    -> official external marketplace API (future; no calls today)
```

`lib/connectors/config.ts` centralizes API access/availability metadata. eBay and
Etsy are Planned primary integrations; Depop requires partner access; Vinted is
restricted to approved/allowlisted Pro access. Poshmark, Grailed, and Facebook
Marketplace have no supported implemented seller connector. Meta Content Library
is not treated as a seller-publishing API. No destination is Available/connected
today and every implemented-capability list is empty.

`MarketplaceConnector` has optional authorization, create, update, delist, status,
sale detection, and sale verification methods. A server-side connection reference
will resolve secure credentials later; no password/token table is added now.
Planned capabilities are candidates subject to official access review, not a
guarantee that every destination supports every method.

`recordSaleAndRequireDelisting` is the shared server sale boundary for manual
confirmation and future verified connector events. It commits through the atomic
RPC before any external worker could run. The future worker can use
`requestDelisting`: resolve an authorized adapter, invoke only supported delist
methods, and persist each outcome independently. Missing adapters/IDs remain
Required; exceptions/unconfirmed responses are Error; only a confirmed result
can become Succeeded. One destination failure does not undo the sale or erase
another destination's success. Persistence failure surfaces instead of silently
losing an outcome. Fake adapters exist only inside unit tests.

Before wiring a real worker, add authorization/token lifecycle, leases/retries,
verified event deduplication, optimistic/fenced external updates, and reconciliation
for timeouts. No background worker, OAuth flow, or live network adapter is supplied.
Official APIs preserve seller consent, documented capabilities, and authorization
boundaries. Credential-based browser bots/scraping are not a fallback when access
is unavailable.

Official references (access availability reviewed 2026-10-26):

- [eBay Inventory API](https://developer.ebay.com/api-docs/sell/inventory/overview.html)
- [Etsy Open API](https://developers.etsy.com/documentation/)
- [Depop partner authentication](https://partnerapi.depop.com/api-docs/concepts/authentication/)
- [Vinted Pro Integrations access](https://pro-docs.svc.vinted.com/)
- [Meta Content Library](https://transparency.meta.com/researchtools/meta-content-library/)

## Files changed

New:

- `supabase/migrations/20261026195800_inventory_lifecycle.sql`.
- `app/(workspace)/inventory/[id]/edit/page.tsx`,
  `app/(workspace)/inventory/archived/page.tsx`, `app/api/inventory/[id]/route.ts`.
- `components/inventory/item-actions.tsx`, `listings-page.tsx`,
  `record-pagination.tsx`.
- `lib/connectors/types.ts`, `config.ts`, `delisting.ts`, `delisting.test.ts`.
- `lib/inventory/edit.ts`, `delete.ts`, `storage.ts`, `sale.ts`,
  `sales-service.ts`, `records.ts`, `missing.ts`, `lifecycle.test.ts`.
- `lib/listing/hydrate.ts`, `scripts/test-lifecycle-db.mjs`,
  `docs/INVENTORY_LIFECYCLE.md`.

Updated:

- `app/(workspace)/inventory/[id]/page.tsx`, `sales/page.tsx`,
  `marketplaces/page.tsx`, `listings/page.tsx`, `listings/live/page.tsx`,
  `listings/missing/page.tsx`, `listings/errors/page.tsx`.
- `components/inventory/inventory-list.tsx`, `inventory-page.tsx`;
  `components/dashboard/dashboard-stats.tsx`, `marketplace-summary.tsx`.
- `components/listing/listing-workflow.tsx`, `final-review.tsx`,
  `marketplace-selector.tsx`, `sortable-photos.tsx`.
- `lib/inventory/queries.ts`, `lib/listing/types.ts`, `lib/marketplaces.ts`,
  `lib/supabase/database.types.ts`, `scripts/run-tests.mjs`.
- `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `PRODUCT_SPEC.md`,
  `ROADMAP.md`, `CREATE_LISTING_DEMO.md`, `BACKEND_SETUP.md`.

No prior migration, authentication implementation, environment values, RLS
policies on existing tables, package manifest, or lockfile was modified.

## Checks

Run `npm test`, `npm run lint`,
`./node_modules/.bin/tsc --noEmit --incremental false`, and
`npm run build -- --webpack`.

`scripts/test-lifecycle-db.mjs` optionally accepts the absolute path to a PGlite
module installed outside the repository, for example:

```sh
node scripts/test-lifecycle-db.mjs /ABSOLUTE/TEMP/node_modules/@electric-sql/pglite/dist/index.js
```

It creates an in-memory Supabase-like Auth/Storage schema, applies all four SQL
migrations there, and checks ownership, edit/retry/conflicts, atomic sales,
delisting flags, archive, deletion fencing/Storage guards, and cascades. Its local
Storage stub models metadata only; it is not the Supabase Storage service.
The isolated test tool is not an application dependency.

After manually applying the migration, test with two real accounts: cross-owner
edit/sale/delete denial, photo upload/removal failures, stale concurrent edits,
duplicate sale requests, and archived/Sold/Live/Missing/Errors filters. Verify file
removal through Storage APIs and ensure no success state implies publishing or
external delisting. No live acceptance data is created automatically.
