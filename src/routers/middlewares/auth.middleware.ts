import type { NextFunction, Request } from "express"

export const authMiddleware = (
  req: Request,
  __: Response,
  next: NextFunction
) => {
  const tenantId = (req.header("tenantId") || "demo") as string

  req.user = {
    userId: "u1",
    tenantId,
  }

  console.log(req.user)

  return next()
}
