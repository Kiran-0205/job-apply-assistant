import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-16">
      <div className="max-w-sm mx-auto">
        <div className="bg-cream border border-linen p-6 sm:p-7">
          <h1 className="font-mono text-lg font-bold text-ink uppercase tracking-[0.15em]">
            Welcome back
          </h1>
          <div className="w-10 h-0.5 bg-rust mt-2" aria-hidden />
          <p className="text-sm text-ink-soft mt-3 mb-6">Sign in to continue to FormSprint.</p>
          <Suspense>
            <AuthForm mode="signin" />
          </Suspense>
        </div>
        <p className="text-center text-sm text-ink-soft mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold text-rust hover:underline underline-offset-2 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
