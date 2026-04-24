import { NextResponse } from "next/server";
import { getConfig, resetSchedaNumber, setConfig } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getConfig());
}

export async function POST(request: Request) {
  const body = await request.json();
  const action = String(body.action || "");

  if (action === "resetSchedaNumber") {
    const value = Number(body.value || 1);
    if (!Number.isFinite(value) || value < 1) {
      return new NextResponse("Numero non valido", { status: 400 });
    }
    return NextResponse.json(resetSchedaNumber(Math.floor(value)));
  }

  const currentSchedaNumber = Number(body.currentSchedaNumber);
  if (!Number.isFinite(currentSchedaNumber) || currentSchedaNumber < 1) {
    return new NextResponse("Numero scheda non valido", { status: 400 });
  }

  return NextResponse.json(setConfig({ currentSchedaNumber: Math.floor(currentSchedaNumber) }));
}
