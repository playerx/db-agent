import "dotenv/config";

import { createAgent } from "langchain";
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

    if (
      (content.messages[0].response_metadata as any)?.stop_reason === "end_turn"
    ) {
      res = content.messages[0].content.toString();
      break;
    }
  }

  // console.log("final", res.messages);

  return res;
};

const res = await run(
  `GAME_FINISHED event:
  {
    game: "g1",
    users: [
        { user: "u1", score: 11.23 },
        { user: "u2", score: 32 },
        { user: "u3", score: 32 },
        { user: "u4", score: 24.4 }
    ]
  }.`
);

// const res = await run(`update all users rating to 0`);

console.log(res);

//   put placeholders for variables which I can provide later.
//   Response should be a valid json with following fields: { "mongoQuery": "", variables: {}, comment: ""  }.
//   variable format: __VARIABLE_NAME__
