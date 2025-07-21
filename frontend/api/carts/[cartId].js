const { connectToDatabase } = require("../_lib/db");
const { verifyToken } = require("../_lib/auth");

console.log("cart id");
module.exports = async function handler(req, res) {
  console.log(`[cartId] API called with method: ${req.method}, cartId: ${req.query.cartId}`);
  
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT, DELETE, OPTIONS");
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

  const { cartId } = req.query;
  const { usersCollection } = await connectToDatabase();

  if (req.method === "PUT") {
    try {
      const { name, icon, color } = req.body;

      if (!cartId) {
        return res.status(400).json({ error: "Cart ID is required" });
      }

      // Update the cart in the user's carts array
      const result = await usersCollection.updateOne(
        { sub: req.user.sub, "carts.id": cartId },
        {
          $set: {
            "carts.$.name": name,
            "carts.$.icon": icon,
            ...(color && { "carts.$.color": color }),
          },
        }
      );

      if (result.modifiedCount > 0) {
        // Fetch the updated cart to return it
        const user = await usersCollection.findOne(
          { sub: req.user.sub },
          { projection: { _id: 0, carts: 1 } }
        );
        const updatedCart = user.carts.find((cart) => cart.id === cartId);
        res.json(updatedCart);
      } else {
        res.status(404).json({ error: "Cart not found" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update cart" });
    }
  } else if (req.method === "DELETE") {
    try {
      if (!cartId) {
        return res.status(400).json({ error: "Cart ID is required" });
      }

      // Remove the cart from the user's carts array
      const result = await usersCollection.updateOne(
        { sub: req.user.sub },
        { $pull: { carts: { id: cartId } } }
      );

      if (result.modifiedCount > 0) {
        res.json({ success: true, message: "Cart deleted successfully" });
      } else {
        res.status(404).json({ error: "Cart not found or already deleted" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete cart" });
    }
  } else {
    console.log(`[cartId] Method not allowed: ${req.method}`);
    res.status(405).json({ error: "Method not allowed 3" });
  }
};
