import Link from "next/link";
import { listPractices } from "@/lib/db";

export default function PratichePage() {
  const pratiche = listPractices();

  return (
    <main style={{ maxWidth: 1100, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 28 }}>Pratiche salvate</h1>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/simulatore">Nuova simulazione</Link>
          <Link href="/tariffe">Tariffe</Link>
        </div>
      </div>

      {!pratiche.length ? (
        <p>Nessuna pratica salvata.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead>
              <tr>
                {["Data", "Via", "Civico", "Zona", "Sottofascia", "Mq", "Min", "Max"].map((h) => (
                  <th key={h} style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pratiche.map((p, i) => (
                <tr key={i}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 10 }}>{new Date(p.created_at).toLocaleString("it-IT")}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 10 }}>{p.via}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 10 }}>{p.civico}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 10 }}>{p.zona}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 10 }}>{p.sottofascia}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 10 }}>{p.mq}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 10 }}>{p.canone_min.toFixed(2)}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 10 }}>{p.canone_max.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
