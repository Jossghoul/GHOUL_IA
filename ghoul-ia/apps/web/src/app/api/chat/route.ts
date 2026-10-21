import { isMode, respond, route, type MessageParam, type Mode } from "@ghoul/agents";

export const runtime = "nodejs";

interface ChatRequest {
  messages: MessageParam[];
  mode?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatRequest;
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Faltan mensajes." }, { status: 400 });
  }
  const override: Mode | undefined = isMode(body.mode) ? body.mode : undefined;

  try {
    const decision = await route(body.messages, override);
    return new Response(respond(decision.mode, body.messages), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Ghoul-Mode": decision.mode,
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "GHOUL no pudo responder. Revisa la clave de la API." }, { status: 500 });
  }
}
