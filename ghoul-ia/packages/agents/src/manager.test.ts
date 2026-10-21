import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { route } from "./manager";
import { AGENTS, MODES, isMode } from "./modes";

function fakeClient(response: unknown) {
  const parse = vi.fn().mockResolvedValue(response);
  return { client: { messages: { parse } } as unknown as Anthropic, parse };
}

const messages: Anthropic.MessageParam[] = [
  { role: "user", content: "TypeError: cannot read properties of undefined" },
];

describe("route", () => {
  it("respeta el modo elegido por el usuario sin llamar al modelo", async () => {
    const { client, parse } = fakeClient(null);
    const decision = await route(messages, "explicar", client);
    expect(decision.mode).toBe("explicar");
    expect(parse).not.toHaveBeenCalled();
  });

  it("usa el modo que decide el Manager", async () => {
    const { client, parse } = fakeClient({
      stop_reason: "end_turn",
      parsed_output: { mode: "corregir", reason: "Pegó un error." },
    });
    const decision = await route(messages, undefined, client);
    expect(decision).toEqual({ mode: "corregir", reason: "Pegó un error." });
    expect(parse).toHaveBeenCalledOnce();
  });

  it("vuelve a conversar si el modelo rechaza", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", parsed_output: null });
    const decision = await route(messages, undefined, client);
    expect(decision.mode).toBe("conversar");
  });
});

describe("modes", () => {
  it("cada modo tiene un agente", () => {
    for (const mode of MODES) expect(AGENTS[mode].mode).toBe(mode);
  });

  it("valida modos", () => {
    expect(isMode("generar")).toBe(true);
    expect(isMode("borrar")).toBe(false);
    expect(isMode(undefined)).toBe(false);
  });
});
