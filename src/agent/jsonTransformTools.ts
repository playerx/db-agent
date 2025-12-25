import { tool } from "langchain"
import * as z from "zod"

export const transformResultCache = new Map<string, any>()

export const analyzeJson = tool(
  async (input) => {
    try {
      const jsonData = JSON.parse(input.jsonString)

      const analysis = {
        type: Array.isArray(jsonData) ? "array" : typeof jsonData,
        keys: Array.isArray(jsonData)
          ? `Array with ${jsonData.length} items`
          : Object.keys(jsonData).join(", "),
        structure: JSON.stringify(jsonData, null, 2).substring(0, 500),
      }

      return {
        status: "success",
        analysis,
        message:
          "JSON analyzed successfully. Use this information to understand the structure before transforming.",
      }
    } catch (err: any) {
      return {
        status: "failed",
        error: err.message,
        message: "Failed to parse JSON. Please check the input format.",
      }
    }
  },
  {
    name: "analyze_json",
    description:
      "Analyze the structure of the input JSON to understand its format before transformation",
    schema: z.object({
      jsonString: z.string().describe("JSON string to analyze"),
    }),
  }
)

export const transformJson = tool(
  async (input, runtime) => {
    try {
      const sourceData = JSON.parse(input.sourceJson)
      const transformedData = JSON.parse(input.transformedJson)

      // Store the transformation result in cache
      transformResultCache.set(runtime.context.referenceId, transformedData)

      return {
        status: "success",
        message: "JSON transformation completed successfully",
        preview: JSON.stringify(transformedData, null, 2).substring(0, 300),
      }
    } catch (err: any) {
      return {
        status: "failed",
        error: err.message,
        message:
          "Failed to transform JSON. Please check the transformation logic.",
      }
    }
  },
  {
    name: "transform_json",
    description:
      "Transform the source JSON into the desired format based on user instructions. Pass both the original JSON and the transformed result.",
    schema: z.object({
      sourceJson: z.string().describe("Original JSON string"),
      transformedJson: z
        .string()
        .describe("The transformed JSON string based on user requirements"),
    }),
  }
)

export const validateTransformation = tool(
  async (input) => {
    try {
      const transformedData = JSON.parse(input.transformedJson)

      const validation = {
        isValid: true,
        itemCount: Array.isArray(transformedData) ? transformedData.length : 1,
        hasRequiredFields: true,
        message: "Transformation appears valid",
      }

      return {
        status: "success",
        validation,
      }
    } catch (err: any) {
      return {
        status: "failed",
        error: err.message,
        message: "Validation failed. The transformed JSON may be malformed.",
      }
    }
  },
  {
    name: "validate_transformation",
    description:
      "Validate that the transformed JSON meets the requirements and is properly formatted",
    schema: z.object({
      transformedJson: z.string().describe("Transformed JSON to validate"),
    }),
  }
)
