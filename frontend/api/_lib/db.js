const { MongoClient } = require("mongodb");

let client;
let db;
let usersCollection;
let cartSharesCollection;

async function connectToDatabase() {
  if (client && db) {
    return { client, db, usersCollection, cartSharesCollection };
  }

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db("shopi");
  usersCollection = db.collection("users");
  cartSharesCollection = db.collection("cartShares");

  return { client, db, usersCollection, cartSharesCollection };
}

module.exports = { connectToDatabase };
