import { ObjectId } from "mongodb";
import { mockInterviewsCol } from "./collections";
import { MockInterview, MockInterviewQuestion, MockInterviewReport } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function createMockInterview(params: {
  userId: string | ObjectId;
  targetRole: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  jobDescription?: string;
  maxQuestions?: number;
  initialQuestion?: MockInterviewQuestion;
}): Promise<MockInterview> {
  const col = await mockInterviewsCol();
  const maxQ = Math.min(Math.max(params.maxQuestions || 5, 3), 15);

  const doc: MockInterview = {
    userId: toObjectId(params.userId),
    targetRole: params.targetRole.trim(),
    difficulty: params.difficulty,
    jobDescription: params.jobDescription?.trim() || undefined,
    maxQuestions: maxQ,
    currentQuestionIndex: 0,
    status: "in_progress",
    questions: params.initialQuestion ? [params.initialQuestion] : [],
    startedAt: new Date(),
  };

  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getMockInterviewById(
  id: string | ObjectId,
  userId?: string | ObjectId
): Promise<MockInterview | null> {
  const col = await mockInterviewsCol();
  const query: Record<string, unknown> = { _id: toObjectId(id) };
  if (userId) {
    query.userId = toObjectId(userId);
  }
  return col.findOne(query);
}

export async function listMockInterviewsByUser(
  userId: string | ObjectId
): Promise<MockInterview[]> {
  const col = await mockInterviewsCol();
  return col
    .find({ userId: toObjectId(userId) })
    .sort({ startedAt: -1 })
    .toArray();
}

export async function addQuestionToInterview(
  id: string | ObjectId,
  question: MockInterviewQuestion
): Promise<MockInterview | null> {
  const col = await mockInterviewsCol();
  await col.updateOne(
    { _id: toObjectId(id) },
    {
      $push: { questions: question },
      $set: { currentQuestionIndex: question.questionNumber - 1 },
    }
  );
  return col.findOne({ _id: toObjectId(id) });
}

export async function recordQuestionAnswer(
  id: string | ObjectId,
  questionIndex: number,
  userAnswer: string,
  evaluation: NonNullable<MockInterviewQuestion["evaluation"]>
): Promise<MockInterview | null> {
  const col = await mockInterviewsCol();
  await col.updateOne(
    { _id: toObjectId(id) },
    {
      $set: {
        [`questions.${questionIndex}.userAnswer`]: userAnswer,
        [`questions.${questionIndex}.evaluation`]: evaluation,
        [`questions.${questionIndex}.answeredAt`]: new Date(),
      },
    }
  );
  return col.findOne({ _id: toObjectId(id) });
}

export async function completeMockInterview(
  id: string | ObjectId,
  report: MockInterviewReport,
  durationSeconds?: number
): Promise<MockInterview | null> {
  const col = await mockInterviewsCol();
  const completedAt = new Date();
  await col.updateOne(
    { _id: toObjectId(id) },
    {
      $set: {
        status: "completed",
        report,
        completedAt,
        durationSeconds: durationSeconds || 0,
      },
    }
  );
  return col.findOne({ _id: toObjectId(id) });
}

export async function deleteMockInterview(
  id: string | ObjectId,
  userId: string | ObjectId
): Promise<boolean> {
  const col = await mockInterviewsCol();
  const res = await col.deleteOne({
    _id: toObjectId(id),
    userId: toObjectId(userId),
  });
  return res.deletedCount > 0;
}
