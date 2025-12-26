import { MongoClient, type ObjectId } from "mongodb"

const MONGO_CONNECTION_STRING = process.env["MONGO_CONNECTION_STRING"]
if (!MONGO_CONNECTION_STRING) {
  throw new Error("Please provide MONGO_CONNECTION_STRING env variable")
}

const client = await new MongoClient(MONGO_CONNECTION_STRING).connect()

export const mongoDb = client.db()

export const managerDb = {
  tenants: mongoDb.collection<TenantDb>("tenants"),
  promptLog: mongoDb.collection<PromptLogDb>("promptLog"),
  eventLog: mongoDb.collection<EventLogDb>("eventLog"),
}

export type TenantDb = {
  encryptedDbConnectionString: string

  displayConfig: {
    [collectionName: string]: (
      | {
          type: "field"
          field: string
        }
      | { type: "pattern"; pattern: string }
    )[]
  }
}

export type PromptLogDb = {
  tenantId: string

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

  lastUsedAt: Date
  timestamp: Date
}

export type EventLogDb = {
  tenantId: string
  timestamp: Date
} & (
  | {
      type: "QUERY"
      queries: string[]
      results: string[]
      promptLogId: string
    }
  | {
      type: "DELETE"
      collection: string
      id: string | ObjectId
      result: any
    }
  | {
      type: "UPDATE"
      collection: string
      id: string | ObjectId
      data: any
      result: any
    }
)
