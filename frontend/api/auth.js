const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("./_lib/db");
const { verifyToken, generateTokens, oauth_client, client_id, REFRESH_TOKEN_SECRET } = require("./_lib/auth");

// login/google, logout, and refresh-token are folded into this one file (dispatched via the
// ?action= query param set by vercel.json rewrites) rather than one file each — Vercel's
// Hobby plan caps a deployment at 12 serverless functions, same reasoning as
// carts/[cartId]/share.js. The public paths (/api/login/google, /api/logout,
// /api/refresh-token) are unchanged for the frontend and for backend/server.js's Express
// routes; only this Vercel-only routing layer is consolidated.

async function loginGoogle(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Google: No token provided" });

    const ticket = await oauth_client.verifyIdToken({
      idToken: token,
      audience: client_id,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ error: "Google: Invalid token" });
    }

    const { usersCollection } = await connectToDatabase();

    const filter = { sub: payload.sub };
    const update = {
      $set: {
        email: payload.email,
        picture: payload.picture,
        lastLogin: new Date(),
      },
      $setOnInsert: {
        carts: [],
        sub: payload.sub,
        name: payload.name,
        username: payload.name,
      },
    };
    await usersCollection.updateOne(filter, update, { upsert: true });

    const user = await usersCollection.findOne({ sub: payload.sub });
    const { accessToken, refreshToken } = generateTokens(user);

    // Persist the issued refresh token so /api/refresh-token can validate it later
    await usersCollection.updateOne(filter, { $set: { refreshToken } });

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
}

async function logout(req, res) {
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
    const { usersCollection } = await connectToDatabase();
    await usersCollection.updateOne(
      { sub: req.user.sub },
      { $unset: { refreshToken: "" } }
    );
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(401).json({ error: "Refresh token is required" });
    }

    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

    const { usersCollection } = await connectToDatabase();
    const user = await usersCollection.findOne({
      sub: decoded.sub,
      refreshToken: token,
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    await usersCollection.updateOne(
      { sub: decoded.sub },
      { $set: { refreshToken: newRefreshToken } }
    );

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Refresh token expired" });
    }
    return res.status(401).json({ error: "Invalid refresh token" });
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  switch (req.query.action) {
    case "login-google":
      return loginGoogle(req, res);
    case "logout":
      return logout(req, res);
    case "refresh-token":
      return refreshToken(req, res);
    default:
      return res.status(400).json({ error: "Unknown or missing auth action" });
  }
};
