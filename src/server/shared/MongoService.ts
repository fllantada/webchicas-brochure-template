import { Collection, Db, Document, MongoClient } from "mongodb";

/**
 * Servicio MongoDB serverless-safe.
 * Reusa la conexión entre invocaciones Vercel via globalThis.
 */
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise(): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("[MongoService] MONGODB_URI no configurada");
    }
    globalForMongo._mongoClientPromise = new MongoClient(uri).connect();
  }
  return globalForMongo._mongoClientPromise;
}

async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB_NAME;
  if (!dbName) {
    throw new Error("[MongoService] MONGODB_DB_NAME no configurada");
  }
  return client.db(dbName);
}

/** Obtiene una colección tipada de MongoDB. */
export async function getCollection<T extends Document>(
  name: string,
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}
