import { Router } from "express"
import { dataService } from "../services/data.service.ts"

const router = Router()

// List all available collections
router.get("/collections", async (_req, res) => {
  const collectionNames = await dataService.listCollections()
  res.json({ collections: collectionNames })
})

router.post("/queries", async (req, res) => {
  const queries = req.body

  if (!queries?.length) {
    return
  }

  const result = await dataService.runQueries(queries)

  res.json(result)
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

  const ejson = req.body

  const result = await dataService.updateDocumentById(collection, id, ejson)
  res.json(result)
})

// Delete document by ID
router.delete("/:collection/:id", async (req, res) => {
  const { collection, id } = req.params
  const result = await dataService.deleteDocumentById(collection, id)
  res.json(result)
})

export default router
