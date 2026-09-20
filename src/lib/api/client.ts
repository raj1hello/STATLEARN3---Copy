import { ApiResponse } from "@/types";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body);
  }

  async del<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {};
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "An unexpected error occurred",
        },
      };
    }
  }

  async upload<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Upload failed",
        },
      };
    }
  }
}

export const api = new ApiClient();

// Auth-specific helpers
export const authApi = {
  login: (email: string, password: string, name?: string, role?: string) =>
    api.post<{ userId: string; email: string; role: string }>("/api/auth/login", { email, password, name, role }),

  logout: () => api.post("/api/auth/logout"),

  getSession: () =>
    api.get<{ user: { id: string; email: string; role: string }; profile: unknown }>("/api/auth/session"),
};

// Analytics
export const analyticsApi = {
  getLearner: () => api.get("/api/analytics/learner"),
  getAdmin: () => api.get("/api/analytics/admin"),
};

// Competencies
export const competenciesApi = {
  list: () => api.get("/api/competencies"),
  get: (id: string) => api.get(`/api/competencies/${id}`),
};

// Assessments
export const assessmentsApi = {
  list: (params?: { competencyId?: string; myOnly?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.competencyId) searchParams.set("competencyId", params.competencyId);
    if (params?.myOnly) searchParams.set("myOnly", "true");
    const query = searchParams.toString();
    return api.get(`/api/assessments${query ? `?${query}` : ""}`);
  },
  get: (id: string) => api.get(`/api/assessments/${id}`),
  submit: (id: string, data: { startedAt: string; answers: { questionId: string; selectedAnswerIndex: number }[] }) =>
    api.post(`/api/assessments/${id}/submit`, data),
  create: (data: { title: string; type?: string; competencyId?: string; published?: boolean; materialId?: string }) =>
    api.post("/api/assessments", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/api/assessments/${id}`, data),
  delete: (id: string) => api.del(`/api/assessments/${id}`),
  getEvidence: (id: string) => api.get(`/api/assessments/${id}/evidence`),
};

// Gap Analysis
export const gapAnalysisApi = {
  get: () => api.get("/api/gap-analysis"),
};

// Recommendations
export const recommendationsApi = {
  get: () => api.get("/api/recommendations"),
};

// Learning Paths
export const learningPathsApi = {
  list: () => api.get("/api/learning-paths"),
  get: (id: string) => api.get(`/api/learning-paths/${id}`),
  generate: () => api.post("/api/learning-paths"),
  update: (id: string, data: { status?: string; weeks?: Record<string, unknown> }) =>
    api.patch(`/api/learning-paths/${id}`, data),
};

// iGOT Courses
export const coursesApi = {
  list: (competencyId?: string) => {
    const query = competencyId ? `?competencyId=${competencyId}` : "";
    return api.get(`/api/igot/mock-courses${query}`);
  },
};

// Profile
export const profileApi = {
  get: () => api.get("/api/profile"),
  update: (data: Record<string, unknown>) => api.patch("/api/profile", data),
};

// Materials (Trainer & Assigned Learner View)
export const materialsApi = {
  upload: (data: { fileName: string; fileType: string; fileSize: number; textContent: string }) =>
    api.post("/api/materials/upload", data),
  process: (id: string) => api.post(`/api/materials/${id}/process`),
  get: (id: string) => api.get<any>(`/api/materials/${id}`),
};

// Quizzes (Trainer & Learner CBT Generation)
export const quizzesApi = {
  list: (params?: { competencyId?: string; myOnly?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.competencyId) searchParams.set("competencyId", params.competencyId);
    if (params?.myOnly) searchParams.set("myOnly", "true");
    const query = searchParams.toString();
    return api.get(`/api/quizzes${query ? `?${query}` : ""}`);
  },
  generate: (data: { title?: string; materialId?: string; competencyId?: string; competencyName?: string; count?: number; difficulty?: string; type?: string }) =>
    api.post("/api/quizzes/generate", data),
  generateFromFile: (data: { fileName: string; fileType?: string; extractedText: string; difficulty?: string; count?: number; type?: string }) =>
    api.post<{ assessmentId: string; assessment: any; totalQuestions: number; message: string }>("/api/quizzes/generate-from-file", data),
  get: (id: string) => api.get(`/api/quizzes/${id}`),
  patch: (id: string, data: { action: string; questionId?: string; text?: string; difficulty?: string; answers?: { text: string; isCorrect: boolean; explanation?: string }[]; reviewedByTrainer?: boolean }) =>
    api.patch(`/api/quizzes/${id}`, data),
};

// Search History (Learner)
export const searchHistoryApi = {
  list: () => api.get<any[]>("/api/search-history"),
  record: (query: string, category?: string) =>
    api.post<{ _id: string; query: string; createdAt: string }>("/api/search-history", { query, category }),
  delete: (id: string) => api.del(`/api/search-history/${id}`),
  clear: () => api.del("/api/search-history"),
};

// Streams & Stream-Based Tests
export const streamsApi = {
  list: () => api.get<any[]>("/api/streams"),
};

export const streamTestsApi = {
  list: (params?: { stream?: string; myOnly?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.stream) searchParams.set("stream", params.stream);
    if (params?.myOnly) searchParams.set("myOnly", "true");
    const query = searchParams.toString();
    return api.get<any[]>(`/api/stream-tests${query ? `?${query}` : ""}`);
  },
  get: (id: string) => api.get<any>(`/api/stream-tests/${id}`),
  create: (data: {
    title: string;
    description?: string;
    stream: string;
    difficulty?: string;
    durationMinutes?: number;
    passingScore?: number;
    published?: boolean;
    questions: any[];
  }) => api.post<{ assessmentId: string; assessment: any; totalQuestions: number }>("/api/stream-tests", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/api/stream-tests/${id}`, data),
  delete: (id: string) => api.del(`/api/stream-tests/${id}`),
  submit: (
    id: string,
    data: {
      startedAt?: string;
      answers: { questionId: string; selectedAnswerIndex: number }[];
    }
  ) => api.post<any>(`/api/stream-tests/${id}/submit`, data),
};

// Organization & College Analytics and Talent Discovery
export const organizationApi = {
  getAnalytics: () => api.get<any>("/api/analytics/organization"),
  listStudents: (params?: { stream?: string; skill?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.stream) searchParams.set("stream", params.stream);
    if (params?.skill) searchParams.set("skill", params.skill);
    const query = searchParams.toString();
    return api.get<{ students: any[]; total: number }>(`/api/organization/students${query ? `?${query}` : ""}`);
  },
  getStudent: (id: string) => api.get<{ student: any; verifiedCompetencies: any[]; recentAssessments: any[] }>(`/api/organization/students/${id}`),
  listTrainers: () => api.get<{ trainers: any[]; total: number }>("/api/organization/trainers"),

  // Organization Join/Request endpoints
  search: (q: string) => api.get<{ organizations: any[] }>(`/api/organization/search?q=${encodeURIComponent(q)}`),
  getMyRequestStatus: () => api.get<{ status: string; organization: any }>(`/api/organization/requests/me`),
  join: (organizationId: string) => api.post(`/api/organization/requests`, { organizationId }),
  getPendingRequests: () => api.get<{ requests: any[] }>(`/api/organization/requests`),
  processRequest: (id: string, action: "approve" | "reject") => api.post(`/api/organization/requests/${id}`, { action }),
};

// AI Mock Interview API
export const mockInterviewApi = {
  list: () => api.get<any[]>("/api/mock-interview"),
  start: (data: {
    targetRole: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    jobDescription?: string;
    maxQuestions?: number;
  }) => api.post<{ interviewId: string; interview: any; currentQuestion: any; message: string }>("/api/mock-interview", data),
  get: (id: string) => api.get<any>(`/api/mock-interview/${id}`),
  delete: (id: string) => api.del(`/api/mock-interview/${id}`),
  submitAnswer: (
    id: string,
    data: {
      userAnswer: string;
      questionIndex: number;
    }
  ) => api.post<{ evaluation: any; nextQuestion: any; isLastQuestion: boolean; interview: any }>(`/api/mock-interview/${id}/answer`, data),
  finish: (id: string, data?: { durationSeconds?: number }) =>
    api.post<{ report: any; interview: any; message: string }>(`/api/mock-interview/${id}/finish`, data || {}),
};

// AI Tutor Conversations & Attachments
export const aiTutorApi = {
  generateChat: (prompt: string, attachments?: any[]) =>
    api.post<{ text: string }>("/api/ai-tutor/chat", { prompt, attachments }),
  uploadAttachment: (data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    category: "document" | "image" | "file";
    fileData: string;
    extractedText?: string;
  }) =>
    api.post<{ attachment: any }>("/api/ai-tutor/upload", data),
  listConversations: () =>
    api.get<{ conversations: any[] }>("/api/ai-tutor/conversations"),
  getConversation: (id: string) =>
    api.get<{ conversation: any }>(`/api/ai-tutor/conversations/${id}`),
  createConversation: (data: { title: string; messages?: any[] }) =>
    api.post<{ conversation: any }>("/api/ai-tutor/conversations", data),
  addMessage: (id: string, data: { message: any; updatedTitle?: string }) =>
    api.post(`/api/ai-tutor/conversations/${id}`, data),
  deleteConversation: (id: string) =>
    api.del(`/api/ai-tutor/conversations/${id}`),
  generateQuizAction: (data: {
    action: "assessment" | "quiz";
    topic?: string;
    conversationContext: string;
    difficulty?: "easy" | "medium" | "hard";
    count?: number;
  }) =>
    api.post<{
      type: string;
      assessment: any;
      totalQuestions: number;
      questions: any[];
      message: string;
    }>("/api/ai-tutor/actions/generate-quiz", data),
  makeNotesAction: (data: {
    topic?: string;
    conversationContext: string;
    conversationId?: string;
  }) =>
    api.post<{
      note: any;
      message: string;
    }>("/api/ai-tutor/actions/make-notes", data),
  getUserNotes: () =>
    api.get<{ notes: any[] }>("/api/ai-tutor/actions/make-notes"),
};

// Trainer Discovery & Connections
export const trainersApi = {
  list: (q?: string) => {
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    return api.get<{ trainers: any[]; total: number }>(`/api/trainers${query}`);
  },
};

export const connectionsApi = {
  list: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return api.get<{ connections: any[]; total: number }>(`/api/connections${query}`);
  },
  request: (trainerId: string, requestMessage?: string) =>
    api.post<{ message: string; connection?: any }>("/api/connections", { trainerId, requestMessage }),
  respond: (id: string, status: "accepted" | "rejected") =>
    api.patch<{ message: string; connection?: any }>(`/api/connections/${id}`, { status }),
};

// Trainer's Connected Learners
export const trainerLearnersApi = {
  list: () => api.get<{ learners: any[]; total: number }>("/api/trainer/learners"),
  get: (id: string) => api.get<any>(`/api/trainer/learners/${id}`),
};

// Parent / Guardian Portal (read-only digital report card)
export const parentApi = {
  getReport: (learnerId?: string) => {
    const query = learnerId ? `?learnerId=${encodeURIComponent(learnerId)}` : "";
    return api.get<{
      parent: { id: string; name?: string };
      list: { learnerId: string; learnerName: string }[];
      report: any;
    }>(`/api/parent/report${query}`);
  },
};

// Parent ↔ Learner linking workflow (request by email → learner confirms)
export interface ParentLinkItem {
  id: string;
  parentId: string;
  learnerId: string;
  status: "active" | "pending" | "rejected" | "revoked";
  requestedBy?: "parent" | "admin" | "learner";
  createdAt: string;
  respondedAt?: string;
  revokedAt?: string;
  learnerName?: string;
  learnerEmail?: string;
  learnerStream?: string;
  parentName?: string;
  parentEmail?: string;
}

export const parentLinksApi = {
  list: (params?: { status?: string }) => {
    const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
    return api.get<{ links: ParentLinkItem[]; requests: ParentLinkItem[]; total: number; viewer: string }>(
      `/api/parent/links${query}`
    );
  },
  request: (email: string) =>
    api.post<{ message: string; link?: ParentLinkItem; linkId?: string; status?: string }>(
      "/api/parent/links",
      { email }
    ),
  respond: (id: string, status: "accepted" | "rejected") =>
    api.patch<{ message: string; link?: ParentLinkItem }>(`/api/parent/links/${id}`, { status }),
  revoke: (id: string) => api.del<{ message: string }>(`/api/parent/links/${id}`),
};

// Assignments
export const assignmentsApi = {
  list: (params?: { status?: string; learnerId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.learnerId) searchParams.set("learnerId", params.learnerId);
    const query = searchParams.toString();
    return api.get<{ assignments: any[]; total: number }>(`/api/assignments${query ? `?${query}` : ""}`);
  },
  create: (data: {
    learnerIds: string[];
    content: {
      type: "assessment" | "quiz" | "stream_test" | "material" | "note";
      refId?: string;
      title: string;
      note?: { title: string; body: string };
    };
    dueAt?: string;
    message?: string;
  }) => api.post<{ message: string; count: number; assignments: any[] }>("/api/assignments", data),
  updateStatus: (id: string, status: "new" | "in_progress" | "completed") =>
    api.patch<{ message: string; assignment: any }>(`/api/assignments/${id}`, { status }),
  delete: (id: string) => api.del(`/api/assignments/${id}`),
};
