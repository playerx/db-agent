import { Router } from "express"
import { AppError } from "../common/appError.ts"
import { tenantService } from "../services/tenant.service.ts"
import { authMiddleware } from "./middlewares/auth.middleware.ts"

const router = Router().use(authMiddleware as any)

router.get("/", async (req, res) => {
  const { userId } = req.user
  const tenants = await tenantService.list(userId)

  const safeTenants = tenants.map((tenant) => ({
    id: tenant._id.toHexString(),
    dbName: tenant.dbName,
    hostname: tenant.hostname,
    displayConfig: tenant.displayConfig,
  }))

  res.json({ tenants: safeTenants })
})

router.post("/", async (req, res) => {
  const { userId } = req.user
  const { dbConnectionString, dbName, displayConfig } = req.body

  if (!dbConnectionString) {
    throw new AppError("Please provide dbConnectionString")
  }

  if (!dbName) {
    throw new AppError("Please provide dbName")
  }

  if (!displayConfig || typeof displayConfig !== "object") {
    throw new AppError(
      "Please provide displayConfig as an object with collection names as keys and field arrays as values"
    )
  }

  const tenant = await tenantService.create({
    userId,
    dbConnectionString,
    dbName,
    displayConfig,
  })

  res.json({
    tenant: {
      id: tenant._id.toHexString(),
      dbName: tenant.dbName,
      hostname: tenant.hostname,
      displayConfig: tenant.displayConfig,
    },
  })
})

router.delete("/:id", async (req, res) => {
  const { userId } = req.user
  const { id } = req.params

  if (!id) {
    throw new AppError("Please provide tenant id")
  }

  const deleted = await tenantService.delete(id, userId)

  if (!deleted) {
    throw new AppError(
      "Tenant not found or you don't have permission to delete it"
    )
  }

  res.json({ success: true })
})

export default router
