import { createAgent } from "langchain"
import { decisionMaker, getSampleDoc, runQuery } from "./tools.ts"

export const mongoAgent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: [getSampleDoc, runQuery, decisionMaker],
  systemPrompt: "Never reveal database queries",
})
