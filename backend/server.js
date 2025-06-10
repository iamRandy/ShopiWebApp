const path = require('path');
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

const USERS_COLLECTION = "users";

dotenv.config();

const app = express();
const PORT = 3000;

// const __dirname = __dirname;

const client = new MongoClient(process.env.MONGODB_URI);
let collection;
let usersCollection;

app.use(cors({
  origin: "*", // or use "*" during dev only
  // credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function init() {
  await client.connect();
  const db = client.db("shopi");
  collection = db.collection("pages");
  usersCollection = db.collection(USERS_COLLECTION);
  app.listen(PORT, () => console.log("API ready on", PORT));
}

// API routes
app.post('/api/login/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });

    // Decode the Google ID token (no verification needed as it's already verified by Google)
    const payload = jwt.decode(token);
    
    if (!payload) {
      return res.status(400).json({ error: "Invalid token" });
    }

    // Save or update user in MongoDB
    const filter = { sub: payload.sub }; // Google's unique user ID
    const update = {
      $set: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub,
        lastLogin: new Date(),
      }
    };
    const options = { upsert: true };
    await usersCollection.updateOne(filter, update, options);

    res.status(200).json({ message: "Login successful", user: payload });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// app.get('/api/products', (req, res) => {
//   // send product data
// });

// Serve React build (only if deploying frontend + backend together)
app.use(express.static(path.join(__dirname, '../dist')));

init();