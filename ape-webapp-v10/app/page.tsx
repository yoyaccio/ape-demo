import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>APE Genova v4</h1>
      <p style={{ lineHeight: 1.5 }}>
        Simulatore web, archivio pratiche e pagina inserimento tariffe.
      </p>
      <div style={{ display: "flex", gap: 18, marginTop: 20, flexWrap: "wrap" }}>
        <Link href="/simulatore">Apri simulatore</Link>
        <Link href="/pratiche">Pratiche salvate</Link>
        <Link href="/tariffe">Inserimento tariffe</Link>
      </div>
    </main>
  );
}
