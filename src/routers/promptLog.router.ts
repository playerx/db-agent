import { Router } from "express"
import { promptService } from "../services/prompt.service.ts"

const router = Router()

// Execute prompt using AI agent
router.get("/", async (req, res) => {
  const { prompt } = req.query

  // Set up Server-Sent Events (SSE) for streaming
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  try {
    const result = await promptService.executePrompt(
      prompt!.toString(),
      (step, content) => {
        // Stream each update to the client
        res.write(`event: update\n`)
        res.write(`data: ${JSON.stringify({ step, content })}\n\n`)
      }
    )

    // Send final result
    res.write(`event: complete\n`)
    res.write(
      `data: ${JSON.stringify({
        id: result.id,
        result: result.promptResult,
        queries: result.queries,
      })}\n\n`
    )
    res.end()
  } catch (error) {
    res.write(`event: error\n`)
    res.write(
      `data: ${JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      })}\n\n`
    )
    res.end()
  }
})

// List all prompt logs with pagination
router.get("/log/", async (req, res) => {
  const { skip, limit } = req.query

  // Parse pagination parameters
  const skipNum = skip ? parseInt(skip as string, 10) : 0
  const limitNum = limit ? parseInt(limit as string, 10) : 10

  // Validate pagination parameters
  if (isNaN(skipNum) || skipNum < 0) {
    return res.status(400).json({ error: "Invalid skip parameter" })
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res
      .status(400)
      .json({ error: "Invalid limit parameter (must be between 1 and 100)" })
  }

  const result = await promptService.listPromptLogs(skipNum, limitNum)

  res.json(result)
})

// Get prompt log by ID
router.get("/log/:id", async (req, res) => {
  const { id } = req.params
  const { debug } = req.query
  const showDebug = debug != undefined

  const log = await promptService.getPromptLogById(id, showDebug)
  res.json(log)
})

// Delete prompt log by ID
router.delete("/log/:id", async (req, res) => {
  const { id } = req.params
  const result = await promptService.deletePromptLogById(id)
  res.json(result)
})

export default router
