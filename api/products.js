const { connectToDatabase } = require("./_lib/db");
const { verifyToken } = require("./_lib/auth");

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
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
        { sub: req.user.sub }, // Use verified user from token
        { projection: { _id: 0, products: 1 } }
      );
      res.json(doc?.products || []);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "failed to fetch products" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      // Try to remove the product with the matching ID first
      let result = await usersCollection.updateOne(
        { sub: req.user.sub }, // Use verified user from token
        { $pull: { products: { id: productId } } }
      );

      if (result.modifiedCount > 0) {
        res.json({ success: true, message: "Product deleted successfully" });
      } else {
        res.status(404).json({ error: "Product not found or already deleted" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete product" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
