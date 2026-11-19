// User account + session persistence for the login, refresh and logout
// functions. Callers pass in the MongoDB `users` collection.
//
// Identity model: `sub` is the canonical user id every route keys on.
//   - Google users: sub = Google's subject id (the browser extension relies on this).
//   - Apple-only users: sub = "apple:<Apple subject id>", with `appleSub` set.
// Accounts are linked by verified email so the same person sees the same carts
// whichever provider they use.
const crypto = require("crypto");

// Refresh tokens are stored hashed, one per signed-in device (web, iOS, ...).
const MAX_SESSIONS_PER_USER = 10;
const APPLE_SUB_PREFIX = "apple:";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const isTrueClaim = (value) => value === true || value === "true";

async function saveRefreshToken(users, sub, refreshToken) {
  await users.updateOne(
    { sub },
    {
      $push: {
        refreshTokens: { $each: [hashToken(refreshToken)], $slice: -MAX_SESSIONS_PER_USER },
      },
      $unset: { refreshToken: "" }, // legacy single-session field
    }
  );
}

/** Atomically removes a refresh token; returns false if it was not active. */
async function consumeRefreshToken(users, sub, refreshToken) {
  const hash = hashToken(refreshToken);
  const result = await users.updateOne(
    { sub, refreshTokens: hash },
    { $pull: { refreshTokens: hash } }
  );
  return result.modifiedCount === 1;
}

async function revokeRefreshToken(users, sub, refreshToken) {
  await users.updateOne({ sub }, { $pull: { refreshTokens: hashToken(refreshToken) } });
}

async function revokeAllRefreshTokens(users, sub) {
  await users.updateOne({ sub }, { $set: { refreshTokens: [] }, $unset: { refreshToken: "" } });
}

/** Creates or updates the user for a verified Google ID token payload. */
async function upsertGoogleUser(users, payload) {
  const emailVerified = isTrueClaim(payload.email_verified);
  const profile = {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified,
    lastLogin: new Date(),
  };

  const existing = await users.findOne({ sub: payload.sub }, { projection: { _id: 1 } });
  if (!existing && emailVerified && payload.email) {
    // Adopt an account first created with Sign in with Apple under the same
    // verified email. Its sub becomes the Google sub so the extension, which
    // identifies users by Google sub, saves into the same carts.
    const adopted = await users.findOneAndUpdate(
      {
        sub: { $regex: `^${APPLE_SUB_PREFIX}` },
        email: payload.email.toLowerCase(),
        emailVerified: true,
      },
      { $set: profile },
      { returnDocument: "after" }
    );
    if (adopted) return adopted;
  }

  return users.findOneAndUpdate(
    { sub: payload.sub },
    { $set: profile, $setOnInsert: { carts: [] } },
    { upsert: true, returnDocument: "after" }
  );
}

function formatFullName(fullName) {
  if (!fullName) return undefined;
  const name =
    typeof fullName === "string"
      ? fullName
      : [fullName.givenName, fullName.familyName].filter(Boolean).join(" ");
  const trimmed = name.trim().slice(0, 100);
  return trimmed || undefined;
}

/**
 * Finds or creates the user for verified Sign in with Apple claims.
 * `fullName` comes from the app because Apple only shares it on first sign-in.
 */
async function upsertAppleUser(users, claims, fullName) {
  const appleSub = claims.sub;
  const email = typeof claims.email === "string" ? claims.email.toLowerCase() : undefined;
  const emailVerified = isTrueClaim(claims.email_verified);
  const isPrivateRelay = isTrueClaim(claims.is_private_email);
  const name = formatFullName(fullName);
  const now = new Date();

  let user = await users.findOne({ appleSub });

  if (!user && email && emailVerified && !isPrivateRelay) {
    // Link to an existing account (typically created with Google on the web).
    user = await users.findOneAndUpdate(
      { email, appleSub: { $exists: false }, emailVerified: { $ne: false } },
      { $set: { appleSub } },
      { returnDocument: "after" }
    );
  }

  if (!user) {
    user = await users.findOneAndUpdate(
      { appleSub },
      {
        $setOnInsert: {
          sub: `${APPLE_SUB_PREFIX}${appleSub}`,
          email: email ?? null,
          emailVerified,
          name: name ?? null,
          picture: null,
          carts: [],
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  // Fill in details Apple only shares once; never overwrite existing values.
  const updates = { lastLogin: now };
  if (!user.name && name) updates.name = name;
  if (!user.email && email) {
    updates.email = email;
    updates.emailVerified = emailVerified;
  }
  await users.updateOne({ _id: user._id }, { $set: updates });

  return { ...user, ...updates };
}

module.exports = {
  saveRefreshToken,
  consumeRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  upsertGoogleUser,
  upsertAppleUser,
};
