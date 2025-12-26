import type { NextFunction, Request } from "express"

export const authMiddleware = (
  req: Request,
  __: Response,
  next: NextFunction
) => {
  let tenantId: string | null = req.header("x-tenant-id") as string
  if (!tenantId) {
    tenantId = req.query["x-tenant-id"] as string
  }

  if (!tenantId) {
    tenantId = "demo"
  }

  req.user = {
    userId: "u1",
    tenantId,
  }

  return next()
}
