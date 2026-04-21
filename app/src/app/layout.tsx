import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono, Tajawal, Cairo, JetBrains_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// ----- Teacher UI v2 (design-handoff) fonts -----
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"], // 600 isn't offered by Tajawal; next/font will 404 otherwise
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SMA — محلل الرياضيات الذكي",
    template: "%s · SMA",
  },
  description:
    "منصّة ذكيّة لتدريس الرياضيات بالعربية — تخطيط الدروس، تشخيص المفاهيم الخاطئة، وتحديات تعليمية للطلاب.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${arabic.variable} ${mono.variable} ${tajawal.variable} ${cairo.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
