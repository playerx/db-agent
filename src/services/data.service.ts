import { EJSON } from "bson"
import { ObjectId } from "mongodb"
import { createQuery } from "odata-v4-mongodb"
import { AppError } from "../common/appError.ts"
import { createDbProxy, run } from "../common/helpers.ts"
import { managerDb } from "../db.ts"
import { dbConnectionCache } from "./dbConnectionCache.service.ts"

class DataService {
  async listDatabases(tenantId: string) {
    const client = await dbConnectionCache.get(tenantId)
    const res = await client.db().admin().listDatabases()

    return res.databases.map((x) => x.name)
  }

  async listCollections(tenantId: string, dbName: string) {
    const client = await dbConnectionCache.get(tenantId)
    const db = client.db(dbName)

    const collections = await db.listCollections().toArray()

    return collections.map((col) => col.name)
  }

  async getDocuments(
    tenantId: string,
    dbName: string,
    collection: string,
    odataQuery: string
  ) {
    const {
      query: filters,
      projection,
      sort,
      skip = 0,
      limit = 20,
    } = odataQuery ? createQuery(odataQuery) : {}

    const client = await dbConnectionCache.get(tenantId)
    const db = client.db(dbName)

    const documents = await db
      .collection(collection)
      .find(filters, projection)
      .sort(sort)
      .skip(skip || 0)
      .limit(limit || 20)
      .toArray()

    return {
      data: documents.map((x) => EJSON.serialize(x)),
      query: {
        filters,
        projection,
        skip,
        limit,
      },
    }
  }

  async getDocumentCount(
    tenantId: string,
    dbName: string,
    collection: string,
    odataQuery: string
  ) {
    const { query: filters } = odataQuery ? createQuery(odataQuery) : {}

    const client = await dbConnectionCache.get(tenantId)
    const db = client.db(dbName)

    const count = await db.collection(collection).countDocuments(filters)

    return {
      count,
    }
  }

  async getDocumentById(
    tenantId: string,
    dbName: string,
    collection: string,
    id: string
  ) {
    const client = await dbConnectionCache.get(tenantId)
    const db = client.db(dbName)

    let itemId: any = id

    if (id.length === 24) {
      try {
        itemId = new ObjectId(id)
      } catch {}
    }

    const document = await db.collection(collection).findOne({ _id: itemId })

    if (!document) {
      throw new AppError("Document not found")
    }

    return EJSON.serialize(document)
  }

  async updateDocumentById(
    tenantId: string,
    dbName: string,
    collection: string,
    id: string,
    bsonData: Record<string, unknown>
  ) {
    const client = await dbConnectionCache.get(tenantId)
    const db = client.db(dbName)

    let itemId: any = id

    if (id.length === 24) {
      try {
        itemId = new ObjectId(id)
      } catch {}
    }

    const { _id, ...updateData } = EJSON.deserialize(bsonData)

    const result = await db
      .collection(collection)
      .findOneAndUpdate(
        { _id: itemId },
        { $set: updateData },
        { returnDocument: "after" }
      )

    if (!result) {
      throw new AppError("Document not found")
    }

    await managerDb.eventLog.insertOne({
      type: "UPDATE",
      tenantId,
      collection,
      id: itemId,
      result,
      timestamp: new Date(),
      data: updateData,
    })

    return EJSON.serialize(result)
  }

  async deleteDocumentById(
    tenantId: string,
    dbName: string,
    collection: string,
    id: string
  ) {
    const client = await dbConnectionCache.get(tenantId)
    const db = client.db(dbName)

    let itemId: any = id

    if (id.length === 24) {
      try {
        itemId = new ObjectId(id)
      } catch {}
    }

    const result = await db.collection(collection).deleteOne({ _id: itemId })

    if (result.deletedCount === 0) {
      throw new AppError("Document not found")
    }

    await managerDb.eventLog.insertOne({
      type: "DELETE",
      tenantId,
      collection,
      id: new ObjectId(id),
      result,
      timestamp: new Date(),
    })

    return { success: true, deletedCount: result.deletedCount }
  }

  async runQueries(
    tenantId: string,
    dbName: string,
    queries: string[],
    promptLogId: string
  ) {
    const client = await dbConnectionCache.get(tenantId)
    const db = client.db(dbName)

    const finalQueries = queries.map((x) => x.replaceAll("\n", " ").trim())

    const tasks = finalQueries.map(async (x) => {
      const res = await run(x, {
        db: createDbProxy(db),
      })

      if (x.includes(".findOne(")) {
        return [EJSON.serialize(res)]
      }

      if (x.includes(".find(") && x.includes(".toArray(")) {
        return res.map((x: any) => EJSON.serialize(x))
      }

      return res
    })

    const results = await Promise.all(tasks)

    await managerDb.eventLog.insertOne({
      type: "QUERY",
      tenantId,
      queries: finalQueries,
      results: results.map((x) => (Array.isArray(x) ? x.length : x)),
      promptLogId,
      timestamp: new Date(),
    })

    await managerDb.promptLog.updateOne(
      { _id: new ObjectId(promptLogId) },
      {
        $set: {
          lastUsedAt: new Date(),
        },
      }
    )

    return results
  }
}

export const dataService = new DataService()
