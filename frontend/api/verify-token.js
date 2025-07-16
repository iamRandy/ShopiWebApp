const { verifyToken } = require("./_lib/auth");

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Use the verifyToken middleware
  // Wrap in a promise to use async/await
  const verifyTokenPromise = new Promise((resolve, reject) => {
    verifyToken(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  try {
    await verifyTokenPromise;
    // If successful, return user info
    res.status(200).json({ valid: true, user: req.user });
  } catch (error) {
    console.error("Error trying to verify token", error);
  }
};