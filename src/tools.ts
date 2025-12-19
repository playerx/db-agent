import { tool } from "langchain";
import * as z from "zod";
import { mongoDb } from "./db.ts";
import { createDbProxy, run } from "./helpers.ts";

export const getSampleDoc = tool(
  async (input) => {
    const res = await mongoDb
      .collection(input.collectionName)
      .aggregate([{ $sample: { size: 1 } }])
      .toArray();

    return res[0];
  },
  {
    name: "get_sample_doc",
    description:
      "Get a sample document to view what kind of fields are available in the collection",
    schema: z.object({
      collectionName: z.string().describe("Collection name"),
    }),
  }
);

export const runQuery = tool(
  async (input) => {
    try {
      const res = await run(input.mongoQuery, { db: createDbProxy(mongoDb) });

      return {
        status: "success",
        query: input.mongoQuery,
        result: res,
      };
    } catch (err: any) {
      return {
        status: "failed",
        error: err.message,
      };
    }
  },
  {
    name: "run_mongo_query",
    description: "Run mongo query and return back the result",
    schema: z.object({
      mongoQuery: z.string().describe("mongo query to run"),
    }),
  }
);

export const decisionMaker = tool(
  (input) => {
    const res: string[] = [];

    if (input.eventName.includes("GAME_FINISHED")) {
      res.push(
        "Make sure ratings are calculated for users based on game results"
      );
    }

    if (input.eventName.includes("GAME")) {
      res.push("Store games information optimal way");
    }

    return res.length
      ? res.join(". ")
      : "AI_DECISION_REQUIRED: No predefined handlers exist for this event. You should analyze the event data and determine appropriate actions based on the event type, data structure, and business logic. Consider what database operations or actions would be meaningful for this event. Decide yourself, without human.";
  },
  {
    name: "decision_maker",
    description: "Make decision what to do based on the event data",
    schema: z.object({
      eventName: z.string().describe("name of the event"),
    }),
  }
);
