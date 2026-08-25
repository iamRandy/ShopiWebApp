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

/** Sites like Amazon serve a 200 OK "prove you're not a robot" interstitial instead of the real
 * page to non-browser traffic — this is a distinct outcome from "no price found", worth telling
 * the user apart from a generic failure so they know to check the price on the site themselves. */
const BOT_BLOCK_PATTERN =
  /captcha|are you a (human|robot)|verify you are a human|unusual traffic|access denied|attention required|cf-browser-verification|just a moment|robot check|automated access to (our|this|amazon)/i;

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

    // Checked before response.ok — some bot-block systems (Cloudflare) fail the request with a
    // 403/503 whose body is the block page itself, rather than Amazon's fake-200 interstitial.
    const html = await response.text();
    if (BOT_BLOCK_PATTERN.test(html)) return { ok: false, blocked: true };
    if (!response.ok) return { ok: false };

    const $ = cheerio.load(html);
    const price = extractJsonLdPrice($);
    return price === null ? { ok: false } : { ok: true, price };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** Mirrors backend/server.js's isHostBlocked/markHostBlocked — both deployments read/write the
 * same `blockedHosts` collection (TTL-expired there, see server.js's init()), so a hostname
 * flagged by one avoids being re-scraped by the other for the same cooldown window. */
async function isHostBlocked(blockedHostsCollection, hostname) {
  if (!hostname) return false;
  const doc = await blockedHostsCollection.findOne({ hostname });
  return Boolean(doc);
}

async function markHostBlocked(blockedHostsCollection, hostname) {
  if (!hostname) return;
  await blockedHostsCollection.updateOne(
    { hostname },
    { $set: { hostname, blockedAt: new Date() } },
    { upsert: true }
  );
}

/** Skips the network call entirely for a hostname recently seen bot-blocking us, and records one
 * the moment it's discovered. No in-process concurrency limiter here (unlike the Express
 * backend's withScanSlot) — each Vercel invocation is its own short-lived, isolated process. */
async function scrapeProductPriceGuarded(blockedHostsCollection, url, timeoutMs) {
  const hostname = hostnameFromUrl(url);
  if (await isHostBlocked(blockedHostsCollection, hostname)) {
    return { ok: false, blocked: true };
  }
  const result = await scrapeProductPrice(url, timeoutMs);
  if (!result.ok && result.blocked) {
    await markHostBlocked(blockedHostsCollection, hostname);
  }
  return result;
}

module.exports = {
  scrapeProductPrice,
  extractJsonLdPrice,
  scrapeProductPriceGuarded,
  isHostBlocked,
  markHostBlocked,
  hostnameFromUrl,
};
