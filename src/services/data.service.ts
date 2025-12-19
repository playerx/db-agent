import { ObjectId } from "mongodb"
import { mongoAgent } from "../agent/agent.ts"
import { AppError } from "../common/appError.ts"
import { db, mongoDb } from "../db.ts"

class DataService {
  async listCollections() {
    const collections = await mongoDb.listCollections().toArray()
    return collections.map((col) => col.name)
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

  async executePrompt(prompt: string) {
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

      debugLog.push({
        index: ++i,
        step,
        content: content.messages[0].content.toString(),
      })

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
