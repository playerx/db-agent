import { MongoClient, ObjectId } from "mongodb"

const MONGO_CONNECTION_STRING = process.env["MONGO_CONNECTION_STRING"]
if (!MONGO_CONNECTION_STRING) {
  throw new Error("Please provide MONGO_CONNECTION_STRING env variable")
}

const client = await new MongoClient(MONGO_CONNECTION_STRING).connect()

export const mongoDb = client.db()

export const db = {
  eventLog: client
    .db(mongoDb.databaseName + "_manager")
    .collection<EventLogDb>("eventLog"),
}

export type EventLogDb =
  | {
      type: "PROMPT"
      prompt: string
      result: string[]
      timestamp: Date
      debug?: {
        messages: {
          index: number
          step: string
          content: string
        }[]
      }
    }
  | {
      type: "DELETE"
      collection: string
      id: string | ObjectId
      result: any
      timestamp: Date
    }
  | {
      type: "UPDATE"
      collection: string
      id: string | ObjectId
      data: any
      result: any
      timestamp: Date
    }
