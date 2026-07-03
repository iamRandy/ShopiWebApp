const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("../_lib/db");
const { JWT_SECRET } = require("../_lib/auth");

// Public: resolve a share token into a cart preview + the viewer's status. Optional auth —
// guests (no/invalid Bearer token) are allowed through with a read-only preview.
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
    const { usersCollection, cartSharesCollection } = await connectToDatabase();

    const share = await cartSharesCollection.findOne({ shareToken: req.query.token });
    if (!share) {
      return res.status(404).json({ error: "This share link is invalid or has been removed." });
    }

    const ownerDoc = await usersCollection.findOne(
      { sub: share.ownerSub, "carts.id": share.cartId },
      { projection: { "carts.$": 1, name: 1, username: 1, picture: 1 } }
    );
    const cart = ownerDoc?.carts?.[0];
    if (!cart) {
      return res.status(404).json({ error: "This cart no longer exists." });
    }

    let viewerSub = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        viewerSub = jwt.verify(authHeader.split(" ")[1], JWT_SECRET).sub;
      } catch {
        // Invalid/expired token: treat as a guest rather than rejecting the request.
      }
    }

    let status;
    let myRole = null;
    if (!viewerSub) {
      status = "guest";
    } else if (viewerSub === share.ownerSub) {
      status = "owner";
    } else {
      const collab = share.collaborators.find((c) => c.sub === viewerSub);
      if (collab) {
        status = "collaborator";
        myRole = collab.role;
      } else {
        status = "pending";
      }
    }

    res.json({
      cartId: share.cartId,
      cartName: cart.name,
      cartIcon: cart.icon,
      cartColor: cart.color,
      productCount: cart.products?.length || 0,
      ownerName: ownerDoc?.username || ownerDoc?.name || "Someone",
      ownerPicture: ownerDoc?.picture || "",
      linkRole: share.linkRole,
      status,
      myRole,
      products: status === "guest" || status === "pending" ? cart.products || [] : undefined,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to resolve share link" });
  }
};
