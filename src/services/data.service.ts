import { ObjectId } from "mongodb"
import { mongoAgent } from "../agent/agent.ts"
import { AppError } from "../common/appError.ts"
import { db, mongoDb } from "../db.ts"

class DataService {
  async listCollections() {
    const collections = await mongoDb.listCollections().toArray()
    return collections.map((col) => col.name)
  }

  async getDocuments(
    collection: string,
    skip: number = 0,
    limit: number = 10,
    searchParams: Record<string, any> = {}
  ) {
    // Build query object from search parameters
    const query: Record<string, any> = {}

    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== "") {
        // If the value looks like an ObjectId, try to match it
        if (key === "_id" && ObjectId.isValid(value as string)) {
          query[key] = new ObjectId(value as string)
        } else if (typeof value === "string") {
          // Use case-insensitive regex for string fields
          query[key] = { $regex: value, $options: "i" }
        } else {
          // For other types, use exact match
          query[key] = value
        }
      }
    }

    const documents = limit
      ? await mongoDb
          .collection(collection)
          .find(query)
          .skip(skip)
          .limit(limit)
          .toArray()
      : []

    const total = await mongoDb.collection(collection).countDocuments(query)

    return {
      data: documents,
      pagination: {
        skip,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    }
  }

  async getDocumentById(collection: string, id: string) {
    if (!ObjectId.isValid(id)) {
      throw new AppError("Invalid document ID format")
    }

    const document = await mongoDb
      .collection(collection)
      .findOne({ _id: new ObjectId(id) })

    if (!document) {
      throw new AppError("Document not found")
    }

    return document
  }

  async updateDocumentById(
    collection: string,
    id: string,
    updateData: Record<string, any>
  ) {
    if (!ObjectId.isValid(id)) {
      throw new AppError("Invalid document ID format")
    }

    // Remove _id from update data if present
    const cleanedData = { ...updateData }
    delete cleanedData._id

    const result = await mongoDb
      .collection(collection)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: cleanedData },
        { returnDocument: "after" }
      )

    if (!result) {
      throw new AppError("Document not found")
    }

    await db.eventLog.insertOne({
      type: "UPDATE",
      collection,
      id: new ObjectId(id),
      result,
      timestamp: new Date(),
      data: cleanedData,
    })

    return result
  }

  async deleteDocumentById(collection: string, id: string) {
    if (!ObjectId.isValid(id)) {
      throw new AppError("Invalid document ID format")
    }

    const result = await mongoDb
      .collection(collection)
      .deleteOne({ _id: new ObjectId(id) })

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
