import { Router } from "express"
import { AppError } from "../common/appError.ts"
import { tenantService } from "../services/tenant.service.ts"

const router = Router()

router.get("/", async (req, res) => {
  const tenants = await tenantService.list()

  const safeTenants = tenants.map((tenant) => ({
    id: tenant._id.toHexString(),
    dbName: tenant.dbName,
    displayConfig: tenant.displayConfig,
  }))

  res.json({ tenants: safeTenants })
})

router.post("/", async (req, res) => {
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
    dbConnectionString,
    dbName,
    displayConfig,
  })

  res.json({
    tenant: {
      id: tenant._id.toHexString(),
      dbName: tenant.dbName,
      displayConfig: tenant.displayConfig,
    },
  })
})

export default router
