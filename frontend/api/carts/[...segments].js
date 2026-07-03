const crypto = require("crypto");
const { connectToDatabase } = require("../_lib/db");
const { verifyToken } = require("../_lib/auth");
const { resolveCartAccess, syncSharedCartIdsDisplay } = require("../_lib/cartAccess");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Everything under /api/carts/* (except the bare /api/carts list+create route, which
// lives in carts.js) is handled here via a catch-all so the whole feature stays within
// Vercel Hobby's 12-serverless-function cap instead of one file per endpoint.
//
// Routed shapes (segments = the path parts after /api/carts/):
//   [selectCart]                                    POST   select a cart by id (body.cartId)
//   [cartId]                                         GET/PUT/DELETE   single cart
//   [cartId, products, productId]                    PATCH/DELETE     product in a cart
//   [cartId, share]                                   GET/POST         share link + settings
//   [cartId, share, transfer]                         POST             ownership transfer
//   [cartId, share, collaborators, collaboratorSub]   PATCH/DELETE     collaborator management

async function handleSelectCart(req, res, usersCollection) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { cartId } = req.body;
    const user = await usersCollection.findOne(
      { sub: req.user.sub },
      { projection: { _id: 0, carts: 1 } }
    );
    const selectedCart = user.carts.find((cart) => cart.id === cartId);
    res.json(selectedCart);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to select cart" });
  }
}

async function handleCart(req, res, usersCollection, cartSharesCollection, cartId) {
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
      const { name, icon, color } = req.body;

      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (!access.allowed || access.role === "view") {
        return res.status(403).json({ error: "You do not have permission to edit this cart" });
      }

      const result = await usersCollection.updateOne(
        { sub: access.ownerSub, "carts.id": cartId },
        {
          $set: {
            "carts.$.name": name,
            "carts.$.icon": icon,
            ...(color && { "carts.$.color": color }),
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
        });

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
      const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
      if (access.role !== "owner") {
        return res.status(403).json({ error: "Only the cart owner can delete this cart" });
      }

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
    res.setHeader("Allow", "GET, PUT, DELETE, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleProduct(req, res, usersCollection, cartSharesCollection, cartId, productId) {
  const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
  if (!access.allowed || access.role === "view") {
    return res.status(403).json({ error: "You do not have permission to edit this cart" });
  }

  if (req.method === "PATCH") {
    try {
      const { nickname, isFavorite, note } = req.body;

      if (nickname !== undefined && typeof nickname !== "string") {
        return res.status(400).json({ error: "Nickname must be a string" });
      }
      if (isFavorite !== undefined && typeof isFavorite !== "boolean") {
        return res.status(400).json({ error: "isFavorite must be a boolean" });
      }
      if (note !== undefined && typeof note !== "string") {
        return res.status(400).json({ error: "Note must be a string" });
      }

      const trimmedNickname = typeof nickname === "string" ? nickname.trim() : undefined;
      const trimmedNote = typeof note === "string" ? note.trim() : undefined;

      const $set = {};
      const $unset = {};

      if (trimmedNickname !== undefined) {
        if (trimmedNickname) {
          $set["carts.$[c].products.$[p].nickname"] = trimmedNickname;
        } else {
          $unset["carts.$[c].products.$[p].nickname"] = "";
        }
      }
      if (isFavorite !== undefined) {
        $set["carts.$[c].products.$[p].isFavorite"] = isFavorite;
      }
      if (trimmedNote !== undefined) {
        if (trimmedNote) {
          $set["carts.$[c].products.$[p].note"] = trimmedNote;
        } else {
          $unset["carts.$[c].products.$[p].note"] = "";
        }
      }

      if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const update = {};
      if (Object.keys($set).length > 0) update.$set = $set;
      if (Object.keys($unset).length > 0) update.$unset = $unset;

      const result = await usersCollection.updateOne(
        { sub: access.ownerSub },
        update,
        { arrayFilters: [{ "c.id": cartId }, { "p.id": productId }] }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Product not found in cart or cart not found" });
      }

      const user = await usersCollection.findOne(
        { sub: access.ownerSub },
        { projection: { _id: 0, carts: 1 } }
      );
      const cart = user?.carts?.find((c) => c.id === cartId);
      const product = cart?.products?.find((p) => p.id === productId);

      if (!product) {
        return res.status(404).json({ error: "Product not found after update" });
      }

      return res.json({ success: true, product });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to update product" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await usersCollection.updateOne(
        { sub: access.ownerSub, "carts.id": cartId },
        { $pull: { "carts.$.products": { id: productId } } }
      );

      if (result.modifiedCount > 0) {
        return res.json({ success: true, message: "Product deleted successfully" });
      }
      return res.status(404).json({ error: "Product not found in cart or cart not found" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to delete product" });
    }
  }

  res.setHeader("Allow", "PATCH, DELETE, OPTIONS");
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleShareSettings(req, res, usersCollection, cartSharesCollection, cartId) {
  if (req.method === "POST") {
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
}

async function handleTransfer(req, res, client, usersCollection, cartSharesCollection, cartId) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { toSub } = req.body;
  if (!toSub) {
    return res.status(400).json({ error: "toSub is required" });
  }

  try {
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to transfer ownership" });
  }
}

async function handleCollaborator(req, res, usersCollection, cartSharesCollection, cartId, collaboratorSub) {
  if (req.method === "PATCH") {
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
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
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

  const segments = [].concat(req.query.segments || []);
  const { client, usersCollection, cartSharesCollection } = await connectToDatabase();

  if (segments.length === 1 && segments[0] === "selectCart") {
    return handleSelectCart(req, res, usersCollection);
  }

  const [cartId, second, third, fourth] = segments;
  if (!cartId) {
    return res.status(400).json({ error: "Cart ID is required" });
  }

  if (segments.length === 1) {
    return handleCart(req, res, usersCollection, cartSharesCollection, cartId);
  }

  if (segments.length === 3 && second === "products") {
    return handleProduct(req, res, usersCollection, cartSharesCollection, cartId, third);
  }

  if (segments.length === 2 && second === "share") {
    return handleShareSettings(req, res, usersCollection, cartSharesCollection, cartId);
  }

  if (segments.length === 3 && second === "share" && third === "transfer") {
    return handleTransfer(req, res, client, usersCollection, cartSharesCollection, cartId);
  }

  if (segments.length === 4 && second === "share" && third === "collaborators") {
    return handleCollaborator(req, res, usersCollection, cartSharesCollection, cartId, fourth);
  }

  return res.status(404).json({ error: "Not found" });
};
