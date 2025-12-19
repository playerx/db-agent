import { Router } from "express"
import { dataService } from "../services/data.service.ts"

const router = Router()

// List all available collections
router.get("/collections", async (_req, res) => {
  const collectionNames = await dataService.listCollections()
  res.json({ collections: collectionNames })
})

// Get document by ID
router.get("/:collection", async (req, res) => {
  const { collection } = req.params

  // TODO

  res.json()
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
router.post("/execute-prompt", async (req, res) => {
  const { prompt } = req.body
  const result = await dataService.executePrompt(prompt)

  res.json(result)
})

export default router
