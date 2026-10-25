# Backend MVP setup and verification

## Deployment status

The project owner reports the initial schema migration applied successfully.
The implementation adds real Supabase authentication, inventory saves/reads, and
private-photo APIs. These features require the configuration below and the two
new migrations. No remote migrations or account/data mutations are performed by
build/unit tests. The implementation task does not apply remote changes.

New migrations, in order:

1. `supabase/migrations/20261023223100_private_item_photos.sql`
2. `supabase/migrations/20261023223200_atomic_inventory_save.sql`

The first creates/configures the private `item-photos` bucket and four folder-
ownership policies. The second adds the RLS-respecting, authenticated-only
`create_inventory_item` function for atomic multi-table saves. Neither changes
existing application-table RLS or requires a service-role key.

## Apply migrations yourself

From the repository root, using the already installed Supabase CLI:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

Replace `YOUR_PROJECT_REF` with the intended project's reference. Do not paste
tokens/passwords into source code or this chat. Review the dry-run: it should
propose only the two new migrations above. Then explicitly apply:

```sh
npx supabase db push --linked
```

If the initial schema was applied manually in the SQL Editor, it may not appear
in migration history. Only after verifying that the existing schema exactly
matches `20261022001313_initial_crosslisting_schema.sql`, record that already-
applied version without re-executing it:

```sh
npx supabase migration repair 20261022001313 --status applied --linked
npx supabase db push --linked --dry-run
npx supabase db push --linked
```

Do not run `db reset`, reapply the initial schema, or repair mismatched history
blindly. If not using the CLI, run the two new SQL files, in order, in the
intended project's SQL Editor instead. Keep migration history consistent before
later switching back to CLI deployment. These are user-run commands only.

## Supabase dashboard and environment settings

- Enable Email/password authentication and user signups. Keep email confirmation
  enabled for normal production use. No social login is implemented.
- Set Auth URL Configuration's Site URL to the app origin, initially
  `http://localhost:3000`. Use the real HTTPS origin for deployment.
- Allow the corresponding `/auth/callback` and `/auth/confirm` URLs as redirect
  destinations for development/deployment. Avoid broad production wildcards.
- In the Confirm signup email template, use the server-compatible link:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/`.
  The app also supports the default PKCE exchange at `/auth/callback`; that flow
  requires the browser that initiated signup. Token-hash confirmation supports
  opening the email on another device.
- Configure reliable SMTP for real testers/production. Supabase's built-in email
  service has recipient and rate restrictions; check provider logs if needed.
- Retain `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in ignored local/deployment environment
  settings. Add `NEXT_PUBLIC_SITE_URL` with your app origin for deployed signup
  redirects; it defaults to `http://localhost:3000` for local development.
  Never add a service-role or secret key. Restart Next.js after env changes.
- Keep the Data API enabled and `public` schema exposed; automatic exposure of
  new tables can remain disabled. The migrations explicitly grant table CRUD
  and save-function execution only to authenticated users.
- Verify `item-photos` is private, all four policies are present, and no older
  permissive Storage policy grants other/anonymous users access to this bucket.
  Retain the 10 MB limit and JPEG/PNG/WebP allowlist.

## Real versus placeholder functionality

Real: email signup/sign-in/sign-out, cookie session refresh, server authorization,
private image uploads/signed reads, atomic new draft saves, independent listing
overrides/readiness persistence, owned Inventory/detail queries, database counts,
and latest inventory update timestamps.

Not implemented: marketplace accounts/APIs/publishing, verified marketplace
requirements, editing/resuming saved drafts, manual sale/status mutations,
delisting, payments, and a historical event/audit log. Sales and Listings pages
outside Inventory remain placeholders. There are no fabricated marketplace
sales, Live statuses, or external listing IDs. New master items remain Draft;
Active/Sold counts can legitimately be zero until future lifecycle functionality
or existing database data supplies those states.

## Failure handling and limitations

- A stable submission UUID is reused within a form instance. A database lock
  serializes concurrent calls with that UUID. Successful retries return the
  existing item instead of inserting duplicates. Changed form data cannot
  overwrite an already-saved item; editing is deferred. After uncertain failure,
  retry the same unchanged form, or check Inventory after refreshing.
- Uploads precede the database RPC. Parent/listing/photo inserts form one
  transaction; failure leaves no partial database item. Failed uploads and
  confirmed failed commits attempt Storage API deletion of attempted files.
- If a commit response is lost, owned database/photo rows are checked before
  cleanup. Referenced photos are preserved; only unused uploads are removed.
  If reconciliation is unavailable, private uploads are retained and the outcome
  is reported as uncertain rather than deleting potentially committed files.
- Storage and PostgreSQL cannot share a transaction. Process crashes or cleanup
  outages can leave private orphan files. No cleanup worker exists. An
  administrator should compare candidate paths with `item_photos.storage_path`
  before removing confirmed unused files through the Storage dashboard/API.
  Never delete `storage.objects` rows directly or blindly delete a user's folder.
- Existing item/user deletion cascades database metadata, not Storage files.
  Deletion UI is deferred until that lifecycle is handled. Production account
  deletion, backup/recovery, and observability remain follow-up work.
- Photo URLs are signed for 15 minutes; treat them as private bearer links. Anyone
  given a signed URL can read that photo until expiry. Refresh for new URLs; do
  not log/share them. They are not public bucket URLs.
- The multipart save endpoint accepts up to 12 × 10 MB images and buffers the
  submission. Hosting request-size/runtime limits may be lower, especially on
  serverless platforms. Check the target host before deployment; future direct-
  to-Storage/resumable uploads are needed for larger requests on constrained
  hosts. Signature checks are not full decoding or malware scanning.
- The save endpoint requires a same-origin Origin header. Configure reverse
  proxy/TLS forwarding correctly; do not disable that check to fix deployment.
- Supabase supplies Auth rate limits. Password recovery, resend-confirmation UI,
  social login, MFA, quotas, and custom abuse controls remain follow-up work.

## Acceptance checks after applying migrations

1. Use two test accounts you control. Confirm email, sign in, refresh, sign out,
   and check protected redirects. Test invalid credentials and confirmation links.
2. As A, save a title-only draft. Verify Inventory, Drafts, details, and dashboard
   after reload. Save an item with photos reordered and independent overrides;
   leave one destination incomplete and verify independent Draft/Ready states.
3. Double-click/retry a save: expect one item. Test upload/DB failure: expect no
   false success or partial database item. Inspect possible private orphan files.
4. As B, try A's detail URL and Storage path. Expect not-found/denied access.
   Test child INSERT/UPDATE against A's item with B's ordinary session, never a
   privileged key. Neither UI filtering nor a hidden link is an authorization test.
5. Compare dashboard counts with owned rows. Attention means errors or missing
   fields; activity means latest item updates, not invented marketplace events.
6. Check phone/desktop layouts, keyboard photo order, empty/loading/error states,
   failed sign-out, and expired signed-photo URLs.

Local checks: `npm test`, `npm run lint`,
`./node_modules/.bin/tsc --noEmit --incremental false`, and
`npm run build -- --webpack`. Isolated tests cover mapping, validation, readiness,
redirects, photo order, duplicate recovery, and cleanup. They do not replace live
two-account/RLS/email/Storage acceptance testing after deployment.

## Files in this milestone

Existing application pages were relocated under `app/(workspace)` without URL
changes: `page.tsx`, `create-listing/page.tsx`, `inventory/page.tsx`,
`inventory/drafts/page.tsx`, `inventory/sold/page.tsx`, `listings/page.tsx`,
`listings/live/page.tsx`, `listings/missing/page.tsx`, `listings/errors/page.tsx`,
`marketplaces/page.tsx`, `sales/page.tsx`, and `settings/page.tsx`. Dashboard,
Inventory, and Settings were updated there; other placeholder content is retained.

New files:

- Root: `proxy.ts`, `scripts/run-tests.mjs`.
- Routes: `app/sign-in/page.tsx`, `app/sign-up/page.tsx`, `app/auth/actions.ts`,
  `app/auth/callback/route.ts`, `app/auth/confirm/route.ts`,
  `app/api/inventory/route.ts`.
- Workspace: `app/(workspace)/layout.tsx`, `loading.tsx`, `error.tsx`,
  `inventory/[id]/page.tsx`, and `inventory/[id]/not-found.tsx`.
- Components: `components/auth/auth-form.tsx`,
  `components/inventory/inventory-list.tsx`, `inventory-page.tsx`, `item-photo.tsx`.
- Auth: `lib/auth/server.ts`, `redirect.ts`, and `redirect.test.ts`.
- Inventory: `lib/inventory/queries.ts` and `presentation.ts`.
- Persistence: `lib/listing/submission.ts`, `submission.test.ts`, `persist.ts`,
  `persist.test.ts`, `multipart.ts`, `multipart.test.ts`,
  `lib/supabase/database.types.ts`, `lib/supabase/proxy.ts`.
- SQL: the two new migrations listed above; the initial migration is unchanged.
- Documentation: `docs/BACKEND_SETUP.md`.

Updated files:

- `app/layout.tsx`, `components/app-shell.tsx`,
  `components/sidebar-navigation.tsx`, `components/page-header.tsx`,
  `components/status-badge.tsx`.
- `components/dashboard/activity-feed.tsx`, `dashboard-stats.tsx`,
  `marketplace-summary.tsx`, `recent-inventory.tsx`.
- `components/listing/listing-workflow.tsx`, `final-review.tsx`,
  `marketplace-selector.tsx`, `marketplace-review.tsx`, `photos-specifics.tsx`.
- `lib/listing/types.ts`, `validation.ts`, `validation.test.ts`, `lib/types.ts`,
  `lib/supabase/client.ts`, `lib/supabase/server.ts`.
- `package.json` (dependency-free test command only), `AGENTS.md`, `README.md`,
  `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`,
  `docs/CREATE_LISTING_DEMO.md`.

Removed: `lib/listing/draft-storage.ts`, the obsolete browser-only draft helper.
Its removal does not erase existing browser storage; old drafts are not imported.
No dependencies or environment files were changed.

## References

- [Supabase SSR and verified identity](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [Password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Storage access policies](https://supabase.com/docs/guides/storage/security/access-control)
