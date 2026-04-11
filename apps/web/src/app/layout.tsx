import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import GuidePanel from "./components/GuidePanel";
import GlobalShortcuts from "./components/GlobalShortcuts";
import { getInitialLocale } from "@/lib/locale";
import { resolveMessage } from "@/app/i18n/messages";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CronoStudio - YouTube Analytics Dashboard",
  description: "Gestiona y automatiza tus canales de YouTube",
  icons: {
    icon: "/favicon.svg",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const locale = await getInitialLocale();

  return (
    <html lang={locale} data-theme="dark" className="overflow-x-hidden">
      <body
        data-nonce={nonce}
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider>
          <ToastProvider>
            <LocaleProvider initialLocale={locale}>
              <AuthProvider>
                <a href="#main-content" className="skip-link">{resolveMessage(locale, 'common.skipToMain')}</a>
                <div id="main-content">{children}</div>
                <GlobalShortcuts />
                <GuidePanel />
              </AuthProvider>
            </LocaleProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
