import { ObjectId } from "mongodb"
import { AppError } from "../common/appError.ts"
import { db } from "../db.ts"

class EventService {
  async listEvents(skip: number = 0, limit: number = 10, showDebug = false) {
    const events = await db.eventLog
      .find({}, { projection: showDebug ? undefined : { debug: 0 } })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await db.eventLog.countDocuments()

    return {
      events,
      pagination: {
        skip,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    }
  }

  async deleteEventById(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new AppError("Invalid event ID format")
    }

    const result = await db.eventLog.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      throw new AppError("Event not found")
    }

    return { success: true, message: "Event deleted successfully" }
  }
}

export const eventService = new EventService()
