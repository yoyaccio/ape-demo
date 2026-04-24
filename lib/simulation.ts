export function countFeatures(features: Record<string, boolean>) {
  return Object.values(features || {}).filter(Boolean).length;
}

export function computeSubband(count: number) {
  if (count <= 2) return 1;
  if (count <= 8) return 2;
  return 3;
}

export function buildNcivico(
  numero: string | number | null | undefined,
  lettera?: string,
  colore?: string
) {
  const num = String(numero ?? "").trim();
  const lettr = String(lettera ?? "").trim().toUpperCase();
  const col = String(colore ?? "").trim().toLowerCase();
  return `${num}${lettr}${col === "r" ? "r" : ""}`;
}

// Valori annui: la tabella è €/mq annuo.
export function superficieConvenzionale(mq: number) {
  if (mq < 45) return Math.min(mq * 1.30, 54);
  if (mq >= 45 && mq <= 60) return Math.min(mq * 1.20, 67);
  if (mq >= 61 && mq <= 69) return Math.min(mq * 1.10, 70);
  if (mq > 100) return 100 + (mq - 100) * 0.70;
  return mq;
}

export function superficieNote(mq: number) {
  if (mq < 45) return "Mq utili inferiori a 45: aumento del 30%, con limite massimo mq 54";
  if (mq >= 45 && mq <= 60) return "Mq compresi tra 45 e 60: aumento del 20%, fino al limite massimo mq 67";
  if (mq >= 61 && mq <= 69) return "Mq superiori a 60 fino a 70: aumento del 10%, fino al massimo mq 70";
  if (mq > 100) return "Mq utili superiori a 100: superficie eccedente ridotta del 30%";
  return "Nessuna maggiorazione/riduzione superficie";
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Scelte contrattuali/maggiorazioni in forma esclusiva.
 * Nota:
 * - 3+2 da solo NON aggiunge maggiorazione.
 * - 3+2 arredato parziale = +6%.
 * - 3+2 arredato totale = +12%.
 * - Durate 4+2 / 5+2 / 6+2 sono alternative, non cumulabili.
 * - Transitorio studenti / ordinario sono alternative, non cumulabili con 3+2.
 */
export const contractTypeOptions = {
  "3_2": { label: "3+2", pct: 0 },
  "3_2_furnished_partial": { label: "3+2 arredato parziale", pct: 6 },
  "3_2_furnished_total": { label: "3+2 arredato totale", pct: 12 },
  "4_2": { label: "4+2", pct: 2 },
  "5_2": { label: "5+2", pct: 4 },
  "6_2": { label: "6+2", pct: 6 },
  "transitory_students": { label: "Transitorio studenti", pct: 12 },
  "transitory_ordinary": { label: "Transitorio ordinario", pct: 16 },
} as const;

export const vincoloOptions = {
  none: { label: "Nessun vincolo", pct: 0 },
  immobile_vincolato: { label: "Immobile vincolato", pct: 30 },
  fabbricato_vincolato: { label: "Fabbricato vincolato", pct: 15 },
} as const;

export function computeMaggiorazioni(input: any) {
  const contractType = String(input?.contract_type || "3_2");
  const vincolo = String(input?.vincolo || "none");

  const rows: { key: string; label: string; pct: number }[] = [];

  const contract = (contractTypeOptions as any)[contractType] || contractTypeOptions["3_2"];
  rows.push({ key: contractType, label: contract.label, pct: contract.pct });

  const vincoloDef = (vincoloOptions as any)[vincolo] || vincoloOptions.none;
  if (vincoloDef.pct > 0) {
    rows.push({ key: vincolo, label: vincoloDef.label, pct: vincoloDef.pct });
  }

  const totalPct = rows.reduce((sum, x) => sum + x.pct, 0);
  return { rows, totalPct, contractType, vincolo };
}
