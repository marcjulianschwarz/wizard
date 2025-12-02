import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

import "./globals.css";

export const metadata: Metadata = {
  title: "Wizard",
  description:
    "Spiele Wizard online mit deinen Freunden. Erstelle ein Spiel, lade deine Freunde ein und hab Spaß!",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className={inter.className}>
        <div className="main">{children}</div>
      </body>
    </html>
  );
}
