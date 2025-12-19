import "dotenv/config"
import express from "express"
import dataRouter from "./routers/data.router.ts"
import { errorHandler } from "./routers/middlewares/errorHandler.middleware.ts"

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Routes
app.use("/data", dataRouter)

// Error handler (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
