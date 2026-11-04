// Keep post-auth redirects inside known application routes. Never trust a
// next/return URL supplied by a browser or an email link.
export function safeNext(value: unknown): string {
  if (typeof value !== "string" || /[\\\r\n]/.test(value)) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  const url = new URL(value, "https://crosslisting.invalid");
  if (url.origin !== "https://crosslisting.invalid" || /%(?:2f|5c|0a|0d)/i.test(url.pathname)) return "/";
  if (url.pathname === "/" || /^\/(?:inventory|create-listing|listings|marketplaces|sales|settings)(?:\/|$)/.test(url.pathname)) return url.pathname + url.search;
  return "/";
}
