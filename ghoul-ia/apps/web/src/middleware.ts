import { NextResponse, type NextRequest } from "next/server";

// Protección simple para V1: si GHOUL_PASSWORD está definida, pide usuario y contraseña (cualquier usuario).
export function middleware(req: NextRequest) {
  const password = process.env.GHOUL_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }
  return new NextResponse("Autenticación requerida", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="GHOUL IA"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
