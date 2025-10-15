// src/lib/mongodb.js
import { MongoClient } from "mongodb";

let client;
let clientPromise;

export async function getClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ لم يتم العثور على MONGODB_URI في ملف البيئة");
    throw new Error("Database connection error");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise;
}
