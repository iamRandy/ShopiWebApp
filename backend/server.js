// ShopiWebApp/backend/server.js
const path = require("path");
const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");

dotenv.config();

const app = express();
const PORT = 3000;
const client_id = process.env.VITE_CLIENT_ID;
const oauth_client = new OAuth2Client(client_id);

// JWT secrets - use environment variables in production
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

const client = new MongoClient(process.env.MONGODB_URI);
let usersCollection;

app.use(
  cors({
    origin: "*", // or use "*" during dev only
    // credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function init() {
  await client.connect();
  const db = client.db("shopi");
  usersCollection = db.collection("users");
  app.listen(PORT, () => console.log("API ready on", PORT));
}

// Generate tokens
const generateTokens = (user) => {
  const payload = {
    sub: user.sub,
    email: user.email,
    name: user.name,
    picture: user.picture,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ sub: user.sub }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
};

// Middleware to verify JWT token (our own tokens, not Google's)
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // Add user info to request
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// API routes
app.post("/api/login/google", async (req, res) => {
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
});

// Refresh token endpoint
app.post("/api/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token is required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // Check if user and refresh token exist in database
    const user = await usersCollection.findOne({
      sub: decoded.sub,
      refreshToken: refreshToken,
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in database (token rotation for security)
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
});

// Logout endpoint to invalidate refresh token
app.post("/api/logout", verifyToken, async (req, res) => {
  try {
    // Remove refresh token from database
    await usersCollection.updateOne(
      { sub: req.user.sub },
      { $unset: { refreshToken: "" } }
    );

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// fetch the logged-in user's own products
app.get("/api/products", verifyToken, async (req, res) => {
  try {
    const doc = await usersCollection.findOne(
      { sub: req.user.sub }, // Use verified user from token
      { projection: { _id: 0, products: 1 } }
    );
    res.json(doc?.products || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed" });
  }
});

// delete a specific product for a user
app.delete("/api/products", verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Try to remove the product with the matching ID first
    let result = await usersCollection.updateOne(
      { sub: req.user.sub }, // Use verified user from token
      { $pull: { products: { id: productId } } }
    );

    if (result.modifiedCount > 0) {
      res.json({ success: true, message: "Product deleted successfully" });
    } else {
      res.status(404).json({ error: "Product not found or already deleted" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Serve React build (only if deploying frontend + backend together)
app.use(express.static(path.join(__dirname, "../dist")));

init();
