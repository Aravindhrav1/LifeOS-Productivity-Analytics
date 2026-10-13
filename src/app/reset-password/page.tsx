"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setCanReset(Boolean(session));
      setCheckingSession(false);
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCanReset(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (password.length < 8) {
      setMessage("❌ Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    setMessage("✅ Password updated successfully. Redirecting to sign in...");

    setTimeout(() => {
      router.replace("/login");
      router.refresh();
    }, 1500);
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="text-sm text-slate-500">
          Checking password reset link...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-indigo-600">
          LIFEOS
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Create a new password
        </h1>

        {!canReset ? (
          <>
            <p className="mt-3 text-sm text-slate-500">
              This password reset link is invalid or has expired.
              Request a new reset link from the sign-in page.
            </p>

            <button
              type="button"
              onClick={() => router.replace("/forgot-password")}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Request a new link
            </button>
          </>
        ) : (
          <>
            <p className="mb-8 mt-2 text-slate-500">
              Enter your new LifeOS password.
            </p>

            <form
              onSubmit={handleUpdatePassword}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  New password
                </label>

                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm new password
                </label>

                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
                  placeholder="Enter password again"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>

            {message && (
              <p className="mt-5 text-sm text-slate-700">
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}