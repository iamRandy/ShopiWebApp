const crypto = require("crypto");
const { connectToDatabase } = require("../../../_lib/db");
const { verifyToken } = require("../../../_lib/auth");
const { ImageError, decodeImage, storeImage, deleteStoredImages } = require("../../../_lib/images");

// POST /api/carts/:cartId/products
//
// Saves a product to one of the signed-in user's carts. The iOS app's share
// extension uses it for links and text shared from any app. Unlike the browser
// extension's /api/save, the account comes from the access token, never from
// the request body.
//
// Body (all optional, but there must be a url, a title or a photo):
//   { url, title, description, image, price, currency, nickname, imageData }
// `imageData` is a base64 photo (a shared photo or screenshot, or a social
// post's preview, whose own link expires). It's stored in Vercel Blob and
// becomes the product's `image`. Responds 201 with { product }.

const LIMITS = {
  url: 2048,
  image: 2048,
  title: 500,
  description: 2000,
  nickname: 200,
  currency: 8,
  priceText: 32,
};

function text(value, limit) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, limit) : null;
}

// http(s) only: anything else (javascript:, data:, file:) is dropped.
function webURL(value, limit) {
  const raw = text(value, Infinity);
  if (!raw || raw.length > limit) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// Scrapers store prices as numbers or as text like "1,299.00"; both are kept.
function price(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  return text(value, LIMITS.priceText);
}

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

  const verifyTokenPromise = new Promise((resolve, reject) => {
    verifyToken(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  try {
    await verifyTokenPromise;
  } catch {
    return; // verifyToken already sent the response
  }

  const { cartId } = req.query;
  if (!cartId) {
    return res.status(400).json({ error: "Cart ID is required" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (body.url != null && body.url !== "" && !webURL(body.url, LIMITS.url)) {
    return res.status(400).json({ error: "The link must be a web address" });
  }

  let photo = null;
  if (body.imageData != null) {
    try {
      photo = decodeImage(body.imageData);
    } catch (err) {
      if (err instanceof ImageError) return res.status(err.status).json({ error: err.message });
      throw err;
    }
  }

  const url = webURL(body.url, LIMITS.url);
  const title = text(body.title, LIMITS.title);
  if (!url && !title && !photo) {
    return res.status(400).json({ error: "Nothing to save: add a link, a title or a photo" });
  }

  const nickname = text(body.nickname, LIMITS.nickname);
  const product = {
    id: crypto.randomUUID(),
    url: url ? url.href : null,
    hostname: url ? url.hostname : null,
    title,
    description: text(body.description, LIMITS.description),
    image: webURL(body.image, LIMITS.image)?.href ?? null,
    price: price(body.price),
    currency: text(body.currency, LIMITS.currency),
    ...(nickname && { nickname }),
    source: "ios-share",
    ts: new Date(),
  };

  if (photo) {
    try {
      product.image = await storeImage(photo);
    } catch (e) {
      console.error("Photo upload failed:", e);
      return res.status(502).json({ error: "The photo couldn't be uploaded. Try again." });
    }
  }

  try {
    const { usersCollection } = await connectToDatabase();
    const result = await usersCollection.updateOne(
      { sub: req.user.sub, "carts.id": cartId },
      { $push: { "carts.$.products": product } }
    );

    if (result.matchedCount === 0) {
      if (photo) await deleteStoredImages([product.image]);
      return res.status(404).json({ error: "Cart not found" });
    }
    return res.status(201).json({ product });
  } catch (e) {
    console.error(e);
    if (photo) await deleteStoredImages([product.image]);
    return res.status(500).json({ error: "Failed to save product" });
  }
};
