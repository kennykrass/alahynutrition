import "./globals.css";
import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display"
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Alahy Nutrition",
  description: "Nutriologo Erick David Alahy Rios Cervantes. Nutricion personalizada y seguimiento integral."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable} font-[var(--font-body)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
