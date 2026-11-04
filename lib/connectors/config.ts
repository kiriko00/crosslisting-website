import type { ConnectorMetadata } from "./types";
import type { Marketplace } from "../supabase/database.types";

// Official-access research checked 2026-10-26. Planned != implemented or connected.
const planned = ["connect", "create", "update", "delist", "status", "sales"] as const;
export const connectorMetadata: Record<Marketplace, ConnectorMetadata> = {
  ebay: { marketplace: "ebay", availability: "Planned", priority: true, implemented: [], planned, description: "Official Sell APIs available. Primary upcoming integration; developer approval and seller authorization still required.", documentation: "https://developer.ebay.com/api-docs/sell/inventory/overview.html" },
  etsy: { marketplace: "etsy", availability: "Planned", priority: true, implemented: [], planned, description: "Official Open API available. Primary upcoming integration, subject to Etsy access approval and OAuth scopes.", documentation: "https://developers.etsy.com/documentation/" },
  depop: { marketplace: "depop", availability: "Partner access required", priority: false, implemented: [], planned, description: "Official Selling API exists. Partner/API access must be arranged with Depop; access has not been granted to this app.", documentation: "https://partnerapi.depop.com/api-docs/concepts/authentication/" },
  vinted: { marketplace: "vinted", availability: "Restricted", priority: false, implemented: [], planned, description: "Official Pro Integrations API is limited to eligible, allowlisted Pro businesses. This app has no approved access.", documentation: "https://pro-docs.svc.vinted.com/" },
  poshmark: { marketplace: "poshmark", availability: "Unsupported", priority: false, implemented: [], planned: [], description: "No supported official connector is implemented in Crosslisting. No scraping or password-based automation will be used." },
  grailed: { marketplace: "grailed", availability: "Unsupported", priority: false, implemented: [], planned: [], description: "No supported official connector is implemented in Crosslisting. Official authorization is a prerequisite for future support." },
  facebook_marketplace: { marketplace: "facebook_marketplace", availability: "Unsupported", priority: false, implemented: [], planned: [], description: "Meta Content Library is a research/content-access API, not a normal seller-publishing API. No supported seller connector is implemented.", documentation: "https://transparency.meta.com/researchtools/meta-content-library/" },
};
export const connectorOrder: Marketplace[] = ["ebay", "etsy", "depop", "vinted", "poshmark", "facebook_marketplace", "grailed"];
