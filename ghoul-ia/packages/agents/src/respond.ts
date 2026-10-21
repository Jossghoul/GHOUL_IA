import type Anthropic from "@anthropic-ai/sdk";
import { getClient, MODEL } from "./client";
import { AGENTS, type Mode } from "./modes";

/**
 * Hace que el agente del modo dado responda y devuelve el texto como stream.
 */
export function respond(
  mode: Mode,
  messages: Anthropic.MessageParam[],
  client: Anthropic = getClient(),
): ReadableStream<Uint8Array> {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    system: AGENTS[mode].system,
    messages,
    output_config: { effort: "medium" },
    // Si el modelo rechaza la petición, la API la reintenta con otro modelo según la categoría.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n_GHOUL no puede ayudar con esta petición._"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n_La respuesta se cortó por longitud._"));
        }
        controller.close();
      } catch (err) {
        console.error(err);
        controller.enqueue(encoder.encode("\n\n_GHOUL no pudo responder. Revisa la clave de la API y vuelve a intentarlo._"));
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });
}
