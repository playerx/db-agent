import type { NextFunction, Request, Response } from "express"
import { verifyAuthToken } from "../../common/verifyAuthToken.ts"

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl

  const url = new URL(fullUrl)

  // // for development, allow to override userId
  // if (!isProd && url.searchParams.get("userId")) {
  //   req.auth = {
  //     userId: url.searchParams.get("userId")!,
  //   }

  //   next()
  //   return
  // }

  let jwtToken: string | null = null

  // 1. try to read from query params
  if (url.searchParams.has("accessToken")) {
    jwtToken = url.searchParams.get("accessToken")
  }

  // 2. try to read from auth header
  if (!jwtToken) {
    const authHeader = req.header("Authorization")
    if (authHeader) {
      jwtToken = authHeader.replace("bearer ", "").replace("Bearer ", "")
    }
  }

  // 3. try to read from cookie
  // if (!jwtToken) {
  //   jwtToken = req.cookies.get('access_token')
  // }

  const result = jwtToken ? verifyAuthToken(jwtToken) : null
  if (!result) {
    res.status(401).json({ error: "Unauthorised" }).end()

    return
  }

  let tenantId: string | null = req.header("x-tenant-id") as string
  if (!tenantId) {
    tenantId = req.query["x-tenant-id"] as string
  }

  if (!tenantId) {
    tenantId = "demo"
  }

  req.user = {
    userId: result.userId,
    tenantId,
  }

  return next()
}
