const { connectToDatabase } = require("../../../_lib/db");
const { verifyToken } = require("../../../_lib/auth");
const { resolveCartAccess } = require("../../../_lib/cartAccess");

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

  const { cartId, productId } = req.query;

  if (!cartId || !productId) {
    return res.status(400).json({ error: "Cart ID and Product ID are required" });
  }

  try {
    const { usersCollection, cartSharesCollection } = await connectToDatabase();
    const access = await resolveCartAccess(usersCollection, cartSharesCollection, req.user.sub, cartId);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }

    if (req.method === "PATCH") {
      const { nickname, isFavorite, note, price, tags } = req.body;

      if (nickname !== undefined && typeof nickname !== "string") {
        return res.status(400).json({ error: "Nickname must be a string" });
      }

      if (isFavorite !== undefined && typeof isFavorite !== "boolean") {
        return res.status(400).json({ error: "isFavorite must be a boolean" });
      }

      if (note !== undefined && typeof note !== "string") {
        return res.status(400).json({ error: "Note must be a string" });
      }

      let normalizedPrice;
      if (price !== undefined) {
        normalizedPrice = typeof price === "string" ? Number(price.replace(/,/g, "").trim()) : Number(price);
        if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
          return res.status(400).json({ error: "Price must be a non-negative number" });
        }
        normalizedPrice = Math.round(normalizedPrice * 100) / 100;
      }

      if (tags !== undefined) {
        if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
          return res.status(400).json({ error: "tags must be an array of strings" });
        }
        if (tags.length > 10) {
          return res.status(400).json({ error: "Maximum 10 tags allowed" });
        }
      }

      const trimmedNickname =
        typeof nickname === "string" ? nickname.trim() : undefined;
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

      if (normalizedPrice !== undefined) {
        $set["carts.$[c].products.$[p].price"] = normalizedPrice;
      }

      if (tags !== undefined) {
        // An empty array is a meaningful "no tags" state (unlike nickname/note),
        // so it's always $set, never $unset.
        $set["carts.$[c].products.$[p].tags"] = tags;
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
        return res
          .status(404)
          .json({ error: "Product not found in cart or cart not found" });
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
    }

    if (req.method === "DELETE") {
      const result = await usersCollection.updateOne(
        { sub: access.ownerSub, "carts.id": cartId },
        { $pull: { "carts.$.products": { id: productId } } }
      );

      if (result.modifiedCount > 0) {
        return res.json({ success: true, message: "Product deleted successfully" });
      }
      return res
        .status(404)
        .json({ error: "Product not found in cart or cart not found" });
    }

    res.setHeader("Allow", "PATCH, DELETE, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to update product" });
  }
};
