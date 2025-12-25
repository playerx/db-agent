import { Router } from "express"
import { promptLogService } from "../services/promptLog.service.ts"

const router = Router()

// List all prompt logs with pagination
router.get("/", async (req, res) => {
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

  const result = await promptLogService.listPromptLogs(skipNum, limitNum)

  res.json(result)
})

// Get prompt log by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params
  const { debug } = req.query
  const showDebug = debug != undefined

  const log = await promptLogService.getPromptLogById(id, showDebug)
  res.json(log)
})

// Delete prompt log by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  const result = await promptLogService.deletePromptLogById(id)
  res.json(result)
})

export default router
