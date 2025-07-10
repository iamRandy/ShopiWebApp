const { connectToDatabase } = require("./_lib/db");
const { verifyToken } = require("./_lib/auth");
const crypto = require("crypto");

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Verify token middleware
  const verifyTokenPromise = new Promise((resolve, reject) => {
    verifyToken(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  try {
    await verifyTokenPromise;
  } catch (error) {
    return; // verifyToken already sent response
  }

  const { usersCollection } = await connectToDatabase();

  if (req.method === "GET") {
    try {
      const doc = await usersCollection.findOne(
        { sub: req.user.sub },
        { projection: { _id: 0, carts: 1 } }
      );
      res.json(doc?.carts || []);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "failed to fetch carts" });
    }
  } else if (req.method === "POST") {
    try {
      const { name, icon } = req.body;
      const newCart = {
        name,
        icon,
        id: crypto.randomUUID(),
      };
      if (req.user.sub) {
        await usersCollection.updateOne(
          { sub: req.user.sub },
          { $push: { carts: newCart } }
        );
      }
      res.json(newCart);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "failed to create cart" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};
