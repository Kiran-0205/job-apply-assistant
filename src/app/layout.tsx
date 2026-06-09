import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Apply Assistant",
  description: "Human-in-the-loop job application helper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 backdrop-blur-md bg-[#faf9f7]/80 border-b border-stone-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-stone-900 text-white text-sm font-semibold tracking-tight group-hover:bg-indigo-600 transition-colors">
                J
              </span>
              <span className="font-semibold text-stone-900 tracking-tight">
                Job Apply Assistant
              </span>
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
