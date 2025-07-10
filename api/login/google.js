const { connectToDatabase } = require("../_lib/db");
const { oauth_client, client_id, generateTokens } = require("../_lib/auth");
const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });

    // Verify the Google ID token first
    const ticket = await oauth_client.verifyIdToken({
      idToken: token,
      audience: client_id,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({ error: "Invalid token" });
    }

    // Connect to database
    const { usersCollection } = await connectToDatabase();

    // Generate refresh token for this user
    const refreshTokenValue = crypto.randomBytes(64).toString("hex");

    // Save or update user in MongoDB with refresh token
    const filter = { sub: payload.sub }; // Google's unique user ID
    const update = {
      $set: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub,
        lastLogin: new Date(),
        refreshToken: refreshTokenValue,
      },
      $setOnInsert: { products: [] },
    };
    const options = { upsert: true };
    await usersCollection.updateOne(filter, update, options);

    // Generate our own JWT tokens
    const { accessToken, refreshToken } = generateTokens(payload);

    res.status(200).json({
      message: "Login successful",
      user: payload,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};
