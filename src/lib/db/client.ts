import { MongoClient, MongoClientOptions, Db } from "mongodb";
import { env } from "@/lib/env";

const uri = env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add your Mongo URI to .env");
}

/**
 * Resilient MongoClient options for MongoDB Atlas (SRV + TLS).
 * - maxIdleTimeMS: closes sockets idle for >60s so wake-from-sleep or dead sockets are dropped
 * - socketTimeoutMS: detects unacknowledged/dropped network packets within 45s
 * - serverSelectionTimeoutMS: fails fast (10s) to trigger reconnect rather than hanging 30s
 * - retryWrites & retryReads: automatic retry for transient failovers
 */
const mongoOptions: MongoClientOptions = {
  maxPoolSize: 20,
  minPoolSize: 0,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryReads: true,
  retryWrites: true,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoClientInstance: MongoClient | undefined;
}

/**
 * Helper to create a new connected MongoClient and bind error listeners.
 */
async function createClient(): Promise<MongoClient> {
  const client = new MongoClient(uri, mongoOptions);

  // Attach listeners to reset cache if topology or connection encounters fatal close/error
  client.on("close", () => {
    if (global._mongoClientInstance === client) {
      global._mongoClientPromise = undefined;
      global._mongoClientInstance = undefined;
    }
  });

  await client.connect();
  global._mongoClientInstance = client;
  return client;
}

/**
 * Retrieves the MongoClient promise, auto-recreating if the cached client was closed or rejected.
 */
function getClientPromise(): Promise<MongoClient> {
  if (env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createClient().catch((err) => {
        // Clear cached promise on rejection so subsequent requests retry fresh
        global._mongoClientPromise = undefined;
        global._mongoClientInstance = undefined;
        throw err;
      });
    }
    return global._mongoClientPromise;
  }

  // In production mode
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClient().catch((err) => {
      global._mongoClientPromise = undefined;
      global._mongoClientInstance = undefined;
      throw err;
    });
  }
  return global._mongoClientPromise;
}

const clientPromise: Promise<MongoClient> = getClientPromise();
export default clientPromise;

/**
 * Returns an active database instance.
 * Automatically verifies topology freshness and reconnects if the connection broke.
 */
export async function getDatabase(): Promise<Db> {
  let client: MongoClient;
  try {
    client = await getClientPromise();
    // Quick ping/verification to detect stale sockets (e.g. after laptop sleep/wake or network switch)
    await client.db().admin().ping();
    return client.db();
  } catch {
    // If the existing connection was dead or rejected, clear the cached promise and retry once
    global._mongoClientPromise = undefined;
    global._mongoClientInstance = undefined;
    client = await getClientPromise();
    return client.db();
  }
}
