import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";
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
  title: "FormSprint",
  description: "Human-in-the-loop job application helper",
};

const NAV_LINK_CLASS =
  "px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 bg-white border-b border-zinc-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
              <span className="font-semibold text-zinc-900 tracking-tight">
                FormSprint
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {session?.user && (
                <>
                  <Link href="/templates" className={NAV_LINK_CLASS}>
                    Templates
                  </Link>
                  <Link href="/profile" className={NAV_LINK_CLASS}>
                    Profile
                  </Link>
                  <SignOutButton />
                </>
              )}
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-16 border-t border-zinc-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              FormSprint — apply faster, stress less.
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" aria-hidden />
          </div>
        </footer>
      </body>
    </html>
  );
}
