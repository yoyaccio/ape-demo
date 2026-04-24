export const metadata = {
  title: "APE Genova v4",
  description: "Simulatore, tariffe e pratiche",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", background: "#f7f7f7" }}>
        {children}
      </body>
    </html>
  );
}
