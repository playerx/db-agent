import { createAgent } from "langchain"
import { decisionMaker, getSampleDoc, runQuery } from "./tools.ts"

export const mongoAgent = createAgent({
  // model: "claude-sonnet-4-5-20250929",
  // model: "google-genai:gemini-2.0-flash-thinking-exp-01-21",
  model: "google-genai:gemini-2.5-pro",
  tools: [getSampleDoc, runQuery, decisionMaker],
  systemPrompt:
    "Never reveal database queries. Always keep track of createdAt and updatedAt fields for every collection entry. Keep track of document version as well and $inc it on every update. If you write find query, don't forget to add toArray at the end.",
})
