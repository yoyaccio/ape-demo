import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Autenticazione richiesta", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="APE Demo"',
    },
  });
}

export function middleware(request: NextRequest) {
  const enabled = process.env.DEMO_BASIC_AUTH_ENABLED !== "false";
  if (!enabled) return NextResponse.next();

  const user = process.env.DEMO_USER || "demo";
  const pass = process.env.DEMO_PASS || "demoape";

  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) return unauthorized();

  const decoded = atob(header.replace("Basic ", ""));
  const [u, p] = decoded.split(":");

  if (u !== user || p !== pass) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
