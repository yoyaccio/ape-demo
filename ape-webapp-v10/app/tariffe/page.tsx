"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ZonaTariffa = {
  1: { min: number; max: number };
  2: { min: number; max: number };
  3: { min: number; max: number };
};

type TariffeDb = Record<string, ZonaTariffa>;

export default function TariffePage() {
  const [db, setDb] = useState<TariffeDb>({});
  const [zona, setZona] = useState("");
  const [s1min, setS1min] = useState("");
  const [s1max, setS1max] = useState("");
  const [s2min, setS2min] = useState("");
  const [s2max, setS2max] = useState("");
  const [s3min, setS3min] = useState("");
  const [s3max, setS3max] = useState("");
  const [msg, setMsg] = useState("");

  const [schedaNumber, setSchedaNumber] = useState("1");
  const [configMsg, setConfigMsg] = useState("");

  async function loadTariffe() {
    const res = await fetch("/api/tariffe", { cache: "no-store" });
    const json = await res.json();
    setDb(json);
  }

  async function loadConfig() {
    const res = await fetch("/api/config", { cache: "no-store" });
    const json = await res.json();
    setSchedaNumber(String(json.currentSchedaNumber || 1));
  }

  useEffect(() => {
    loadTariffe();
    loadConfig();
  }, []);

  function loadZonaValues(z: string) {
    const item = db[z];
    setZona(z);
    setS1min(item?.[1]?.min?.toString() || "");
    setS1max(item?.[1]?.max?.toString() || "");
    setS2min(item?.[2]?.min?.toString() || "");
    setS2max(item?.[2]?.max?.toString() || "");
    setS3min(item?.[3]?.min?.toString() || "");
    setS3max(item?.[3]?.max?.toString() || "");
  }

  async function salvaTariffe() {
    setMsg("");
    const res = await fetch("/api/tariffe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zona,
        s1min: Number(s1min), s1max: Number(s1max),
        s2min: Number(s2min), s2max: Number(s2max),
        s3min: Number(s3min), s3max: Number(s3max),
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      setMsg(`Errore: ${text}`);
      return;
    }
    setMsg("Tariffe salvate.");
    await loadTariffe();
  }

  async function salvaNumeroScheda() {
    setConfigMsg("");
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentSchedaNumber: Number(schedaNumber) }),
    });
    const text = await res.text();
    if (!res.ok) {
      setConfigMsg(`Errore: ${text}`);
      return;
    }
    setConfigMsg("Numero scheda salvato.");
    await loadConfig();
  }

  async function azzeraNumeroScheda() {
    setConfigMsg("");
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resetSchedaNumber", value: 1 }),
    });
    const text = await res.text();
    if (!res.ok) {
      setConfigMsg(`Errore: ${text}`);
      return;
    }
    setConfigMsg("Progressivo azzerato a 1.");
    await loadConfig();
  }

  return (
    <main style={{ maxWidth: 1100, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 28 }}>Configurazione e tariffe</h1>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/simulatore">Simulatore</Link>
          <Link href="/pratiche">Pratiche</Link>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 10, padding: 16, marginTop: 20 }}>
        <h3>Progressivo scheda</h3>
        <p>Numero che verrà assegnato alla prossima scheda generata.</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input value={schedaNumber} onChange={(e) => setSchedaNumber(e.target.value)} style={{ width: 160, padding: 10 }} />
          <button onClick={salvaNumeroScheda} style={{ padding: "10px 14px" }}>Salva numero</button>
          <button onClick={azzeraNumeroScheda} style={{ padding: "10px 14px" }}>Azzera a 1</button>
          {configMsg ? <span>{configMsg}</span> : null}
        </div>
      </div>

      <p style={{ lineHeight: 1.5, marginTop: 20 }}>
        Qui inserisci per ogni zona i valori min/max delle tre sottofasce. Il simulatore userà automaticamente questi dati.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, marginTop: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
          <h3>Zone configurate</h3>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {Object.keys(db).sort().map((z) => (
              <button key={z} onClick={() => loadZonaValues(z)} style={{ padding: "8px 10px", textAlign: "left" }}>
                {z}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
          <h3>Modifica / aggiungi zona</h3>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <label>
              Zona
              <input value={zona} onChange={(e) => setZona(e.target.value.toUpperCase())} style={{ width: "100%", padding: 10, marginTop: 6 }} />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <label>1ª fascia min<input value={s1min} onChange={(e) => setS1min(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} /></label>
              <label>1ª fascia max<input value={s1max} onChange={(e) => setS1max(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} /></label>
              <label>2ª fascia min<input value={s2min} onChange={(e) => setS2min(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} /></label>
              <label>2ª fascia max<input value={s2max} onChange={(e) => setS2max(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} /></label>
              <label>3ª fascia min<input value={s3min} onChange={(e) => setS3min(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} /></label>
              <label>3ª fascia max<input value={s3max} onChange={(e) => setS3max(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} /></label>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button onClick={salvaTariffe} style={{ padding: "10px 14px" }}>Salva tariffe</button>
              {msg ? <span>{msg}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
