import type { ModelMessage } from "ai";
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { setup } from "./config.ts";
import systemPrompt from "./prompt.md" with { type: "text" };

if (import.meta.main) {
  const { tools, persist } = await setup();

  const messages: ModelMessage[] = [];
  while (true) {
    const promptText = prompt(">");
    if (!promptText) {
      continue;
    }

    if (promptText === "exit") {
      break;
    }

    messages.push({
      role: "user",
      content: promptText,
    });

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(100),
    });

    messages.push({
      role: "assistant",
      content: result.text,
    });

    console.dir(result, { depth: null });
    console.log(result.text);

    // Persist stores after each assistant response.
    await persist();
  }
}
