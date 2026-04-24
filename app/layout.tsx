export const metadata = {
  title: "APE Genova v4",
  description: "Simulatore, tariffe e pratiche",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", background: "#f7f7f7" }}>
        {process.env.NEXT_PUBLIC_DEMO_BANNER ? (
          <div style={{ background: "#b00020", color: "white", padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>
            {process.env.NEXT_PUBLIC_DEMO_BANNER}
          </div>
        ) : null}
        {children}
      </body>
    </html>
  );
}
