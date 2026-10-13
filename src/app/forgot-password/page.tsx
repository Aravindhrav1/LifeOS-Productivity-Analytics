"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    const supabase = createClient();

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setMessage(
      "Password reset email sent. Check your inbox and follow the link to create a new password."
    );
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-indigo-600">
          LIFEOS
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Reset your password
        </h1>

        <p className="mb-8 mt-2 text-slate-500">
          Enter your email and we&apos;ll send you a password reset link.
        </p>

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-5 text-sm ${
              success ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}