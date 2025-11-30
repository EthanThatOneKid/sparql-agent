import type { ModelMessage } from "ai";
import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { formatSparqlPrompt } from "./src/tools/sparql-tools.ts";
import systemPrompt from "./prompt.md" with { type: "text" };
import { setup } from "./config.ts";

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
      content: formatSparqlPrompt(promptText, {
        userIri: "https://id.etok.me/",
        assistantIri: "https://id.etok.me/assistant",
        formatDate: () => new Date().toISOString(),
      }),
    });

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(100),
    });

    messages.push({ role: "assistant", content: result.text });

    // Log tool call traces.
    result.steps.forEach((step) => {
      step.toolResults.forEach((toolResult) => {
        console.log(`🛠️ ${toolResult.toolName}`, {
          input: toolResult.input,
          output: toolResult.output,
        });
      });
    });

    // Log the final response.
    console.log(result.text);

    // Persist the knowledge base.
    await persist().catch((error) => {
      console.error(
        "Continuing without persisting the knowledge base:",
        error,
      );
    });
  }
}
