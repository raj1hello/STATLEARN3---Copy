import { ObjectId } from "mongodb";
import { streamsCol, assessmentsCol } from "./collections";
import { Stream } from "@/types";

export const DEFAULT_STREAMS: Omit<Stream, "_id">[] = [
  {
    slug: "statistics",
    title: "Statistics & Probability",
    description: "Foundational and inferential statistics, sampling theory, distribution analysis, and parameter estimation.",
    icon: "BarChart3",
    category: "Foundations",
    order: 1,
    skills: ["Descriptive Statistics", "Inferential Statistics", "Sampling Theory", "Hypothesis Testing", "Probability Distributions"],
  },
  {
    slug: "data-analytics",
    title: "Data Analytics & BI",
    description: "Exploratory data analysis, business intelligence, data cleaning, visualization, and metric formulation.",
    icon: "LineChart",
    category: "Applied Analytics",
    order: 2,
    skills: ["EDA", "Data Cleaning", "Data Visualization", "Dashboarding", "SQL for Analytics"],
  },
  {
    slug: "computer-science",
    title: "Computer Science & Systems",
    description: "Core algorithms, data structures, relational database architecture, and software design principles.",
    icon: "Cpu",
    category: "Core Computing",
    order: 3,
    skills: ["Data Structures", "Algorithms", "Database Systems", "Operating Systems", "System Architecture"],
  },
  {
    slug: "programming",
    title: "Programming (Python / R / SQL)",
    description: "Practical coding, scripting, statistical computation in Python/R, and relational query optimization.",
    icon: "Code2",
    category: "Implementation",
    order: 4,
    skills: ["Python", "R Programming", "Advanced SQL", "Pandas/NumPy", "Script Automation"],
  },
  {
    slug: "machine-learning",
    title: "Machine Learning & AI",
    description: "Supervised and unsupervised learning, predictive modeling, model validation, and AI pipeline development.",
    icon: "BrainCircuit",
    category: "Advanced Intelligence",
    order: 5,
    skills: ["Supervised Learning", "Classification & Regression", "Clustering", "Feature Engineering", "Model Evaluation"],
  },
  {
    slug: "economics-surveys",
    title: "Economics & Official Surveys",
    description: "National survey methodologies, econometric models, public policy analytics, and official census indices.",
    icon: "FileSpreadsheet",
    category: "Government & Governance",
    order: 6,
    skills: ["Survey Methodology", "Econometrics", "Index Numbers", "Census Operations", "Public Policy Analysis"],
  },
];

/**
 * List all streams with counts of available tests.
 */
export async function listStreams(): Promise<Stream[]> {
  const col = await streamsCol();
  let streams = await col.find({}).sort({ order: 1, title: 1 }).toArray();

  if (streams.length === 0) {
    // Auto-seed default streams if collection is currently empty
    await seedDefaultStreams();
    streams = await col.find({}).sort({ order: 1, title: 1 }).toArray();
  }

  // Count published tests for each stream
  const assCol = await assessmentsCol();
  const counts = await assCol
    .aggregate<{ _id: string; count: number }>([
      { $match: { published: true, stream: { $exists: true, $ne: "" } } },
      { $group: { _id: "$stream", count: { $sum: 1 } } },
    ])
    .toArray();

  const countMap = new Map<string, number>(counts.map((c) => [c._id, c.count]));

  return streams.map((s) => ({
    ...s,
    testCount: countMap.get(s.slug) || 0,
  }));
}

export async function getStreamBySlug(slug: string): Promise<Stream | null> {
  const col = await streamsCol();
  let stream = await col.findOne({ slug });
  if (!stream) {
    const defaultMatch = DEFAULT_STREAMS.find((s) => s.slug === slug);
    if (defaultMatch) {
      await seedDefaultStreams();
      stream = await col.findOne({ slug });
    }
  }
  return stream;
}

export async function seedDefaultStreams(): Promise<void> {
  const col = await streamsCol();
  for (const stream of DEFAULT_STREAMS) {
    await col.updateOne(
      { slug: stream.slug },
      { $set: stream },
      { upsert: true }
    );
  }
}
