"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        },
      },
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage(
        "✅ Account created. Check your email if Supabase asks you to confirm your account."
      );
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <p className="text-sm font-semibold text-indigo-600">LIFEOS</p>

        <h1 className="text-3xl font-bold text-slate-900 mt-2">
          Create your account
        </h1>

        <p className="text-slate-500 mt-2 mb-8">
          Build your system. Track your progress.
        </p>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Name
            </label>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Minimum 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {message && (
          <p className="mt-5 text-sm text-slate-700">{message}</p>
        )}
      </div>
    </main>
  );
}