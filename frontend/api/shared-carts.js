const { connectToDatabase } = require("./_lib/db");
const { verifyToken } = require("./_lib/auth");

// List (metadata only, no products) of carts shared with the current user.
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const verifyTokenPromise = new Promise((resolve, reject) => {
    verifyToken(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  try {
    await verifyTokenPromise;
  } catch {
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { usersCollection } = await connectToDatabase();
    const doc = await usersCollection.findOne(
      { sub: req.user.sub },
      { projection: { _id: 0, sharedCartIds: 1 } }
    );
    res.json(doc?.sharedCartIds || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch shared carts" });
  }
};
