import { NextResponse } from "next/server";

const WFS_BASE = "https://mappe.comune.genova.it/geoserver/ows";
const TYPE_NAME = "SITGEO:V_URB_ZONE_OMI_CIVICI";

function escapeCql(s: string) {
  return s.replace(/'/g, "''");
}

function parseQuery(q: string) {
  const cleaned = q.trim().replace(/\s+/g, " ");
  // Ultimo token tipo: 5, 5r, 5a, 12/1 non gestito per ora.
  const m = cleaned.match(/^(.*?)(?:\s+(\d+[a-zA-Z]?r?))?$/);
  const via = (m?.[1] || cleaned).trim();
  const civico = (m?.[2] || "").trim().toLowerCase();
  return { via, civico };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 3) return NextResponse.json([]);

  const { via, civico } = parseQuery(q);

  const parts = [`INDIRIZZO ILIKE '%${escapeCql(via)}%'`];
  if (civico) parts.push(`NCIVICO ILIKE '${escapeCql(civico)}%'`);

  const cql = parts.join(" AND ");

  const url =
    `${WFS_BASE}?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=${encodeURIComponent(TYPE_NAME)}` +
    `&outputFormat=application/json` +
    `&count=50` +
    `&cql_filter=${encodeURIComponent(cql)}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const txt = await res.text();
    return new NextResponse(`WFS error ${res.status}: ${txt}`, { status: 502 });
  }

  const json = await res.json();
  const seen = new Set<string>();

  const out = (json?.features || [])
    .map((f: any) => {
      const p = f.properties || {};
      return {
        id: String(p.ID ?? `${p.INDIRIZZO}-${p.NCIVICO}`),
        indirizzo: String(p.INDIRIZZO || ""),
        civico: String(p.NCIVICO || ""),
        zona_omi: String(p.ZONA_OMI || ""),
        municipio: String(p.MUNICIPIO || ""),
        label: `${p.INDIRIZZO || ""} ${p.NCIVICO || ""} — zona ${p.ZONA_OMI || ""}`,
      };
    })
    .filter((x: any) => {
      const key = `${x.indirizzo}|${x.civico}`;
      if (!x.indirizzo || !x.civico || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);

  return NextResponse.json(out);
}
