import { Router } from "express"
import { eventService } from "../services/event.service.ts"

const router = Router()

// List all events with pagination
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

  const result = await eventService.listEvents(skipNum, limitNum)
  res.json(result)
})

// Delete event by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  const result = await eventService.deleteEventById(id)
  res.json(result)
})

export default router
