const { MongoClient } = require("mongodb");

let client;
let db;
let usersCollection;
let cartSharesCollection;
let tagsCollection;

async function connectToDatabase() {
  if (client && db) {
    return { client, db, usersCollection, cartSharesCollection, tagsCollection };
  }

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db("shopi");
  usersCollection = db.collection("users");
  cartSharesCollection = db.collection("cartShares");
  tagsCollection = db.collection("tags");

  return { client, db, usersCollection, cartSharesCollection, tagsCollection };
}

module.exports = { connectToDatabase };
