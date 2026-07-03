const { connectToDatabase } = require("../../../_lib/db");
const { verifyToken } = require("../../../_lib/auth");
const { resolveCartAccess } = require("../../../_lib/cartAccess");

// Owner transfers ownership of a cart to an existing collaborator.
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

  const { cartId } = req.query;
  const { toSub } = req.body;
  if (!toSub) {
    return res.status(400).json({ error: "toSub is required" });
  }

  try {
    const { client, usersCollection, cartSharesCollection } = await connectToDatabase();

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

        // toSub is now the owner: drop their "shared with me" pointer for this cart.
        await usersCollection.updateOne(
          { sub: toSub },
          { $pull: { sharedCartIds: { cartId } } },
          { session }
        );

        // Old owner now sees this cart under "Shared with me" as an edit collaborator.
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

        // Fix up display data for every other remaining collaborator.
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to transfer ownership" });
  }
};
