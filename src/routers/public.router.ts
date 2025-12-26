import { Router } from "express"

export const router = Router()

router.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8").end("✅")
})

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

export default router
