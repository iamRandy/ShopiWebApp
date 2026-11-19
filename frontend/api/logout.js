const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("./_lib/db");
const { verifyToken, REFRESH_TOKEN_SECRET } = require("./_lib/auth");
const { revokeRefreshToken, revokeAllRefreshTokens } = require("./_lib/accounts");

// POST /api/logout
//   Body { refreshToken }: ends just that device's session (no access token needed).
//   Otherwise a valid access token is required and every session is ended.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed 1" });
  }

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { refreshToken } = req.body || {};
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, { ignoreExpiration: true });
      const { usersCollection } = await connectToDatabase();
      await revokeRefreshToken(usersCollection, decoded.sub, refreshToken);
    } catch (error) {
      // An invalid token has no session to end; logging out stays idempotent.
      console.error("Logout with refresh token:", error.message);
    }
    return res.json({ message: "Logged out successfully" });
  }

  // Verify token middleware
  const verifyTokenPromise = new Promise((resolve, reject) => {
    verifyToken(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  try {
    await verifyTokenPromise;
  } catch (error) {
    return; // verifyToken already sent response
  }

  try {
    // Connect to database
    const { usersCollection } = await connectToDatabase();

    await revokeAllRefreshTokens(usersCollection, req.user.sub);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};
