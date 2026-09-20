# STATLEARN2 - Stage 1: Backend + Database

A complete, modular, and secure backend and database layer built using **Next.js App Router**, **TypeScript**, **Node.js runtime**, **MongoDB Atlas** (using the official `mongodb` driver), and **Zod validation**.

---

## 1. Architecture Overview

The system strictly enforces a layered separation of concerns:

```text
API Route (Next.js App Router)
    ↓
Zod Schema Validation & Sanitization (lib/sanitize.ts)
    ↓
Authentication & Role Authorization (lib/auth/)
    ↓
Service / Business & AI Logic (lib/ai/)
    ↓
Database Repository Helper (db/)
    ↓
MongoDB (Official Node.js Driver)
```

For AI features:
```text
API Route → AI Service (lib/ai/*) → AI Provider Abstraction (lib/ai/provider.ts) → LLM Provider
```

---

## 2. Prerequisites & Setup

### Requirements
* Node.js v18.17+ or v20+
* MongoDB Atlas cluster or local MongoDB instance (v6.0+)

### Installation Commands

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Create database indexes
npm run ensure-indexes

# 4. Seed synthetic demonstration data
npm run seed

# 5. Start development server
npm run dev
```

---

## 3. Environment Variables

All variables are centrally validated using Zod in `src/lib/env.ts`.

| Variable | Description | Required | Example / Default |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | Optional | `development` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | **REQUIRED** | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB Atlas / local connection string | **REQUIRED** | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/statlearn2` |
| `SESSION_SECRET` | 32+ character key for signing HttpOnly session cookies | **REQUIRED** | `super-secret-session-key-at-least-32-chars` |
| `ANTHROPIC_API_KEY` | API key for native Anthropic Claude API | Optional | `sk-ant-...` or `mock-anthropic-api-key` |
| `AI_PROVIDER_BASE_URL` | Base URL for Anthropic Claude API (defaults to `https://cc.api-anthropic.help` or `https://api.anthropic.com`) | Optional | `https://cc.api-anthropic.help` |
| `AI_PROVIDER_MODEL` | Claude model identifier | Optional | `claude-sonnet-5` |
| `MAX_UPLOAD_SIZE_MB` | Maximum allowed file upload size in Megabytes | Optional | `10` |
| `IGOT_MODE` | Integration mode for iGOT (`mock` or `live`) | Optional | `mock` |
| `ELEVENLABS_API_KEY_1..5` | ElevenLabs TTS API keys forming the server-side round-robin pool (see Voice & Accessibility below) | Optional* | `sk_...` |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID used for narration | Optional | `EXAVITQu4vrwxnBUxP9w` (Rachel) |
| `ELEVENLABS_MODEL` | ElevenLabs TTS model | Optional | `eleven_multilingual_v2` |

*If no `ELEVENLABS_API_KEY_*` keys are configured, narration falls back to the browser's Web Speech Synthesis.

---

## 4. MongoDB Atlas Configuration

1. **Create an Atlas Cluster**: Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and deploy a free or dedicated cluster.
2. **Database User**: Navigate to **Database Access** -> **Add New Database User** (e.g. `statlearn_admin` with Read and Write permissions).
3. **Network Access**: Navigate to **Network Access** -> **Add IP Address** -> Allow access from your application server's IP address (or `0.0.0.0/0` for initial testing).
4. **Connection String**: Under **Clusters** -> **Connect** -> **Drivers (Node.js)**, copy the URI into your `.env`:
   ```env
   MONGODB_URI=mongodb+srv://statlearn_admin:<password>@cluster0.abcde.mongodb.net/statlearn2?retryWrites=true&w=majority
   ```

---

## 5. Database Collections & Indexes

### Collections
* `users` — Authentication accounts and assigned roles.
* `profiles` — User profile details, experience, skills, and goals.
* `competencies` — Master catalog of competencies and categories.
* `user_competencies` — User competency proficiency scores, targets, and historical records.
* `assessments` — Assessment metadata, publication status, and links to learning materials.
* `questions` — Multiple-choice questions, difficulty levels, answer options, and explanations.
* `assessment_attempts` — Historical submissions, scores, and question-level evidence.
* `courses` — iGOT / Mock iGOT courses mapped to competencies.
* `learning_paths` — Dynamic 4-week structured learning roadmap.
* `recommendations` — Explainable course recommendations linked to competency deficits.
* `learning_materials` — Uploaded curriculum documents, extracted texts, and chunks.
* `progress` — Granular tracking metrics and timestamps.

### Database Indexes (`scripts/ensureIndexes.ts`)
* `users.email` → **unique**
* `profiles.userId` → **unique**
* `user_competencies(userId, competencyId)` → **unique compound**
* `assessments`: `createdById`, `competencyId`, `published`
* `questions`: `assessmentId`, `competencyId`
* `assessment_attempts`: `userId`, `assessmentId`, `(userId, assessmentId)`
* `learning_paths`: `userId`, `status`
* `recommendations`: `userId`
* `learning_materials`: `uploadedById`
* `progress`: `userId`, `recordedAt`

---

## 6. Authentication & Roles

### Mock Authentication
* **Method**: HttpOnly, SameSite=Strict, signed server-side session cookies (`session`).
* **Roles**:
  * `learner`: Access to personal profile, competencies, published assessments, evidence, personalized gap analysis, learning paths, recommendations, and learner analytics.
  * `trainer`: Access to upload materials, trigger AI processing, generate draft quizzes, review/edit questions, change difficulty, publish assessments, and manage curricula.
  * `admin`: Access to system-wide aggregate analytics, organization skill gaps, training effectiveness metrics, and full platform oversight.

### Demo Synthetic Accounts (from `npm run seed`):
* **Learner**: `learner@statlearn.local` / `Learner@123`
* **Trainer**: `trainer@statlearn.local` / `Trainer@123`
* **Admin**: `admin@statlearn.local` / `Admin@123`

---

## 7. Complete API Documentation

All responses use a standardized envelope:
* **Success**: `{ "success": true, "data": { ... } }`
* **Error**: `{ "success": false, "error": { "code": "...", "message": "..." } }`

### 1. Auth Endpoints
* **`POST /api/auth/login`**
  * **Role**: Public
  * **Body**: `{ "email": "learner@statlearn.local", "password": "Learner@123" }`
  * **Response**: Sets `session` HttpOnly cookie and returns user info.
* **`POST /api/auth/logout`**
  * **Role**: Public
  * **Response**: Clears session cookie.
* **`GET /api/auth/session`**
  * **Role**: Authenticated
  * **Response**: Current user session and linked profile.

### 2. Profile Endpoints
* **`GET /api/profile`**
  * **Role**: Authenticated
  * **Response**: Current user's profile.
* **`PATCH /api/profile`**
  * **Role**: Authenticated
  * **Body**: `{ "name": "...", "designation": "...", "department": "...", "experience": 3, "existingSkills": ["Python", "Stats"], "careerGoal": "..." }`
  * **Response**: Updated profile document.

### 3. Competency Endpoints
* **`GET /api/competencies`**
  * **Role**: Authenticated (Learners receive catalogue enriched with their current/target scores and history).
* **`POST /api/competencies`**
  * **Role**: `trainer`, `admin`
  * **Body**: `{ "name": "Hypothesis Testing", "category": "Core Analytics" }`
* **`GET /api/competencies/[id]`**
  * **Role**: Authenticated

### 4. Assessment & Submission Endpoints
* **`GET /api/assessments`**
  * **Role**: Authenticated (Learners only receive published assessments; trainers/admins can query all).
* **`POST /api/assessments`**
  * **Role**: `trainer`, `admin`
  * **Body**: `{ "title": "...", "type": "mcq", "competencyId": "...", "published": false }`
* **`GET /api/assessments/[id]`**
  * **Role**: Authenticated (CRITICAL SECURITY: If requested by a learner, correct answers and explanations are stripped).
* **`PATCH /api/assessments/[id]`**
  * **Role**: `trainer`, `admin` (Owner only if trainer).
* **`DELETE /api/assessments/[id]`**
  * **Role**: `trainer`, `admin` (Deletes assessment and questions).
* **`POST /api/assessments/[id]/submit`**
  * **Role**: Authenticated
  * **Body**: `{ "startedAt": "2026-02-05T14:00:00Z", "answers": [{ "questionId": "...", "selectedAnswerIndex": 0 }] }`
  * **Response**: Server calculates score, generates question-level evidence, updates competency history, and logs progress.
* **`GET /api/assessments/[id]/evidence`**
  * **Role**: Authenticated (Returns structured evidence explaining performance on submissions).

### 5. Gap Analysis & Recommendations
* **`GET /api/gap-analysis`**
  * **Role**: Authenticated
  * **Response**: Evidence-based gap calculation considering assessment score, incorrect answers, difficulty weighting, repeated weaknesses, and target gaps.
* **`GET /api/recommendations`**
  * **Role**: Authenticated
  * **Response**: Explainable recommendations connecting `user → competency gap → course → reason`.

### 6. Learning Paths
* **`GET /api/learning-paths`**
  * **Role**: Authenticated
* **`POST /api/learning-paths`**
  * **Role**: Authenticated
  * **Response**: Synthesizes a structured 4-week learning path (Foundation → Weak Concept Practice → Applied Practice → Reassessment) tailored to user deficits.
* **`PATCH /api/learning-paths/[id]`**
  * **Role**: Authenticated (Owner only)

### 7. Learning Materials (Trainer Only)
* **`POST /api/materials/upload`**
  * **Role**: `trainer`, `admin` (Rate limited)
  * **Body**: `{ "fileName": "SamplingTheory.pdf", "fileType": "application/pdf", "fileSize": 10240, "textContent": "..." }`
* **`POST /api/materials/[id]/process`**
  * **Role**: `trainer`, `admin`
  * **Response**: Executes pipeline: Text Extraction → Cleaning → Chunking → Topic Extraction → Competency Association.

### 8. AI Quiz Generation & Trainer Review Workflow
* **`POST /api/quizzes/generate`**
  * **Role**: `trainer`, `admin` (Rate limited)
  * **Body**: `{ "materialId": "...", "competencyName": "Inferential Stats", "count": 10, "difficulty": "medium", "type": "mcq" }`
  * **Behavior**: Generates draft assessment with 10 questions (`published: false`, `reviewedByTrainer: false`).
* **`GET /api/quizzes/[id]`**
  * **Role**: `trainer`, `admin`
  * **Response**: Complete quiz with questions and answers for trainer review.
* **`PATCH /api/quizzes/[id]`**
  * **Role**: `trainer`, `admin`
  * **Body Actions**:
    * Edit question: `{ "action": "update_question", "questionId": "...", "text": "...", "difficulty": "hard", "answers": [...] }`
    * Delete question: `{ "action": "delete_question", "questionId": "..." }`
    * Publish: `{ "action": "publish" }` (Allows learners to take assessment).

### 9. Courses & Analytics
* **`GET /api/igot/mock-courses`**
  * **Role**: Authenticated (Database-backed mock iGOT course catalog).
* **`GET /api/analytics/learner`**
  * **Role**: Authenticated (Competency scores, gaps, average score, before/after improvement tracking).
* **`GET /api/analytics/admin`**
  * **Role**: `admin` (Aggregates competency distribution, score distribution, training effectiveness, improvement gains).
* **`GET /api/health`**
  * **Role**: Public (Database ping and system readiness).

---

## 8. Security Measures Implemented

1. **NoSQL Injection Defense (`src/lib/sanitize.ts`)**: Filters all `$` operators and `.` characters from user input; explicitly constructs all database queries and update documents.
2. **ObjectId Format Validation (`isValidObjectId`)**: Prevents malformed IDs from reaching database queries.
3. **Zod Strict Validation**: Every request body, query parameter, and upload payload is strictly validated before touching services.
4. **Answer Protection**: Assessment GET endpoints strip `isCorrect` and `explanation` from questions when requested by learners.
5. **Server-Side Scoring**: Submission endpoints strictly calculate scores on the server.
6. **HttpOnly Signed Cookies**: Sessions are securely signed and prevented from client-side script inspection.
7. **Rate Limiting (`src/lib/rateLimit.ts`)**: In-memory rate limiting applied to resource-heavy endpoints (`/api/quizzes/generate` and `/api/materials/upload`).
8. **Draft Review Boundary**: AI generated quizzes are created as unpublished drafts; only authenticated trainers can review and publish them.
9. **Zero Secret Leakage**: Stack traces and internal database errors are hidden in production responses.

---

## 9. Future Frontend Integration

A future frontend (React / Next.js / Mobile) can consume these backend APIs seamlessly:

1. **Authentication Flow**: Make a `POST /api/auth/login` request. The browser automatically stores the HttpOnly session cookie for all subsequent requests (`credentials: "include"`).
2. **Learner Dashboard**: Call `GET /api/analytics/learner` to retrieve competency radars, before/after improvements, and active learning paths.
3. **Taking Assessments**: Fetch questions via `GET /api/assessments/[id]`, display options without answers, and submit selected indices to `POST /api/assessments/[id]/submit`.
4. **Trainer Dashboard**: Upload documents to `POST /api/materials/upload`, generate draft quizzes via `POST /api/quizzes/generate`, edit questions via `PATCH /api/quizzes/[id]`, and publish with `{ action: "publish" }`.
5. **Admin Dashboard**: Consume `GET /api/analytics/admin` for organization-wide effectiveness KPIs and score distribution metrics.

---

## 10. Voice & Accessibility (Stage 4)

The AI Mock Interview and the global accessibility layer use **ElevenLabs streaming TTS** as the primary voice, with **Claude** remaining the interview AI (question generation, evaluation, and reports are unchanged).

### ElevenLabs-first narration
* **Server-side key pool** (`src/lib/tts/elevenLabs.ts`): up to 5 keys (`ELEVENLABS_API_KEY_1..5`) are load-balanced round-robin. On rate-limit or auth/quota/concurrency failures (429 / 401 / 403 / 503 / 5xx, network or timeout), the pool automatically rotates to the next key.
* **Keys never reach the client.** The browser only calls the authenticated `POST /api/tts` route, which validates the request, synthesizes on the server, and streams MP3 audio back.
* **Emergency fallback:** if no keys are configured or the voice service is unreachable, narration transparently falls back to the browser's Web Speech Synthesis so audio never goes silent. Once keys are set, normal operation is 100% ElevenLabs.
* A single shared client speech manager (`src/lib/tts/speech.ts`) drives one audio element across the interview, AI tutor, and accessibility toolbar, giving pause / resume / stop / replay and adjustable speed.

### Accessibility layer
* **Auto-narration toggle** — reads AI tutor responses, interview questions plus Claude feedback, and the final interview report aloud (Markdown stripped to clean prose).
* **Replay / pause / resume / stop + speech speed** controls (0.5×–1.5×) in the mock interview, on the interview report, and in the floating toolbar's whole-page read-aloud.
* **Voice input** — speech-to-text dictation into the focused text field, plus the interview's own mic answer input.
* **Screen-reader support** — ARIA labels on icon-only buttons, `aria-live` status regions (mic errors, "evaluating…"), `aria-expanded`/`aria-controls` on the transcript history disclosure, a labeled live timer, and a global skip-to-content link with keyboard focus-visible states.
