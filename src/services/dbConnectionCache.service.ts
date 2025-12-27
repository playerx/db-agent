import { MongoClient, type Db } from "mongodb"
import { AppError } from "../common/appError.ts"
import { encryption } from "../common/encryption.ts"
import { tenantService } from "./tenant.service.ts"

class DbConnectionCache {
  private dbConnectionCache = new Map<string, { client: MongoClient; db: Db }>()

  async getDb(tenantId: string) {
    let cache = this.dbConnectionCache.get(tenantId)
    if (!cache) {
      const tenant = await tenantService.get(tenantId)
      if (!tenant) {
        // if (tenant === 'demo')
        throw new AppError("Tenant not found")
      }

      const dbConnectionString = encryption.decrypt(tenant.encryptedDbConnectionString)

      const client = await new MongoClient(dbConnectionString).connect()
      const db = client.db(tenant.dbName)

      cache = { client, db }

      this.dbConnectionCache.set(tenantId, cache)
    }

    return cache
  }

  async remove(tenantId: string) {
    let cache = this.dbConnectionCache.get(tenantId)
    if (!cache) {
      return
    }

    try {
      await cache.client.close(true)
    } finally {
      this.dbConnectionCache.delete(tenantId)
    }
  }
}

export const dbConnectionCache = new DbConnectionCache()
