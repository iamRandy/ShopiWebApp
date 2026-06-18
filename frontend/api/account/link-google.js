const { connectToDatabase } = require("../_lib/db");
const { verifyToken, oauth_client, client_id, generateTokens } = require("../_lib/auth");
const { toPublicProfile } = require("../_lib/user");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Google token is required" });
    }

    const ticket = await oauth_client.verifyIdToken({
      idToken: token,
      audience: client_id,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({ error: "Invalid Google token" });
    }

    if (payload.sub !== req.user.sub) {
      return res.status(403).json({
        error:
          "This Google account does not match your current login. Sign out and sign in with the other account instead.",
      });
    }

    const { usersCollection } = await connectToDatabase();

    await usersCollection.updateOne(
      { sub: req.user.sub },
      {
        $set: {
          email: payload.email,
          picture: payload.picture,
        },
      }
    );

    const updatedUser = await usersCollection.findOne({ sub: req.user.sub });
    const { accessToken } = generateTokens(updatedUser);

    return res.json({
      ...toPublicProfile(updatedUser),
      accessToken,
      message: "Google account updated",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to link Google account" });
  }
};
