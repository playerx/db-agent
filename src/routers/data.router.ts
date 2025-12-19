import { Router } from "express"
import { dataService } from "../services/data.service.ts"

const router = Router()

// List all available collections
router.get("/collections", async (_req, res) => {
  const collectionNames = await dataService.listCollections()
  res.json({ collections: collectionNames })
})

// Get documents from collection with pagination and search
router.get("/:collection", async (req, res) => {
  const { collection } = req.params
  const { skip, limit, ...searchParams } = req.query

  // Parse pagination parameters
  const skipNum = skip ? parseInt(skip as string, 10) : 0
  const limitNum = limit ? parseInt(limit as string, 10) : 10

  // Validate pagination parameters
  if (isNaN(skipNum) || skipNum < 0) {
    return res.status(400).json({ error: "Invalid skip parameter" })
  }
  if (isNaN(limitNum) || limitNum < 0 || limitNum > 100) {
    return res
      .status(400)
      .json({ error: "Invalid limit parameter (must be between 1 and 100)" })
  }

  const result = await dataService.getDocuments(
    collection,
    skipNum,
    limitNum,
    searchParams as Record<string, any>
  )

  res.json(result)
})

// Get document by ID
router.get("/:collection/:id", async (req, res) => {
  const { collection, id } = req.params
  const document = await dataService.getDocumentById(collection, id)
  res.json(document)
})

// Update document by ID
router.put("/:collection/:id", async (req, res) => {
  const { collection, id } = req.params
  const updateData = req.body
  const result = await dataService.updateDocumentById(
    collection,
    id,
    updateData
  )
  res.json(result)
})

// Delete document by ID
router.delete("/:collection/:id", async (req, res) => {
  const { collection, id } = req.params
  const result = await dataService.deleteDocumentById(collection, id)
  res.json(result)
})

// Execute prompt using AI agent
router.post("/prompt", async (req, res) => {
  const { prompt } = req.body
  const result = await dataService.executePrompt(prompt)

  res.json(result)
})

export default router
