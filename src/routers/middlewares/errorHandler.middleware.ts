import type { NextFunction, Request, Response } from "express"
import { AppError } from "../../common/appError.ts"

/**
 * Custom error class for application errors
 * When thrown, results in a 400 Bad Request response
 */

/**
 * Global error handler middleware
 * - Returns 400 for AppError instances
 * - Returns 500 for all other errors
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error:", err)

  if (err instanceof AppError) {
    return res.status(400).json({
      error: err.message,
    })
  }

  // Default to 500 for all other errors
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  })
}
