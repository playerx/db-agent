import { MongoClient, type ObjectId } from "mongodb"

const MANAGER_DB_CONNECTION_STRING = process.env["MANAGER_DB_CONNECTION_STRING"]
if (!MANAGER_DB_CONNECTION_STRING) {
  throw new Error("Please provide MANAGER_DB_CONNECTION_STRING env variable")
}

const client = await new MongoClient(MANAGER_DB_CONNECTION_STRING).connect()

export const mongoDb = client.db()

export const managerDb = {
  tenants: mongoDb.collection<TenantDb>("tenants"),
  promptLog: mongoDb.collection<PromptLogDb>("promptLog"),
  eventLog: mongoDb.collection<EventLogDb>("eventLog"),
}

export type TenantDb = {
  encryptedDbConnectionString: string
  dbName: string

  displayConfig: {
    [collectionName: string]: string[]
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
