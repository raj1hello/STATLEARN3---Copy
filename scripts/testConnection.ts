import * as dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

async function main() {
  console.log("Connecting using MONGODB_URI...");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB Atlas!");

    const db = client.db();
    const users = await db.collection("users").find().toArray();
    console.log(`\nFound ${users.length} existing users in 'users' collection:`);
    users.forEach((u) => {
      console.log(`  - ID: ${u._id} | Email: ${u.email} | Role: ${u.role}`);
    });

    await client.close();
  } catch (err: any) {
    console.error("❌ Connection failed:", err.message);
  }
}

main();
