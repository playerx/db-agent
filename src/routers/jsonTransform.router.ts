import { Router } from "express"
import { jsonTransformService } from "../services/jsonTransform.service.ts"

const router = Router()

// Transform JSON using AI agent
router.post("/", async (req, res) => {
  const { json, prompt } = req.body

  // Set up Server-Sent Events (SSE) for streaming
  // res.setHeader("Content-Type", "text/event-stream")
  // res.setHeader("Cache-Control", "no-cache")
  // res.setHeader("Connection", "keep-alive")

  // try {

  const result = await jsonTransformService.transformJson(
    json,
    prompt,
    (step, content) => {
      console.log(step, content)
      // // Stream each update to the client
      // res.write(`event: update\n`)
      // res.write(`data: ${JSON.stringify({ step, content })}\n\n`)
    }
  )

  res.json({
    result: result.result,
    data: result.transformedJson,
    debug: result.debug,
  })

  // // Send final result
  // res.write(`event: complete\n`)
  // res.write(
  //   `data: ${JSON.stringify({
  //     result: result.result,
  //     x: result.transformedJson,
  //   })}\n\n`
  // )
  // res.end()

  // } catch (error: any) {
  //   res.write(`event: error\n`)
  //   res.write(
  //     `data: ${JSON.stringify({
  //       error: error instanceof Error ? error.message : "Unknown error",
  //     })}\n\n`
  //   )
  //   res.end()
  // }
})

export default router
