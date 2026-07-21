import "./globals.css";

export const metadata = {
  title: "FoxFollowUp — Care continues at home",
  description: "A patient-first pharmacy follow-up prototype built for OpenAI Build Week 2026.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  );
}
