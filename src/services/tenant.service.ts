import { ObjectId } from "mongodb"
import { encryption } from "../common/encryption.ts"
import { managerDb, type TenantDb } from "../db.ts"

const { DEMO_DB_CONNECTION_STRING } = process.env

class TenantService {
  async get(tenantId: string) {
    if (tenantId === "demo") {
      return {
        encryptedDbConnectionString: encryption.encrypt(
          DEMO_DB_CONNECTION_STRING!
        ),
        dbName: "demo",
        userId: "",
        displayConfig: {
          default: ["name"],
          users: ["name", "email"],
        },
      } as TenantDb
    }
    const res = await managerDb.tenants.findOne({ _id: new ObjectId(tenantId) })

    return res
  }

  async list(userId: string) {
    const tenants = await managerDb.tenants
      .find({ $or: [{ userId: "" }, { userId }] })
      .toArray()
    return tenants
  }

  async create(data: {
    userId: string
    dbConnectionString: string
    dbName: string
    displayConfig: { [collectionName: string]: string[] }
  }) {
    const result = await managerDb.tenants.insertOne({
      encryptedDbConnectionString: encryption.encrypt(data.dbConnectionString),
      dbName: data.dbName,
      userId: data.userId,
      displayConfig: data.displayConfig,
    })

    return {
      _id: result.insertedId,
      ...data,
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
