const { MongoClient } = require("mongodb");

let client;
let db;
let usersCollection;

async function connectToDatabase() {
  if (client && db) {
    return { client, db, usersCollection };
  }

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db("shopi");
  usersCollection = db.collection("users");

  return { client, db, usersCollection };
}

module.exports = { connectToDatabase };
