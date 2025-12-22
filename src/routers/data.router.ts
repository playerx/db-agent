import { Router } from "express"
import { dataService } from "../services/data.service.ts"

const router = Router()

// List all available collections
router.get("/collections", async (_req, res) => {
  const collectionNames = await dataService.listCollections()
  res.json({ collections: collectionNames })
})

// Execute prompt using AI agent
router.get("/prompt", async (req, res) => {
  const { prompt } = req.query

  // Set up Server-Sent Events (SSE) for streaming
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  try {
    const result = await dataService.executePrompt(
      prompt!.toString(),
      (step, content) => {
        // Stream each update to the client
        res.write(`event: update\n`)
        res.write(`data: ${JSON.stringify({ step, content })}\n\n`)
      }
    )

    // Send final result
    res.write(`event: complete\n`)
    res.write(`data: ${JSON.stringify(result)}\n\n`)
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

// Get documents from collection with pagination and search
router.get("/:collection/count", async (req, res) => {
  const { collection } = req.params

  const index = req.originalUrl.indexOf("?")
  const queryParams = index === -1 ? "" : req.originalUrl.slice(index + 1)

  const result = await dataService.getDocumentCount(collection, queryParams)

  res.json(result)
})

// Get documents from collection with pagination and search
router.get("/:collection", async (req, res) => {
  const { collection } = req.params

  const index = req.originalUrl.indexOf("?")
  const queryParams = index === -1 ? "" : req.originalUrl.slice(index + 1)

  const result = await dataService.getDocuments(collection, queryParams)

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

export default router
