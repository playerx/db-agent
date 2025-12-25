import { ObjectId } from "mongodb"
import { AppError } from "../common/appError.ts"
import { db } from "../db.ts"

class PromptLogService {
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

export const promptLogService = new PromptLogService()
