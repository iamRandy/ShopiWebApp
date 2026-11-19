// Sign in with Apple helpers for the iOS app. Node built-ins only
// (crypto + global fetch), so no extra dependencies to deploy.
//
// Environment:
//   APPLE_BUNDLE_ID    iOS bundle identifier(s) allowed as the token audience
//                      (comma-separated). Required for Sign in with Apple.
//   APPLE_TEAM_ID      Optional. Together with APPLE_KEY_ID and APPLE_PRIVATE_KEY
//   APPLE_KEY_ID       enables revoking Apple tokens when an account is deleted
//   APPLE_PRIVATE_KEY  (required by App Review for apps offering Apple sign-in).
//                      APPLE_PRIVATE_KEY is the .p8 contents; "\n" escapes are OK.
const crypto = require("crypto");

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke";
const KEY_CACHE_MS = 60 * 60 * 1000;
const CLOCK_SKEW_SECONDS = 60;

class AppleAuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = "AppleAuthError";
    this.status = status;
  }
}

let cachedKeys = null;
let cachedKeysAt = 0;

function appleAudiences() {
  return (process.env.APPLE_BUNDLE_ID || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function fetchAppleKeys({ force = false } = {}) {
  if (!force && cachedKeys && Date.now() - cachedKeysAt < KEY_CACHE_MS) {
    return cachedKeys;
  }
  const response = await fetch(APPLE_KEYS_URL);
  if (!response.ok) {
    throw new AppleAuthError(`Apple keys request failed (${response.status})`, 502);
  }
  const { keys } = await response.json();
  cachedKeys = Array.isArray(keys) ? keys : [];
  cachedKeysAt = Date.now();
  return cachedKeys;
}

function decodeSegment(segment) {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

/**
 * Verifies an identity token from ASAuthorizationAppleIDCredential and returns
 * its claims. `rawNonce` is the unhashed nonce the app generated; the token
 * must carry its SHA-256 hex digest, which prevents token replay.
 */
async function verifyAppleIdentityToken(identityToken, rawNonce) {
  const audiences = appleAudiences();
  if (audiences.length === 0) {
    throw new AppleAuthError("Sign in with Apple is not configured (APPLE_BUNDLE_ID)", 500);
  }
  if (typeof identityToken !== "string") {
    throw new AppleAuthError("Identity token is required", 400);
  }

  const parts = identityToken.split(".");
  if (parts.length !== 3) throw new AppleAuthError("Malformed identity token");
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  let header;
  let claims;
  try {
    header = decodeSegment(encodedHeader);
    claims = decodeSegment(encodedPayload);
  } catch {
    throw new AppleAuthError("Malformed identity token");
  }
  if (header.alg !== "RS256") throw new AppleAuthError("Unexpected token algorithm");

  let jwk = (await fetchAppleKeys()).find((key) => key.kid === header.kid);
  if (!jwk) {
    // Apple rotates keys; refetch once before giving up.
    jwk = (await fetchAppleKeys({ force: true })).find((key) => key.kid === header.kid);
  }
  if (!jwk) throw new AppleAuthError("Unknown signing key");

  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signatureValid = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    publicKey,
    Buffer.from(encodedSignature, "base64url")
  );
  if (!signatureValid) throw new AppleAuthError("Invalid token signature");

  const now = Math.floor(Date.now() / 1000);
  const tokenAudiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== APPLE_ISSUER) throw new AppleAuthError("Invalid token issuer");
  if (!tokenAudiences.some((aud) => audiences.includes(aud))) {
    throw new AppleAuthError("Invalid token audience");
  }
  if (typeof claims.exp !== "number" || claims.exp + CLOCK_SKEW_SECONDS < now) {
    throw new AppleAuthError("Identity token expired");
  }
  if (!claims.sub) throw new AppleAuthError("Identity token has no subject");

  if (typeof rawNonce !== "string" || rawNonce.length === 0) {
    throw new AppleAuthError("Nonce is required", 400);
  }
  const expectedNonce = crypto.createHash("sha256").update(rawNonce).digest("hex");
  if (claims.nonce !== expectedNonce) throw new AppleAuthError("Nonce mismatch");

  return claims;
}

// --- Token revocation (optional) -------------------------------------------

function appleSigningConfig() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientId = appleAudiences()[0];
  if (!teamId || !keyId || !privateKey || !clientId) return null;
  return { teamId, keyId, privateKey, clientId };
}

function isAppleRevocationConfigured() {
  return appleSigningConfig() !== null;
}

/** ES256 client secret JWT for Apple's token/revoke endpoints. */
function createClientSecret({ teamId, keyId, privateKey, clientId }) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const signingInput = `${encode({ alg: "ES256", kid: keyId })}.${encode({
    iss: teamId,
    iat: now,
    exp: now + 300,
    aud: APPLE_ISSUER,
    sub: clientId,
  })}`;
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${signature.toString("base64url")}`;
}

async function postToApple(url, params) {
  const config = appleSigningConfig();
  if (!config) throw new AppleAuthError("Apple token revocation is not configured", 500);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: createClientSecret(config),
    ...params,
  });
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AppleAuthError(`Apple request failed (${response.status}) ${detail}`, 502);
  }
  return response;
}

/** Exchanges the one-time authorization code for an Apple refresh token. */
async function exchangeAppleAuthorizationCode(authorizationCode) {
  const response = await postToApple(APPLE_TOKEN_URL, {
    code: authorizationCode,
    grant_type: "authorization_code",
  });
  const data = await response.json();
  return data.refresh_token || null;
}

async function revokeAppleToken(appleRefreshToken) {
  await postToApple(APPLE_REVOKE_URL, {
    token: appleRefreshToken,
    token_type_hint: "refresh_token",
  });
}

module.exports = {
  AppleAuthError,
  verifyAppleIdentityToken,
  isAppleRevocationConfigured,
  exchangeAppleAuthorizationCode,
  revokeAppleToken,
};
