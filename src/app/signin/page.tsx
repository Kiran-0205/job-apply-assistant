import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-16">
      <div className="max-w-sm mx-auto">
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">Welcome back</h1>
          <p className="text-sm text-stone-500 mt-1 mb-6">Sign in to continue to Apply Accelerator.</p>
          <Suspense>
            <AuthForm mode="signin" />
          </Suspense>
        </div>
        <p className="text-center text-sm text-stone-500 mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-stone-900 hover:text-indigo-600 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
