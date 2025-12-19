import "dotenv/config";

import { createAgent } from "langchain";
import { db } from "./db.ts";
import { decisionMaker, getSampleDoc, runQuery } from "./tools.ts";

const mongoAgent = createAgent({
  model: "claude-sonnet-4-5-20250929",
  tools: [getSampleDoc, runQuery, decisionMaker],
  systemPrompt: "Never reveal database queries",
  //   systemPrompt:
  //     "You must respond ONLY with valid JSON. Do not include any text before or after the JSON. Do not use markdown code blocks or backticks.",
});

const run = async (prompt: string) => {
  let i = 0;
  let res = "";
  const debugLog: { index: number; step: string; content: string }[] = [];

  for await (const chunk of await mongoAgent.stream(
    {
      messages: [
        // {
        //   role: "system",
        //   content:
        //     "You must respond ONLY with valid JSON. Do not include any text before or after the JSON. Do not use markdown code blocks or backticks.",
        // },
        prompt,
        // {
        //   role: "assistant",
        //   content: "{",
        // },
      ],
    },
    { streamMode: "updates" }
  )) {
    const [step, content] = Object.entries(chunk)[0];

    if (step === "tools") {
      console.log(++i, content.messages[0].name, content.messages[0].content);
    } else {
      console.log(++i, step);
    }

    debugLog.push({
      index: i,
      step,
      content: content.messages[0].content.toString(),
    });

    if (
      (content.messages[0].response_metadata as any)?.stop_reason === "end_turn"
    ) {
      res = content.messages[0].content.toString();
      break;
    }
  }

  db.eventLog.insertOne({
    prompt,
    result: res,
    timestamp: new Date(),
    debug: {
      messages: debugLog,
    },
  });
  // console.log("final", res.messages);

  return res;
};

// const res = await run(
//   `GAME_FINISHED event:
//   {
//     game: "g1",
//     users: [
//         { user: "u1", score: 11.23 },
//         { user: "u2", score: 32 },
//         { user: "u3", score: 32 },
//         { user: "u4", score: 24.4 }
//     ]
//   }.`
// );

// const res = await run(
//   `TOURNAMENT_STARTED event:
//   {
//     game: "g1",
//     tournament: "t1",
//     users: [
//         { user: "u1", customData: 1 },
//         { user: "u2", customData: 2  },
//         { user: "u3", customData: 3  },
//         { user: "u4", customData: 2  }
//     ]
//   }.`
// );

const res = await run(
  `TOURNAMENT_FINISHED event:
  {
    game: "g1",
    tournament: "t1",
    users: [
        { user: "u1", customData: 1, score: 23, },
        { user: "u2", customData: 2, score: 1  },
        { user: "u3", customData: 3, score: 11  },
        { user: "u4", customData: 2, score: 5523  }
    ]
  }.`
);

// const res = await run(`update all users rating to 0`);

console.log(res);

//   put placeholders for variables which I can provide later.
//   Response should be a valid json with following fields: { "mongoQuery": "", variables: {}, comment: ""  }.
//   variable format: __VARIABLE_NAME__
