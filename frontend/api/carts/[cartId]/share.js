const crypto = require("crypto");
const { connectToDatabase } = require("../../_lib/db");
const { verifyToken } = require("../../_lib/auth");
const { resolveCartAccess } = require("../../_lib/cartAccess");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// All cart-sharing mutations are folded into this one file (owner generates/regenerates
// the link, transfers ownership, or manages a collaborator's role) via a body.action
// discriminator, rather than one file per action — Vercel's Hobby plan caps a deployment
// at 12 serverless functions, and its zero-config file routing doesn't support catch-all
// dynamic segments, so distinct URL shapes each cost a function.

async function generateLink(req, res, usersCollection, cartSharesCollection, cartId) {
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
}

async function setCollaboratorRole(req, res, usersCollection, cartSharesCollection, cartId) {
  const { sub, role } = req.body;
  if (!sub) return res.status(400).json({ error: "sub is required" });
  if (role !== "view" && role !== "edit") {
    return res.status(400).json({ error: "role must be 'view' or 'edit'" });
  }

  const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
  if (access.role !== "owner") {
    return res.status(403).json({ error: "Only the cart owner can change collaborator roles" });
  }

  const result = await cartSharesCollection.updateOne(
    { cartId, ownerSub: req.user.sub, "collaborators.sub": sub },
    { $set: { "collaborators.$.role": role } }
  );
  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Collaborator not found" });
  }

  await usersCollection.updateOne(
    { sub, "sharedCartIds.cartId": cartId },
    { $set: { "sharedCartIds.$.role": role } }
  );

  res.json({ success: true, sub, role });
}

async function removeCollaborator(req, res, usersCollection, cartSharesCollection, cartId) {
  const { sub } = req.body;
  if (!sub) return res.status(400).json({ error: "sub is required" });

  const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
  if (access.role !== "owner") {
    return res.status(403).json({ error: "Only the cart owner can remove collaborators" });
  }

  await cartSharesCollection.updateOne(
    { cartId, ownerSub: req.user.sub },
    { $pull: { collaborators: { sub } } }
  );
  await usersCollection.updateOne(
    { sub },
    { $pull: { sharedCartIds: { cartId } } }
  );

  res.json({ success: true });
}

async function transferOwnership(req, res, client, usersCollection, cartSharesCollection, cartId) {
  const { toSub } = req.body;
  if (!toSub) {
    return res.status(400).json({ error: "toSub is required" });
  }

  const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
  if (access.role !== "owner") {
    return res.status(403).json({ error: "Only the cart owner can transfer ownership" });
  }
  if (toSub === req.user.sub) {
    return res.status(400).json({ error: "You already own this cart" });
  }

  const oldOwnerSub = req.user.sub;
  const share = await cartSharesCollection.findOne({ cartId, ownerSub: oldOwnerSub });
  const targetCollab = share?.collaborators?.find((c) => c.sub === toSub);
  if (!targetCollab) {
    return res.status(400).json({ error: "Transfer target must be an existing collaborator" });
  }

  let newOwnerProfile = null;

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const oldOwnerDoc = await usersCollection.findOne(
        { sub: oldOwnerSub, "carts.id": cartId },
        { session, projection: { "carts.$": 1, name: 1, username: 1, picture: 1, email: 1 } }
      );
      const cartSubdoc = oldOwnerDoc?.carts?.[0];
      if (!cartSubdoc) throw new Error("Cart not found");

      newOwnerProfile = await usersCollection.findOne(
        { sub: toSub },
        { session, projection: { name: 1, username: 1, picture: 1 } }
      );
      if (!newOwnerProfile) throw new Error("Target user not found");

      await usersCollection.updateOne(
        { sub: oldOwnerSub },
        { $pull: { carts: { id: cartId } } },
        { session }
      );
      await usersCollection.updateOne(
        { sub: toSub },
        { $push: { carts: cartSubdoc } },
        { session }
      );

      const otherCollaborators = (share.collaborators || []).filter((c) => c.sub !== toSub);
      await cartSharesCollection.updateOne(
        { _id: share._id },
        {
          $set: {
            ownerSub: toSub,
            collaborators: [
              ...otherCollaborators,
              {
                sub: oldOwnerSub,
                role: "edit",
                email: oldOwnerDoc.email || "",
                name: oldOwnerDoc.username || oldOwnerDoc.name || "",
                picture: oldOwnerDoc.picture || "",
                acceptedAt: new Date(),
              },
            ],
          },
        },
        { session }
      );

      await usersCollection.updateOne(
        { sub: toSub },
        { $pull: { sharedCartIds: { cartId } } },
        { session }
      );

      await usersCollection.updateOne(
        { sub: oldOwnerSub },
        {
          $push: {
            sharedCartIds: {
              shareId: share._id,
              cartId,
              ownerSub: toSub,
              ownerName: newOwnerProfile.username || newOwnerProfile.name || "",
              ownerPicture: newOwnerProfile.picture || "",
              cartName: cartSubdoc.name,
              cartIcon: cartSubdoc.icon,
              cartColor: cartSubdoc.color,
              role: "edit",
              acceptedAt: new Date(),
            },
          },
        },
        { session }
      );

      const otherSubs = otherCollaborators.map((c) => c.sub);
      if (otherSubs.length > 0) {
        await usersCollection.updateMany(
          { sub: { $in: otherSubs }, "sharedCartIds.cartId": cartId },
          {
            $set: {
              "sharedCartIds.$[s].ownerSub": toSub,
              "sharedCartIds.$[s].ownerName": newOwnerProfile.username || newOwnerProfile.name || "",
              "sharedCartIds.$[s].ownerPicture": newOwnerProfile.picture || "",
            },
          },
          { session, arrayFilters: [{ "s.cartId": cartId }] }
        );
      }
    });
  } finally {
    await session.endSession();
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
  const { client, usersCollection, cartSharesCollection } = await connectToDatabase();

  if (req.method === "GET") {
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
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    switch (req.body?.action) {
      case "generate":
        return await generateLink(req, res, usersCollection, cartSharesCollection, cartId);
      case "setRole":
        return await setCollaboratorRole(req, res, usersCollection, cartSharesCollection, cartId);
      case "remove":
        return await removeCollaborator(req, res, usersCollection, cartSharesCollection, cartId);
      case "transfer":
        return await transferOwnership(req, res, client, usersCollection, cartSharesCollection, cartId);
      default:
        return res.status(400).json({ error: "Unknown or missing action" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to update sharing settings" });
  }
};
