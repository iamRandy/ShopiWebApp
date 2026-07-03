const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("../_lib/db");
const { verifyToken, JWT_SECRET } = require("../_lib/auth");

// Catch-all under /api/shared/*.
// Routed shapes: [token]  GET (public preview) | [token, "accept"|"decline"]  POST (auth required)

async function handlePreview(req, res, usersCollection, cartSharesCollection, token) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const share = await cartSharesCollection.findOne({ shareToken: token });
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
}

async function handleAccept(req, res, usersCollection, cartSharesCollection, token) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const share = await cartSharesCollection.findOne({ shareToken: token });
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
}

function handleDecline(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.json({ success: true });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const segments = [].concat(req.query.segments || []);
  const [token, action] = segments;

  if (!token || segments.length > 2) {
    return res.status(404).json({ error: "Not found" });
  }

  // The bare token preview is publicly accessible (optional auth); accept/decline require auth.
  if (segments.length === 1) {
    const { usersCollection, cartSharesCollection } = await connectToDatabase();
    return handlePreview(req, res, usersCollection, cartSharesCollection, token);
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

  if (action === "accept") {
    const { usersCollection, cartSharesCollection } = await connectToDatabase();
    return handleAccept(req, res, usersCollection, cartSharesCollection, token);
  }

  if (action === "decline") {
    return handleDecline(req, res);
  }

  return res.status(404).json({ error: "Not found" });
};
