const { connectToDatabase } = require("./_lib/db");
const { verifyToken } = require("./_lib/auth");
const { isAppleRevocationConfigured, revokeAppleToken } = require("./_lib/apple");
const { storedImagesInCarts, deleteStoredImages } = require("./_lib/images");

// DELETE /api/account — permanently deletes the signed-in user and their carts.
// Required by App Store Review for apps that let people create accounts.
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE, OPTIONS");
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
    return; // verifyToken already sent response
  }

  try {
    const { db, usersCollection } = await connectToDatabase();
    const user = await usersCollection.findOne(
      { sub: req.user.sub },
      { projection: { appleRefreshToken: 1, "carts.products.image": 1 } }
    );
    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (user.appleRefreshToken && isAppleRevocationConfigured()) {
      try {
        await revokeAppleToken(user.appleRefreshToken);
      } catch (err) {
        console.error("Apple token revocation failed:", err.message);
      }
    }

    await usersCollection.deleteOne({ sub: req.user.sub });
    // So do the notes of which days they used Chaos (_lib/activity.js)...
    await db.collection("activity").deleteMany({ sub: req.user.sub });
    // ...and their saved photos.
    await deleteStoredImages(storedImagesInCarts(user.carts));
    res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
};
