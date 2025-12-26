import cors from "cors"
import "dotenv/config"
import express from "express"
import dataRouter from "./routers/data.router.ts"
import jsonTransformRouter from "./routers/jsonTransform.router.ts"
import { errorHandler } from "./routers/middlewares/errorHandler.middleware.ts"
import promptRouter from "./routers/prompt.router.ts"
import publicRouter from "./routers/public.router.ts"

const { AI_MODEL, PORT = 3000 } = process.env

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/", publicRouter)
app.use("/data", dataRouter)
app.use("/prompt", promptRouter)
app.use("/transform", jsonTransformRouter)

// Error handler (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} | AI Model: ${AI_MODEL}`)
})
