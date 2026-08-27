const { connectToDatabase } = require("../_lib/db");
const { verifyToken } = require("../_lib/auth");
const { resolveCartAccess, syncSharedCartIdsDisplay } = require("../_lib/cartAccess");

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, PATCH, DELETE, OPTIONS");
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
  const { usersCollection, cartSharesCollection } = await connectToDatabase();

  if (!cartId) {
    return res.status(400).json({ error: "Cart ID is required" });
  }

  if (req.method === "GET") {
    try {
      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (!access.allowed) {
        return res.status(403).json({ error: "You do not have access to this cart" });
      }
      const doc = await usersCollection.findOne(
        { sub: access.ownerSub, "carts.id": cartId },
        { projection: { _id: 0, "carts.$": 1 } }
      );
      const cart = doc?.carts?.[0];
      if (!cart) return res.status(404).json({ error: "Cart not found" });
      res.json({ ...cart, myRole: access.role, ownerSub: access.ownerSub });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  } else if (req.method === "PUT") {
    try {
      const { name, icon, color, bannerType, bannerGradient } = req.body;

      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (!access.allowed || access.role === "view") {
        return res.status(403).json({ error: "You do not have permission to edit this cart" });
      }

      // Update the cart in the owner's carts array (owner may differ from the requester for shared carts)
      const result = await usersCollection.updateOne(
        { sub: access.ownerSub, "carts.id": cartId },
        {
          $set: {
            "carts.$.name": name,
            "carts.$.icon": icon,
            ...(color && { "carts.$.color": color }),
            ...(bannerType && { "carts.$.bannerType": bannerType }),
            ...(bannerType === "gradient" && { "carts.$.bannerGradient": bannerGradient || null }),
          },
        }
      );

      if (result.modifiedCount > 0) {
        const user = await usersCollection.findOne(
          { sub: access.ownerSub },
          { projection: { _id: 0, carts: 1 } }
        );
        const updatedCart = user.carts.find((cart) => cart.id === cartId);

        await syncSharedCartIdsDisplay(usersCollection, cartId, {
          cartName: updatedCart.name,
          cartIcon: updatedCart.icon,
          ...(updatedCart.color && { cartColor: updatedCart.color }),
          ...(updatedCart.bannerType && { bannerType: updatedCart.bannerType }),
          ...(updatedCart.bannerGradient && { bannerGradient: updatedCart.bannerGradient }),
        });

        res.json(updatedCart);
      } else {
        res.status(404).json({ error: "Cart not found" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update cart" });
    }
  } else if (req.method === "PATCH") {
    // Persists a custom drag-and-drop product order for this cart. Folded in here (rather
    // than a separate carts/[cartId]/order.js function) to stay under Vercel's Hobby-plan
    // 12-function cap — mirrors backend/server.js's PATCH /api/carts/:cartId. Unlike the
    // Express route, this deployment has no persistent Socket.IO server, so it never emits
    // a live-update event, matching every other mutation route under frontend/api/.
    try {
      const { productOrder } = req.body;

      if (!Array.isArray(productOrder) || productOrder.some((id) => typeof id !== "string")) {
        return res.status(400).json({ error: "productOrder must be an array of product ids" });
      }

      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (!access.allowed || access.role === "view") {
        return res.status(403).json({ error: "You do not have permission to edit this cart" });
      }

      const result = await usersCollection.updateOne(
        { sub: access.ownerSub, "carts.id": cartId },
        { $set: { "carts.$.productOrder": productOrder } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Cart not found" });
      }

      res.json({ success: true, productOrder });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save product order" });
    }
  } else if (req.method === "DELETE") {
    try {
      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (access.role !== "owner") {
        return res.status(403).json({ error: "Only the cart owner can delete this cart" });
      }

      // Remove the cart from the user's carts array
      const result = await usersCollection.updateOne(
        { sub: req.user.sub },
        { $pull: { carts: { id: cartId } } }
      );

      if (result.modifiedCount > 0) {
        const share = await cartSharesCollection.findOneAndDelete({
          cartId,
          ownerSub: req.user.sub,
        });
        const collaboratorSubs = share?.collaborators?.map((c) => c.sub) || [];
        if (collaboratorSubs.length > 0) {
          await usersCollection.updateMany(
            { sub: { $in: collaboratorSubs } },
            { $pull: { sharedCartIds: { cartId } } }
          );
        }

        res.json({ success: true, message: "Cart deleted successfully" });
      } else {
        res.status(404).json({ error: "Cart not found or already deleted" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete cart" });
    }
  } else {
    res.setHeader("Allow", "GET, PUT, PATCH, DELETE, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
  }
};
