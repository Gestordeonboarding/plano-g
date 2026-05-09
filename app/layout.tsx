import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Inter_Tight,
  Playfair_Display,
  Montserrat,
  Poppins,
  Rajdhani,
  Cormorant_Garamond,
  JetBrains_Mono,
  Bebas_Neue,
  Space_Grotesk,
  Libre_Baskerville,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ── Fontes do módulo de apresentações ───────────────────────────────────────
// Carregadas via CSS variables consumidas em lib/presentations/colors.ts.

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const presentationFontVars = [
  inter.variable,
  interTight.variable,
  playfair.variable,
  montserrat.variable,
  poppins.variable,
  rajdhani.variable,
  cormorant.variable,
  jetbrainsMono.variable,
  bebasNeue.variable,
  spaceGrotesk.variable,
  libreBaskerville.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Plano G",
  description: "Sistema SaaS de Consórcios",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
    shortcut: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${presentationFontVars} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
