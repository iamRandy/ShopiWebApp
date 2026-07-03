const crypto = require("crypto");
const { connectToDatabase } = require("../../_lib/db");
const { verifyToken } = require("../../_lib/auth");
const { resolveCartAccess } = require("../../_lib/cartAccess");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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

  const { cartId } = req.query;
  const { usersCollection, cartSharesCollection } = await connectToDatabase();

  if (req.method === "POST") {
    // Owner generates or regenerates a cart's share link + role.
    try {
      const { role } = req.body;
      if (role !== "view" && role !== "edit") {
        return res.status(400).json({ error: "role must be 'view' or 'edit'" });
      }

      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (access.role !== "owner") {
        return res.status(403).json({ error: "Only the cart owner can share this cart" });
      }

      const shareToken = crypto.randomBytes(32).toString("base64url");
      const now = new Date();

      const existing = await cartSharesCollection.findOne({ cartId, ownerSub: req.user.sub });
      if (existing) {
        await cartSharesCollection.updateOne(
          { _id: existing._id },
          { $set: { shareToken, linkRole: role, updatedAt: now } }
        );
      } else {
        await cartSharesCollection.insertOne({
          cartId,
          ownerSub: req.user.sub,
          shareToken,
          linkRole: role,
          createdAt: now,
          updatedAt: now,
          collaborators: [],
        });
      }

      res.json({ shareToken, linkRole: role, shareUrl: `${FRONTEND_URL}/shared/${shareToken}` });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate share link" });
    }
  } else if (req.method === "GET") {
    // Owner fetches share link + collaborator list, for the manage-collaborators UI.
    try {
      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (access.role !== "owner") {
        return res.status(403).json({ error: "Only the cart owner can view sharing settings" });
      }

      const share = await cartSharesCollection.findOne({ cartId, ownerSub: req.user.sub });
      if (!share) {
        return res.json({ shareToken: null, linkRole: null, shareUrl: null, collaborators: [] });
      }

      res.json({
        shareToken: share.shareToken,
        linkRole: share.linkRole,
        shareUrl: `${FRONTEND_URL}/shared/${share.shareToken}`,
        collaborators: share.collaborators.map((c) => ({
          sub: c.sub,
          role: c.role,
          email: c.email,
          name: c.name,
          picture: c.picture,
          acceptedAt: c.acceptedAt,
        })),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch sharing settings" });
    }
  } else {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
  }
};
