import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Courier_Prime } from "next/font/google";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const typewriter = Courier_Prime({
  variable: "--font-typewriter",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FormSprint",
  description: "Human-in-the-loop job application helper",
};

const NAV_LINK_CLASS =
  "px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-cream/60 hover:text-cream transition-colors";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${typewriter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 bg-coal border-b-[3px] border-rust shadow-[0_5px_16px_rgba(22,18,14,0.45)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <span className="grid place-items-center w-7 h-7 border-2 border-cream/80 font-mono text-sm font-bold text-cream group-hover:bg-rust group-hover:border-rust transition-colors">
                F
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-mono font-bold text-cream tracking-[0.18em] uppercase">
                  FormSprint
                </span>
                <span className="font-mono text-[9px] text-rust tracking-[0.3em] uppercase mt-1">
                  Application Counsel
                </span>
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
        <footer className="mt-16 bg-rust border-t-4 border-coal">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-serif italic text-xl text-cream">
                Let&apos;s get you hired.
              </p>
              <p className="font-mono text-[10px] text-cream/70 uppercase tracking-[0.25em] mt-1.5">
                We make your job-search troubles disappear
              </p>
            </div>
            <div className="border-2 border-cream/80 px-4 py-2 text-center">
              <p className="font-mono text-xs font-bold text-cream uppercase tracking-[0.2em]">
                FormSprint
              </p>
              <p className="font-mono text-[9px] text-cream/70 uppercase tracking-[0.25em] mt-0.5">
                Applicant-at-large
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
