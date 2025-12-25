import { EJSON } from "bson"
import { ObjectId } from "mongodb"
import { createQuery } from "odata-v4-mongodb"
import { AppError } from "../common/appError.ts"
import { createDbProxy, run } from "../common/helpers.ts"
import { db, mongoDb } from "../db.ts"

class DataService {
  async listCollections() {
    const collections = await mongoDb.listCollections().toArray()
    return collections.map((col) => col.name)
  }

  async getDocuments(collection: string, odataQuery: string) {
    const {
      query: filters,
      projection,
      sort,
      skip = 0,
      limit = 20,
    } = odataQuery ? createQuery(odataQuery) : {}

    const documents = await mongoDb
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

  async getDocumentCount(collection: string, odataQuery: string) {
    const { query: filters } = odataQuery ? createQuery(odataQuery) : {}

    const count = await mongoDb.collection(collection).countDocuments(filters)

    return {
      count,
    }
  }

  async getDocumentById(collection: string, id: string) {
    let itemId: any = id

    if (id.length === 24) {
      try {
        itemId = new ObjectId(id)
      } catch {}
    }

    const document = await mongoDb
      .collection(collection)
      .findOne({ _id: itemId })

    if (!document) {
      throw new AppError("Document not found")
    }

    return EJSON.serialize(document)
  }

  async updateDocumentById(
    collection: string,
    id: string,
    bsonData: Record<string, unknown>
  ) {
    let itemId: any = id

    if (id.length === 24) {
      try {
        itemId = new ObjectId(id)
      } catch {}
    }

    const { _id, ...updateData } = EJSON.deserialize(bsonData)

    const result = await mongoDb
      .collection(collection)
      .findOneAndUpdate(
        { _id: itemId },
        { $set: updateData },
        { returnDocument: "after" }
      )

    if (!result) {
      throw new AppError("Document not found")
    }

    await db.eventLog.insertOne({
      type: "UPDATE",
      collection,
      id: itemId,
      result,
      timestamp: new Date(),
      data: updateData,
    })

    return EJSON.serialize(result)
  }

  async deleteDocumentById(collection: string, id: string) {
    let itemId: any = id

    if (id.length === 24) {
      try {
        itemId = new ObjectId(id)
      } catch {}
    }

    const result = await mongoDb
      .collection(collection)
      .deleteOne({ _id: itemId })

    if (result.deletedCount === 0) {
      throw new AppError("Document not found")
    }

    await db.eventLog.insertOne({
      type: "DELETE",
      collection,
      id: new ObjectId(id),
      result,
      timestamp: new Date(),
    })

    return { success: true, deletedCount: result.deletedCount }
  }

  async runQueries(queries: string[]) {
    const tasks = queries.map(async (x) => {
      const res = await run(x, { db: createDbProxy(mongoDb) })

      if (x.includes(".findOne(")) {
        return [EJSON.serialize(res)]
      }

      if (x.includes(".find(") && x.includes(".toArray(")) {
        return res.map((x: any) => EJSON.serialize(x))
      }
    })

    const results = await Promise.all(tasks)

    await db.eventLog.insertOne({
      type: "QUERY",
      queries,
      results: results.map((x) => (Array.isArray(x) ? x.length : x)),
      timestamp: new Date(),
    })

    return results
  }
}

export const dataService = new DataService()
