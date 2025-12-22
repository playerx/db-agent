import { createAgent } from "langchain"
import { decisionMaker, getSampleDoc, runQuery } from "./tools.ts"

export const mongoAgent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: [getSampleDoc, runQuery, decisionMaker],
  systemPrompt:
    "Never reveal database queries. Always keep track of createdAt and updatedAt fields for every collection entry. Keep track of document version as well and $inc it on every update.",
})
