import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getClient, MODEL } from "./client";
import { AGENTS, MODES, type Mode } from "./modes";

const Decision = z.object({
  mode: z.enum(MODES),
  reason: z.string(),
});

export type ManagerDecision = z.infer<typeof Decision>;

const SYSTEM = `Eres GHOUL Manager. Lee el último mensaje del usuario (con el contexto de la conversación) y decide qué agente debe responder.
Agentes:
${MODES.map((m) => `- ${m}: ${AGENTS[m].description}`).join("\n")}
Reglas: si el usuario pega un error o dice que algo no funciona, elige "corregir". Si pega código y pregunta qué hace, "explicar".
Si pide crear o escribir código, "generar". Para todo lo demás, "conversar".
"reason" es una frase corta en español.`;

/**
 * Decide qué agente responde. Si el usuario eligió un modo a mano, se respeta sin llamar al modelo.
 */
export async function route(
  messages: Anthropic.MessageParam[],
  override?: Mode,
  client: Anthropic = getClient(),
): Promise<ManagerDecision> {
  if (override) return { mode: override, reason: "Elegido por el usuario." };

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages,
    output_config: { effort: "low", format: zodOutputFormat(Decision) },
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return { mode: "conversar", reason: "No se pudo clasificar; se usa conversación." };
  }
  return response.parsed_output;
}
