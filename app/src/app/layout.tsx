<<<<<<< Updated upstream
=======
import type { Metadata } from "next";
>>>>>>> Stashed changes
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

<<<<<<< Updated upstream
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

export const metadata = {
  icons: { icon: "/favicon.svg" },
=======
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      className={`${arabic.variable} ${mono.variable} h-full antialiased`}
=======
      className={`${plexArabic.variable} ${plexMono.variable} h-full antialiased`}
>>>>>>> Stashed changes
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
