const { connectToDatabase } = require("../../../_lib/db");
const { verifyToken } = require("../../../_lib/auth");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
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

  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cartId, productId } = req.query;

  if (!cartId || !productId) {
    return res.status(400).json({ error: "Cart ID and Product ID are required" });
  }

  try {
    const { usersCollection } = await connectToDatabase();

    const result = await usersCollection.updateOne(
      { sub: req.user.sub, "carts.id": cartId },
      { $pull: { "carts.$.products": { id: productId } } }
    );

    if (result.modifiedCount > 0) {
      return res.json({ success: true, message: "Product deleted successfully" });
    }
    return res
      .status(404)
      .json({ error: "Product not found in cart or cart not found" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to delete product" });
  }
};
