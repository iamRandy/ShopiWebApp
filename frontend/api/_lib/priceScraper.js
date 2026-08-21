const cheerio = require("cheerio");

const SCRAPE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Pulls a numeric price out of schema.org Product/Offer JSON-LD, the same first-choice
 * strategy the browser extension's scrapers use, since most retailers embed it in
 * server-rendered HTML for SEO even on otherwise JS-heavy storefronts. */
function extractJsonLdPrice($) {
  const blocks = $('script[type="application/ld+json"]').toArray();
  for (const block of blocks) {
    let parsed;
    try {
      parsed = JSON.parse($(block).contents().text());
    } catch {
      continue;
    }

    const nodes = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.["@graph"])
        ? parsed["@graph"]
        : [parsed];

    for (const node of nodes) {
      if (!node || node["@type"] !== "Product") continue;
      const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      const rawPrice = offers?.price;
      const price =
        typeof rawPrice === "string" ? Number(rawPrice.replace(/,/g, "").trim()) : Number(rawPrice);
      if (Number.isFinite(price) && price >= 0) return Math.round(price * 100) / 100;
    }
  }
  return null;
}

/** Best-effort, lightweight re-scrape: plain HTTP GET + static HTML parse, no headless browser.
 * Sites that only render price via client JS, or that block non-browser traffic, just fail here
 * silently. `timeoutMs` is caller-tunable since this runs inside a hard-capped Vercel function
 * (see rescan.js) rather than an always-on process. */
async function scrapeProductPrice(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": SCRAPE_USER_AGENT, Accept: "text/html" },
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false };

    const html = await response.text();
    const $ = cheerio.load(html);
    const price = extractJsonLdPrice($);
    return price === null ? { ok: false } : { ok: true, price };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { scrapeProductPrice, extractJsonLdPrice };
