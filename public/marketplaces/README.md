# Marketplace identity assets

These files are local, identification-only assets. No remote logo URL is used
at runtime and no connection or endorsement is implied.

- `depop.svg`: black RGB logo from the [official Depop media kit](https://news.depop.com/media-centre/), downloaded from `https://assets.depop.com/web/assets/newsroom/depop-logos.zip` (nested `2024_LOGO_BLACK.svg`). Only the viewBox is cropped to remove excess whitespace for a small UI placement; paths are unchanged.
- `poshmark.png`: unmodified color emblem from the [official Poshmark downloadable assets](https://newsroom.poshmark.com/downloadable-assets/), downloaded from `https://newsroom.poshmark.com/wp-content/uploads/2026/03/Poshmark-Logos.zip` (`Emblem/Logo-Emblem-Color.png`).
- `ebay.svg`, `vinted.svg`, `etsy.svg`, `facebook.svg`: monochrome brand marks from the [Simple Icons source repository](https://github.com/simple-icons/simple-icons/tree/develop/icons). Paths are unchanged; eBay's viewBox is cropped to its wordmark for legibility. Simple Icons distributes these files under [CC0](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md); brand trademarks remain with their owners. The Facebook mark identifies Facebook Marketplace, rather than representing a custom Marketplace logo.
- `fallback.svg`: a generic storefront icon created for temporary use with Grailed and the existing Mercari dashboard entry. No suitable verified asset was obtained in this task. This is not a fabricated brand mark. Fallback metadata is explicit in `lib/marketplaces.ts` and the icon's title.

The app displays the real marketplace name alongside each mark. All source
assets were retrieved on October 14, 2026. No logo or icon package was installed.
