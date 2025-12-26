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
}

export const tenantService = new TenantService()
