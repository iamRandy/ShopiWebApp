const { connectToDatabase } = require("../../../../_lib/db");
const { verifyToken } = require("../../../../_lib/auth");
const { resolveCartAccess } = require("../../../../_lib/cartAccess");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, DELETE, OPTIONS");
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

  const { cartId, collaboratorSub } = req.query;
  const { usersCollection, cartSharesCollection } = await connectToDatabase();

  if (req.method === "PATCH") {
    // Owner changes a collaborator's role.
    try {
      const { role } = req.body;
      if (role !== "view" && role !== "edit") {
        return res.status(400).json({ error: "role must be 'view' or 'edit'" });
      }

      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (access.role !== "owner") {
        return res.status(403).json({ error: "Only the cart owner can change collaborator roles" });
      }

      const result = await cartSharesCollection.updateOne(
        { cartId, ownerSub: req.user.sub, "collaborators.sub": collaboratorSub },
        { $set: { "collaborators.$.role": role } }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Collaborator not found" });
      }

      await usersCollection.updateOne(
        { sub: collaboratorSub, "sharedCartIds.cartId": cartId },
        { $set: { "sharedCartIds.$.role": role } }
      );

      res.json({ success: true, sub: collaboratorSub, role });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to change collaborator role" });
    }
  } else if (req.method === "DELETE") {
    // Owner removes a collaborator. The share link itself stays valid for reuse.
    try {
      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (access.role !== "owner") {
        return res.status(403).json({ error: "Only the cart owner can remove collaborators" });
      }

      await cartSharesCollection.updateOne(
        { cartId, ownerSub: req.user.sub },
        { $pull: { collaborators: { sub: collaboratorSub } } }
      );
      await usersCollection.updateOne(
        { sub: collaboratorSub },
        { $pull: { sharedCartIds: { cartId } } }
      );

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to remove collaborator" });
    }
  } else {
    res.setHeader("Allow", "PATCH, DELETE, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
  }
};
