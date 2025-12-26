import type { Request } from "express"

export const authMiddleware = (_: Error, req: Request) => {
  const tenantId = (req.headers.tenantId || "demo") as string
  const dbName = (req.headers.dbName || "") as string

  req.user = {
    userId: "u1",
    tenantId,
    dbName,
  }
}
