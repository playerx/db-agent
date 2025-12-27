import { MongoClient, ObjectId } from "mongodb"
import { AppError } from "../common/appError.ts"
import { encryption } from "../common/encryption.ts"
import { getHostnameFromMongoURI } from "../common/getHostnameFromMongoURI.ts"
import { managerDb, type TenantDb } from "../db.ts"

const { DEMO_DB_CONNECTION_STRING } = process.env

async function validateMongoConnection(
  connectionString: string,
  dbName: string
): Promise<void> {
  let client: MongoClient | null = null
  try {
    client = new MongoClient(connectionString)
    await client.connect()

    // Try to access the database to ensure it exists and is accessible
    const db = client.db(dbName)
    await db.admin().ping()
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(`Invalid database connection: ${error.message}`)
    }
    throw new AppError("Invalid database connection: Unable to connect")
  } finally {
    if (client) {
      await client.close()
    }
  }
}

class TenantService {
  async get(tenantId: string, userId: string) {
    if (tenantId === "demo") {
      return {
        encryptedDbConnectionString: encryption.encrypt(
          DEMO_DB_CONNECTION_STRING!
        ),
        dbName: "demo",
        hostname: "local",
        userId: "",
        displayConfig: {
          default: ["name"],
          users: ["name", "email"],
        },
      } as TenantDb
    }

    const res = await managerDb.tenants.findOne({
      _id: new ObjectId(tenantId),
      userId,
    })

    return res
  }

  async list(userId: string) {
    const tenants = await managerDb.tenants.find({ userId }).toArray()
    return tenants
  }

  async create(data: {
    userId: string
    dbConnectionString: string
    dbName: string
    displayConfig: { [collectionName: string]: string[] }
  }) {
    // Validate connection before creating tenant
    await validateMongoConnection(data.dbConnectionString, data.dbName)

    const hostname = getHostnameFromMongoURI(data.dbConnectionString)

    const result = await managerDb.tenants.insertOne({
      encryptedDbConnectionString: encryption.encrypt(data.dbConnectionString),
      dbName: data.dbName,
      hostname,
      userId: data.userId,
      displayConfig: data.displayConfig,
    })

    return {
      _id: result.insertedId,
      ...data,
      hostname,
    }
  }

  async delete(tenantId: string, userId: string) {
    const result = await managerDb.tenants.deleteOne({
      _id: new ObjectId(tenantId),
      userId,
    })

    return result.deletedCount > 0
  }
}

export const tenantService = new TenantService()
