import { Collection } from "mongodb";
import { getDatabase } from "@/lib/db/client";
import {
  User,
  Profile,
  Competency,
  UserCompetency,
  Assessment,
  Question,
  AssessmentAttempt,
  Course,
  LearningPath,
  Recommendation,
  LearningMaterial,
  Progress,
  AiConversation,
  UserNote,
  SearchHistory,
  Stream,
  MockInterview,
  Connection,
  Assignment,
  ParentLink,
  OrganizationRequest,
} from "@/types";

export async function usersCol(): Promise<Collection<User>> {
  const db = await getDatabase();
  return db.collection<User>("users");
}

export async function profilesCol(): Promise<Collection<Profile>> {
  const db = await getDatabase();
  return db.collection<Profile>("profiles");
}

export async function competenciesCol(): Promise<Collection<Competency>> {
  const db = await getDatabase();
  return db.collection<Competency>("competencies");
}

export async function userCompetenciesCol(): Promise<Collection<UserCompetency>> {
  const db = await getDatabase();
  return db.collection<UserCompetency>("user_competencies");
}

export async function assessmentsCol(): Promise<Collection<Assessment>> {
  const db = await getDatabase();
  return db.collection<Assessment>("assessments");
}

export async function questionsCol(): Promise<Collection<Question>> {
  const db = await getDatabase();
  return db.collection<Question>("questions");
}

export async function assessmentAttemptsCol(): Promise<Collection<AssessmentAttempt>> {
  const db = await getDatabase();
  return db.collection<AssessmentAttempt>("assessment_attempts");
}

export async function coursesCol(): Promise<Collection<Course>> {
  const db = await getDatabase();
  return db.collection<Course>("courses");
}

export async function learningPathsCol(): Promise<Collection<LearningPath>> {
  const db = await getDatabase();
  return db.collection<LearningPath>("learning_paths");
}

export async function recommendationsCol(): Promise<Collection<Recommendation>> {
  const db = await getDatabase();
  return db.collection<Recommendation>("recommendations");
}

export async function learningMaterialsCol(): Promise<Collection<LearningMaterial>> {
  const db = await getDatabase();
  return db.collection<LearningMaterial>("learning_materials");
}

export async function progressCol(): Promise<Collection<Progress>> {
  const db = await getDatabase();
  return db.collection<Progress>("progress");
}

export async function aiConversationsCol(): Promise<Collection<AiConversation>> {
  const db = await getDatabase();
  return db.collection<AiConversation>("ai_conversations");
}

export async function userNotesCol(): Promise<Collection<UserNote>> {
  const db = await getDatabase();
  return db.collection<UserNote>("user_notes");
}

export async function searchHistoryCol(): Promise<Collection<SearchHistory>> {
  const db = await getDatabase();
  return db.collection<SearchHistory>("search_history");
}

export async function streamsCol(): Promise<Collection<Stream>> {
  const db = await getDatabase();
  return db.collection<Stream>("streams");
}

export async function mockInterviewsCol(): Promise<Collection<MockInterview>> {
  const db = await getDatabase();
  return db.collection<MockInterview>("mock_interviews");
}

export async function connectionsCol(): Promise<Collection<Connection>> {
  const db = await getDatabase();
  return db.collection<Connection>("connections");
}

export async function assignmentsCol(): Promise<Collection<Assignment>> {
  const db = await getDatabase();
  return db.collection<Assignment>("assignments");
}

export async function parentLinksCol(): Promise<Collection<ParentLink>> {
  const db = await getDatabase();
  return db.collection<ParentLink>("parent_links");
}

export async function organizationRequestsCol(): Promise<Collection<OrganizationRequest>> {
  const db = await getDatabase();
  return db.collection<OrganizationRequest>("organization_requests");
}
