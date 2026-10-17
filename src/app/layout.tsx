import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Literata, Onest } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { appUrl } from "@/lib/urls";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic", "cyrillic-ext"], display: "swap" });
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
  style: ["normal", "italic"],
});
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "cyrillic"], display: "swap" });

const description =
  "QR меню, онлайн захиалга, ширээний удирдлага, гал тогооны дэлгэц, борлуулалтын тайланг нэг системээс удирдах ресторанын платформ.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "TABLE.MN | Рестораны бизнесийг нэг дор", template: "%s | TABLE.MN" },
  description,
  applicationName: "TABLE.MN",
  keywords: ["QR меню", "ресторан", "захиалгын систем", "POS", "гал тогооны дэлгэц", "ширээ захиалга", "Монгол"],
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: "TABLE.MN",
    title: "TABLE.MN | Рестораны бизнесийг нэг дор",
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TABLE.MN" }],
  },
  twitter: { card: "summary_large_image", title: "TABLE.MN | Рестораны бизнесийг нэг дор", description, images: ["/og.png"] },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={`${onest.variable} ${literata.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
