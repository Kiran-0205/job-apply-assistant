import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export default function SignUpPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-16">
      <div className="max-w-sm mx-auto">
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">Create your account</h1>
          <p className="text-sm text-stone-500 mt-1 mb-6">
            Set up Apply Accelerator to start tracking applications.
          </p>
          <Suspense>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
        <p className="text-center text-sm text-stone-500 mt-4">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-stone-900 hover:text-indigo-600 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
