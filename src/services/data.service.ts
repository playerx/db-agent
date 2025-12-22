import { EJSON } from "bson"
import { ObjectId } from "mongodb"
import { createQuery } from "odata-v4-mongodb"
import { mongoAgent } from "../agent/mongoAgent.ts"
import { AppError } from "../common/appError.ts"
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

  async executePrompt(
    prompt: string,
    cb?: (step: string, content: string) => void
  ) {
    if (!prompt || typeof prompt !== "string") {
      throw new AppError("Prompt is required and must be a string")
    }

    let result = ""
    const debugLog: { index: number; step: string; content: string }[] = []
    let i = 0

    for await (const chunk of await mongoAgent.stream(
      {
        messages: [prompt],
      },
      { streamMode: "updates" }
    )) {
      const [step, content] = Object.entries(chunk)[0]

      const contentData =
        typeof content.messages[0].content === "object"
          ? JSON.stringify(content.messages[0].content)
          : content.messages[0].content.toString()

      debugLog.push({
        index: ++i,
        step,
        content: contentData,
      })

      cb?.(
        step === "tools" ? `${content.messages[0].name} (tool)` : step,
        contentData
      )

      if (
        (content.messages[0].response_metadata as any)?.stop_reason ===
        "end_turn"
      ) {
        result = content.messages[0].content.toString()
        break
      }
    }

    await db.eventLog.insertOne({
      type: "PROMPT",
      prompt,
      result,
      debug: { messages: debugLog },
      timestamp: new Date(),
    })

    return {
      result,
      debug: debugLog,
    }
  }
}

export const dataService = new DataService()
