import { MongoClient } from "mongodb";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://haqueinj7708_db_user:statlearn_app_7708@statlearn-db.rilz2iv.mongodb.net/?appName=STATLEARN-DB";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();

    // Simulate GET /api/parent/links for parent '6aaf49eb4252b4d8f6492a02'
    const parentId = "6aaf49eb4252b4d8f6492a02";

    // The exact server-side code:
    const col = db.collection("parent_links");
    const links = await col.find({ parentId: new (require("mongodb")).ObjectId(parentId) }).sort({ createdAt: -1 }).toArray();
    console.log("DB returned:", links);

  } finally {
    await client.close();
  }
}
run();