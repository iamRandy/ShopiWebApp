// ShopiWebApp/backend/server.js
const path = require("path");
const http = require("http");
const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const { Server: SocketIOServer } = require("socket.io");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const cheerio = require("cheerio");

dotenv.config();

const app = express();
const PORT = 3000;
const client_id = process.env.VITE_CLIENT_ID;
const oauth_client = new OAuth2Client(client_id);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// JWT secrets - use environment variables in production
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "2h"; // 2 hours
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

// A product's price is re-checked at most once per this window, and only when visible to a user.
const STALE_SCAN_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

// A user-triggered manual price check is throttled independently of STALE_SCAN_MS (and only
// armed on success — see the check-price route) so a failed check never blocks an immediate retry.
const MANUAL_CHECK_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// Once a hostname is seen serving a bot-check page, skip re-hitting it (for any product on that
// domain, manual or background) for this long — avoids repeatedly bothering a site we already
// know is blocking us. Short enough that a lifted block gets retried on its own eventually.
const BLOCKED_HOST_TTL_SECONDS = 6 * 60 * 60; // 6 hours

const client = new MongoClient(process.env.MONGODB_URI);
let usersCollection;
let cartSharesCollection;
let tagsCollection;
let blockedHostsCollection;

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });

app.use(
  cors({
    origin: "*", // or use "*" during dev only
    // credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

async function init() {
  await client.connect();
  const db = client.db("shopi");
  usersCollection = db.collection("users");
  cartSharesCollection = db.collection("cartShares");
  tagsCollection = db.collection("tags");
  blockedHostsCollection = db.collection("blockedHosts");
  await Promise.all([
    cartSharesCollection.createIndex({ shareToken: 1 }, { unique: true }),
    cartSharesCollection.createIndex({ cartId: 1, ownerSub: 1 }, { unique: true }),
    cartSharesCollection.createIndex({ "collaborators.sub": 1 }),
    usersCollection.createIndex({ "sharedCartIds.cartId": 1 }),
    blockedHostsCollection.createIndex({ hostname: 1 }, { unique: true }),
    blockedHostsCollection.createIndex({ blockedAt: 1 }, { expireAfterSeconds: BLOCKED_HOST_TTL_SECONDS }),
  ]);
  httpServer.listen(PORT, () => console.log("API ready on", PORT));
}

const MAX_PROFILE_FIELD_LENGTH = 50;
const MAX_PICTURE_BYTES = 512 * 1024;
const ALLOWED_IMAGE_PREFIXES = [
  "data:image/jpeg",
  "data:image/png",
  "data:image/webp",
  "data:image/gif",
];

const buildDisplayName = ({ username, name }) => {
  if (username && String(username).trim()) return String(username).trim();
  return name || "";
};

const getDisplayPicture = (user) => {
  if (!user) return "";
  if (user.customPicture) return user.customPicture;
  if (user.picture) return user.picture;
  return "";
};

/** Only short URLs belong in JWT — never embed base64 custom avatars. */
const getJwtPicture = (user) => {
  const picture = user?.picture || "";
  if (!picture || picture.startsWith("data:")) return "";
  return picture;
};

const toPublicProfile = (user) => ({
  sub: user.sub,
  email: user.email || "",
  username: user.username || user.name || "",
  name: user.name || "",
  picture: user.picture || "",
  customPicture: user.customPicture || "",
  avatarUrl: getDisplayPicture(user),
  hasCustomPicture: Boolean(user.customPicture),
});

const sanitizeProfileField = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_PROFILE_FIELD_LENGTH) {
    throw new Error(`${fieldName} must be at most ${MAX_PROFILE_FIELD_LENGTH} characters`);
  }
  return trimmed;
};

const sanitizeCustomPicture = (value) => {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error("Picture must be a data URL string");
  }
  if (!ALLOWED_IMAGE_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    throw new Error("Picture must be JPEG, PNG, WebP, or GIF");
  }
  const base64 = value.split(",")[1] || "";
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > MAX_PICTURE_BYTES) {
    throw new Error("Picture must be under 512KB");
  }
  return value;
};

// Generate tokens
const generateTokens = (user) => {
  const payload = {
    sub: user.sub,
    email: user.email,
    name: user.name,
    picture: getJwtPicture(user),
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ sub: user.sub }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
};

/** Socket.IO room name for a given cart, keyed by its owner (stable regardless of who's viewing). */
const room = (ownerSub, cartId) => `cart:${ownerSub}:${cartId}`;

/**
 * Resolves whether `sub` can act on `cartId`, and as what role.
 * Returns { allowed, role: "owner"|"edit"|"view"|null, ownerSub }.
 * Checks owner-status first (cheap, existing pattern), falls back to cartShares.
 */
async function resolveCartAccess(sub, cartId) {
  const ownerDoc = await usersCollection.findOne(
    { sub, "carts.id": cartId },
    { projection: { _id: 1 } }
  );
  if (ownerDoc) return { allowed: true, role: "owner", ownerSub: sub };

  const share = await cartSharesCollection.findOne({ cartId });
  if (!share) return { allowed: false, role: null, ownerSub: null };

  const collab = share.collaborators.find((c) => c.sub === sub);
  if (!collab) return { allowed: false, role: null, ownerSub: share.ownerSub };

  return { allowed: true, role: collab.role, ownerSub: share.ownerSub };
}

/** Patches the denormalized display fields in every collaborator's sharedCartIds entry for a cart. */
async function syncSharedCartIdsDisplay(cartId, fields) {
  const $set = {};
  for (const [key, value] of Object.entries(fields)) {
    $set[`sharedCartIds.$[s].${key}`] = value;
  }
  if (Object.keys($set).length === 0) return;
  await usersCollection.updateMany(
    { "sharedCartIds.cartId": cartId },
    { $set },
    { arrayFilters: [{ "s.cartId": cartId }] }
  );
}

// ---------------------------------------------------------------------------
// Background price rescanning
// ---------------------------------------------------------------------------

const SCRAPE_TIMEOUT_MS = 9000;
const SCRAPE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Pulls a numeric price out of schema.org Product/Offer JSON-LD, the same first-choice
 * strategy the browser extension's scrapers use, since most retailers embed it in
 * server-rendered HTML for SEO even on otherwise JS-heavy storefronts. */
function extractJsonLdPrice($) {
  const blocks = $('script[type="application/ld+json"]').toArray();
  for (const block of blocks) {
    let parsed;
    try {
      parsed = JSON.parse($(block).contents().text());
    } catch {
      continue;
    }

    const nodes = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.["@graph"])
        ? parsed["@graph"]
        : [parsed];

    for (const node of nodes) {
      if (!node || node["@type"] !== "Product") continue;
      const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      const rawPrice = offers?.price;
      const price =
        typeof rawPrice === "string" ? Number(rawPrice.replace(/,/g, "").trim()) : Number(rawPrice);
      if (Number.isFinite(price) && price >= 0) return Math.round(price * 100) / 100;
    }
  }
  return null;
}

/** Sites like Amazon serve a 200 OK "prove you're not a robot" interstitial instead of the real
 * page to non-browser traffic — this is a distinct outcome from "no price found", worth telling
 * the user apart from a generic failure so they know to check the price on the site themselves. */
const BOT_BLOCK_PATTERN =
  /captcha|are you a (human|robot)|verify you are a human|unusual traffic|access denied|attention required|cf-browser-verification|just a moment|robot check|automated access to (our|this|amazon)/i;

/** Best-effort, lightweight re-scrape: plain HTTP GET + static HTML parse, no headless browser.
 * Sites that only render price via client JS, or that block non-browser traffic, just fail here
 * silently — the caller still bumps lastScannedAt so we don't hammer the same URL every cart open. */
async function scrapeProductPrice(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": SCRAPE_USER_AGENT, Accept: "text/html" },
      signal: controller.signal,
    });

    // Checked before response.ok — some bot-block systems (Cloudflare) fail the request with a
    // 403/503 whose body is the block page itself, rather than Amazon's fake-200 interstitial.
    const html = await response.text();
    if (BOT_BLOCK_PATTERN.test(html)) return { ok: false, blocked: true };
    if (!response.ok) return { ok: false };

    const $ = cheerio.load(html);
    const price = extractJsonLdPrice($);
    return price === null ? { ok: false } : { ok: true, price };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

// Caps how many rescans run concurrently server-wide, so a big page of stale products
// doesn't fire dozens of simultaneous outbound requests at once.
const MAX_CONCURRENT_SCANS = 4;
let activeScans = 0;
const scanQueue = [];

function withScanSlot(fn) {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeScans++;
      fn()
        .then(resolve, reject)
        .finally(() => {
          activeScans--;
          const next = scanQueue.shift();
          if (next) next();
        });
    };
    if (activeScans < MAX_CONCURRENT_SCANS) run();
    else scanQueue.push(run);
  });
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function isHostBlocked(hostname) {
  if (!hostname) return false;
  const doc = await blockedHostsCollection.findOne({ hostname });
  return Boolean(doc);
}

async function markHostBlocked(hostname) {
  if (!hostname) return;
  await blockedHostsCollection.updateOne(
    { hostname },
    { $set: { hostname, blockedAt: new Date() } },
    { upsert: true }
  );
}

/** Wraps scrapeProductPrice with the shared concurrency limiter and the blocked-hostname cache:
 * skips the network call entirely for a hostname we've recently seen bot-block us, and records
 * one the moment it's discovered, so every caller (manual check, background rescan) benefits. */
async function scrapeProductPriceGuarded(url) {
  const hostname = hostnameFromUrl(url);
  if (await isHostBlocked(hostname)) {
    return { ok: false, blocked: true };
  }
  const result = await withScanSlot(() => scrapeProductPrice(url));
  if (!result.ok && result.blocked) {
    await markHostBlocked(hostname);
  }
  return result;
}

// Product ids currently mid-scan, so overlapping rescan requests (two tabs on the same
// cart, or rapidly flipping pages/carts) never scrape the same product twice at once.
const scanningProductIds = new Set();

/** Persists a completed scan's result and, only if the price actually changed, emits a
 * live update for whoever currently has the cart open. */
async function applyRescanResult({ ownerSub, cartId, productId, previousPrice, result }) {
  const priceChanged =
    result.ok &&
    Number.isFinite(result.price) &&
    (!Number.isFinite(Number(previousPrice)) || Math.abs(result.price - Number(previousPrice)) >= 0.01);

  const $set = { "carts.$[c].products.$[p].lastScannedAt": new Date().toISOString() };
  if (priceChanged) {
    $set["carts.$[c].products.$[p].price"] = result.price;
  }

  await usersCollection.updateOne(
    { sub: ownerSub },
    { $set },
    { arrayFilters: [{ "c.id": cartId }, { "p.id": productId }] }
  );

  if (!priceChanged) return;

  const user = await usersCollection.findOne({ sub: ownerSub }, { projection: { _id: 0, carts: 1 } });
  const cart = user?.carts?.find((c) => c.id === cartId);
  const product = cart?.products?.find((p) => p.id === productId);
  if (!product) return;

  io.to(room(ownerSub, cartId)).emit("product:rescanned", { cartId, productId, previousPrice, product });
}

// Middleware to verify JWT token (our own tokens, not Google's)
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Verify Token: No token provided" });
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
    return res.status(401).json({ error: "Verify token: Invalid token" });
  }
};

// Socket.IO: authenticate the handshake with the same access JWT used by REST, then
// let clients join/leave a room scoped to whichever single cart they currently have open.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("unauthorized"));
  try {
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("cart:join", async ({ cartId }) => {
    try {
      const access = await resolveCartAccess(socket.user.sub, cartId);
      if (!access.allowed) return socket.emit("cart:joinDenied", { cartId });
      socket.join(room(access.ownerSub, cartId));
    } catch (e) {
      console.error("cart:join error", e);
    }
  });

  socket.on("cart:leave", ({ cartId, ownerSub }) => {
    if (cartId && ownerSub) socket.leave(room(ownerSub, cartId));
  });
});

// API routes
app.post("/api/login/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Login: No token provided" });

    // Verify the Google ID token first
    const ticket = await oauth_client.verifyIdToken({
      idToken: token,
      audience: client_id,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({ error: "Google API: Invalid token" });
    }

    // Save or update user in MongoDB
    const filter = { sub: payload.sub }; // Google's unique user ID
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
    const options = { upsert: true };
    await usersCollection.updateOne(filter, update, options);

    const user = await usersCollection.findOne({ sub: payload.sub });

    // Generate our own JWT tokens
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

app.get("/api/carts", verifyToken, async (req, res) => {
  try {
    const doc = await usersCollection.findOne(
      { sub: req.user.sub },
      { projection: { _id: 0, carts: 1 } }
    );
    res.json(doc?.carts || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to fetch carts" });
  }
});

app.post("/api/carts", verifyToken, async (req, res) => {
  try {
    const { name, icon, color, bannerType, bannerGradient } = req.body;
    const newCart = {
      name,
      icon,
      color: color || "#000000",
      bannerType: bannerType || "color",
      bannerGradient: bannerType === "gradient" ? bannerGradient || null : null,
      id: crypto.randomUUID(),
      products: [], // Initialize empty products array
    };
    if (req.user.sub) {
      await usersCollection.updateOne(
        { sub: req.user.sub },
        { $push: { carts: newCart } }
      );
    }
    res.json(newCart);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to create cart" });
  }
});

app.post("/api/carts/selectCart", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.body;
    const user = await usersCollection.findOne(
      { sub: req.user.sub },
      { projection: { _id: 0, carts: 1 } }
    );
    const selectedCart = user.carts.find((cart) => cart.id === cartId);
    res.json(selectedCart);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to select cart" });
  }
});

// Update a specific cart
app.put("/api/carts/:cartId", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { name, icon, color, bannerType, bannerGradient } = req.body;

    if (!cartId) {
      return res.status(400).json({ error: "Cart ID is required" });
    }

    const access = await resolveCartAccess(req.user.sub, cartId);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }

    // Update the cart in the owner's carts array (owner may differ from the requester for shared carts)
    const result = await usersCollection.updateOne(
      { sub: access.ownerSub, "carts.id": cartId },
      {
        $set: {
          "carts.$.name": name,
          "carts.$.icon": icon,
          ...(color && { "carts.$.color": color }),
          ...(bannerType && { "carts.$.bannerType": bannerType }),
          ...(bannerType === "gradient" && { "carts.$.bannerGradient": bannerGradient || null }),
        },
      }
    );

    if (result.modifiedCount > 0) {
      // Fetch the updated cart to return it
      const user = await usersCollection.findOne(
        { sub: access.ownerSub },
        { projection: { _id: 0, carts: 1 } }
      );
      const updatedCart = user.carts.find((cart) => cart.id === cartId);

      await syncSharedCartIdsDisplay(cartId, {
        cartName: updatedCart.name,
        cartIcon: updatedCart.icon,
        ...(updatedCart.color && { cartColor: updatedCart.color }),
        ...(updatedCart.bannerType && { bannerType: updatedCart.bannerType }),
        ...(updatedCart.bannerGradient && { bannerGradient: updatedCart.bannerGradient }),
      });
      io.to(room(access.ownerSub, cartId)).emit("cart:renamed", {
        cartId,
        name: updatedCart.name,
        icon: updatedCart.icon,
        color: updatedCart.color,
        bannerType: updatedCart.bannerType,
        bannerGradient: updatedCart.bannerGradient,
      });

      res.json(updatedCart);
    } else {
      res.status(404).json({ error: "Cart not found" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// Persist a custom drag-and-drop product order for a cart.
app.patch("/api/carts/:cartId/order", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { productOrder } = req.body;

    if (!Array.isArray(productOrder) || productOrder.some((id) => typeof id !== "string")) {
      return res.status(400).json({ error: "productOrder must be an array of product ids" });
    }

    const access = await resolveCartAccess(req.user.sub, cartId);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }

    const result = await usersCollection.updateOne(
      { sub: access.ownerSub, "carts.id": cartId },
      { $set: { "carts.$.productOrder": productOrder } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Cart not found" });
    }

    io.to(room(access.ownerSub, cartId)).emit("cart:productsReordered", { cartId, productOrder });
    res.json({ success: true, productOrder });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save product order" });
  }
});

// Delete a specific cart (owner only)
app.delete("/api/carts/:cartId", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.params;

    if (!cartId) {
      return res.status(400).json({ error: "Cart ID is required" });
    }

    const access = await resolveCartAccess(req.user.sub, cartId);
    if (access.role !== "owner") {
      return res.status(403).json({ error: "Only the cart owner can delete this cart" });
    }

    // Remove the cart from the user's carts array
    const result = await usersCollection.updateOne(
      { sub: req.user.sub },
      { $pull: { carts: { id: cartId } } }
    );

    if (result.modifiedCount > 0) {
      io.to(room(req.user.sub, cartId)).emit("cart:deleted", { cartId });

      const share = await cartSharesCollection.findOneAndDelete({
        cartId,
        ownerSub: req.user.sub,
      });
      const collaboratorSubs = share?.collaborators?.map((c) => c.sub) || [];
      if (collaboratorSubs.length > 0) {
        await usersCollection.updateMany(
          { sub: { $in: collaboratorSubs } },
          { $pull: { sharedCartIds: { cartId } } }
        );
      }

      res.json({ success: true, message: "Cart deleted successfully" });
    } else {
      res.status(404).json({ error: "Cart not found or already deleted" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete cart" });
  }
});

// NOTE: Products API endpoints removed - products are now stored directly in carts
// No longer need separate products array or batch fetching
// Products are automatically deleted when their cart is deleted

// Update a product in a specific cart (nickname, favorite, note)
app.patch("/api/carts/:cartId/products/:productId", verifyToken, async (req, res) => {
  try {
    const { cartId, productId } = req.params;
    const { nickname, isFavorite, note, price, tags } = req.body;

    if (!cartId || !productId) {
      return res.status(400).json({ error: "Cart ID and Product ID are required" });
    }

    const access = await resolveCartAccess(req.user.sub, cartId);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }

    if (nickname !== undefined && typeof nickname !== "string") {
      return res.status(400).json({ error: "Nickname must be a string" });
    }

    if (isFavorite !== undefined && typeof isFavorite !== "boolean") {
      return res.status(400).json({ error: "isFavorite must be a boolean" });
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({ error: "Note must be a string" });
    }

    let normalizedPrice;
    if (price !== undefined) {
      normalizedPrice = typeof price === "string" ? Number(price.replace(/,/g, "").trim()) : Number(price);
      if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
        return res.status(400).json({ error: "Price must be a non-negative number" });
      }
      normalizedPrice = Math.round(normalizedPrice * 100) / 100;
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
        return res.status(400).json({ error: "tags must be an array of strings" });
      }
      if (tags.length > 10) {
        return res.status(400).json({ error: "Maximum 10 tags allowed" });
      }
    }

    const trimmedNickname =
      typeof nickname === "string" ? nickname.trim() : undefined;
    const trimmedNote = typeof note === "string" ? note.trim() : undefined;

    const $set = {};
    const $unset = {};

    if (trimmedNickname !== undefined) {
      if (trimmedNickname) {
        $set["carts.$[c].products.$[p].nickname"] = trimmedNickname;
      } else {
        $unset["carts.$[c].products.$[p].nickname"] = "";
      }
    }

    if (isFavorite !== undefined) {
      $set["carts.$[c].products.$[p].isFavorite"] = isFavorite;
    }

    if (trimmedNote !== undefined) {
      if (trimmedNote) {
        $set["carts.$[c].products.$[p].note"] = trimmedNote;
      } else {
        $unset["carts.$[c].products.$[p].note"] = "";
      }
    }

    if (normalizedPrice !== undefined) {
      $set["carts.$[c].products.$[p].price"] = normalizedPrice;
    }

    if (tags !== undefined) {
      // An empty array is a meaningful "no tags" state (unlike nickname/note),
      // so it's always $set, never $unset.
      $set["carts.$[c].products.$[p].tags"] = tags;
    }

    if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const update = {};
    if (Object.keys($set).length > 0) update.$set = $set;
    if (Object.keys($unset).length > 0) update.$unset = $unset;

    const result = await usersCollection.updateOne(
      { sub: access.ownerSub },
      update,
      { arrayFilters: [{ "c.id": cartId }, { "p.id": productId }] }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found in cart or cart not found" });
    }

    const user = await usersCollection.findOne(
      { sub: access.ownerSub },
      { projection: { _id: 0, carts: 1 } }
    );
    const cart = user?.carts?.find((c) => c.id === cartId);
    const product = cart?.products?.find((p) => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found after update" });
    }

    io.to(room(access.ownerSub, cartId)).emit("product:updated", { cartId, productId, product });

    res.json({ success: true, product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete a product from a specific cart
app.delete("/api/carts/:cartId/products/:productId", verifyToken, async (req, res) => {
  try {
    const { cartId, productId } = req.params;

    if (!cartId || !productId) {
      return res.status(400).json({ error: "Cart ID and Product ID are required" });
    }

    const access = await resolveCartAccess(req.user.sub, cartId);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }

    // Remove the product from the cart's products array
    const result = await usersCollection.updateOne(
      { sub: access.ownerSub, "carts.id": cartId },
      { $pull: { "carts.$.products": { id: productId } } }
    );

    if (result.modifiedCount > 0) {
      io.to(room(access.ownerSub, cartId)).emit("product:deleted", { cartId, productId });
      res.json({ success: true, message: "Product deleted successfully" });
    } else {
      res.status(404).json({ error: "Product not found in cart or cart not found" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Delete multiple products from a specific cart in a single request
app.delete("/api/carts/:cartId/products", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { productIds } = req.body;

    if (!cartId) {
      return res.status(400).json({ error: "Cart ID is required" });
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "productIds must be a non-empty array" });
    }

    const access = await resolveCartAccess(req.user.sub, cartId);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }

    const result = await usersCollection.updateOne(
      { sub: access.ownerSub, "carts.id": cartId },
      { $pull: { "carts.$.products": { id: { $in: productIds } } } }
    );

    if (result.modifiedCount > 0) {
      io.to(room(access.ownerSub, cartId)).emit("products:deleted", { cartId, productIds });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "No matching products found in cart" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete products" });
  }
});

// Re-check prices for a set of currently-visible products in a cart. Only products whose
// price hasn't been checked in STALE_SCAN_MS get scraped; the rest are ignored. Responds
// immediately with which ids were actually queued — the scraping itself runs after the
// response is sent and isn't tied to this request's lifecycle.
app.post("/api/carts/:cartId/products/rescan", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { productIds } = req.body;

    if (!cartId) {
      return res.status(400).json({ error: "Cart ID is required" });
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "productIds must be a non-empty array" });
    }

    const access = await resolveCartAccess(req.user.sub, cartId);
    if (!access.allowed) {
      return res.status(403).json({ error: "You do not have access to this cart" });
    }

    const user = await usersCollection.findOne(
      { sub: access.ownerSub, "carts.id": cartId },
      { projection: { _id: 0, "carts.$": 1 } }
    );
    const cart = user?.carts?.[0];
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const requestedIds = new Set(productIds);
    const now = Date.now();
    const staleProducts = (cart.products || []).filter(
      (p) =>
        requestedIds.has(p.id) &&
        p.url &&
        !scanningProductIds.has(p.id) &&
        (!p.lastScannedAt || now - new Date(p.lastScannedAt).getTime() >= STALE_SCAN_MS)
    );

    res.json({ queued: staleProducts.map((p) => p.id) });

    staleProducts.forEach((product) => scanningProductIds.add(product.id));
    staleProducts.forEach((product) => {
      scrapeProductPriceGuarded(product.url)
        .then((result) =>
          applyRescanResult({
            ownerSub: access.ownerSub,
            cartId,
            productId: product.id,
            previousPrice: product.price,
            result,
          })
        )
        .catch((e) => console.error("Rescan failed for product", product.id, e))
        .finally(() => scanningProductIds.delete(product.id));
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to queue rescan" });
  }
});

// User-triggered price check for a single product, re-scraping its source URL on demand.
// Throttled to once per MANUAL_CHECK_COOLDOWN_MS, armed only on a successful check so a failed
// scrape (site down, price not found) never blocks the user from retrying right away.
// Registered after the /rescan route above so that literal path isn't shadowed by :productId.
app.post("/api/carts/:cartId/products/:productId", verifyToken, async (req, res) => {
  try {
    const { cartId, productId } = req.params;

    if (!cartId || !productId) {
      return res.status(400).json({ error: "Cart ID and Product ID are required" });
    }

    const access = await resolveCartAccess(req.user.sub, cartId);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }

    // Moving a product into another cart is folded behind a body.action discriminator on
    // this same route rather than a dedicated path, matching how cart-sharing mutations are
    // consolidated above — the manual price-check below stays the default (unconditional
    // bare-POST) behavior since the existing "refresh price" button never sends a body.
    if (req.body?.action === "move") {
      const { destinationCartId } = req.body;
      if (!destinationCartId) {
        return res.status(400).json({ error: "destinationCartId is required" });
      }
      if (destinationCartId === cartId) {
        return res.status(400).json({ error: "Source and destination cart must be different" });
      }

      const destAccess = await resolveCartAccess(req.user.sub, destinationCartId);
      if (!destAccess.allowed || destAccess.role === "view") {
        return res.status(403).json({ error: "You do not have permission to edit the destination cart" });
      }

      let movedProducts;
      try {
        movedProducts = await moveProductsBetweenCarts(access, cartId, [productId], destAccess, destinationCartId);
      } catch (e) {
        return res.status(e.status || 500).json({ error: e.status ? e.message : "Failed to move product" });
      }
      const product = movedProducts[0];

      io.to(room(access.ownerSub, cartId)).emit("product:moved", { cartId, productId, destinationCartId });
      io.to(room(destAccess.ownerSub, destinationCartId)).emit("product:movedIn", {
        cartId: destinationCartId,
        product,
        sourceCartId: cartId,
      });

      return res.json({ success: true, product });
    }

    const user = await usersCollection.findOne(
      { sub: access.ownerSub, "carts.id": cartId },
      { projection: { _id: 0, "carts.$": 1 } }
    );
    const cart = user?.carts?.[0];
    const product = cart?.products?.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found in cart or cart not found" });
    }
    if (!product.url) {
      return res.status(400).json({ error: "Product has no source URL to check" });
    }

    const lastCheckMs = product.lastManualPriceCheckAt
      ? new Date(product.lastManualPriceCheckAt).getTime()
      : null;
    if (lastCheckMs && Date.now() - lastCheckMs < MANUAL_CHECK_COOLDOWN_MS) {
      return res.json({
        status: "cooldown",
        price: product.price,
        previousPrice: product.priceBeforeManualCheck ?? product.price,
        currency: product.currency,
        lastManualPriceCheckAt: product.lastManualPriceCheckAt,
      });
    }

    if (scanningProductIds.has(productId)) {
      return res.json({ status: "busy" });
    }
    scanningProductIds.add(productId);

    let result;
    try {
      result = await scrapeProductPriceGuarded(product.url);
    } finally {
      scanningProductIds.delete(productId);
    }

    if (!result.ok) {
      return res.json({ status: result.blocked ? "blocked" : "error" });
    }

    const previousPrice = product.price;
    const priceChanged =
      Number.isFinite(result.price) &&
      (!Number.isFinite(Number(previousPrice)) || Math.abs(result.price - Number(previousPrice)) >= 0.01);
    const nowIso = new Date().toISOString();

    const $set = {
      "carts.$[c].products.$[p].lastManualPriceCheckAt": nowIso,
      "carts.$[c].products.$[p].priceBeforeManualCheck": previousPrice,
      "carts.$[c].products.$[p].lastScannedAt": nowIso,
    };
    if (priceChanged) {
      $set["carts.$[c].products.$[p].price"] = result.price;
    }

    await usersCollection.updateOne(
      { sub: access.ownerSub },
      { $set },
      { arrayFilters: [{ "c.id": cartId }, { "p.id": productId }] }
    );

    if (priceChanged) {
      const updatedUser = await usersCollection.findOne(
        { sub: access.ownerSub },
        { projection: { _id: 0, carts: 1 } }
      );
      const updatedProduct = updatedUser?.carts
        ?.find((c) => c.id === cartId)
        ?.products?.find((p) => p.id === productId);
      if (updatedProduct) {
        io.to(room(access.ownerSub, cartId)).emit("product:rescanned", {
          cartId,
          productId,
          previousPrice,
          product: updatedProduct,
        });
      }
    }

    res.json({
      status: "checked",
      price: priceChanged ? result.price : previousPrice,
      previousPrice,
      priceChanged,
      currency: product.currency,
      lastManualPriceCheckAt: nowIso,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to check price" });
  }
});

// Moves one or more products from `cartId` into `destinationCartId`, which may belong to a
// different user's document (e.g. moving into/out of a cart shared at "edit" role) — modeled
// on transferOwnership's session.withTransaction pattern above, since a pull-from-one-doc +
// push-to-another-doc needs to be atomic. Always runs the transaction, even when both carts
// happen to be owned by the same user, to keep a single code path. Throws an Error with a
// `.status` set to the HTTP status the caller should respond with.
async function moveProductsBetweenCarts(sourceAccess, cartId, productIds, destAccess, destinationCartId) {
  let movedProducts = [];

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const sourceDoc = await usersCollection.findOne(
        { sub: sourceAccess.ownerSub, "carts.id": cartId },
        { session, projection: { "carts.$": 1 } }
      );
      const sourceCart = sourceDoc?.carts?.[0];
      if (!sourceCart) {
        const err = new Error("Cart not found");
        err.status = 404;
        throw err;
      }

      // Tolerant of ids that are no longer in the source cart (e.g. deleted or already moved
      // by someone else) — move whichever requested ids are still actually present, matching
      // the existing bulk-delete route's tolerant $in semantics rather than hard-failing.
      movedProducts = (sourceCart.products || []).filter((p) => productIds.includes(p.id));
      if (movedProducts.length === 0) {
        const err = new Error("Product not found in cart");
        err.status = 404;
        throw err;
      }

      const destDoc = await usersCollection.findOne(
        { sub: destAccess.ownerSub, "carts.id": destinationCartId },
        { session, projection: { _id: 1 } }
      );
      if (!destDoc) {
        const err = new Error("Destination cart not found");
        err.status = 404;
        throw err;
      }

      const movedIds = movedProducts.map((p) => p.id);
      await usersCollection.updateOne(
        { sub: sourceAccess.ownerSub, "carts.id": cartId },
        { $pull: { "carts.$.products": { id: { $in: movedIds } } } },
        { session }
      );
      await usersCollection.updateOne(
        { sub: destAccess.ownerSub, "carts.id": destinationCartId },
        { $push: { "carts.$.products": { $each: movedProducts } } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return movedProducts;
}

// Bulk-move products from this cart into another cart the user can edit (own cart, or a cart
// shared with them at "edit" role). Folded behind a body.action discriminator on this
// collection route (mirroring the cart-sharing consolidation above) rather than a dedicated
// path, leaving room for other bulk actions on this same route later.
app.post("/api/carts/:cartId/products", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { action, productIds, destinationCartId } = req.body;

    if (action !== "move") {
      return res.status(400).json({ error: "Unknown or missing action" });
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "productIds must be a non-empty array" });
    }
    if (!destinationCartId) {
      return res.status(400).json({ error: "destinationCartId is required" });
    }
    if (destinationCartId === cartId) {
      return res.status(400).json({ error: "Source and destination cart must be different" });
    }

    const [access, destAccess] = await Promise.all([
      resolveCartAccess(req.user.sub, cartId),
      resolveCartAccess(req.user.sub, destinationCartId),
    ]);
    if (!access.allowed || access.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit this cart" });
    }
    if (!destAccess.allowed || destAccess.role === "view") {
      return res.status(403).json({ error: "You do not have permission to edit the destination cart" });
    }

    let movedProducts;
    try {
      movedProducts = await moveProductsBetweenCarts(access, cartId, productIds, destAccess, destinationCartId);
    } catch (e) {
      return res.status(e.status || 500).json({ error: e.status ? e.message : "Failed to move products" });
    }

    const movedIds = movedProducts.map((p) => p.id);
    io.to(room(access.ownerSub, cartId)).emit("products:moved", { cartId, productIds: movedIds, destinationCartId });
    io.to(room(destAccess.ownerSub, destinationCartId)).emit("products:movedIn", {
      cartId: destinationCartId,
      products: movedProducts,
      sourceCartId: cartId,
    });

    res.json({ success: true, movedProducts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to move products" });
  }
});

// ---------------------------------------------------------------------------
// Tags (read-only here — the canonical list is owned/written by the Chrome
// extension's own backend; this app only reads the shared `tags` collection)
// ---------------------------------------------------------------------------

app.get("/api/tags", async (_req, res) => {
  try {
    const tags = await tagsCollection.find({}).toArray();
    res.json({ tags });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

app.get("/api/tags/suggest", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const limit = Number(req.query.limit) || 10;
    if (!q) return res.json({ tags: [] });

    const all = await tagsCollection.find({}).toArray();
    const matches = all
      .filter(
        (tag) =>
          tag.slug?.toLowerCase().includes(q) ||
          tag.label?.toLowerCase().includes(q) ||
          (tag.aliases || []).some((alias) => alias.toLowerCase().includes(q))
      )
      .slice(0, limit);
    res.json({ tags: matches });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch tag suggestions" });
  }
});

// ---------------------------------------------------------------------------
// Cart sharing
// ---------------------------------------------------------------------------

// New unified single-cart fetch (owner or accepted collaborator), with products.
app.get("/api/carts/:cartId", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.params;
    const access = await resolveCartAccess(req.user.sub, cartId);
    if (!access.allowed) {
      return res.status(403).json({ error: "You do not have access to this cart" });
    }
    const doc = await usersCollection.findOne(
      { sub: access.ownerSub, "carts.id": cartId },
      { projection: { _id: 0, "carts.$": 1 } }
    );
    const cart = doc?.carts?.[0];
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    res.json({ ...cart, myRole: access.role, ownerSub: access.ownerSub });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// List (metadata only, no products) of carts shared with the current user.
app.get("/api/shared-carts", verifyToken, async (req, res) => {
  try {
    const doc = await usersCollection.findOne(
      { sub: req.user.sub },
      { projection: { _id: 0, sharedCartIds: 1 } }
    );
    res.json(doc?.sharedCartIds || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch shared carts" });
  }
});

// A collaborator removes their own access to a shared cart.
app.delete("/api/shared-carts", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.body || {};
    if (!cartId) {
      return res.status(400).json({ error: "cartId is required" });
    }
    const share = await cartSharesCollection.findOne({ cartId });
    if (!share) {
      return res.status(404).json({ error: "This cart is not shared" });
    }
    if (share.ownerSub === req.user.sub) {
      return res.status(400).json({ error: "Owners cannot leave their own cart" });
    }

    await cartSharesCollection.updateOne(
      { cartId },
      { $pull: { collaborators: { sub: req.user.sub } } }
    );
    await usersCollection.updateOne(
      { sub: req.user.sub },
      { $pull: { sharedCartIds: { cartId } } }
    );

    io.to(room(share.ownerSub, cartId)).emit("collaborator:removed", { cartId, sub: req.user.sub });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to leave shared cart" });
  }
});

// Owner generates or regenerates a cart's share link + role.
async function generateShareLink(req, res, cartId) {
  const { role } = req.body;
  if (role !== "view" && role !== "edit") {
    return res.status(400).json({ error: "role must be 'view' or 'edit'" });
  }

  const access = await resolveCartAccess(req.user.sub, cartId);
  if (access.role !== "owner") {
    return res.status(403).json({ error: "Only the cart owner can share this cart" });
  }

  const shareToken = crypto.randomBytes(32).toString("base64url");
  const now = new Date();

  const existing = await cartSharesCollection.findOne({ cartId, ownerSub: req.user.sub });
  if (existing) {
    await cartSharesCollection.updateOne(
      { _id: existing._id },
      { $set: { shareToken, linkRole: role, updatedAt: now } }
    );
  } else {
    await cartSharesCollection.insertOne({
      cartId,
      ownerSub: req.user.sub,
      shareToken,
      linkRole: role,
      createdAt: now,
      updatedAt: now,
      collaborators: [],
    });
  }

  res.json({ shareToken, linkRole: role, shareUrl: `${FRONTEND_URL}/shared/${shareToken}` });
}

// Owner changes a collaborator's role.
async function setCollaboratorRole(req, res, cartId) {
  const { sub, role } = req.body;
  if (!sub) return res.status(400).json({ error: "sub is required" });
  if (role !== "view" && role !== "edit") {
    return res.status(400).json({ error: "role must be 'view' or 'edit'" });
  }

  const access = await resolveCartAccess(req.user.sub, cartId);
  if (access.role !== "owner") {
    return res.status(403).json({ error: "Only the cart owner can change collaborator roles" });
  }

  const result = await cartSharesCollection.updateOne(
    { cartId, ownerSub: req.user.sub, "collaborators.sub": sub },
    { $set: { "collaborators.$.role": role } }
  );
  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Collaborator not found" });
  }

  await usersCollection.updateOne(
    { sub, "sharedCartIds.cartId": cartId },
    { $set: { "sharedCartIds.$.role": role } }
  );

  io.to(room(req.user.sub, cartId)).emit("collaborator:roleChanged", { cartId, sub, role });

  res.json({ success: true, sub, role });
}

// Owner removes a collaborator. The share link itself stays valid for reuse.
async function removeCollaborator(req, res, cartId) {
  const { sub } = req.body;
  if (!sub) return res.status(400).json({ error: "sub is required" });

  const access = await resolveCartAccess(req.user.sub, cartId);
  if (access.role !== "owner") {
    return res.status(403).json({ error: "Only the cart owner can remove collaborators" });
  }

  await cartSharesCollection.updateOne(
    { cartId, ownerSub: req.user.sub },
    { $pull: { collaborators: { sub } } }
  );
  await usersCollection.updateOne(
    { sub },
    { $pull: { sharedCartIds: { cartId } } }
  );

  io.to(room(req.user.sub, cartId)).emit("collaborator:removed", { cartId, sub });

  res.json({ success: true });
}

// Owner transfers ownership of a cart to an existing collaborator.
async function transferOwnership(req, res, cartId) {
  const { toSub } = req.body;
  if (!toSub) {
    return res.status(400).json({ error: "toSub is required" });
  }

  const access = await resolveCartAccess(req.user.sub, cartId);
  if (access.role !== "owner") {
    return res.status(403).json({ error: "Only the cart owner can transfer ownership" });
  }
  if (toSub === req.user.sub) {
    return res.status(400).json({ error: "You already own this cart" });
  }

  const oldOwnerSub = req.user.sub;
  const share = await cartSharesCollection.findOne({ cartId, ownerSub: oldOwnerSub });
  const targetCollab = share?.collaborators?.find((c) => c.sub === toSub);
  if (!targetCollab) {
    return res.status(400).json({ error: "Transfer target must be an existing collaborator" });
  }

  let newOwnerProfile = null;

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const oldOwnerDoc = await usersCollection.findOne(
        { sub: oldOwnerSub, "carts.id": cartId },
        { session, projection: { "carts.$": 1, name: 1, username: 1, picture: 1, email: 1 } }
      );
      const cartSubdoc = oldOwnerDoc?.carts?.[0];
      if (!cartSubdoc) throw new Error("Cart not found");

      newOwnerProfile = await usersCollection.findOne(
        { sub: toSub },
        { session, projection: { name: 1, username: 1, picture: 1 } }
      );
      if (!newOwnerProfile) throw new Error("Target user not found");

      await usersCollection.updateOne(
        { sub: oldOwnerSub },
        { $pull: { carts: { id: cartId } } },
        { session }
      );
      await usersCollection.updateOne(
        { sub: toSub },
        { $push: { carts: cartSubdoc } },
        { session }
      );

      const otherCollaborators = (share.collaborators || []).filter((c) => c.sub !== toSub);
      await cartSharesCollection.updateOne(
        { _id: share._id },
        {
          $set: {
            ownerSub: toSub,
            collaborators: [
              ...otherCollaborators,
              {
                sub: oldOwnerSub,
                role: "edit",
                email: oldOwnerDoc.email || "",
                name: oldOwnerDoc.username || oldOwnerDoc.name || "",
                picture: oldOwnerDoc.picture || "",
                acceptedAt: new Date(),
              },
            ],
          },
        },
        { session }
      );

      // toSub is now the owner: drop their "shared with me" pointer for this cart.
      await usersCollection.updateOne(
        { sub: toSub },
        { $pull: { sharedCartIds: { cartId } } },
        { session }
      );

      // Old owner now sees this cart under "Shared with me" as an edit collaborator.
      await usersCollection.updateOne(
        { sub: oldOwnerSub },
        {
          $push: {
            sharedCartIds: {
              shareId: share._id,
              cartId,
              ownerSub: toSub,
              ownerName: newOwnerProfile.username || newOwnerProfile.name || "",
              ownerPicture: newOwnerProfile.picture || "",
              cartName: cartSubdoc.name,
              cartIcon: cartSubdoc.icon,
              cartColor: cartSubdoc.color,
              role: "edit",
              acceptedAt: new Date(),
            },
          },
        },
        { session }
      );

      // Fix up display data for every other remaining collaborator.
      const otherSubs = otherCollaborators.map((c) => c.sub);
      if (otherSubs.length > 0) {
        await usersCollection.updateMany(
          { sub: { $in: otherSubs }, "sharedCartIds.cartId": cartId },
          {
            $set: {
              "sharedCartIds.$[s].ownerSub": toSub,
              "sharedCartIds.$[s].ownerName": newOwnerProfile.username || newOwnerProfile.name || "",
              "sharedCartIds.$[s].ownerPicture": newOwnerProfile.picture || "",
            },
          },
          { session, arrayFilters: [{ "s.cartId": cartId }] }
        );
      }
    });
  } finally {
    await session.endSession();
  }

  io.to(room(oldOwnerSub, cartId)).emit("cart:ownershipTransferred", {
    cartId,
    newOwnerSub: toSub,
    newOwnerName: newOwnerProfile?.username || newOwnerProfile?.name || "",
    previousOwnerSub: oldOwnerSub,
  });

  res.json({ success: true });
}

// Cart-sharing mutations (generate/regenerate link, change a collaborator's role, remove a
// collaborator, transfer ownership) are folded behind a body.action discriminator on this one
// route — mirrors the equivalent consolidation in frontend/api/carts/[cartId]/share.js, which
// Vercel's Hobby plan function-count cap forced; kept in sync here so local dev matches prod.
app.post("/api/carts/:cartId/share", verifyToken, async (req, res) => {
  const { cartId } = req.params;
  try {
    switch (req.body?.action) {
      case "generate":
        return await generateShareLink(req, res, cartId);
      case "setRole":
        return await setCollaboratorRole(req, res, cartId);
      case "remove":
        return await removeCollaborator(req, res, cartId);
      case "transfer":
        return await transferOwnership(req, res, cartId);
      default:
        return res.status(400).json({ error: "Unknown or missing action" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to update sharing settings" });
  }
});

// Owner fetches share link + collaborator list, for the manage-collaborators UI.
app.get("/api/carts/:cartId/share", verifyToken, async (req, res) => {
  try {
    const { cartId } = req.params;
    const access = await resolveCartAccess(req.user.sub, cartId);
    if (access.role !== "owner") {
      return res.status(403).json({ error: "Only the cart owner can view sharing settings" });
    }

    const share = await cartSharesCollection.findOne({ cartId, ownerSub: req.user.sub });
    if (!share) {
      return res.json({ shareToken: null, linkRole: null, shareUrl: null, collaborators: [] });
    }

    res.json({
      shareToken: share.shareToken,
      linkRole: share.linkRole,
      shareUrl: `${FRONTEND_URL}/shared/${share.shareToken}`,
      collaborators: share.collaborators.map((c) => ({
        sub: c.sub,
        role: c.role,
        email: c.email,
        name: c.name,
        picture: c.picture,
        acceptedAt: c.acceptedAt,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sharing settings" });
  }
});

// Public: resolve a share token into a cart preview + the viewer's status. Optional auth —
// guests (no/invalid Bearer token) are allowed through with a read-only preview.
app.get("/api/shared/:token", async (req, res) => {
  try {
    const share = await cartSharesCollection.findOne({ shareToken: req.params.token });
    if (!share) {
      return res.status(404).json({ error: "This share link is invalid or has been removed." });
    }

    const ownerDoc = await usersCollection.findOne(
      { sub: share.ownerSub, "carts.id": share.cartId },
      { projection: { "carts.$": 1, name: 1, username: 1, picture: 1 } }
    );
    const cart = ownerDoc?.carts?.[0];
    if (!cart) {
      return res.status(404).json({ error: "This cart no longer exists." });
    }

    let viewerSub = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        viewerSub = jwt.verify(authHeader.split(" ")[1], JWT_SECRET).sub;
      } catch {
        // Invalid/expired token: treat as a guest rather than rejecting the request.
      }
    }

    let status;
    let myRole = null;
    if (!viewerSub) {
      status = "guest";
    } else if (viewerSub === share.ownerSub) {
      status = "owner";
    } else {
      const collab = share.collaborators.find((c) => c.sub === viewerSub);
      if (collab) {
        status = "collaborator";
        myRole = collab.role;
      } else {
        status = "pending";
      }
    }

    res.json({
      cartId: share.cartId,
      cartName: cart.name,
      cartIcon: cart.icon,
      cartColor: cart.color,
      productCount: cart.products?.length || 0,
      ownerName: ownerDoc?.username || ownerDoc?.name || "Someone",
      ownerPicture: ownerDoc?.picture || "",
      linkRole: share.linkRole,
      status,
      myRole,
      products: status === "guest" || status === "pending" ? cart.products || [] : undefined,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to resolve share link" });
  }
});

// Authenticated user accepts a share invite.
async function acceptShareInvite(req, res, token) {
  const share = await cartSharesCollection.findOne({ shareToken: token });
  if (!share) {
    return res.status(404).json({ error: "This share link is invalid or has been removed." });
  }

  if (req.user.sub === share.ownerSub) {
    return res.status(400).json({ error: "You already own this cart" });
  }

  const existing = share.collaborators.find((c) => c.sub === req.user.sub);
  if (existing) {
    return res.json({ cartId: share.cartId, role: existing.role });
  }

  const ownerDoc = await usersCollection.findOne(
    { sub: share.ownerSub, "carts.id": share.cartId },
    { projection: { "carts.$": 1, name: 1, username: 1, picture: 1 } }
  );
  const cart = ownerDoc?.carts?.[0];
  if (!cart) {
    return res.status(404).json({ error: "This cart no longer exists." });
  }

  const viewerDoc = await usersCollection.findOne({ sub: req.user.sub });
  const acceptedAt = new Date();
  const collaborator = {
    sub: req.user.sub,
    role: share.linkRole,
    email: viewerDoc?.email || req.user.email || "",
    name: viewerDoc?.username || viewerDoc?.name || req.user.name || "",
    picture: viewerDoc?.picture || req.user.picture || "",
    acceptedAt,
  };

  await cartSharesCollection.updateOne(
    { _id: share._id },
    { $push: { collaborators: collaborator } }
  );

  await usersCollection.updateOne(
    { sub: req.user.sub },
    {
      $push: {
        sharedCartIds: {
          shareId: share._id,
          cartId: share.cartId,
          ownerSub: share.ownerSub,
          ownerName: ownerDoc?.username || ownerDoc?.name || "Someone",
          ownerPicture: ownerDoc?.picture || "",
          cartName: cart.name,
          cartIcon: cart.icon,
          cartColor: cart.color,
          role: share.linkRole,
          acceptedAt,
        },
      },
    }
  );

  io.to(room(share.ownerSub, share.cartId)).emit("collaborator:added", {
    cartId: share.cartId,
    collaborator: {
      sub: collaborator.sub,
      role: collaborator.role,
      name: collaborator.name,
      picture: collaborator.picture,
    },
  });

  res.json({ cartId: share.cartId, role: share.linkRole });
}

// Authenticated user accepts or declines a share invite (declining has no server-side state
// to undo, just an acknowledgement) — folded behind body.action for the same reason the
// cart-sharing routes above are; kept in sync with frontend/api/shared/[token].js.
app.post("/api/shared/:token", verifyToken, async (req, res) => {
  try {
    if (req.body?.action === "decline") {
      return res.json({ success: true });
    }
    if (req.body?.action === "accept") {
      return await acceptShareInvite(req, res, req.params.token);
    }
    res.status(400).json({ error: "Unknown or missing action" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to accept share invite" });
  }
});

app.get("/api/account", verifyToken, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ sub: req.user.sub });
    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json(toPublicProfile(user));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

async function linkGoogleAccount(req, res, user) {
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

  if (payload.sub !== user.sub) {
    return res.status(403).json({
      error:
        "This Google account does not match your current login. Sign out and sign in with the other account instead.",
    });
  }

  await usersCollection.updateOne(
    { sub: user.sub },
    { $set: { email: payload.email, picture: payload.picture } }
  );

  const updatedUser = await usersCollection.findOne({ sub: user.sub });
  const { accessToken } = generateTokens(updatedUser);

  res.json({
    ...toPublicProfile(updatedUser),
    accessToken,
    message: "Google account updated",
  });
}

async function updateProfile(req, res, user) {
  const { username, customPicture } = req.body || {};
  const updates = {};
  const unsets = {};

  try {
    const nextUsername = sanitizeProfileField(username, "username");
    if (nextUsername !== undefined) updates.username = nextUsername;

    if (customPicture !== undefined) {
      const nextPicture = sanitizeCustomPicture(customPicture);
      if (nextPicture === null) {
        unsets.customPicture = "";
      } else {
        updates.customPicture = nextPicture;
      }
    }
  } catch (validationError) {
    return res.status(400).json({ error: validationError.message });
  }

  if (Object.keys(updates).length === 0 && Object.keys(unsets).length === 0) {
    return res.status(400).json({ error: "No profile fields to update" });
  }

  if (updates.username !== undefined) {
    updates.name = buildDisplayName({ ...user, ...updates });
  }

  const updateOp = {};
  if (Object.keys(updates).length > 0) updateOp.$set = updates;
  if (Object.keys(unsets).length > 0) updateOp.$unset = unsets;

  await usersCollection.updateOne({ sub: user.sub }, updateOp);
  const updatedUser = await usersCollection.findOne({ sub: user.sub });
  const { accessToken } = generateTokens(updatedUser);

  res.json({
    ...toPublicProfile(updatedUser),
    accessToken,
  });
}

// Profile field updates and Google account (re)linking are folded behind body.action —
// kept in sync with frontend/api/account.js's equivalent consolidation.
app.patch("/api/account", verifyToken, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ sub: req.user.sub });
    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (req.body?.action === "linkGoogle") {
      return await linkGoogleAccount(req, res, user);
    }
    await updateProfile(req, res, user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update account" });
  }
});

app.delete("/api/account", verifyToken, async (req, res) => {
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

    res.json({ success: true, message: "Account deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Serve React build (only if deploying frontend + backend together)
app.use(express.static(path.join(__dirname, "../dist")));

init();
