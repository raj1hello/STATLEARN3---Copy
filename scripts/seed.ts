import * as dotenv from "dotenv";
dotenv.config();

import { MongoClient, ObjectId } from "mongodb";
import { createHash } from "crypto";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

function hashPassword(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

async function seed() {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    const db = client.db();
    console.log("Connected to MongoDB for seeding synthetic data...");

    // Clear existing collections safely
    const collections = [
      "users",
      "profiles",
      "competencies",
      "user_competencies",
      "assessments",
      "questions",
      "assessment_attempts",
      "courses",
      "learning_paths",
      "recommendations",
      "learning_materials",
      "progress",
      "search_history",
      "streams",
      "mock_interviews",
    ];

    for (const name of collections) {
      await db.collection(name).deleteMany({});
    }
    console.log("Cleared old collections.");

    // 1. Seed Users (Learner, Trainer, Admin, Organization)
    const learnerId = new ObjectId();
    const trainerId = new ObjectId();
    const adminId = new ObjectId();
    const orgId = new ObjectId();

    const users = [
      {
        _id: learnerId,
        email: "learner@statlearn.local",
        role: "learner",
        passwordHash: hashPassword("Learner@123"),
        createdAt: new Date("2026-01-10"),
      },
      {
        _id: trainerId,
        email: "trainer@statlearn.local",
        role: "trainer",
        passwordHash: hashPassword("Trainer@123"),
        createdAt: new Date("2026-01-05"),
      },
      {
        _id: adminId,
        email: "admin@statlearn.local",
        role: "admin",
        passwordHash: hashPassword("Admin@123"),
        createdAt: new Date("2026-01-01"),
      },
      {
        _id: orgId,
        email: "organization@statlearn.local",
        role: "organization",
        passwordHash: hashPassword("Org@123"),
        createdAt: new Date("2026-01-02"),
      },
    ];
    await db.collection("users").insertMany(users);
    console.log("Seeded 4 users (learner, trainer, admin, organization).");

    // 2. Seed Profiles
    const profiles = [
      {
        userId: learnerId,
        name: "Aarav Sharma",
        designation: "Data Analyst Trainee",
        department: "Statistical Operations",
        experience: 2,
        education: "B.Sc. in Statistics & Data Science",
        existingSkills: ["Basic Excel", "Introductory Python", "Data Cleaning", "Descriptive Statistics"],
        careerGoal: "Senior Quantitative Research Officer",
        stream: "statistics",
        shareProfileWithOrganizations: true,
        certifications: ["iGOT Certified Statistical Analyst - Level 1"],
        projects: [
          {
            title: "National Household Consumption Survey Analysis",
            description: "Conducted variance estimation and outlier analysis on a 15,000-household demographic dataset using Python.",
            skills: ["Python", "Sampling Theory", "Data Cleaning"],
          },
        ],
      },
      {
        userId: trainerId,
        name: "Dr. Sunita Rao",
        designation: "Principal Statistical Trainer",
        department: "Learning & Development",
        experience: 12,
        education: "Ph.D. in Applied Statistics",
        existingSkills: ["Curriculum Design", "Advanced Econometrics", "Psychometrics"],
        careerGoal: "Director of Training",
      },
      {
        userId: adminId,
        name: "Vikram Mehta",
        designation: "Head of Learning Administration",
        department: "Executive Administration",
        experience: 15,
        education: "Master of Public Policy",
        existingSkills: ["Platform Management", "Workforce Analytics", "Strategic Planning"],
      },
      {
        userId: orgId,
        name: "National Institute of Statistical Intelligence",
        designation: "Institutional Administrator",
        department: "Academic & Industry Relations",
        experience: 20,
        education: "Institution Accreditation Board",
        existingSkills: ["Workforce Planning", "Competency Benchmarking", "Talent Acquisition"],
      },
    ];
    await db.collection("profiles").insertMany(profiles);
    console.log("Seeded profiles.");

    // Seed Streams
    const { DEFAULT_STREAMS } = await import("../src/db/streams");
    await db.collection("streams").insertMany(DEFAULT_STREAMS);
    console.log("Seeded default streams.");

    // 3. Seed Competencies
    const c1 = new ObjectId();
    const c2 = new ObjectId();
    const c3 = new ObjectId();
    const c4 = new ObjectId();
    const c5 = new ObjectId();

    const competencies = [
      { _id: c1, name: "Descriptive Statistics", category: "Foundations" },
      { _id: c2, name: "Inferential Statistics", category: "Core Analytics" },
      { _id: c3, name: "Hypothesis Testing", category: "Core Analytics" },
      { _id: c4, name: "Regression Modeling", category: "Advanced Methods" },
      { _id: c5, name: "Data Visualization & Communication", category: "Applied Skills" },
    ];
    await db.collection("competencies").insertMany(competencies);
    console.log("Seeded 5 competencies.");

    // 4. Seed User Competencies with history
    const userCompetencies = [
      {
        userId: learnerId,
        competencyId: c1,
        currentScore: 82,
        targetScore: 85,
        history: [
          { score: 65, recordedAt: new Date("2026-01-15") },
          { score: 82, recordedAt: new Date("2026-02-01") },
        ],
      },
      {
        userId: learnerId,
        competencyId: c2,
        currentScore: 48, // Significant gap
        targetScore: 80,
        history: [
          { score: 40, recordedAt: new Date("2026-01-15") },
          { score: 48, recordedAt: new Date("2026-02-05") },
        ],
      },
      {
        userId: learnerId,
        competencyId: c3,
        currentScore: 52, // Significant gap
        targetScore: 85,
        history: [
          { score: 45, recordedAt: new Date("2026-01-20") },
          { score: 52, recordedAt: new Date("2026-02-10") },
        ],
      },
      {
        userId: learnerId,
        competencyId: c4,
        currentScore: 42,
        targetScore: 75,
        history: [{ score: 42, recordedAt: new Date("2026-02-12") }],
      },
      {
        userId: learnerId,
        competencyId: c5,
        currentScore: 78,
        targetScore: 80,
        history: [{ score: 78, recordedAt: new Date("2026-02-15") }],
      },
    ];
    await db.collection("user_competencies").insertMany(userCompetencies);
    console.log("Seeded user competencies.");

    // 5. Seed Published & Draft Assessments and Quizzes
    const assessment1Id = new ObjectId();
    const assessment2Id = new ObjectId();
    const quiz1Id = new ObjectId();
    const quiz2Id = new ObjectId();

    const assessments = [
      {
        _id: assessment1Id,
        title: "Inferential Statistics & Probability Diagnostics",
        type: "mcq",
        kind: "assessment",
        competencyId: c2,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-10"),
      },
      {
        _id: assessment2Id,
        title: "Hypothesis Testing Applied Benchmark",
        type: "mcq",
        kind: "assessment",
        competencyId: c3,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-12"),
      },
      {
        _id: quiz1Id,
        title: "Quick Drill: Sampling & Central Limit Theorem",
        type: "mcq",
        kind: "quiz",
        competencyId: c2,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-14"),
      },
      {
        _id: quiz2Id,
        title: "Practice Drill: Type I & II Error Rates",
        type: "mcq",
        kind: "quiz",
        competencyId: c3,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-16"),
      },
      // Stream Tests
      {
        _id: new ObjectId("65c1234567890123456789a1"),
        title: "Foundations of Statistical Inference & Hypothesis Testing",
        description: "Comprehensive stream test evaluating CLT, parametric intervals, Neyman allocation, and p-value significance bounds.",
        type: "mcq",
        kind: "stream_test",
        stream: "statistics",
        durationMinutes: 25,
        passingScore: 70,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-18"),
      },
      {
        _id: new ObjectId("65c1234567890123456789a2"),
        title: "Exploratory Data Analysis & Dimensional Modeling",
        description: "Practical assessment on cleaning dirty datasets, missing value imputation, variance analysis, and dashboard KPIs.",
        type: "mcq",
        kind: "stream_test",
        stream: "data-analytics",
        durationMinutes: 30,
        passingScore: 65,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-20"),
      },
      {
        _id: new ObjectId("65c1234567890123456789a3"),
        title: "Data Structures, Complexity & Relational Query Design",
        description: "Stream evaluation covering search/sort computational bounds, indexing strategies, and database transaction ACIDity.",
        type: "mcq",
        kind: "stream_test",
        stream: "computer-science",
        durationMinutes: 30,
        passingScore: 65,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-22"),
      },
      {
        _id: new ObjectId("65c1234567890123456789a4"),
        title: "Python Data Science Stack (NumPy, Pandas & SQL Drills)",
        description: "Applied coding knowledge evaluation on vector operations, group-by aggregations, and window functions.",
        type: "mcq",
        kind: "stream_test",
        stream: "programming",
        durationMinutes: 25,
        passingScore: 70,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-24"),
      },
      {
        _id: new ObjectId("65c1234567890123456789a5"),
        title: "Supervised Learning, Regularization & Model Validation",
        description: "In-depth test on bias-variance trade-off, cross-validation, ROC-AUC, and feature scaling.",
        type: "mcq",
        kind: "stream_test",
        stream: "machine-learning",
        durationMinutes: 30,
        passingScore: 70,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-26"),
      },
      {
        _id: new ObjectId("65c1234567890123456789a6"),
        title: "Official Survey Methodologies & National Index Formulations",
        description: "Evaluation on multi-stage cluster sampling, price index formulas (Laspeyres/Paasche), and demographic weighting.",
        type: "mcq",
        kind: "stream_test",
        stream: "economics-surveys",
        durationMinutes: 30,
        passingScore: 65,
        createdById: trainerId,
        published: true,
        isOfficial: true,
        createdAt: new Date("2026-01-28"),
      },
    ];
    await db.collection("assessments").insertMany(assessments);
    console.log("Seeded assessments and quizzes.");

    // 6. Seed Questions for Assessment 1 and Quiz 1
    const q1 = new ObjectId();
    const q2 = new ObjectId();
    const q3 = new ObjectId();
    const q4 = new ObjectId();
    const qQuiz1 = new ObjectId();
    const qQuiz2 = new ObjectId();

    const questions = [
      {
        _id: q1,
        assessmentId: assessment1Id,
        competencyId: c2,
        text: "What does the Central Limit Theorem state regarding the sampling distribution of the sample mean?",
        type: "mcq",
        difficulty: "easy",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "It approaches a normal distribution as sample size increases, regardless of population shape.", isCorrect: true, explanation: "Standard formulation of CLT for finite variance populations." },
          { text: "The sample mean is always exactly equal to the median.", isCorrect: false, explanation: "Mean and median only coincide in symmetric distributions." },
          { text: "Variance increases proportionally with sample size.", isCorrect: false, explanation: "Standard error decreases as 1/sqrt(n)." },
          { text: "Sample distributions are always uniform.", isCorrect: false, explanation: "CLT yields normality, not uniform distributions." },
        ],
      },
      {
        _id: q2,
        assessmentId: assessment1Id,
        competencyId: c2,
        text: "When calculating a 95% confidence interval for a population mean with known variance, what z-multiplier is used?",
        type: "mcq",
        difficulty: "easy",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "1.96", isCorrect: true, explanation: "Standard normal critical value for two-tailed alpha = 0.05." },
          { text: "2.58", isCorrect: false, explanation: "2.58 corresponds to a 99% confidence interval." },
          { text: "1.645", isCorrect: false, explanation: "1.645 corresponds to a 90% confidence interval." },
          { text: "3.00", isCorrect: false, explanation: "3.00 covers approximately 99.7% under empirical rule." },
        ],
      },
      {
        _id: q3,
        assessmentId: assessment1Id,
        competencyId: c2,
        text: "In a stratified sampling design, how are sub-samples allocated across strata for optimal Neyman allocation?",
        type: "mcq",
        difficulty: "medium",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "Proportional to stratum size multiplied by stratum standard deviation", isCorrect: true, explanation: "Neyman allocation minimizes total variance under constant sampling cost." },
          { text: "Equal allocation across all strata regardless of size", isCorrect: false, explanation: "Equal allocation ignores stratum variance and population weight." },
          { text: "Inversely proportional to stratum variance", isCorrect: false, explanation: "Higher variance strata receive more sample points, not fewer." },
          { text: "Random assignment without weighting", isCorrect: false, explanation: "Random assignment defeats the purpose of stratified design." },
        ],
      },
      {
        _id: q4,
        assessmentId: assessment1Id,
        competencyId: c2,
        text: "What happens to the p-value when the sample size is increased while the observed effect size remains constant?",
        type: "mcq",
        difficulty: "hard",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "The p-value decreases because the standard error of the test statistic becomes smaller.", isCorrect: true, explanation: "Increased power shrinks the standard error, driving the test statistic into the critical rejection region." },
          { text: "The p-value increases proportionally.", isCorrect: false, explanation: "Standard error shrinks, not expands." },
          { text: "The p-value remains unaffected.", isCorrect: false, explanation: "Statistical power is a direct function of sample size." },
          { text: "The p-value becomes exactly 0.50.", isCorrect: false, explanation: "Incorrect assertion." },
        ],
      },
      {
        _id: qQuiz1,
        assessmentId: quiz1Id,
        competencyId: c2,
        text: "Which theorem justifies using the normal distribution for confidence intervals with large sample sizes?",
        type: "mcq",
        difficulty: "easy",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "Central Limit Theorem", isCorrect: true, explanation: "CLT guarantees asymptotic normality of sample averages." },
          { text: "Law of Total Probability", isCorrect: false, explanation: "Law of Total Probability partitions sample spaces." },
          { text: "Bayes Theorem", isCorrect: false, explanation: "Bayes theorem updates prior beliefs with likelihood." },
          { text: "Chebyshev Inequality", isCorrect: false, explanation: "Chebyshev provides non-parametric probability bounds." },
        ],
      },
      {
        _id: qQuiz2,
        assessmentId: quiz2Id,
        competencyId: c3,
        text: "What type of error occurs when a false null hypothesis fails to be rejected?",
        type: "mcq",
        difficulty: "easy",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "Type II Error (Beta)", isCorrect: true, explanation: "Type II error is failing to reject a false H0." },
          { text: "Type I Error (Alpha)", isCorrect: false, explanation: "Type I error is rejecting a true H0." },
          { text: "Sampling Bias", isCorrect: false, explanation: "Sampling bias is systematic distortion in selection." },
          { text: "Measurement Variance", isCorrect: false, explanation: "Measurement variance is instrument error." },
        ],
      },
      // Questions for Stream Tests
      {
        _id: new ObjectId(),
        assessmentId: new ObjectId("65c1234567890123456789a1"),
        text: "Under simple random sampling without replacement (SRSWOR), what is the finite population correction (FPC) factor for sample variance?",
        type: "mcq",
        difficulty: "medium",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "(N - n) / (N - 1)", isCorrect: true, explanation: "FPC accounts for reduction in variance when sample fraction n/N is significant." },
          { text: "n / N", isCorrect: false, explanation: "This is the sampling fraction, not the correction factor." },
          { text: "sqrt(N / n)", isCorrect: false, explanation: "Incorrect variance multiplier." },
          { text: "(N - 1) / N", isCorrect: false, explanation: "Incorrect formula." },
        ],
      },
      {
        _id: new ObjectId(),
        assessmentId: new ObjectId("65c1234567890123456789a1"),
        text: "What is the primary assumption required for a two-sample Student's t-test regarding population variance equality?",
        type: "mcq",
        difficulty: "easy",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "Homoscedasticity (equal population variances)", isCorrect: true, explanation: "Standard Student's t-test pools variances; Welch's t-test relaxes this assumption." },
          { text: "Complete independence of all predictor variables", isCorrect: false, explanation: "Not an assumption of two-sample means comparison." },
          { text: "Infinite sample size in both groups", isCorrect: false, explanation: "T-distribution specifically addresses finite sample sizes." },
          { text: "Non-parametric rank ordering", isCorrect: false, explanation: "Rank ordering applies to Wilcoxon/Mann-Whitney tests." },
        ],
      },
      {
        _id: new ObjectId(),
        assessmentId: new ObjectId("65c1234567890123456789a2"),
        text: "Which visualization technique is best suited for assessing the distribution shape, skewness, and potential outliers in a continuous numerical variable?",
        type: "mcq",
        difficulty: "easy",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "Box Plot (Box-and-Whisker) and Histogram with KDE", isCorrect: true, explanation: "Box plots show medians, quartiles, and IQR outlier boundaries clearly." },
          { text: "Pie Chart", isCorrect: false, explanation: "Pie charts are only suitable for low-cardinality categorical compositions." },
          { text: "Stacked Area Chart", isCorrect: false, explanation: "Stacked area charts show multi-series time trends, not single variable distributions." },
          { text: "Scatter Plot Matrix without marginals", isCorrect: false, explanation: "Scatter plots show bivariate relationships rather than univariate skewness." },
        ],
      },
      {
        _id: new ObjectId(),
        assessmentId: new ObjectId("65c1234567890123456789a3"),
        text: "What is the average time complexity of searching an element in a balanced Binary Search Tree (AVL / Red-Black Tree)?",
        type: "mcq",
        difficulty: "easy",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "O(log n)", isCorrect: true, explanation: "Balanced BSTs guarantee logarithmic height bounding search operations." },
          { text: "O(n)", isCorrect: false, explanation: "O(n) occurs only in degenerate unbalanced trees." },
          { text: "O(1)", isCorrect: false, explanation: "O(1) is typical for hash table lookups, not trees." },
          { text: "O(n log n)", isCorrect: false, explanation: "O(n log n) is standard for comparison-based sorting algorithms." },
        ],
      },
      {
        _id: new ObjectId(),
        assessmentId: new ObjectId("65c1234567890123456789a4"),
        text: "In Python's Pandas library, which function performs vector transformations without triggering a slow Python-level row iteration loop?",
        type: "mcq",
        difficulty: "medium",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "Direct column vector expressions (e.g. df['c'] = df['a'] + df['b']) and numpy.where()", isCorrect: true, explanation: "Vectorized arithmetic executes in optimized compiled C routines." },
          { text: "df.iterrows() with a for loop", isCorrect: false, explanation: "iterrows creates Series objects per row and is substantially slower." },
          { text: "for i in range(len(df))", isCorrect: false, explanation: "Explicit index looping bypasses vectorization entirely." },
          { text: "df.to_dict() and dict comprehension", isCorrect: false, explanation: "Converting to dictionary incurs high memory overhead." },
        ],
      },
      {
        _id: new ObjectId(),
        assessmentId: new ObjectId("65c1234567890123456789a5"),
        text: "What is the primary effect of L2 Regularization (Ridge) on the coefficients of a linear regression model?",
        type: "mcq",
        difficulty: "medium",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "Shrinks weights continuously toward zero without forcing exact zeros", isCorrect: true, explanation: "Ridge penalizes squared magnitude of weights, reducing variance without sparse selection." },
          { text: "Forces unimportant coefficients to become exactly zero", isCorrect: false, explanation: "L1 (Lasso) produces exact zeros, not L2." },
          { text: "Increases training set variance infinitely", isCorrect: false, explanation: "Regularization decreases model variance." },
          { text: "Eliminates all bias from the model", isCorrect: false, explanation: "Regularization intentionally introduces a small bias to drastically reduce variance." },
        ],
      },
      {
        _id: new ObjectId(),
        assessmentId: new ObjectId("65c1234567890123456789a6"),
        text: "Which index number formula uses base-period quantity weights to measure aggregate price changes over time?",
        type: "mcq",
        difficulty: "easy",
        aiGenerated: false,
        reviewedByTrainer: true,
        answers: [
          { text: "Laspeyres Price Index", isCorrect: true, explanation: "Laspeyres fixes quantities at base period (q0), making it standard for official CPI benchmarks." },
          { text: "Paasche Price Index", isCorrect: false, explanation: "Paasche uses current period quantities (qn)." },
          { text: "Fisher's Ideal Index", isCorrect: false, explanation: "Fisher is the geometric mean of Laspeyres and Paasche." },
          { text: "Marshall-Edgeworth Index", isCorrect: false, explanation: "Marshall-Edgeworth uses the average of base and current quantities." },
        ],
      },
    ];
    await db.collection("questions").insertMany(questions);
    console.log("Seeded questions.");

    // 7. Seed Assessment Attempts showing improvement (Before = 50, After = 75)
    const attempt1Id = new ObjectId();
    const attempt2Id = new ObjectId();

    const attempts = [
      {
        _id: attempt1Id,
        userId: learnerId,
        assessmentId: assessment1Id,
        score: 50, // Before
        evidence: {
          totalQuestions: 4,
          correctCount: 2,
          scorePercentage: 50,
          items: [
            { questionId: q1.toHexString(), difficulty: "easy", isCorrect: true, explanation: "Correct answer" },
            { questionId: q2.toHexString(), difficulty: "easy", isCorrect: false, explanation: "Selected 2.58 instead of 1.96" },
            { questionId: q3.toHexString(), difficulty: "medium", isCorrect: false, explanation: "Missed Neyman allocation principle" },
            { questionId: q4.toHexString(), difficulty: "hard", isCorrect: true, explanation: "Correct answer" },
          ],
        },
        startedAt: new Date("2026-01-20T10:00:00Z"),
        completedAt: new Date("2026-01-20T10:25:00Z"),
      },
      {
        _id: attempt2Id,
        userId: learnerId,
        assessmentId: assessment1Id,
        score: 75, // After -> Improvement = +25
        evidence: {
          totalQuestions: 4,
          correctCount: 3,
          scorePercentage: 75,
          items: [
            { questionId: q1.toHexString(), difficulty: "easy", isCorrect: true, explanation: "Correct answer" },
            { questionId: q2.toHexString(), difficulty: "easy", isCorrect: true, explanation: "Correct critical value identified" },
            { questionId: q3.toHexString(), difficulty: "medium", isCorrect: true, explanation: "Correctly resolved Neyman allocation" },
            { questionId: q4.toHexString(), difficulty: "hard", isCorrect: false, explanation: "Missed extreme tail sensitivity" },
          ],
        },
        startedAt: new Date("2026-02-05T14:00:00Z"),
        completedAt: new Date("2026-02-05T14:22:00Z"),
      },
    ];
    await db.collection("assessment_attempts").insertMany(attempts);
    console.log("Seeded assessment attempts with before/after scores (50 -> 75, improvement = +25).");

    // 8. Seed Mock iGOT Courses
    const course1Id = new ObjectId();
    const course2Id = new ObjectId();
    const course3Id = new ObjectId();

    const courses = [
      {
        _id: course1Id,
        title: "iGOT: Fundamentals of Inferential Statistics & Sampling Theory",
        source: "mock_igot",
        competencyId: c2,
        metadata: {
          durationHours: 6,
          rating: 4.8,
          level: "Beginner",
          modules: ["Central Limit Theorem", "Confidence Intervals", "Sampling Methods"],
        },
      },
      {
        _id: course2Id,
        title: "iGOT: Applied Hypothesis Testing & Error Minimization",
        source: "mock_igot",
        competencyId: c3,
        metadata: {
          durationHours: 8,
          rating: 4.9,
          level: "Intermediate",
          modules: ["Z-test & T-test", "ANOVA", "Type I & II Errors", "P-value Interpretation"],
        },
      },
      {
        _id: course3Id,
        title: "iGOT: Linear & Logistic Regression Modeling in Governance",
        source: "mock_igot",
        competencyId: c4,
        metadata: {
          durationHours: 10,
          rating: 4.7,
          level: "Advanced",
          modules: ["Ordinary Least Squares", "Multicollinearity", "Model Diagnostics"],
        },
      },
    ];
    await db.collection("courses").insertMany(courses);
    console.log("Seeded mock iGOT courses.");

    // 9. Seed Explainable Recommendations
    const recommendations = [
      {
        userId: learnerId,
        courseId: course1Id,
        reason: "Recommended because you have a 32-point gap in Inferential Statistics (Current: 48%, Target: 80%). This course addresses foundational sampling concepts.",
      },
      {
        userId: learnerId,
        courseId: course2Id,
        reason: "Recommended because you have a 33-point gap in Hypothesis Testing (Current: 52%, Target: 85%). This module covers practical p-value drills.",
      },
    ];
    await db.collection("recommendations").insertMany(recommendations);
    console.log("Seeded recommendations.");

    // 10. Seed Learning Paths
    const learningPaths = [
      {
        userId: learnerId,
        status: "active",
        weeks: {
          week1: {
            theme: "Foundation",
            tasks: [
              { id: "w1-1", title: "Review Sampling Distributions", status: "completed" },
              { id: "w1-2", title: "Diagnostic Quiz on Confidence Bounds", status: "completed" },
            ],
          },
          week2: {
            theme: "Weak Concept Practice",
            tasks: [
              { id: "w2-1", title: "Neyman Allocation Practice Problems", status: "in_progress" },
              { id: "w2-2", title: "Error Analysis Review", status: "pending" },
            ],
          },
          week3: {
            theme: "Applied Practice",
            tasks: [
              { id: "w3-1", title: "Governance Dataset Hypothesis Analysis", status: "pending" },
            ],
          },
          week4: {
            theme: "Reassessment",
            tasks: [
              { id: "w4-1", title: "Complete Final Inferential Mastery Assessment", status: "pending" },
            ],
          },
        },
      },
    ];
    await db.collection("learning_paths").insertMany(learningPaths);
    console.log("Seeded learning paths.");

    // 11. Seed Progress Events
    const progress = [
      {
        userId: learnerId,
        metric: "assessment_score",
        value: 50,
        recordedAt: new Date("2026-01-20T10:25:00Z"),
      },
      {
        userId: learnerId,
        metric: "module_completion",
        value: 100,
        recordedAt: new Date("2026-01-28T16:00:00Z"),
      },
      {
        userId: learnerId,
        metric: "assessment_score",
        value: 75,
        recordedAt: new Date("2026-02-05T14:22:00Z"),
      },
    ];
    await db.collection("progress").insertMany(progress);
    console.log("Seeded progress records.");

    console.log("\n==========================================");
    console.log("DATABASE SEED COMPLETED SUCCESSFULLY!");
    console.log("Synthetic credentials for testing:");
    console.log("  Learner: learner@statlearn.local / Learner@123");
    console.log("  Trainer: trainer@statlearn.local / Trainer@123");
    console.log("  Admin:   admin@statlearn.local   / Admin@123");
    console.log("==========================================\n");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
