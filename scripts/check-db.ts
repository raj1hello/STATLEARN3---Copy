import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/statlearn";
  const client = await MongoClient.connect(uri);
  const db = client.db();
  const cols = await db.listCollections().toArray();
  for (const c of cols) {
    const data = await db.collection(c.name).find({}).toArray();
    if (JSON.stringify(data).includes("1240")) {
      console.log("Found 1240 in collection: " + c.name);
    }
  }
  console.log("DB string search done.");
  process.exit(0);
}
main();