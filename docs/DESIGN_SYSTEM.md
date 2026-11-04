# Crosslisting Design System

## Design direction

Crosslisting should feel like a dependable professional operations tool. The
interface is restrained, practical, and information-dense without becoming
crowded. Visual choices should help a reseller scan inventory, compare
marketplace states, and resolve problems quickly.

Avoid a stereotypical “AI-generated” or trend-driven SaaS appearance. In
particular, avoid gratuitous gradients, glowing effects, excessive shadows,
decorative glass panels, oversized marketing typography inside the application,
and a different visual treatment for every page.

## Core principles

1. **Clarity over decoration.** Use hierarchy, spacing, alignment, and typography
   before adding visual effects.
2. **Consistency over novelty.** Reuse established page, table, form, badge, and
   feedback patterns.
3. **Operational density.** Show enough information to support real inventory
   work while preserving legibility and clear grouping.
4. **Status is explicit.** Never communicate important listing or inventory
   status through color alone.
5. **Actions match consequence.** Primary actions are visually clear; destructive
   or irreversible actions require stronger labeling and confirmation.
6. **Responsive, desktop-first.** Optimize complex workflows for desktop while
   retaining full usability on tablets and phones.

## Color

Use a neutral foundation with a small, purposeful semantic palette.

### Neutral roles

- **Application background:** a very light neutral gray, distinct from content
  surfaces.
- **Primary surface:** white or the closest dark-theme surface.
- **Subtle surface:** a restrained neutral tint for headers, selected rows, and
  grouped controls.
- **Primary text:** near-black, not absolute black.
- **Secondary text:** medium neutral gray with accessible contrast.
- **Muted text:** reserved for truly secondary metadata and never used for
  required instructions.
- **Borders:** subtle neutral borders that remain visible without becoming the
  dominant visual element.

### Semantic roles

- **Accent/action:** one consistent, accessible brand or action color.
- **Success/live:** green.
- **Warning/attention:** amber.
- **Danger/error:** red.
- **Informational/publishing:** blue.
- **Inactive/draft/delisted:** neutral gray.

Every semantic color needs a corresponding text label and, where useful, an icon
or shape. Do not assign slightly different colors to concepts that mean the same
thing.

## Typography

- Use the shared application sans-serif font for UI text and a monospaced font
  only for SKUs, identifiers, or technical values where alignment helps.
- Use a compact, predictable type scale. Most application text should fall
  between 12px and 18px; page titles should generally remain between 24px and
  32px.
- Prefer medium or semibold weight for hierarchy rather than extreme size.
- Body copy should have comfortable line height. Dense table content can use a
  tighter but still readable line height.
- Use sentence case for page titles, labels, buttons, tabs, and table headers.
- Avoid all-caps text except for short identifiers where it has established
  meaning.

## Spacing and layout

- Use a 4px base spacing scale, favoring repeatable increments such as 4, 8, 12,
  16, 24, 32, and 40px.
- Keep form labels close to their controls and use larger gaps to separate
  sections.
- Align page titles, toolbars, cards, and data regions to a consistent content
  grid.
- Prefer whitespace and subtle dividers over nesting every group in another
  card.
- Keep primary application content within a sensible maximum width where the
  workflow allows. Data tables and comparison views may use the full available
  workspace.

## Application shell

The desktop shell should use a stable navigation region and a flexible main
workspace:

- A restrained sidebar or equivalent persistent navigation for the primary
  product areas.
- A compact top region for page-level context and account controls when needed.
- A consistent page header containing the title, optional supporting text, and
  the most important page action.
- Predictable locations for filters, search, bulk actions, and view controls.

On smaller screens, navigation may collapse into a drawer. Page actions can wrap
or move into an overflow menu, but important actions and status information must
remain discoverable.

## Surfaces, borders, radii, and shadows

- Use thin, subtle borders to define tables, controls, and grouped content.
- Use restrained corner radii, normally 6–8px. Pills are reserved for badges,
  tags, compact filters, and controls whose shape communicates their behavior.
- Avoid applying cards to every piece of content.
- Use shadows sparingly, primarily for floating layers such as menus, popovers,
  and dialogs. Persistent content should rely on borders and surface contrast.
- Do not use gradients unless a future brand specification introduces a concrete
  and limited use case.

## Core component patterns

### Buttons

- **Primary:** one per action group for the main forward action.
- **Secondary:** bordered or neutral actions of lower emphasis.
- **Tertiary:** low-emphasis text or ghost actions.
- **Destructive:** reserved for destructive operations; pair with direct wording
  and confirmation when consequences are difficult to reverse.
- Include visible hover, active, focus, disabled, and loading states.

### Forms

- Labels remain visible; placeholders are examples, not replacements for labels.
- Indicate required fields consistently.
- Put help text and validation feedback next to the relevant control.
- Preserve entered values when marketplace validation fails.
- Group master fields separately from marketplace-specific overrides.
- Make inheritance explicit with language such as “Using master value” and offer
  a clear way to customize or restore the inherited value.

### Data tables and lists

- Use tables for comparable operational data and card/list layouts when records
  need richer imagery or do not compare cleanly by column.
- Keep headers visible where practical in long desktop tables.
- Support concise filtering, sorting, selection, and bulk actions only when the
  workflow requires them.
- Use consistent alignment: text left, counts and monetary values right, and
  status placement consistent across views.
- On narrow screens, prioritize essential fields and expose secondary details in
  a row expansion or dedicated detail view rather than shrinking text
  excessively.

### Status badges

- Use one shared badge system for Draft, Ready, Publishing, Live, Error, Sold,
  and Delisted.
- Pair color with a readable label.
- Keep badges compact and visually quieter than the record title or primary
  action.
- Use the same status color and wording everywhere.

### Cards and metrics

- Operational metric cards should be compact and comparable.
- Favor counts and short labels over decorative charts.
- Charts must answer a defined operational question and include readable labels,
  units, and accessible alternatives.
- Do not feature total inventory value or monthly profit as primary dashboard
  metrics.

### Feedback and exception states

- Use inline feedback for field-level problems and banners or notices for
  page-level problems.
- Error messages should name what failed, which marketplace was affected, and
  the next useful action.
- Empty states should explain why the area is empty and offer a relevant action;
  they do not need large illustrations.
- Loading states should preserve layout and avoid unnecessary full-screen
  spinners.

### Overlays

- Prefer a normal page or inline expansion for complex listing work.
- Use dialogs for short, focused decisions and drawers for contextual review
  that benefits from keeping the underlying page visible.
- Do not place multi-step listing creation inside a small modal.

## Imagery and product photos

- Product imagery is functional inventory data, not decoration.
- Use consistent thumbnail aspect ratios and provide a clear fallback when an
  image is unavailable.
- Preserve useful crop visibility and avoid covering product details with badges
  or controls.
- In listing creation, make photo order and marketplace image requirements
  understandable.

## Motion

- Keep animation minimal and functional.
- Use short transitions, generally around 120–180ms, for menus, drawers, focus,
  and state changes.
- Avoid background motion, looping decoration, parallax, or large entrance
  animations.
- Respect reduced-motion preferences.

## Accessibility

- Meet WCAG AA contrast expectations for text, controls, focus indicators, and
  status communication.
- All interactive elements must be keyboard accessible with a visible focus
  state.
- Use semantic headings, landmarks, form labels, buttons, and tables.
- Give product images meaningful alternative text when the image conveys item
  identity; mark purely decorative imagery appropriately.
- Do not rely on hover, color, or icons alone to reveal required information.
- Keep touch targets comfortably usable on smaller screens.

## Responsive behavior

Desktop is the primary working environment, particularly for tables and
marketplace comparison. Responsive support is still required:

- Preserve the task's primary action and critical listing statuses.
- Collapse navigation deliberately rather than simply hiding it.
- Allow toolbars to wrap and move secondary actions into a labeled overflow.
- Convert dense multi-column layouts into prioritized stacks or detail views.
- Avoid horizontal page scrolling; contained tables may scroll when no clearer
  representation exists.
- Test common phone, tablet, laptop, and wide-desktop widths.

## Visual review checklist

Before considering a screen complete, verify that:

- It reuses the established shell and component patterns.
- The most important information and action are immediately clear.
- Spacing, radii, borders, type sizes, and status treatments are consistent.
- Mock functionality is clearly identified where relevant.
- Empty, loading, error, disabled, and success states are considered.
- Keyboard focus, contrast, and responsive behavior are usable.
- The screen does not introduce decorative patterns prohibited by this system.
