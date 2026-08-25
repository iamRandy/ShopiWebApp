const { MongoClient } = require("mongodb");

let client;
let db;
let usersCollection;
let cartSharesCollection;
let tagsCollection;
let blockedHostsCollection;

async function connectToDatabase() {
  if (client && db) {
    return { client, db, usersCollection, cartSharesCollection, tagsCollection, blockedHostsCollection };
  }

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db("shopi");
  usersCollection = db.collection("users");
  cartSharesCollection = db.collection("cartShares");
  tagsCollection = db.collection("tags");
  // Indexes (including the TTL on blockedAt) are created once by the Express backend's init() —
  // both deployments share the same MongoDB database, so no need to redeclare them here.
  blockedHostsCollection = db.collection("blockedHosts");

  return { client, db, usersCollection, cartSharesCollection, tagsCollection, blockedHostsCollection };
}

module.exports = { connectToDatabase };
