/**
 * Moves one or more products from `cartId` into `destinationCartId`, which may belong to a
 * different user's document (e.g. moving into/out of a cart shared at "edit" role) — modeled
 * on the transferOwnership transaction in carts/[cartId]/share.js, since a pull-from-one-doc +
 * push-to-another-doc needs to be atomic. Always runs the transaction, even when both carts
 * happen to be owned by the same user, to keep a single code path. Mirrors
 * backend/server.js's moveProductsBetweenCarts by hand — keep both in sync.
 * Throws an Error with a `.status` set to the HTTP status the caller should respond with.
 */
async function moveProductsBetweenCarts(
  client,
  usersCollection,
  sourceAccess,
  cartId,
  productIds,
  destAccess,
  destinationCartId
) {
  let movedProducts = [];

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const sourceDoc = await usersCollection.findOne(
        { sub: sourceAccess.ownerSub, "carts.id": cartId },
        { session, projection: { "carts.$": 1 } }
      );
      const sourceCart = sourceDoc?.carts?.[0];
      if (!sourceCart) {
        const err = new Error("Cart not found");
        err.status = 404;
        throw err;
      }

      // Tolerant of ids that are no longer in the source cart (e.g. deleted or already moved
      // by someone else) — move whichever requested ids are still actually present, matching
      // the existing bulk-delete route's tolerant $in semantics rather than hard-failing.
      movedProducts = (sourceCart.products || []).filter((p) => productIds.includes(p.id));
      if (movedProducts.length === 0) {
        const err = new Error("Product not found in cart");
        err.status = 404;
        throw err;
      }

      const destDoc = await usersCollection.findOne(
        { sub: destAccess.ownerSub, "carts.id": destinationCartId },
        { session, projection: { _id: 1 } }
      );
      if (!destDoc) {
        const err = new Error("Destination cart not found");
        err.status = 404;
        throw err;
      }

      const movedIds = movedProducts.map((p) => p.id);
      await usersCollection.updateOne(
        { sub: sourceAccess.ownerSub, "carts.id": cartId },
        { $pull: { "carts.$.products": { id: { $in: movedIds } } } },
        { session }
      );
      await usersCollection.updateOne(
        { sub: destAccess.ownerSub, "carts.id": destinationCartId },
        { $push: { "carts.$.products": { $each: movedProducts } } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return movedProducts;
}

module.exports = { moveProductsBetweenCarts };
