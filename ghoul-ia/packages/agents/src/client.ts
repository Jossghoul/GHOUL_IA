import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";

let shared: Anthropic | undefined;

// Lee ANTHROPIC_API_KEY del entorno.
export function getClient(): Anthropic {
  shared ??= new Anthropic();
  return shared;
}
