import * as dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("MongoDB connection failed: MONGODB_URI is not defined");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    // Ping the admin database
    await client.db().admin().ping();
    console.log("MongoDB connection successful");
  } catch {
    console.log("MongoDB connection failed");
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();
