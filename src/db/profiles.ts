import { ObjectId } from "mongodb";
import { profilesCol } from "./collections";
import { Profile } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function getProfileByUserId(userId: string | ObjectId): Promise<Profile | null> {
  const col = await profilesCol();
  return col.findOne({ userId: toObjectId(userId) });
}

export async function upsertProfile(
  userId: string | ObjectId,
  data: Partial<Omit<Profile, "_id" | "userId">>
): Promise<Profile> {
  const col = await profilesCol();
  const uid = toObjectId(userId);

  // Only allow explicitly whitelisted fields to reach MongoDB.
  const allowed: Partial<Profile> = {};
  if (data.name !== undefined) allowed.name = data.name;
  if (data.designation !== undefined) allowed.designation = data.designation;
  if (data.department !== undefined) allowed.department = data.department;
  if (data.experience !== undefined) allowed.experience = data.experience;
  if (data.education !== undefined) allowed.education = data.education;
  if (data.existingSkills !== undefined) allowed.existingSkills = data.existingSkills;
  if (data.careerGoal !== undefined) allowed.careerGoal = data.careerGoal;
  if (data.stream !== undefined) allowed.stream = data.stream;
  if (data.certifications !== undefined) allowed.certifications = data.certifications;
  if (data.projects !== undefined) allowed.projects = data.projects;
  if (data.organizationId !== undefined) allowed.organizationId = toObjectId(data.organizationId);
  if (data.shareProfileWithOrganizations !== undefined) {
    allowed.shareProfileWithOrganizations = Boolean(data.shareProfileWithOrganizations);
  }

  await col.updateOne(
    { userId: uid },
    {
      $set: allowed,
      $setOnInsert: {
        userId: uid,
        ...(allowed.name === undefined ? { name: "" } : {}),
        ...(allowed.existingSkills === undefined ? { existingSkills: [] } : {}),
      },
    },
    { upsert: true }
  );

  const profile = await col.findOne({ userId: uid });
  if (!profile) {
    throw new Error("Failed to upsert profile");
  }
  return profile;
}

export async function createProfile(input: Omit<Profile, "_id">): Promise<Profile> {
  const col = await profilesCol();
  const result = await col.insertOne(input as Profile);
  return { ...input, _id: result.insertedId };
}

/**
 * List student profiles that have explicitly enabled organization visibility.
 * Filters by stream and skill tags if specified.
 */
export async function listConsentingStudentProfiles(filters?: {
  stream?: string;
  skill?: string;
}): Promise<Profile[]> {
  const col = await profilesCol();
  const query: Record<string, unknown> = {
    shareProfileWithOrganizations: true,
  };

  if (filters?.stream && filters.stream !== "all") {
    query.stream = filters.stream;
  }

  if (filters?.skill && filters.skill.trim()) {
    query.existingSkills = { $in: [new RegExp(`^${filters.skill.trim()}$`, "i")] };
  }

  return col.find(query).toArray();
}

/**
 * Get a single consenting student profile by user ID.
 * Returns null if user has not consented or does not exist.
 */
export async function getConsentingStudentProfile(
  userId: string | ObjectId
): Promise<Profile | null> {
  const col = await profilesCol();
  return col.findOne({
    userId: toObjectId(userId),
    shareProfileWithOrganizations: true,
  });
}
