// Photos saved from the iOS app live in the Vercel Blob store
// "shopi-product-images", connected to this project (BLOB_READ_WRITE_TOKEN).
//
// The store is public, so <img> tags, the app and the extension load the files
// straight from Vercel's CDN. Each file gets a random UUID name, so its URL
// can't be guessed or listed; it's only ever written into its owner's cart.
// Products point at their file through `image`, like any other picture.
const crypto = require("crypto");
const { put, del } = require("@vercel/blob");

// Decoded size. The app sends JPEGs well under this; Vercel caps a function's
// request body at 4.5 MB, and base64 adds a third.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const FOLDER = "products/";
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

// What browsers, the extension and iOS can all show, identified by content.
const FORMATS = [
  { type: "image/jpeg", ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", ext: "png", matches: (b) => b.toString("latin1", 0, 8) === "\x89PNG\r\n\x1a\n" },
  { type: "image/webp", ext: "webp", matches: (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP" },
  { type: "image/gif", ext: "gif", matches: (b) => b.toString("latin1", 0, 4) === "GIF8" },
];

class ImageError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Reads a base64 image from a request body, or throws an ImageError. */
function decodeImage(base64) {
  if (typeof base64 !== "string") throw new ImageError(400, "The photo couldn't be read");
  const compact = base64.replace(/\s+/g, "");
  if (!compact || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
    throw new ImageError(400, "The photo couldn't be read");
  }
  if ((compact.length * 3) / 4 > MAX_IMAGE_BYTES + 3) {
    throw new ImageError(413, "The photo is too large");
  }
  const bytes = Buffer.from(compact, "base64");
  const format = bytes.length >= 12 && FORMATS.find((f) => f.matches(bytes));
  if (!format) throw new ImageError(415, "Only JPEG, PNG, WebP and GIF photos can be saved");
  return { bytes, ...format };
}

/** Uploads a decoded image and returns its public URL. */
async function storeImage({ bytes, type, ext }) {
  const blob = await put(`${FOLDER}${crypto.randomUUID()}.${ext}`, bytes, {
    access: "public",
    contentType: type,
    // The name never changes hands, so the CDN and devices can keep it for good.
    cacheControlMaxAge: 365 * 24 * 60 * 60,
  });
  return blob.url;
}

/** True for files this API stored, as opposed to pictures on other sites. */
function isStoredImage(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(BLOB_HOST_SUFFIX) && url.pathname.startsWith(`/${FOLDER}`);
  } catch {
    return false;
  }
}

/** The stored files behind some products. */
function storedImagesOf(products) {
  return [...new Set((products || []).map((p) => p?.image).filter(isStoredImage))];
}

/** The stored files behind every product in some carts. */
function storedImagesInCarts(carts) {
  return storedImagesOf((carts || []).flatMap((cart) => cart?.products || []));
}

/**
 * Deletes stored files once nothing points at them. Never throws: a file left
 * behind is better than failing the delete the person asked for.
 */
async function deleteStoredImages(urls) {
  const stored = (urls || []).filter(isStoredImage);
  if (stored.length === 0) return;
  try {
    await del(stored);
  } catch (err) {
    console.error("Failed to delete stored images:", err.message);
  }
}

/**
 * After products were removed: deletes their stored files, except any that
 * another of the user's products still shows. Never throws.
 */
async function deleteUnusedImages(users, sub, urls) {
  const unused = [];
  for (const url of new Set((urls || []).filter(isStoredImage))) {
    try {
      const stillUsed = await users.findOne({ sub, "carts.products.image": url }, { projection: { _id: 1 } });
      if (!stillUsed) unused.push(url);
    } catch (err) {
      console.error("Failed to check a stored image:", err.message);
    }
  }
  await deleteStoredImages(unused);
}

module.exports = {
  MAX_IMAGE_BYTES,
  ImageError,
  decodeImage,
  storeImage,
  isStoredImage,
  storedImagesOf,
  storedImagesInCarts,
  deleteStoredImages,
  deleteUnusedImages,
};
