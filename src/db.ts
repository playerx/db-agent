import { MongoClient, type ObjectId } from "mongodb"

const MONGO_CONNECTION_STRING = process.env["MONGO_CONNECTION_STRING"]
if (!MONGO_CONNECTION_STRING) {
  throw new Error("Please provide MONGO_CONNECTION_STRING env variable")
}

const client = await new MongoClient(MONGO_CONNECTION_STRING).connect()

export const mongoDb = client.db()

export const db = {
  promptLog: mongoDb.collection<PromptLogDb>("ai.promptLog"),
  eventLog: mongoDb.collection<EventLogDb>("ai.eventLog"),
}

export type PromptLogDb = {
  prompt: string
  result: string
  queries: string[]

  debug?: {
    messages: {
      index: number
      step: string
      content: string
    }[]
  }

  timestamp: Date
}

export type EventLogDb =
  | {
      type: "QUERY"
      queries: string[]
      results: string[]
      timestamp: Date
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
