import { MongoClient } from "mongodb";

async function main() {
  const uri = "mongodb://localhost:27017/statlearn";
  const client = await MongoClient.connect(uri);
  const db = client.db();

  // Create a dummy collection and insert 3 objects
  const col = db.collection("test_empty_in");
  await col.deleteMany({});
  await col.insertMany([{ name: "A" }, { name: "B" }, { name: "C" }]);

  // Query with $in: []
  const docs = await col.find({ _id: { $in: [] } }).toArray();
  console.log("Documents matching $in: []:", docs.length);

  await client.close();
}
main().catch(console.error);