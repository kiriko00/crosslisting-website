# Crosslisting Product Specification

## Document purpose

This document is the product source of truth for Crosslisting. It defines the
audience, terminology, core workflows, information architecture, and product
boundaries that implementation work should preserve.

## Product summary

Crosslisting is a centralized resale inventory and cross-listing application for
clothing, footwear, jewelry, and accessories. It serves casual through
professional resellers, while primarily optimizing for small and medium sellers
whose inventory is large enough that maintaining the same items across several
marketplaces has become tedious and error-prone.

The primary value proposition is centralized resale inventory management.
Cross-listing is the major feature that extends that central inventory into
multiple marketplaces.

## Product principles

1. **Create the item once.** A seller records the richest practical version of
   a physical product as one master inventory item.
2. **Adapt per marketplace.** Marketplace listings derive from the master item,
   but can override fields the marketplace permits, including title,
   description, price, and marketplace-specific attributes.
3. **Keep one source of truth.** Marketplace overrides do not silently replace
   master inventory data.
4. **Publish independently.** Missing or invalid information for one
   marketplace does not prevent another ready marketplace from being published.
5. **Expose operational problems.** Missing listings, validation problems, and
   publishing errors are visible, actionable parts of the product rather than
   hidden background details.
6. **Be honest about integration state.** Mock operations, queued operations,
   and confirmed marketplace operations must be clearly distinguishable.
7. **Use authorized integrations.** Marketplace connections use official and
   authorized APIs; Crosslisting does not depend on credential scraping or
   browser automation.

## Core terminology

### Master inventory item

The canonical record for one physical item the seller owns and intends to sell.
It contains the maximum useful reusable product information, such as:

- Internal SKU and category
- Title and description
- Brand, condition, color, material, and size
- Category-specific attributes and measurements
- Product identifiers when available
- Photos and their preferred order
- Default asking price
- Internal notes and tags
- Inventory status and important dates

The initial product assumes unique or single-quantity resale items. Quantity
support can be considered later without weakening the one-master-to-many-listings
relationship.

### Marketplace listing

A channel-specific representation of a master inventory item. One physical item
may have several marketplace listings, but each listing belongs to exactly one
master item and one marketplace.

A marketplace listing stores its own:

- Marketplace and external listing identity, when published
- Listing status
- Marketplace-specific title, description, price, and permitted field values
- Validation issues and missing requirements
- Publishing or synchronization error details
- Last attempted and last successful synchronization times
- Public listing URL when one exists

### Override

A value intentionally customized for one marketplace. If a supported field has
no override, the listing inherits the relevant value from the master item.
Changing an override must not modify the master value or another marketplace's
override.

### Missing listing

A selected or expected marketplace on which an otherwise relevant inventory item
does not currently have a live listing. “Missing” is an operational view and may
be caused by an uncreated listing, an incomplete draft, a validation requirement,
an error, or a delisted listing.

## Navigation and product areas

The application should approximately support this structure:

- **Dashboard** — operational overview and items needing attention.
- **Inventory**
  - All Items
  - Drafts
  - Sold
- **Listings**
  - Live
  - Missing
  - Errors
- **Create Listing** — the master-first cross-listing workflow.
- **Marketplaces** — available connections, capabilities, and connection state.
- **Sales** — sold-item history and sale details.
- **Settings** — account and application preferences as those features become
  available.

The exact navigation presentation may evolve, but the distinction between
inventory and marketplace listings should remain clear.

## Primary workflow: create and cross-list an item

The listing creation experience is a hybrid workflow:

1. **Enter master product information.** The seller creates a rich reusable item
   record, adds photos, and supplies common product details.
2. **Select marketplaces.** The seller chooses the marketplaces on which the
   item should be listed.
3. **Review requirements.** Crosslisting evaluates each selected marketplace
   independently and identifies required, inherited, and unsupported fields.
4. **Customize per marketplace.** The seller reviews the derived listing and may
   independently edit title, description, price, and other permitted fields.
5. **Resolve marketplace-local issues.** Each marketplace shows its own missing
   data and validation feedback. A problem on one card or review step does not
   invalidate other marketplaces.
6. **Save or publish independently.** Ready marketplace listings can proceed
   while incomplete listings remain drafts or require attention.

During the mock-data stages, this workflow may simulate state transitions for
demonstration, but must label them as mock behavior and must not suggest that an
external marketplace was contacted.

## Marketplace listing statuses

Every marketplace listing has an independent status:

| Status | Meaning |
| --- | --- |
| Draft | The listing exists but is incomplete or has not been submitted. |
| Ready | Validation has passed and the listing is ready to publish. |
| Publishing | A publish operation has started but is not yet confirmed. |
| Live | The marketplace has confirmed an active listing. |
| Error | The latest operation failed or the listing requires intervention. |
| Sold | The marketplace reports that the item sold through this listing. |
| Delisted | The listing is no longer active on the marketplace. |

Statuses belong to listings, not the entire physical item. The interface may
derive attention states and filters from these values, but should not collapse
independent marketplace states into one ambiguous status.

## Sale and delisting behavior

### Marketplace-originated sale

In the eventual integrated product, when a marketplace confirms a sale:

1. Record the sale event idempotently.
2. Mark the master inventory item sold.
3. Mark the marketplace listing that produced the sale sold.
4. Attempt to delist every other live listing for the same master item.
5. Track each delisting attempt independently.
6. Surface failures prominently until resolved.

The interface must not claim that all other listings are removed until each
marketplace confirms the result. Concurrent sales and delayed marketplace events
must be treated as real operational risks in the future system.

### Manual or off-platform sale

A seller can manually mark a master inventory item sold, including when the sale
happens locally or through a marketplace without an integration. The seller can
record the source and sale details when known. The system should then attempt the
same independent delisting workflow for any other live integrated listings.

## Dashboard and analytics

The dashboard is an operational workspace, not an accounting dashboard. Its most
useful information includes:

- Active inventory items
- Draft inventory or listings
- Sold items
- Listings requiring attention
- Missing marketplace listings
- Average days listed
- Sales by marketplace
- Recently sold items

Do not emphasize total inventory value or monthly profit on the main dashboard.
Financial reporting may be considered later in a dedicated context, but it
should not displace operational inventory and listing health.

## Dedicated exception workflows

### Listing errors

The Listings > Errors area should identify the item, marketplace, failed action,
plain-language error, last attempt, and available next action. Errors should be
filterable and should link directly to the relevant marketplace listing review.

### Missing listings

The Listings > Missing area should show inventory items that are absent from a
selected or expected marketplace. It should explain whether the listing was
never created, is incomplete, is blocked by a requirement, encountered an
error, or was delisted.

## Current implementation scope

The first implementation stage uses mock data only. It may build realistic UI,
navigation, filters, forms, validation demonstrations, and local in-memory
interactions.

It must not add:

- Authentication or user accounts
- A database or Supabase
- Real marketplace API calls
- Marketplace credential collection
- Payments or subscriptions
- Production backend infrastructure
- Claims that mock publish, sale, sync, or delist actions occurred externally

eBay is the expected first priority for a real integration in a later stage.
Other marketplaces should be integrated only when suitable official API access
and authorization are available.

## Product quality bar

A feature is product-aligned when it:

- Preserves the master-item-to-marketplace-listings relationship.
- Makes inherited values and marketplace overrides understandable.
- Keeps validation and operations independent by marketplace.
- Helps sellers identify what is live, missing, sold, or requires attention.
- Uses accurate language about mock, queued, attempted, and confirmed actions.
- Follows the shared design system and works responsively.
