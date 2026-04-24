"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { countFeatures, computeSubband, contractTypeOptions, vincoloOptions } from "@/lib/simulation";

type AddressSuggestion = {
  id: string;
  indirizzo: string;
  civico: string;
  zona_omi: string;
  municipio: string;
  label: string;
};

const featureLabels: Record<string, { n: number; label: string }> = {
  elevator: { n: 1, label: "Impianto di ascensore (presente comunque per alloggi ubicati non oltre il primo piano)" },
  heating: { n: 2, label: "Impianto riscaldamento (centralizzato, autonomo a piastre radianti, pompa di calore)" },
  cooling: { n: 3, label: "Impianto di raffrescamento" },
  bath_with_shower_or_tub: { n: 4, label: "Servizio igienico con doccia o vasca da bagno" },
  outdoor_space: { n: 5, label: "Balcone con profondità minima ml. 0,80 o terrazzo o giardino pertinenziale (superficie almeno mq. 10)" },
  double_services: { n: 6, label: "Doppi servizi igienici" },
  double_glazing_or_security_door: { n: 7, label: "Doppi vetri ad almeno il 90% delle finestre e/o porta blindata" },
  cellar_or_attic: { n: 8, label: "Cantina e/o soffitta" },
  concierge: { n: 9, label: "Servizio di portineria" },
  condo_green_area_or_sports: { n: 10, label: "Area verde di uso comune / impianto sportivo" },
  barrier_free_common_areas: { n: 11, label: "Strutture/interventi atti al superamento delle barriere architettoniche nel condominio" },
  shared_parking: { n: 12, label: "Spazio scoperto condominiale per posteggio di uso comune" },
  private_garage_or_exclusive_parking: { n: 13, label: "Box pertinenziale e/o posto auto esclusivo" },
  energy_class_A_to_D: { n: 14, label: "Classe energetica (da certificazione APE) da A sino a D comprese" },
  building_new_10y: { n: 15, label: "Edificio ultimato da non oltre 10 anni" },
  building_fully_renovated_10y: { n: 16, label: "Edificio oggetto di integrale ristrutturazione ultimata da non oltre 10 anni" },
  extraordinary_maintenance_10y: { n: 17, label: "Intervento di manutenzione straordinaria del fabbricato ultimato da non oltre 10 anni" },
  internal_renovation_bath_kitchen_10y: { n: 18, label: "Ristrutturazione interna / rifacimento integrale di bagno e cucina ultimati da non oltre 10 anni" },
  sun_exposure: { n: 19, label: "Esposizione a levante/mezzogiorno o mezzogiorno/ponente di almeno la metà dei vani" },
  sea_view_two_windows: { n: 20, label: "Vista mare da almeno due finestre" },
  distance_to_sea_lt_300m: { n: 21, label: "Distanza dal mare inferiore a m. 300" },
};

const allFeatureRows = Object.entries(featureLabels).map(([key, item]) => ({ key, ...item }));

const FeaturesSchema = z.object(Object.fromEntries(Object.keys(featureLabels).map((k) => [k, z.boolean().default(false)])) as any);
const MaggiorazioniSchema = z.object({
  contract_type: z.string().default("3_2"),
  vincolo: z.string().default("none"),
});

const ResultSchema = z.object({
  indirizzo: z.string(),
  civico: z.string(),
  municipio: z.string().optional(),
  zone_code: z.string(),
  subband: z.number(),
  features_count: z.number().optional(),
  eur_mq_min: z.number(),
  eur_mq_max: z.number(),
  mq_reali: z.number().optional(),
  mq_calcolo: z.number().optional(),
  surface_note: z.string().optional(),
  base_annual_min: z.number().optional(),
  base_annual_max: z.number().optional(),
  adjustment_percent: z.number().optional(),
  adjustments: z.array(z.object({ key: z.string(), label: z.string(), pct: z.number() })).optional(),
  rent_min: z.number(),
  rent_max: z.number(),
  rent_annual_min: z.number().optional(),
  rent_annual_max: z.number().optional(),
  rent_monthly_min: z.number().optional(),
  rent_monthly_max: z.number().optional(),
  explanation: z.array(z.string()),
});

const FormSchema = z.object({
  locatore: z.string().optional(),
  address_query: z.string().min(3, "Digita almeno 3 caratteri"),
  indirizzo: z.string().min(1, "Seleziona un indirizzo dalla tendina"),
  ncivico: z.string().min(1, "Seleziona un civico dalla tendina"),
  surface_mq: z.coerce.number().min(10, "Min 10 mq").max(250, "Max 250 mq"),
  features: FeaturesSchema,
  maggiorazioni: MaggiorazioniSchema,
  result: ResultSchema.optional(),
}).superRefine((data, ctx) => {
  const count = countFeatures(data.features);
  const subband = computeSubband(count);
  if (subband > 1) {
    if (!(data.features as any).heating) {
      ctx.addIssue({ code: "custom", path: ["features", "heating"], message: "Per sottofasce > 1 serve riscaldamento." });
    }
    if (!(data.features as any).bath_with_shower_or_tub) {
      ctx.addIssue({ code: "custom", path: ["features", "bath_with_shower_or_tub"], message: "Per sottofasce > 1 serve bagno con doccia/vasca." });
    }
  }
});

type FormValues = z.infer<typeof FormSchema>;

const defaultFeatures = Object.fromEntries(Object.keys(featureLabels).map((k) => [k, false]));
const defaultMaggiorazioni = { contract_type: "3_2", vincolo: "none" };

export default function SimulatorePage() {
  const methods = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      locatore: "",
      address_query: "",
      indirizzo: "",
      ncivico: "",
      surface_mq: 70,
      features: defaultFeatures as any,
      maggiorazioni: defaultMaggiorazioni as any,
      result: undefined,
    },
  });

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const features = methods.watch("features");
  const nFeat = useMemo(() => countFeatures(features), [features]);
  const subband = useMemo(() => computeSubband(nFeat), [nFeat]);

  async function nextStep() {
    if (step === 1) {
      const ok = await methods.trigger(["address_query", "indirizzo", "ncivico"]);
      if (!ok) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      const ok = await methods.trigger(["surface_mq", "maggiorazioni"]);
      if (!ok) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      const currentFeatures = methods.getValues("features");
      const cnt = countFeatures(currentFeatures);
      const sf = computeSubband(cnt);
      if (sf > 1 && (!(currentFeatures as any).heating || !(currentFeatures as any).bath_with_shower_or_tub)) {
        alert("Per accedere alle sottofasce superiori alla 1ª devi selezionare le caratteristiche obbligatorie: 2) riscaldamento e 4) bagno con doccia/vasca.");
        await methods.trigger(["features"]);
        return;
      }
      const ok = await methods.trigger(["features"]);
      if (!ok) return;
      setStep(4);
      await runSimulation();
      return;
    }
    if (step === 4) {
      setStep(5);
      return;
    }
    await runSimulation();
  }

  function prevStep() {
    if (step === 1) return;
    setStep(step === 2 ? 1 : step === 3 ? 2 : step === 4 ? 3 : 4);
  }

  async function runSimulation() {
    const values = methods.getValues();
    const payload = {
      locatore: values.locatore || "",
      street_query: values.indirizzo,
      ncivico: values.ncivico,
      surface_mq: values.surface_mq,
      features: values.features,
      maggiorazioni: values.maggiorazioni,
    };

    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      alert(`Errore simulazione (${res.status}): ${text}`);
      return;
    }

    methods.setValue("result", JSON.parse(text), { shouldValidate: false });
  }

  return (
    <main style={{ maxWidth: 1080, margin: "40px auto", padding: 16 }}>
      <style>{`
        @page { size: A4; margin: 10mm; }
        .demo-watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; opacity: 0.08; font-size: 46px; font-weight: 900; transform: rotate(-30deg); }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-module {
            width: 190mm !important;
            min-height: 277mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 10px !important;
          }
          .a4-sheet {
            width: 190mm !important;
            min-height: 277mm !important;
            padding: 0 !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 30 }}>Simulatore Canone Genova</h1>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/tariffe">Tariffe</Link>
          <Link href="/pratiche">Pratiche</Link>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StepPill label="1) Indirizzo" active={step === 1} done={step > 1} />
        <StepPill label="2) Superficie e maggiorazioni" active={step === 2} done={step > 2} />
        <StepPill label="3) Caratteristiche" active={step === 3} done={step > 3} />
        <StepPill label="4) Risultato" active={step === 4} done={step > 4} />
        <StepPill label="5) Modulo A4" active={step === 5} done={false} />
      </div>

      <div style={{ marginTop: 18, padding: step === 5 ? 0 : 16, border: step === 5 ? "none" : "1px solid #ddd", borderRadius: 10, background: "#fff" }}>
        <FormProvider {...methods}>
          {step === 1 && <StepAddress />}
          {step === 2 && <StepSurfaceAndAdjustments />}
          {step === 3 && <StepFeatures nFeat={nFeat} subband={subband} />}
          {step === 4 && <StepResult />}
          {step === 5 && <CompiledModule />}
        </FormProvider>
      </div>

      <div className="no-print" style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
        <button onClick={prevStep} disabled={step === 1} style={{ padding: "10px 14px" }}>Indietro</button>
        <button onClick={nextStep} style={{ padding: "10px 14px" }}>
          {step === 3 ? "Calcola" : step === 4 ? "Genera modulo" : step === 5 ? "Ricalcola" : "Avanti"}
        </button>
      </div>
    </main>
  );
}

function StepPill({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  const bg = active ? "#111" : done ? "#444" : "#eee";
  const fg = active || done ? "#fff" : "#111";
  return <div style={{ padding: "6px 10px", borderRadius: 999, background: bg, color: fg, fontSize: 13 }}>{label}</div>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div style={{ color: "crimson", marginTop: 6, fontSize: 13 }}>{message}</div>;
}

function useFieldError(path: string): string | undefined {
  const { formState } = useFormContext<FormValues>();
  const parts = path.split(".");
  let cur: any = formState.errors;
  for (const p of parts) cur = cur?.[p];
  return cur?.message ? String(cur.message) : undefined;
}


function StepAddress() {
  const { register, setValue, watch } = useFormContext<FormValues>();
  const locatore = watch("locatore");
  const query = watch("address_query");
  const indirizzo = watch("indirizzo");
  const ncivico = watch("ncivico");

  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    const raw = query || "";
    const q = raw.trim();

    // Se l'utente non ha modificato il testo dopo la selezione, non cancelliamo il civico.
    if (selectedText && raw === selectedText) return;

    // Se modifica il testo dopo aver selezionato, invalidiamo la vecchia selezione.
    if (selectedText && raw !== selectedText) {
      setSelectedText("");
      setValue("indirizzo", "", { shouldValidate: true });
      setValue("ncivico", "", { shouldValidate: true });
    }

    if (q.length < 3) {
      setItems([]);
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/addresses?q=${encodeURIComponent(q.toUpperCase())}`, { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) {
          setItems([]);
          return;
        }
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        if (!ctrl.signal.aborted) setItems([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, selectedText, setValue]);

  function pick(item: AddressSuggestion) {
    const value = `${item.indirizzo} ${item.civico}`.toUpperCase();
    setSelectedText(value);
    setValue("address_query", value, { shouldValidate: true });
    setValue("indirizzo", item.indirizzo.toUpperCase(), { shouldValidate: true });
    setValue("ncivico", item.civico, { shouldValidate: true });
    setItems([]);
  }

  return (
    <section>
      <h2>Locatore e indirizzo</h2>

      <label>
        Locatore
        <input
          {...register("locatore")}
          placeholder="NOME E COGNOME / RAGIONE SOCIALE"
          style={{ width: "100%", padding: 10, marginTop: 6, textTransform: "uppercase" }}
          onChange={(e) => setValue("locatore", e.target.value.toUpperCase(), { shouldValidate: false })}
        />
      </label>

      <div style={{ marginTop: 14 }}>
        <label>
          Cerca via e civico
          <input
            {...register("address_query")}
            placeholder="ES. PIAZZA DELLE ERBE 5R"
            style={{ width: "100%", padding: 10, marginTop: 6, textTransform: "uppercase" }}
            onChange={(e) => setValue("address_query", e.target.value.toUpperCase(), { shouldValidate: true })}
          />
        </label>
      </div>

      <FieldError message={useFieldError("address_query")} />
      <FieldError message={useFieldError("indirizzo")} />
      <FieldError message={useFieldError("ncivico")} />

      <p style={{ color: "#666", fontSize: 13 }}>
        Scrivi via + civico: <b>5R</b> = rosso, <b>5</b> = normale/nero, <b>5A</b> = civico con lettera. Dopo la selezione puoi cliccare subito Avanti.
      </p>

      {loading ? <p>Caricamento...</p> : null}

      {items.length ? (
        <div style={{ marginTop: 8, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
          {items.map((x) => (
            <button type="button" key={x.id} onClick={() => pick(x)} style={{ display: "block", width: "100%", padding: 10, textAlign: "left", border: 0, borderBottom: "1px solid #eee", background: "#fff", cursor: "pointer" }}>
              <b>{x.indirizzo} {x.civico}</b><span style={{ color: "#666" }}> — zona {x.zona_omi} — {x.municipio}</span>
            </button>
          ))}
        </div>
      ) : null}

      {indirizzo && ncivico ? <div style={{ marginTop: 12, padding: 10, background: "#f5f5f5", borderRadius: 8 }}>Selezionato: <b>{indirizzo} {ncivico}</b></div> : null}
    </section>
  );
}


function StepSurfaceAndAdjustments() {
  const { register } = useFormContext<FormValues>();
  return (
    <section>
      <h2>Superficie e maggiorazioni</h2>
      <label>
        MQ utili
        <input {...register("surface_mq")} inputMode="decimal" style={{ width: "100%", padding: 10, marginTop: 6 }} />
      </label>
      <FieldError message={useFieldError("surface_mq")} />
      <p>Il software calcola i mq convenzionali secondo le maggiorazioni/riduzioni del modulo.</p>

      <h3>Tipo contratto / arredamento</h3>
      <p style={{ color: "#666", fontSize: 13 }}>
        Scelta esclusiva: non puoi selezionare contemporaneamente 3+2, 4+2, 5+2, 6+2 o transitorio.
        Il 3+2 semplice non comporta maggiorazione; le maggiorazioni per arredo sono solo parziale (+6%) o totale (+12%).
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {Object.entries(contractTypeOptions).map(([key, item]) => (
          <label key={key} style={{ display: "flex", gap: 8 }}>
            <input type="radio" value={key} {...register("maggiorazioni.contract_type")} />
            {item.label}{item.pct ? ` (+${item.pct}%)` : ""}
          </label>
        ))}
      </div>

      <h3>Vincoli</h3>
      <p style={{ color: "#666", fontSize: 13 }}>
        Scelta esclusiva: nessun vincolo, immobile vincolato oppure fabbricato vincolato.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {Object.entries(vincoloOptions).map(([key, item]) => (
          <label key={key} style={{ display: "flex", gap: 8 }}>
            <input type="radio" value={key} {...register("maggiorazioni.vincolo")} />
            {item.label}{item.pct ? ` (+${item.pct}%)` : ""}
          </label>
        ))}
      </div>
    </section>
  );
}

function StepFeatures({ nFeat, subband }: { nFeat: number; subband: number }) {
  return (
    <section>
      <h2>Caratteristiche</h2>
      <p>Selezionate: <b>{nFeat}</b> — Sottofascia: <b>{subband}ª</b></p>
      <div style={{ display: "grid", gap: 8 }}>
        {Object.entries(featureLabels).map(([key, item]) => (
          <FeatureCheckbox key={key} name={`features.${key}`} label={`${item.n}) ${item.label}`} />
        ))}
      </div>
    </section>
  );
}

function FeatureCheckbox({ name, label }: { name: string; label: string }) {
  const { register } = useFormContext<FormValues>();
  return <div style={{ display: "flex", gap: 10 }}><input type="checkbox" {...register(name)} /><div>{label}<FieldError message={useFieldError(name)} /></div></div>;
}

function StepResult() {
  const { watch } = useFormContext<FormValues>();
  const r = watch("result");
  if (!r) return <p>Nessun risultato.</p>;

  return (
    <section>
      <h2>Risultato</h2>
      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div><b>Zona:</b> {r.zone_code}</div>
        <div><b>Sottofascia:</b> {r.subband}ª</div>
        <div><b>Mq reali:</b> {r.mq_reali ?? "-"} — <b>Mq calcolo:</b> {r.mq_calcolo ?? "-"}</div>
        <div><b>Valori annui €/mq:</b> {r.eur_mq_min.toFixed(2)} – {r.eur_mq_max.toFixed(2)}</div>
        <div><b>Canone base annuo:</b> {(r.base_annual_min ?? r.rent_min).toFixed(2)} – {(r.base_annual_max ?? r.rent_max).toFixed(2)}</div>
        <div><b>Maggiorazioni:</b> {r.adjustment_percent ?? 0}%</div>
        <div><b>Canone annuo:</b> {(r.rent_annual_min ?? r.rent_min).toFixed(2)} – {(r.rent_annual_max ?? r.rent_max).toFixed(2)}</div>
        <div><b>Canone mensile:</b> {(r.rent_monthly_min ?? r.rent_min / 12).toFixed(2)} – {(r.rent_monthly_max ?? r.rent_max / 12).toFixed(2)}</div>
        <ul>{r.explanation.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
      </div>
    </section>
  );
}

function CompiledModule() {
  const { watch } = useFormContext<FormValues>();
  const values = watch();
  const r = values.result;
  const features = values.features;
  const maggiorazioni = values.maggiorazioni;

  if (!r) return <p>Calcola prima il canone.</p>;

  const checkedNums = new Set<number>();
  Object.entries(featureLabels).forEach(([key, item]) => {
    if ((features as any)[key]) checkedNums.add(item.n);
  });

  return (
    <section className="print-module" style={{ background: "#fff", padding: 20, border: "1px solid #ddd", borderRadius: 10 }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 12 }}>
        <button onClick={() => window.print()} style={{ padding: "10px 14px" }}>Stampa / Salva PDF A4</button>
      </div>

      <div className="a4-sheet" style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", background: "#fff", padding: "10mm", boxSizing: "border-box", border: "1px solid #ddd", position: "relative" }}>
        <div className="demo-watermark">DEMO - NON VALIDO</div>
        <div style={{ display: "grid", gridTemplateColumns: "50mm 1fr", gap: "8mm", alignItems: "start" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#b83a3a", fontSize: 16, lineHeight: 1.1 }}>ASSOCIAZIONE<br />PROPRIETÀ<br />EDILIZIA</div>
            <div style={{ marginTop: 8, fontSize: 10 }}>Via XX Settembre 41 piano 6<br />16121 Genova</div>
          </div>
          <div>
            <div style={{ textAlign: "right", fontWeight: 700 }}>Scheda n. {r.scheda_number ?? "________"}</div>
            <h3 style={{ margin: "6px 0 2px", fontSize: 14 }}>Locatore</h3><div style={{ fontWeight: 700, minHeight: 16 }}>{r.locatore || values.locatore || "____________________________"}</div>
            <div style={{ textDecoration: "underline", fontWeight: 700, fontSize: 11 }}>Scheda per la determinazione del canone di contratti agevolati</div>
            <div style={{ marginTop: 6, fontSize: 10 }}>
              ☑ contratto agevolato 3+2 &nbsp;&nbsp; ☐ transitorio studenti &nbsp;&nbsp; ☐ transitorio ordinario
            </div>
          </div>
        </div>

        <hr style={{ margin: "8px 0" }} />

        <div style={{ fontSize: 10, display: "grid", gridTemplateColumns: "1fr 25mm 30mm 30mm", gap: 6 }}>
          <div><b>Immobile sito in</b><br />{r.indirizzo} {r.civico}</div>
          <div><b>Zona</b><br />{r.zone_code}</div>
          <div><b>Min fascia</b><br />{r.eur_mq_min.toFixed(2)}</div>
          <div><b>Max fascia</b><br />{r.eur_mq_max.toFixed(2)}</div>
        </div>

        <div style={{ fontSize: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
          <div><b>Elementi caratteristici n°</b><br />{r.features_count ?? countFeatures(features)}</div>
          <div><b>Collocazione in sottofascia</b><br />{r.subband}ª</div>
          <div><b>Mq calcolo</b><br />{r.mq_calcolo ?? ""}</div>
        </div>

        <div style={{ fontSize: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
          <div><b>Mq. intera unità immobiliare</b><br />{values.surface_mq}</div>
          <div><b>1) Mq. porzione locata</b><br />________</div>
          <div><b>2) Mq quota parti comuni</b><br />________</div>
        </div>

        <div style={{ marginTop: 8, fontSize: 10 }}>
          <b>Maggiorazioni valori:</b>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4, marginTop: 3 }}>
            <div>
              <b>Tipo contratto / arredamento</b><br />
              {Object.entries(contractTypeOptions).map(([key, item]) => (
                <span key={key} style={{ display: "block" }}>
                  {(maggiorazioni as any).contract_type === key ? "☑" : "☐"} {item.label}{item.pct ? ` (+${item.pct}%)` : ""}
                </span>
              ))}
            </div>
            <div>
              <b>Vincoli</b><br />
              {Object.entries(vincoloOptions).map(([key, item]) => (
                <span key={key} style={{ display: "block" }}>
                  {(maggiorazioni as any).vincolo === key ? "☑" : "☐"} {item.label}{item.pct ? ` (+${item.pct}%)` : ""}
                </span>
              ))}
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginTop: 8 }}>
          <tbody>
            <tr><td style={td}><b>CANONE ANNUO EURO</b></td><td style={td}>minimo: {(r.rent_annual_min ?? r.rent_min).toFixed(2)}</td><td style={td}>massimo: {(r.rent_annual_max ?? r.rent_max).toFixed(2)}</td></tr>
            <tr><td style={td}><b>CANONE MENSILE EURO</b></td><td style={td}>minimo: {(r.rent_monthly_min ?? r.rent_min / 12).toFixed(2)}</td><td style={td}>massimo: {(r.rent_monthly_max ?? r.rent_max / 12).toFixed(2)}</td></tr>
          </tbody>
        </table>

        <h3 style={{ margin: "8px 0 4px", textAlign: "center", fontSize: 10 }}>TABELLA DEGLI ELEMENTI CARATTERISTICI DI RIFERIMENTO DELLE UNITÀ IMMOBILIARI ABITATIVE</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8.5 }}>
          <tbody>
            {allFeatureRows.map(({ n, label }) => (
              <tr key={n}>
                <td style={{ ...td, width: 20, textAlign: "center" }}>{checkedNums.has(n) ? "☑" : "☐"}</td>
                <td style={{ ...td, width: 22 }}>{n}</td>
                <td style={td}>{label}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 6, fontSize: 8.5 }}>
          <b>SOTTOFASCE:</b> 1ª da 1 a 2 caratteristiche; 2ª da 3 a 8 caratteristiche; 3ª da 9 a 21 caratteristiche.
          Le voci 2 e 4 sono obbligatorie per accedere alle sottofasce superiori alla 1ª.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 12, fontSize: 10 }}>
          <div>Data ____________________</div><div></div>
          <div>Locatore ______________________________</div>
          <div>Conduttore ______________________________</div>
        </div>
      </div>
    </section>
  );
}

const td: React.CSSProperties = {
  border: "1px solid #999",
  padding: "3px 4px",
  verticalAlign: "top",
};
