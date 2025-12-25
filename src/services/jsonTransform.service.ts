import { jsonTransformAgent } from "../agent/jsonTransformAgent.ts"
import { transformResultCache } from "../agent/jsonTransformTools.ts"
import { AppError } from "../common/appError.ts"

class JsonTransformService {
  async transformJson(
    jsonInput: any,
    prompt: string,
    cb?: (step: string, content: string) => void
  ) {
    if (!jsonInput) {
      throw new AppError("JSON input is required")
    }

    if (!prompt || typeof prompt !== "string") {
      throw new AppError("Prompt is required and must be a string")
    }

    let transformResult = ""
    const debugLog: { index: number; step: string; content: string }[] = []
    let i = 0

    const referenceId = crypto.randomUUID()

    // Convert JSON input to string if it's an object
    const jsonString =
      typeof jsonInput === "string" ? jsonInput : JSON.stringify(jsonInput)

    // Combine JSON and prompt for the agent
    const fullPrompt = `Input JSON:\n${jsonString}\n\nTransformation Instructions:\n${prompt}`

    for await (const chunk of await jsonTransformAgent.stream(
      {
        messages: [fullPrompt],
      },
      { streamMode: "updates", context: { referenceId } }
    )) {
      const [step, content] = Object.entries(chunk)[0]

      const contentData =
        typeof content.messages[0].content === "object"
          ? JSON.stringify(content.messages[0].content)
          : content.messages[0].content.toString()

      debugLog.push({
        index: ++i,
        step,
        content: contentData,
      })

      cb?.(
        step === "tools" ? `${content.messages[0].name} (tool)` : step,
        contentData
      )

      if (
        (content.messages[0].response_metadata as any)?.stop_reason ===
        "end_turn"
      ) {
        transformResult = content.messages[0].content.toString()
        break
      }
    }

    const transformedJson = transformResultCache.get(referenceId)

    transformResultCache.delete(referenceId)

    return {
      result: transformResult,
      transformedJson,
      debug: debugLog,
    }
  }
}

export const jsonTransformService = new JsonTransformService()
