const { connectToDatabase } = require("../_lib/db");
const { oauth_client, googleAudiences, generateTokens } = require("../_lib/auth");
const { upsertGoogleUser, saveRefreshToken } = require("../_lib/accounts");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed 5" });
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
    if (!token) return res.status(400).json({ error: "Google: No token provided" });

    // Verify the Google ID token first
    const ticket = await oauth_client.verifyIdToken({
      idToken: token,
      audience: googleAudiences,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({ error: "Google: Invalid token" });
    }

    // Connect to database
    const { usersCollection } = await connectToDatabase();

    // Save or update the user (links to an Apple-created account by verified email)
    const user = await upsertGoogleUser(usersCollection, payload);

    // Generate our own JWT tokens and remember this session's refresh token
    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(usersCollection, user.sub, refreshToken);

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
