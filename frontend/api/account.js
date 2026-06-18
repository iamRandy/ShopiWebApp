const { connectToDatabase } = require("./_lib/db");
const { verifyToken, generateTokens } = require("./_lib/auth");
const {
  buildDisplayName,
  toPublicProfile,
  sanitizeProfileField,
} = require("./_lib/user");

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

      const { username, firstName, lastName } = req.body || {};
      const updates = {};

      try {
        const nextUsername = sanitizeProfileField(username, "username");
        const nextFirstName = sanitizeProfileField(firstName, "firstName");
        const nextLastName = sanitizeProfileField(lastName, "lastName");

        if (nextUsername !== undefined) updates.username = nextUsername;
        if (nextFirstName !== undefined) updates.firstName = nextFirstName;
        if (nextLastName !== undefined) updates.lastName = nextLastName;
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No profile fields to update" });
      }

      const merged = { ...user, ...updates };
      updates.name = buildDisplayName(merged);

      await usersCollection.updateOne({ sub: req.user.sub }, { $set: updates });
      const updatedUser = await usersCollection.findOne({ sub: req.user.sub });
      const { accessToken } = generateTokens(updatedUser);

      return res.json({
        ...toPublicProfile(updatedUser),
        accessToken,
      });
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
