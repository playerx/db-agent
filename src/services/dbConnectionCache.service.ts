import { MongoClient } from "mongodb"
import { AppError } from "../common/appError.ts"
import { tenantService } from "./tenant.service.ts"

class DbConnectionCache {
  private dbConnectionCache = new Map<string, MongoClient>()

  async get(tenantId: string) {
    let client = this.dbConnectionCache.get(tenantId)
    if (!client) {
      const tenant = await tenantService.get(tenantId)
      if (!tenant) {
        throw new AppError("Tenant not found")
      }

      // TODO: decrypt
      const dbConnectionString = tenant.encryptedDbConnectionString

      client = await new MongoClient(dbConnectionString).connect()

      this.dbConnectionCache.set(tenantId, client)
    }

    return client
  }

  async remove(tenantId: string) {
    let client = this.dbConnectionCache.get(tenantId)
    if (!client) {
      return
    }

    try {
      await client.close(true)
    } finally {
      this.dbConnectionCache.delete(tenantId)
    }
  }
}

export const dbConnectionCache = new DbConnectionCache()
