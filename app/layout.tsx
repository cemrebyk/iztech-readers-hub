import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

// Senin oluşturduğun CSS dosyalarını burada projeye dahil ediyoruz
import "./styles/styles.css";
import "./styles/books.css";
import "./styles/book-details.css";
import "./styles/clubs.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const merriweather = Merriweather({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "IZTECH Reader's Hub",
  description: "Campus Library Book Ratings & AI Recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${merriweather.variable}`}>
        {children}
      </body>
    </html>
  );
}