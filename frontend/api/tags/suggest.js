const { connectToDatabase } = require("../_lib/db");

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
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    if (!q) return res.json({ tags: [] });

    const limit = Number(req.query.limit) || 10;
    const { tagsCollection } = await connectToDatabase();
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch tag suggestions" });
  }
};
