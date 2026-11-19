const { connectToDatabase } = require("../_lib/db");
const { generateTokens } = require("../_lib/auth");
const {
  verifyAppleIdentityToken,
  isAppleRevocationConfigured,
  exchangeAppleAuthorizationCode,
} = require("../_lib/apple");
const { upsertAppleUser, saveRefreshToken } = require("../_lib/accounts");

// POST /api/login/apple
// Body: { identityToken, rawNonce, authorizationCode?, fullName?: { givenName, familyName } }
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { identityToken, rawNonce, authorizationCode, fullName } = req.body || {};

  let claims;
  try {
    claims = await verifyAppleIdentityToken(identityToken, rawNonce);
  } catch (err) {
    console.error("Apple token verification failed:", err.message);
    const status = err.status || 401;
    return res
      .status(status)
      .json({ error: status >= 500 ? err.message : "Apple: Invalid identity token" });
  }

  try {
    const { usersCollection } = await connectToDatabase();
    const user = await upsertAppleUser(usersCollection, claims, fullName);

    // Keep an Apple refresh token so it can be revoked if the account is deleted.
    if (authorizationCode && isAppleRevocationConfigured()) {
      try {
        const appleRefreshToken = await exchangeAppleAuthorizationCode(authorizationCode);
        if (appleRefreshToken) {
          await usersCollection.updateOne({ sub: user.sub }, { $set: { appleRefreshToken } });
        }
      } catch (err) {
        console.error("Apple authorization code exchange failed:", err.message);
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(usersCollection, user.sub, refreshToken);

    res.status(200).json({
      message: "Login successful",
      user: { sub: user.sub, email: user.email, name: user.name, picture: user.picture },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Apple login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};
