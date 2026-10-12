# Create Listing demo

The `/create-listing` route implements six frontend-only steps: item details,
photos and product specifics, pricing and shipping, marketplace selection,
independent marketplace review, and final review.

## State and persistence

- React state retains master fields, photos, selection, and overrides when moving
  backward or forward within the workflow.
- Save Draft stores one text/settings draft under
  `crosslisting.create-listing.draft.v1` in this browser's localStorage. Saving
  replaces the previous draft; there is no server persistence or account.
- Restore browser draft explicitly replaces current form data. Invalid or
  unavailable storage produces inline feedback and preserves current input.
- Photos use temporary browser object URLs. They are not uploaded or saved in
  localStorage. Reselect photos after restoring a draft or refreshing the page.
- The first photo is primary. Any photo can become primary; removing the primary
  promotes the next photo. URLs are released on removal and unmount.
- Unsaved input and publish results are lost when leaving or refreshing the page.
- Load example item replaces the form with a vintage jacket example, selecting
  eBay, Depop, and Vinted. The user must supply local photos.

## Mock marketplace behavior

All seven destinations are labeled demo/not connected. The central registry in
`lib/listing/config.ts` does not assert real API availability or current platform
requirements. Illustrative additional rules are parcel size for Vinted, item
eligibility for Etsy, shipping region for Grailed, and fulfillment preference for
Facebook Marketplace. Other demo destinations need only valid inherited item
data and a photo.

Title, description, and price inherit master values until explicitly overridden.
Edits create overrides scoped to one marketplace. Restore master value removes
that override and resumes inheritance. Unselecting a marketplace retains its
configuration for reselection, but excludes it from review and publishing.

Publish Ready Listings performs a synchronous client-side simulation. Ready
selected marketplaces become `Live (simulated)`, while incomplete selected
marketplaces remain `Draft (simulated)` with individual issues. It makes no
marketplace/network calls and does not update dashboard fixtures, inventory
pages, or the saved browser draft. Editing form values invalidates prior results.

## Implementation boundaries

`lib/listing/types.ts` defines form and marketplace draft types.
`lib/listing/config.ts` centralizes categories, destinations, and example data.
`lib/listing/validation.ts` contains pure inheritance, readiness, and simulation
logic. `lib/listing/draft-storage.ts` owns guarded browser draft serialization.
`components/listing/` contains the workflow coordinator and reusable form steps.

Quantity defaults to 1 and is validated as a positive whole number. It is demo
form data only; multi-unit inventory synchronization is not implemented.

No dependencies, authentication, database, API routes, marketplace connectors,
payments, or production services were added.
