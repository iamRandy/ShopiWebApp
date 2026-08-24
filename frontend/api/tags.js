const { connectToDatabase } = require("./_lib/db");

// Read-only here — the canonical list is owned/written by the Chrome
// extension's own backend; this app only reads the shared `tags` collection.
//
// tags/suggest is folded into this file (dispatched via the ?action= query param set by
// vercel.json rewrites) rather than a separate file — Vercel's Hobby plan caps a deployment
// at 12 serverless functions, same reasoning as carts/[cartId]/share.js. The public path
// (/api/tags/suggest) and backend/server.js's Express route are unchanged.

async function suggest(req, res, tagsCollection) {
  const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
  if (!q) return res.json({ tags: [] });

  const limit = Number(req.query.limit) || 10;
  const all = await tagsCollection.find({}).toArray();
  const matches = all
    .filter(
      (tag) =>
        tag.slug?.toLowerCase().includes(q) ||
        tag.label?.toLowerCase().includes(q) ||
        (tag.aliases || []).some((alias) => alias.toLowerCase().includes(q))
    )
    .slice(0, limit);
  res.json({ tags: matches });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { tagsCollection } = await connectToDatabase();

    if (req.query.action === "suggest") {
      return await suggest(req, res, tagsCollection);
    }

    const tags = await tagsCollection.find({}).toArray();
    res.json({ tags });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
};
