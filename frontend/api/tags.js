const { connectToDatabase } = require("./_lib/db");

// Read-only here — the canonical list is owned/written by the Chrome
// extension's own backend; this app only reads the shared `tags` collection.
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
    const tags = await tagsCollection.find({}).toArray();
    res.json({ tags });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
};
