const {
  buildDisplayName,
  toPublicProfile,
  sanitizeProfileField,
  sanitizeCustomPicture,
} = require("./_lib/user");
const { connectToDatabase } = require("./_lib/db");
const { verifyToken, generateTokens } = require("./_lib/auth");

async function applyAccountPatch(usersCollection, user, body) {
  const { username, customPicture } = body || {};
  const updates = {};
  const unsets = {};

  try {
    const nextUsername = sanitizeProfileField(username, "username");
    if (nextUsername !== undefined) updates.username = nextUsername;

    if (customPicture !== undefined) {
      const nextPicture = sanitizeCustomPicture(customPicture);
      if (nextPicture === null) {
        unsets.customPicture = "";
      } else {
        updates.customPicture = nextPicture;
      }
    }
  } catch (validationError) {
    return { error: validationError.message, status: 400 };
  }

  if (Object.keys(updates).length === 0 && Object.keys(unsets).length === 0) {
    return { error: "No profile fields to update", status: 400 };
  }

  if (updates.username !== undefined) {
    updates.name = buildDisplayName({ ...user, ...updates });
  }

  const updateOp = {};
  if (Object.keys(updates).length > 0) updateOp.$set = updates;
  if (Object.keys(unsets).length > 0) updateOp.$unset = unsets;

  await usersCollection.updateOne({ sub: user.sub }, updateOp);
  const updatedUser = await usersCollection.findOne({ sub: user.sub });
  const { accessToken } = generateTokens(updatedUser);

  return {
    body: {
      ...toPublicProfile(updatedUser),
      accessToken,
    },
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, DELETE, OPTIONS");
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

  const { usersCollection } = await connectToDatabase();

  if (req.method === "GET") {
    try {
      const user = await usersCollection.findOne({ sub: req.user.sub });
      if (!user) {
        return res.status(404).json({ error: "Account not found" });
      }
      return res.json(toPublicProfile(user));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to fetch account" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const user = await usersCollection.findOne({ sub: req.user.sub });
      if (!user) {
        return res.status(404).json({ error: "Account not found" });
      }

      const result = await applyAccountPatch(usersCollection, user, req.body);
      if (result.error) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.json(result.body);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to update account" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { confirmation } = req.body || {};
      if (confirmation !== "DELETE") {
        return res.status(400).json({
          error: 'Type "DELETE" to confirm account deletion',
        });
      }

      const result = await usersCollection.deleteOne({ sub: req.user.sub });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Account not found" });
      }

      return res.json({ success: true, message: "Account deleted" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
