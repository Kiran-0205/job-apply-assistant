import { signOut } from "@/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/signin" });
      }}
    >
      <button
        type="submit"
        className="px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
      >
        Sign out
      </button>
    </form>
  );
}
