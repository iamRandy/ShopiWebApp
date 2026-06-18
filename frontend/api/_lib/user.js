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

module.exports = {
  buildDisplayName,
  getDisplayPicture,
  getJwtPicture,
  toPublicProfile,
  sanitizeProfileField,
  sanitizeCustomPicture,
};
