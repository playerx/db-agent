import cors from "cors"
import "dotenv/config"
import express from "express"
import dataRouter from "./routers/data.router.ts"
import eventRouter from "./routers/event.router.ts"
import jsonTransformRouter from "./routers/jsonTransform.router.ts"
import { errorHandler } from "./routers/middlewares/errorHandler.middleware.ts"
import promptRouter from "./routers/promptLog.router.ts"

const { AI_MODEL, PORT = 3000 } = process.env

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/data", dataRouter)
app.use("/events", eventRouter)
app.use("/prompt", promptRouter)
app.use("/transform", jsonTransformRouter)

// Error handler (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} | AI Model: ${AI_MODEL}`)
})
