import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DrainSense India — Urban Waterlogging Early Warning & Response Intelligence",
  description: "Decision-support system estimating short-term urban waterlogging risk at 500m grid level using rainfall, terrain, and historical flood patterns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
