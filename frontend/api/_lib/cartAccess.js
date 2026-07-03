/**
 * Resolves whether `sub` can act on `cartId`, and as what role.
 * Returns { allowed, role: "owner"|"edit"|"view"|null, ownerSub }.
 * Checks owner-status first (cheap, existing pattern), falls back to cartShares.
 */
async function resolveCartAccess(usersCollection, cartSharesCollection, sub, cartId) {
  const ownerDoc = await usersCollection.findOne(
    { sub, "carts.id": cartId },
    { projection: { _id: 1 } }
  );
  if (ownerDoc) return { allowed: true, role: "owner", ownerSub: sub };

  const share = await cartSharesCollection.findOne({ cartId });
  if (!share) return { allowed: false, role: null, ownerSub: null };

  const collab = share.collaborators.find((c) => c.sub === sub);
  if (!collab) return { allowed: false, role: null, ownerSub: share.ownerSub };

  return { allowed: true, role: collab.role, ownerSub: share.ownerSub };
}

/** Patches the denormalized display fields in every collaborator's sharedCartIds entry for a cart. */
async function syncSharedCartIdsDisplay(usersCollection, cartId, fields) {
  const $set = {};
  for (const [key, value] of Object.entries(fields)) {
    $set[`sharedCartIds.$[s].${key}`] = value;
  }
  if (Object.keys($set).length === 0) return;
  await usersCollection.updateMany(
    { "sharedCartIds.cartId": cartId },
    { $set },
    { arrayFilters: [{ "s.cartId": cartId }] }
  );
}

module.exports = { resolveCartAccess, syncSharedCartIdsDisplay };
