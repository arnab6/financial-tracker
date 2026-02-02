import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env"
    );
}

interface MongoCache {
    client: MongoClient | null;
    db: Db | null;
    promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
    /* eslint-disable no-var */
    var mongoCache: MongoCache | undefined;
}

let cached = global.mongoCache;

if (!cached) {
    cached = global.mongoCache = { client: null, db: null, promise: null };
}

async function dbConnect() {
    if (cached!.client && cached!.db) {
        return { client: cached!.client, db: cached!.db };
    }

    if (!cached!.promise) {
        const opts = {
            // No SRV resolution options needed, native driver handles it better
        };

        cached!.promise = MongoClient.connect(MONGODB_URI!, opts).then((client) => {
            const db = client.db('financial_app'); // Explicitly specify database
            return { client, db };
        });
    }

    const { client, db } = await cached!.promise;
    cached!.client = client;
    cached!.db = db;

    return { client, db };
}

export default dbConnect;
