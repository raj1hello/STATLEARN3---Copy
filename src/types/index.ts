import { ObjectId } from "mongodb";

export type UserRole = "learner" | "trainer" | "admin" | "organization" | "parent";

export interface User {
  _id?: ObjectId;
  email: string;
  role: UserRole;
  passwordHash?: string; // used for mock auth
  createdAt: Date;
}

export interface StudentProject {
  title: string;
  description: string;
  link?: string;
  skills?: string[];
}

export interface Profile {
  _id?: ObjectId;
  userId: ObjectId;
  organizationId?: ObjectId; // Added for multi-tenant isolation
  name: string;
  designation?: string;
  department?: string;
  experience?: number;
  education?: string;
  existingSkills: string[];
  careerGoal?: string;
  stream?: string;
  certifications?: string[];
  projects?: StudentProject[];
  shareProfileWithOrganizations?: boolean;
}

export interface SearchHistory {
  _id?: ObjectId;
  userId: ObjectId;
  query: string;
  category?: string;
  createdAt: Date;
}

export interface Stream {
  _id?: ObjectId;
  slug: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
  order?: number;
  skills?: string[];
  testCount?: number;
}

export interface Competency {
  _id?: ObjectId;
  name: string;
  category?: string;
}

export interface ScoreHistoryItem {
  score: number;
  recordedAt: Date;
}

export interface UserCompetency {
  _id?: ObjectId;
  userId: ObjectId;
  competencyId: ObjectId;
  currentScore: number;
  targetScore: number;
  history: ScoreHistoryItem[];
}

export type QuestionType = "mcq" | "scenario";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface QuestionAnswerOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  _id?: ObjectId;
  assessmentId: ObjectId;
  competencyId?: ObjectId;
  text: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  aiGenerated: boolean;
  reviewedByTrainer: boolean;
  answers: QuestionAnswerOption[];
  marks?: number;
}

export interface Assessment {
  _id?: ObjectId;
  title: string;
  description?: string;
  type: QuestionType;
  kind?: "assessment" | "quiz" | "stream_test";
  stream?: string;
  competencyId?: ObjectId;
  createdById: ObjectId;
  published: boolean;
  isOfficial?: boolean;
  materialId?: ObjectId;
  durationMinutes?: number;
  passingScore?: number;
  tags?: string[];
  createdAt: Date;
}

export interface AssessmentAttemptEvidenceItem {
  questionId: string;
  questionText?: string;
  difficulty?: string;
  competencyId?: string;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  explanation?: string;
}

export interface AssessmentAttempt {
  _id?: ObjectId;
  userId: ObjectId;
  assessmentId: ObjectId;
  score: number;
  percentage?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  unansweredQuestions?: number;
  strengths?: string[];
  weakAreas?: string[];
  stream?: string;
  evidence?: {
    totalQuestions: number;
    correctCount: number;
    scorePercentage: number;
    items?: AssessmentAttemptEvidenceItem[];
  } | Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
}

export interface Course {
  _id?: ObjectId;
  title: string;
  source: "mock_igot" | "igot";
  competencyId?: ObjectId;
  metadata?: Record<string, unknown>;
}

export interface LearningPath {
  _id?: ObjectId;
  userId: ObjectId;
  weeks: Record<string, unknown>;
  status: "active" | "completed";
}

export interface Recommendation {
  _id?: ObjectId;
  userId: ObjectId;
  courseId?: ObjectId;
  reason: string;
}

export interface LearningMaterial {
  _id?: ObjectId;
  uploadedById: ObjectId;
  fileName: string;
  extractedText?: string;
  chunks?: Record<string, unknown>;
  createdAt: Date;
}

export interface Progress {
  _id?: ObjectId;
  userId: ObjectId;
  metric: string;
  value: number;
  recordedAt: Date;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  category: "document" | "image" | "file";
  dataUrl?: string;
  extractedText?: string;
}

export interface AiChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  attachments?: ChatAttachment[];
  example?: string;
  sources?: string[];
  timestamp: string;
}

export interface AiConversation {
  _id?: ObjectId;
  userId: ObjectId;
  title: string;
  messages: AiChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNote {
  _id?: ObjectId;
  userId: ObjectId;
  title: string;
  topic?: string;
  summary: string;
  keyPoints: string[];
  practicalTakeaways?: string[];
  markdownContent: string;
  conversationId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Trainer ↔ Learner Connections & Assignments (Stage 5)
export type ConnectionStatus = "pending" | "accepted" | "rejected";

export type OrganizationRequestStatus = "pending" | "approved" | "rejected";

export interface OrganizationRequest {
  _id?: ObjectId;
  userId: ObjectId;
  organizationId: ObjectId;
  userRole: UserRole;
  status: OrganizationRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Connection {
  _id?: ObjectId;
  trainerId: ObjectId;
  learnerId: ObjectId;
  status: ConnectionStatus;
  requestedBy: "learner";
  requestMessage?: string;
  senderName?: string;
  createdAt: Date;
  respondedAt?: Date;
}

export type AssignmentContentType =
  | "assessment"
  | "quiz"
  | "stream_test"
  | "material"
  | "note";

export type AssignmentStatus = "new" | "in_progress" | "completed";

export interface AssignmentNote {
  title: string;
  body: string;
}

export interface AssignmentContent {
  type: AssignmentContentType;
  refId?: ObjectId;
  title: string;
  note?: AssignmentNote;
}

export interface Assignment {
  _id?: ObjectId;
  assignedBy: ObjectId;
  learnerId: ObjectId;
  content: AssignmentContent;
  status: AssignmentStatus;
  dueAt?: Date;
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  message?: string;
}

// Parent / Guardian ↔ Learner linking (Parent Portal, read-only report card)
// Status lifecycle: pending (requested) → active (learner approved / admin created)
//                     → rejected (learner declined) | revoked (parent/admin cancelled)
export type ParentLinkStatus = "active" | "pending" | "rejected" | "revoked";

export interface ParentLink {
  _id?: ObjectId;
  parentId: ObjectId;
  learnerId: ObjectId;
  status: ParentLinkStatus;
  requestedBy?: "parent" | "admin" | "learner";
  createdAt: Date;
  respondedAt?: Date;
  revokedAt?: Date;
}

// AI Mock Interview Types
export interface MockInterviewQuestion {
  id: string;
  questionNumber: number;
  question: string;
  category?: "technical" | "behavioral" | "problem_solving" | "situational";
  idealAnswerGuidelines?: string;
  userAnswer?: string;
  evaluation?: {
    relevanceScore: number; // 0-100
    technicalAccuracyScore: number; // 0-100
    communicationScore: number; // 0-100
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  answeredAt?: Date;
}

export interface MockInterviewReport {
  summary: string;
  overallScore: number;
  technicalKnowledgeAssessment: string;
  problemSolvingAssessment: string;
  communicationObservations: string;
  strengths: string[];
  areasForImprovement: string[];
  topicsToRevise: string[];
  recommendedResources: Array<{
    title: string;
    description?: string;
    topic?: string;
  }>;
  finalFeedback: string;
  generatedAt: Date;
}

export interface MockInterview {
  _id?: ObjectId;
  userId: ObjectId;
  targetRole: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  jobDescription?: string;
  maxQuestions: number;
  currentQuestionIndex: number;
  status: "in_progress" | "completed";
  questions: MockInterviewQuestion[];
  report?: MockInterviewReport;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
