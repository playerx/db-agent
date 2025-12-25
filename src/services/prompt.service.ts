import { ObjectId } from "mongodb"
import { mongoAgent } from "../agent/mongoAgent.ts"
import { runQueryCache } from "../agent/tools.ts"
import { AppError } from "../common/appError.ts"
import { db } from "../db.ts"

class PromptService {
  async executePrompt(
    prompt: string,
    cb?: (step: string, content: string) => void
  ) {
    if (!prompt || typeof prompt !== "string") {
      throw new AppError("Prompt is required and must be a string")
    }

    let promptResult = ""
    const debugLog: { index: number; step: string; content: string }[] = []
    let i = 0

    const referenceId = crypto.randomUUID()

    for await (const chunk of await mongoAgent.stream(
      {
        messages: [prompt],
      },
      { streamMode: "updates", context: { referenceId } }
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
        promptResult = content.messages[0].content.toString()
        break
      }
    }

    const queries = runQueryCache.get(referenceId) ?? []

    runQueryCache.delete(referenceId)

    const { insertedId } = await db.promptLog.insertOne({
      prompt,
      result: promptResult,
      queries,
      debug: { messages: debugLog },
      lastUsedAt: new Date(),
      timestamp: new Date(),
    })

    return {
      id: insertedId.toHexString(),
      promptResult,
      queries,
      debug: debugLog,
    }
  }

  async listPromptLogs(
    skip: number = 0,
    limit: number = 10,
    showDebug = false
  ) {
    const data = await db.promptLog
      .find({}, { projection: showDebug ? undefined : { debug: 0 } })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.promptLog.countDocuments()

    return {
      data,
      pagination: {
        skip,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    }
  }

  async getPromptLogById(id: string, showDebug = false) {
    if (!ObjectId.isValid(id)) {
      throw new AppError("Invalid prompt log ID format")
    }

    const log = await db.promptLog.findOne(
      { _id: new ObjectId(id) },
      { projection: showDebug ? undefined : { debug: 0 } }
    )

    if (!log) {
      throw new AppError("Prompt log not found")
    }

    return log
  }

  async deletePromptLogById(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new AppError("Invalid prompt log ID format")
    }

    const result = await db.promptLog.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      throw new AppError("Prompt log not found")
    }

    return { success: true, message: "Prompt log deleted successfully" }
  }
}

export const promptService = new PromptService()
