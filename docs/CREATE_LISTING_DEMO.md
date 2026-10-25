# Create Listing workflow

The original six-step demo now saves real inventory for the signed-in user.
This filename is retained for existing documentation links. See
`BACKEND_SETUP.md` before enabling the backend deployment.

## State and saves

- React state retains master fields, files, photo order, selections, and overrides
  while moving between the same six form steps. Inputs are disabled during save.
- Save draft requires a title and valid supplied values, but permits incomplete
  publish-time fields and no photos/marketplaces. It creates a draft master item,
  selected marketplace records, and ordered photo metadata in the database.
- Save & prepare listings additionally requires complete common details, at least
  one photo, and one ready selected destination. Missing data for another
  marketplace does not block ready destinations.
- Both actions retain master status Draft. Each selected marketplace is saved
  independently as Draft or Ready; Ready is internal, not externally published.
- Success redirects to `/inventory/[id]`. Failed saves keep the current form and
  show an error; there is no localStorage draft persistence or automatic import
  of old browser-only drafts. Editing/resuming saved items is not implemented.
- The stable submission ID and database lock prevent duplicate records from
  double-clicks, concurrent attempts, and retries in this form instance. If a
  response is uncertain, retry the same form before starting a new item. After a
  reload, check Inventory before creating another item.
- Unsaved edits/files are lost on navigation or refresh. Load example fields
  loads sample text only; saving it creates a real item, not a demo record.

## Photos

- Up to 12 JPEG, PNG, or WebP photos, 10 MB each. The server checks size, MIME
  type, and file signatures. No SVG or arbitrary file upload is accepted.
- Object URLs provide local previews and are released on removal/unmount. File
  objects are uploaded only when saving; no blob URLs are stored in the database.
- The first ordered photo remains the Preview photo. Existing pointer dragging,
  keyboard movement, and Earlier/Later controls remain unchanged. Upload order is
  mapped to sequential `sort_order` values beginning at zero.
- Files go to the private `item-photos` bucket under the owner/item UUIDs. Failed
  saves use compensating cleanup; see the setup guide for remaining limits.

## Marketplace boundary

Selections, title/description/price overrides, marketplace-specific values, and
missing-field identifiers are persisted. Unset overrides inherit the master.
An explicit blank text override stays blank and incomplete; an empty numeric
price override must be corrected or restored before saving.

The seven marketplace destinations and their extra requirements remain
illustrative, not verified official API policies. No accounts are connected,
external IDs are generated, or Live transitions simulated. External publishing
must wait for future authorized integrations; do not describe Ready as Live.

## Implementation

- `lib/listing/types.ts`, `config.ts`, `validation.ts`: form contracts and internal
  illustrative readiness checks.
- `lib/listing/submission.ts`: server input validation and database mappings.
- `lib/listing/persist.ts`: testable upload/commit/cleanup coordination.
- `app/api/inventory/route.ts`: authenticated, same-origin save endpoint using
  Supabase Storage APIs and the atomic save RPC.
- `components/listing/`: existing workflow and reusable steps.

Field help, compact styling, local marketplace assets, and accessible photo
reordering remain unchanged. Multi-unit reconciliation, editing, sale mutations,
payments, and marketplace APIs are outside this milestone.
