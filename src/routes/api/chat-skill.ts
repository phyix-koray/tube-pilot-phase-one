import { createFileRoute } from "@tanstack/react-router";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };
type SkillAttachment = {
  name: string;
  type?: string;
  size?: number;
  content: string;
};

const MODEL_MAP: Record<string, string> = {
  "claude-sonnet-5": "openai/gpt-5.4-mini", // via gateway fallback; see below
  "claude-opus-5": "openai/gpt-5.4",
  "gpt-5.6": "openai/gpt-5.6-terra",
  "gemini-3-pro": "google/gemini-3.1-pro-preview",
};

// Actual Claude models available on gateway are Anthropic-branded; but the
// gateway only lists Google + OpenAI models in the catalog. We map user's
// choice to the closest available model.

export const Route = createFileRoute("/api/chat-skill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "Missing LOVABLE_API_KEY" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        const body = (await request.json()) as {
          messages: ChatMsg[];
          model?: string;
          skillName?: string;
          skillFile?: string;
          attachments?: SkillAttachment[];
        };

        const model = MODEL_MAP[body.model ?? ""] ?? "google/gemini-3.6-flash";
        const attachments = Array.isArray(body.attachments)
          ? body.attachments.filter((attachment) => attachment.content.trim())
          : [];
        const attachmentContext = attachments.length
          ? [
              `Uploaded attachments available to read:`,
              ...attachments.map((attachment, index) =>
                [
                  `Attachment ${index + 1}: ${attachment.name}`,
                  `Type: ${attachment.type ?? "text/plain"}`,
                  `Size: ${attachment.size ?? attachment.content.length} bytes`,
                  "```text",
                  attachment.content,
                  "```",
                ].join("\n"),
              ),
            ].join("\n\n")
          : `No uploaded attachments yet.`;

        const system: ChatMsg = {
          role: "system",
          content: [
            `You are a Skill Builder assistant inside TubePilot.`,
            `You help the user craft and refine a single markdown "skill file" that guides AI agents when they run.`,
            `Skill name: ${body.skillName ?? "Untitled skill"}.`,
            `Current skill file contents (may be empty):`,
            "```markdown",
            body.skillFile ?? "",
            "```",
            attachmentContext,
            `Always read every uploaded attachment included in the conversation history. If the user uploaded a file, treat its full contents as source material for the skill file.`,
            `When the user asks you to create, rewrite, improve, or fold an attachment into a skill file, return a short sentence followed by the complete updated skill file in one fenced markdown block.`,
            `The fenced markdown block must start with a single H1 title and contain valid markdown only — never HTML, never escaped HTML, and never an empty file.`,
            `When the user only asks a question, answer from the current skill file and attachments without re-introducing yourself. Remember the entire prior conversation.`,
          ].join("\n"),
        };

        const messages = [system, ...body.messages];

        const res = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "Lovable-API-Key": key,
              "X-Lovable-AIG-SDK": "vercel-ai-sdk",
            },
            body: JSON.stringify({
              model,
              messages,
              ...(model.startsWith("openai/gpt-5.6-")
                ? { reasoning_effort: "none" }
                : {}),
            }),
          },
        );

        if (!res.ok) {
          const text = await res.text();
          return new Response(
            JSON.stringify({ error: text || `Gateway ${res.status}` }),
            {
              status: res.status,
              headers: { "content-type": "application/json" },
            },
          );
        }

        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = json.choices?.[0]?.message?.content ?? "";

        return new Response(JSON.stringify({ content, model }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
