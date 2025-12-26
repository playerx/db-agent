import { Router } from "express"
import { AppError } from "../common/appError.ts"
import { dataService } from "../services/data.service.ts"
import { authMiddleware } from "./middlewares/auth.middleware.ts"

const router = Router().use(authMiddleware as any)

router.get("/databases", async (req, res) => {
  const { tenantId } = req.user

  const databases = await dataService.listDatabases(tenantId)

  res.json({ databases })
})

// List all available collections
router.get("/collections", async (req, res) => {
  const { tenantId } = req.user

  const collectionNames = await dataService.listCollections(tenantId)

  res.json({ collections: collectionNames })
})

router.post("/queries", async (req, res) => {
  const { tenantId } = req.user

  const promptLogId = req.query.promptLogId?.toString()
  const queries = req.body

  if (!promptLogId) {
    throw new AppError("Please provide `promptLogId` query string")
  }

  if (!queries?.length) {
    return
  }

  const result = await dataService.runQueries(tenantId, queries, promptLogId)

  res.json(result)
})

// Get documents from collection with pagination and search
router.get("/:collection/count", async (req, res) => {
  const { tenantId } = req.user
  const { collection } = req.params

  const index = req.originalUrl.indexOf("?")
  const queryParams = index === -1 ? "" : req.originalUrl.slice(index + 1)

  const result = await dataService.getDocumentCount(
    tenantId,
    collection,
    queryParams
  )

  res.json(result)
})

// Get documents from collection with pagination and search
router.get("/:collection", async (req, res) => {
  const { tenantId } = req.user
  const { collection } = req.params

  const index = req.originalUrl.indexOf("?")
  const queryParams = index === -1 ? "" : req.originalUrl.slice(index + 1)

  const result = await dataService.getDocuments(
    tenantId,
    collection,
    queryParams
  )

  res.json(result)
})

// Get document by ID
router.get("/:collection/:id", async (req, res) => {
  const { tenantId } = req.user
  const { collection, id } = req.params
  const document = await dataService.getDocumentById(tenantId, collection, id)
  res.json(document)
})

// Update document by ID
router.put("/:collection/:id", async (req, res) => {
  const { tenantId } = req.user
  const { collection, id } = req.params

  const ejson = req.body

  const result = await dataService.updateDocumentById(
    tenantId,
    collection,
    id,
    ejson
  )
  res.json(result)
})

// Delete document by ID
router.delete("/:collection/:id", async (req, res) => {
  const { tenantId } = req.user
  const { collection, id } = req.params

  const result = await dataService.deleteDocumentById(tenantId, collection, id)

  res.json(result)
})

export default router
