const path = require('path');
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config();

const app = express();
const PORT = 3000;

// const __dirname = __dirname;

const client = new MongoClient(process.env.MONGODB_URI);
let collection;

app.use(cors({
  origin: "*", // or use "*" during dev only
  // credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function init() {
  await client.connect();
  const db = client.db("shopi");
  collection = db.collection("pages"); // renamed for clarity
  app.listen(PORT, () => console.log("API ready on", PORT));
}

// API routes
app.post('/api/login/google', (req, res) => {
  console.log("Login with google success");
  res.status(200).json({message: "Login successful"})
});

// app.get('/api/products', (req, res) => {
//   // send product data
// });

// Serve React build (only if deploying frontend + backend together)
app.use(express.static(path.join(__dirname, '../dist')));

init();