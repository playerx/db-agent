import { ObjectId } from "mongodb"
import { managerDb } from "../db.ts"

class TenantService {
  async get(tenantId: string) {
    const res = await managerDb.tenants.findOne({ _id: new ObjectId(tenantId) })

    return res
  }
}

export const tenantService = new TenantService()
