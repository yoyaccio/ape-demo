import { NextResponse } from "next/server";

const WFS_BASE = "https://mappe.comune.genova.it/geoserver/ows";
const TYPE_NAME = "SITGEO:V_URB_ZONE_OMI_CIVICI";

function escapeCql(s: string) {
  return s.replace(/'/g, "''");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const via = (searchParams.get("via") || "").trim();
    const civico = (searchParams.get("civico") || "").trim();

    if (!via || !civico) {
      return new NextResponse("Missing via or civico", { status: 400 });
    }

    const cql =
      `INDIRIZZO ILIKE '%${escapeCql(via)}%' AND ` +
      `NCIVICO ILIKE '${escapeCql(civico)}'`;

    const url =
      `${WFS_BASE}?service=WFS&version=2.0.0&request=GetFeature` +
      `&typeNames=${encodeURIComponent(TYPE_NAME)}` +
      `&outputFormat=application/json` +
      `&count=1` +
      `&cql_filter=${encodeURIComponent(cql)}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text();
      return new NextResponse(`WFS error ${res.status}: ${txt}`, { status: 502 });
    }

    const json = await res.json();
    const f = json?.features?.[0];
    if (!f) return NextResponse.json({ found: false });

    return NextResponse.json({
      found: true,
      zona_omi: f.properties?.ZONA_OMI,
      municipio: f.properties?.MUNICIPIO,
      indirizzo: f.properties?.INDIRIZZO,
      civico: f.properties?.NCIVICO,
    });
  } catch (e: any) {
    return new NextResponse(e.message || "Errore lookup zona", { status: 502 });
  }
}
