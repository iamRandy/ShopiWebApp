const MAX_PROFILE_FIELD_LENGTH = 50;

const buildDisplayName = ({ username, firstName, lastName, name }) => {
  if (username && String(username).trim()) return String(username).trim();
  const full = [firstName, lastName]
    .filter((part) => part && String(part).trim())
    .join(" ")
    .trim();
  if (full) return full;
  return name || "";
};

const toPublicProfile = (user) => ({
  sub: user.sub,
  email: user.email || "",
  username: user.username || user.name || "",
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  name: user.name || "",
  picture: user.picture || "",
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

module.exports = {
  buildDisplayName,
  toPublicProfile,
  sanitizeProfileField,
};
