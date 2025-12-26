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
        displayConfig: {
          default: ["name"],
          users: ["name", "email"],
        },
      } as TenantDb
    }
    const res = await managerDb.tenants.findOne({ _id: new ObjectId(tenantId) })

    return res
  }

  async list() {
    const tenants = await managerDb.tenants.find({}).toArray()
    return tenants
  }

  async create(data: {
    dbConnectionString: string
    dbName: string
    displayConfig: { [collectionName: string]: string[] }
  }) {
    const result = await managerDb.tenants.insertOne({
      encryptedDbConnectionString: encryption.encrypt(data.dbConnectionString),
      dbName: data.dbName,
      displayConfig: data.displayConfig,
    })

    return {
      _id: result.insertedId,
      ...data,
    }
  }
}

export const tenantService = new TenantService()
