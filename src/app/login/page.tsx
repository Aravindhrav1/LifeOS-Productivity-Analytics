"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/client";

const DEFAULT_CATEGORIES = [
  { name: "Lost", type: "Lost", icon: "🔴", is_active: true },
  { name: "Maintain", type: "Maintain", icon: "🏠", is_active: true },
  { name: "Build", type: "Build", icon: "🚀", is_active: true },
  { name: "Enjoy", type: "Enjoy", icon: "💗", is_active: true },
  { name: "Sleep", type: "Sleep", icon: "😴", is_active: true },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: loginData,
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setMessage(`❌ ${loginError.message}`);
      setLoading(false);
      return;
    }

    const user = loginData.user;

    if (!user) {
      setMessage("❌ Unable to load your account. Please try again.");
      setLoading(false);
      return;
    }

    // Check which LifeOS categories this user already has.
    const {
      data: existingCategories,
      error: categoryCheckError,
    } = await supabase
      .from("categories")
      .select("name")
      .eq("user_id", user.id);

    if (categoryCheckError) {
      console.error(
        "Unable to check LifeOS categories:",
        categoryCheckError
      );

      setMessage(
        "❌ Signed in, but LifeOS could not initialise your categories."
      );
      setLoading(false);
      return;
    }

    const existingNames = new Set(
      (existingCategories ?? []).map((category) => category.name)
    );

    // Create only categories that are missing.
    const missingCategories = DEFAULT_CATEGORIES.filter(
      (category) => !existingNames.has(category.name)
    ).map((category) => ({
      ...category,
      user_id: user.id,
    }));

    if (missingCategories.length > 0) {
      const { error: categoryInsertError } = await supabase
        .from("categories")
        .insert(missingCategories);

      if (categoryInsertError) {
        console.error(
          "Unable to create LifeOS categories:",
          categoryInsertError
        );

        setMessage(
          "❌ Signed in, but LifeOS could not initialise your categories."
        );
        setLoading(false);
        return;
      }
    }

    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-indigo-600">
          LIFEOS
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Welcome back
        </h1>

        <p className="mb-8 mt-2 text-slate-500">
          Sign in to continue building your system.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {message && (
          <p className="mt-5 text-sm text-rose-600">
            {message}
          </p>
        )}

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-500">
            New to LifeOS?{" "}
            <Link
              href="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}