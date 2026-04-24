import { NextResponse } from "next/server";
import { getTariffeDb, upsertZonaTariffe } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getTariffeDb());
}

export async function POST(request: Request) {
  const body = await request.json();
  const zona = String(body.zona || "").trim().toUpperCase();

  if (!zona) return new NextResponse("Zona mancante", { status: 400 });

  const vals = [
    body.s1min, body.s1max, body.s2min, body.s2max, body.s3min, body.s3max
  ].map((x: any) => Number(x));

  if (vals.some((x) => !Number.isFinite(x))) {
    return new NextResponse("Valori non validi", { status: 400 });
  }

  const saved = upsertZonaTariffe(
    zona,
    vals[0], vals[1],
    vals[2], vals[3],
    vals[4], vals[5]
  );

  return NextResponse.json(saved);
}
