"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/client";



export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const {
      data,
      error: signupError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name.trim(),
        },
      },
    });

    if (signupError) {
      setMessage(`❌ ${signupError.message}`);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setMessage(
        "❌ Account creation did not return a user. Please try again."
      );
      setLoading(false);
      return;
    }

    // If Supabase created an active session immediately, initialise
    // this user's default LifeOS categories.

    if (!data.session) {
      setMessage(
        "✅ Account created. Please check your email to confirm your account, then sign in."
      );
    } else {
      setMessage("✅ Account created. Your LifeOS is ready.");
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-indigo-600">LIFEOS</p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Create your account
        </h1>

        <p className="mb-8 mt-2 text-slate-500">
          Build your system. Track your progress.
        </p>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              placeholder="Minimum 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {message && (
          <p className="mt-5 text-sm text-slate-700">{message}</p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}