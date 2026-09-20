import { ObjectId } from "mongodb";
import { userCompetenciesCol } from "./collections";
import { UserCompetency } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function getUserCompetencies(userId: string | ObjectId): Promise<UserCompetency[]> {
  const col = await userCompetenciesCol();
  return col.find({ userId: toObjectId(userId) }).toArray();
}

/**
 * Get user competencies joined with competency metadata (names, categories).
 */
export async function getUserCompetenciesWithDetails(userId: string | ObjectId): Promise<any[]> {
  const col = await userCompetenciesCol();
  const uid = toObjectId(userId);
  return col
    .aggregate([
      { $match: { userId: uid } },
      {
        $lookup: {
          from: "competencies",
          localField: "competencyId",
          foreignField: "_id",
          as: "competency",
        },
      },
      { $unwind: { path: "$competency", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: 1,
          competencyId: 1,
          currentScore: 1,
          targetScore: 1,
          history: 1,
          competencyName: "$competency.name",
          category: "$competency.category",
        },
      },
    ])
    .toArray();
}

export async function getUserCompetency(
  userId: string | ObjectId,
  competencyId: string | ObjectId
): Promise<UserCompetency | null> {
  const col = await userCompetenciesCol();
  return col.findOne({
    userId: toObjectId(userId),
    competencyId: toObjectId(competencyId),
  });
}

export async function upsertUserCompetency(input: {
  userId: string | ObjectId;
  competencyId: string | ObjectId;
  currentScore: number;
  targetScore: number;
}): Promise<UserCompetency> {
  const col = await userCompetenciesCol();
  const uid = toObjectId(input.userId);
  const cid = toObjectId(input.competencyId);

  await col.updateOne(
    { userId: uid, competencyId: cid },
    {
      $set: {
        currentScore: input.currentScore,
        targetScore: input.targetScore,
      },
      $setOnInsert: {
        userId: uid,
        competencyId: cid,
        history: [],
      },
    },
    { upsert: true }
  );

  const doc = await col.findOne({ userId: uid, competencyId: cid });
  if (!doc) throw new Error("Failed to upsert user competency");
  return doc;
}

/**
 * Records a new score into competency history and updates the current score.
 * Creates the user-competency link if it does not exist.
 */
export async function recordCompetencyScore(input: {
  userId: string | ObjectId;
  competencyId: string | ObjectId;
  score: number;
  targetScore?: number;
}): Promise<void> {
  const col = await userCompetenciesCol();
  const uid = toObjectId(input.userId);
  const cid = toObjectId(input.competencyId);
  const recordedAt = new Date();

  await col.updateOne(
    { userId: uid, competencyId: cid },
    {
      $set: { currentScore: input.score },
      $push: { history: { score: input.score, recordedAt } },
      $setOnInsert: {
        userId: uid,
        competencyId: cid,
        targetScore: input.targetScore ?? 80,
      },
    },
    { upsert: true }
  );
}
