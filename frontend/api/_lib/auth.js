const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client_id = process.env.VITE_CLIENT_ID;
const oauth_client = new OAuth2Client(client_id);

// JWT secrets
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

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

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "JWT: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "JWT: Invalid token" });
  }
};

module.exports = {
  oauth_client,
  client_id,
  generateTokens,
  verifyToken,
  JWT_SECRET,
  REFRESH_TOKEN_SECRET,
};
