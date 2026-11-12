import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Noto_Sans_Devanagari, Noto_Sans_Telugu } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "600", "700"],
  variable: "--font-telugu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DrainSenseAI: Urban waterlogging early warning",
  description:
    "Decision support for short-term urban waterlogging risk on a 500 m grid, using rainfall, terrain, and historical floods.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${devanagari.variable} ${telugu.variable}`}>
      <Script id="ignore-wallet-extension" strategy="beforeInteractive">{`
        (function () {
          function isWalletInject(event) {
            var message = String((event && event.message) || "");
            var file = String((event && event.filename) || "");
            var stack = "";
            try {
              stack = String((event && event.error && event.error.stack) || "");
            } catch (err) {}
            var blob = message + " " + file + " " + stack;
            return blob.indexOf("Cannot redefine property: ethereum") !== -1
              || (blob.indexOf("chrome-extension://") !== -1 && blob.indexOf("ethereum") !== -1);
          }
          window.addEventListener("error", function (event) {
            if (!isWalletInject(event)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
          }, true);
        })();
      `}</Script>
      <body className="bg-[#F3F7F6] text-[#12262A] antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
