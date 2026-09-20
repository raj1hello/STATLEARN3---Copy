import { ObjectId } from "mongodb";
import { usersCol } from "./collections";
import { User, UserRole } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function findUserByEmail(email: string): Promise<User | null> {
  const col = await usersCol();
  return col.findOne({ email: email.toLowerCase().trim() });
}

export async function findUserById(id: string | ObjectId): Promise<User | null> {
  const col = await usersCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function createUser(input: {
  email: string;
  role: UserRole;
  passwordHash?: string;
}): Promise<User> {
  const col = await usersCol();
  const doc: User = {
    email: input.email.toLowerCase().trim(),
    role: input.role,
    passwordHash: input.passwordHash,
    createdAt: new Date(),
  };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function listUsers(): Promise<User[]> {
  const col = await usersCol();
  return col.find({}).toArray();
}
