const { connectToDatabase } = require("../_lib/db");
const { verifyToken } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed 6" });
  }

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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

  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: "productIds must be an array" });
    }

    const { usersCollection } = await connectToDatabase();

    // Fetch the user document
    const user = await usersCollection.findOne(
      { sub: req.user.sub },
      { projection: { _id: 0, products: 1 } }
    );
    if (!user || !user.products) {
      return res.status(400).json({ error: "no products found" }); // TODO: remove the error message for prod
    }
    // Filter products by ID
    const products = user.products.filter((p) => productIds.includes(p.id));
    res.json({ products: products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to fetch products" });
  }
};
