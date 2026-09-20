import { MongoClient } from "mongodb";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://haqueinj7708_db_user:statlearn_app_7708@statlearn-db.rilz2iv.mongodb.net/?appName=STATLEARN-DB";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    console.log("DB NAME: ", db.databaseName);
    const links = await db.collection("parent_links").find().sort({ createdAt: -1 }).limit(5).toArray();
    console.log("Latest Parent links:");
    console.log(JSON.stringify(links, null, 2));
  } finally {
    await client.close();
  }
}
run();