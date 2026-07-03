const { connectToDatabase } = require("../../_lib/db");
const { verifyToken } = require("../../_lib/auth");

// Authenticated user accepts a share invite.
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { usersCollection, cartSharesCollection } = await connectToDatabase();

    const share = await cartSharesCollection.findOne({ shareToken: req.query.token });
    if (!share) {
      return res.status(404).json({ error: "This share link is invalid or has been removed." });
    }

    if (req.user.sub === share.ownerSub) {
      return res.status(400).json({ error: "You already own this cart" });
    }

    const existing = share.collaborators.find((c) => c.sub === req.user.sub);
    if (existing) {
      return res.json({ cartId: share.cartId, role: existing.role });
    }

    const ownerDoc = await usersCollection.findOne(
      { sub: share.ownerSub, "carts.id": share.cartId },
      { projection: { "carts.$": 1, name: 1, username: 1, picture: 1 } }
    );
    const cart = ownerDoc?.carts?.[0];
    if (!cart) {
      return res.status(404).json({ error: "This cart no longer exists." });
    }

    const viewerDoc = await usersCollection.findOne({ sub: req.user.sub });
    const acceptedAt = new Date();
    const collaborator = {
      sub: req.user.sub,
      role: share.linkRole,
      email: viewerDoc?.email || req.user.email || "",
      name: viewerDoc?.username || viewerDoc?.name || req.user.name || "",
      picture: viewerDoc?.picture || req.user.picture || "",
      acceptedAt,
    };

    await cartSharesCollection.updateOne(
      { _id: share._id },
      { $push: { collaborators: collaborator } }
    );

    await usersCollection.updateOne(
      { sub: req.user.sub },
      {
        $push: {
          sharedCartIds: {
            shareId: share._id,
            cartId: share.cartId,
            ownerSub: share.ownerSub,
            ownerName: ownerDoc?.username || ownerDoc?.name || "Someone",
            ownerPicture: ownerDoc?.picture || "",
            cartName: cart.name,
            cartIcon: cart.icon,
            cartColor: cart.color,
            role: share.linkRole,
            acceptedAt,
          },
        },
      }
    );

    res.json({ cartId: share.cartId, role: share.linkRole });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to accept share invite" });
  }
};
