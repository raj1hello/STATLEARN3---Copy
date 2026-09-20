import { MongoClient, ObjectId } from "mongodb";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://haqueinj7708_db_user:statlearn_app_7708@statlearn-db.rilz2iv.mongodb.net/?appName=STATLEARN-DB";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const parentId = "6aaf49eb4252b4d8f6492a02";
  const col = db.collection("parent_links");
  const links = await col.find({ parentId: new ObjectId(parentId) }).sort({ createdAt: -1 }).toArray();
  console.log("DB links:", JSON.stringify(links, null, 2));

  const learnerIds = links.map(l => l.learnerId);
  const [profiles, users] = await Promise.all([
    db.collection("profiles").find({ userId: { $in: learnerIds } }).toArray(),
    db.collection("users").find({ _id: { $in: learnerIds } }).toArray(),
  ]);
  const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));
  const userMap = new Map(users.map(u => [u._id.toString(), u]));
  const enriched = links.map(l => {
    const idStr = l.learnerId.toString();
    const p = profileMap.get(idStr);
    const u = userMap.get(idStr);
    return {
      id: l._id.toString(),
      parentId: l.parentId.toString(),
      learnerId: idStr,
      status: l.status,
      requestedBy: l.requestedBy,
      createdAt: l.createdAt,
      learnerName: p?.name || u?.email.split("@")[0] || "Learner",
      learnerEmail: u?.email,
    };
  });
  console.log("\nEnriched response:", JSON.stringify(enriched, null, 2));
  console.log("\nrequestedBy values:", enriched.map(e => e.requestedBy));
  client.close();
}
run();