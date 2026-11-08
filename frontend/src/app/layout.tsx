import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PayGuard Sentinel | Enterprise B2B Payment Firewall",
  description:
    "Institutional B2B invoice fraud prevention, X-Ray hidden prompt detection, Canary active bot trap, and PayPal Enterprise Sandbox gateway.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-slate-50 text-slate-900 font-sans antialiased selection:bg-[#0070BA]/15 selection:text-[#003087]">
        {children}
      </body>
    </html>
  );
}
