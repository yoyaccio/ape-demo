import { NextResponse } from "next/server";
import { countFeatures, computeSubband, superficieConvenzionale, superficieNote, round2, computeMaggiorazioni } from "@/lib/simulation";
import { consumeSchedaNumber, getTariffa, savePractice } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();

  const locatore = String(body.locatore || "").trim();
  const via = String(body.street_query || "").trim().toUpperCase();
  const civico = String(body.ncivico || "").trim();
  const mqReali = Number(body.surface_mq || 0);

  if (!via || !civico) {
    return new NextResponse("Missing via/civico", { status: 400 });
  }

  const nFeat = countFeatures(body.features || {});
  const subband = computeSubband(nFeat);

  const baseUrl = new URL(request.url);
  const zoneUrl = `${baseUrl.origin}/api/zone?via=${encodeURIComponent(via)}&civico=${encodeURIComponent(civico)}`;

  const zoneRes = await fetch(zoneUrl, { cache: "no-store" });
  if (!zoneRes.ok) {
    const txt = await zoneRes.text();
    return new NextResponse(`Errore lookup zona: ${txt}`, { status: 502 });
  }

  const zoneJson = await zoneRes.json();
  if (!zoneJson?.found) {
    return new NextResponse(`Zona non trovata per ${via} ${civico}`, { status: 404 });
  }

  const tariffa = getTariffa(zoneJson.zona_omi, subband);
  if (!tariffa) {
    return new NextResponse(`Tariffe non configurate per zona ${zoneJson.zona_omi} (sottofascia ${subband})`, { status: 500 });
  }

  const mqCalcolo = round2(superficieConvenzionale(mqReali));
  const baseAnnuoMin = round2(mqCalcolo * tariffa.min);
  const baseAnnuoMax = round2(mqCalcolo * tariffa.max);

  const magg = computeMaggiorazioni(body.maggiorazioni || {});
  const multiplier = 1 + magg.totalPct / 100;

  const annuoMin = round2(baseAnnuoMin * multiplier);
  const annuoMax = round2(baseAnnuoMax * multiplier);
  const mensileMin = round2(annuoMin / 12);
  const mensileMax = round2(annuoMax / 12);

  const scheda_number = consumeSchedaNumber();

  savePractice({
    via: zoneJson.indirizzo,
    civico: zoneJson.civico,
    zona: zoneJson.zona_omi,
    sottofascia: subband,
    mq: mqCalcolo,
    canone_min: annuoMin,
    canone_max: annuoMax,
  } as any);

  return NextResponse.json({
    scheda_number,
    locatore,
    indirizzo: zoneJson.indirizzo,
    civico: zoneJson.civico,
    municipio: zoneJson.municipio,
    zone_code: zoneJson.zona_omi,
    subband,
    features_count: nFeat,
    eur_mq_min: tariffa.min,
    eur_mq_max: tariffa.max,
    mq_reali: mqReali,
    mq_calcolo: mqCalcolo,
    surface_note: superficieNote(mqReali),
    base_annual_min: baseAnnuoMin,
    base_annual_max: baseAnnuoMax,
    adjustment_percent: magg.totalPct,
    adjustments: magg.rows,
    rent_min: annuoMin,
    rent_max: annuoMax,
    rent_annual_min: annuoMin,
    rent_annual_max: annuoMax,
    rent_monthly_min: mensileMin,
    rent_monthly_max: mensileMax,
    explanation: [
      `Valori tabella: €/mq annui`,
      `Zona OMI: ${zoneJson.zona_omi}`,
      `Indirizzo trovato: ${zoneJson.indirizzo} ${zoneJson.civico}`,
      `Caratteristiche selezionate: ${nFeat} -> sottofascia ${subband}ª`,
      `Mq reali: ${mqReali}; mq di calcolo: ${mqCalcolo}`,
      superficieNote(mqReali),
      `Canone base annuo = mq di calcolo × valore €/mq annuo`,
      `Maggiorazioni complessive applicate: ${magg.totalPct}%`,
      `Canone mensile = canone annuo / 12`
    ],
  });
}
