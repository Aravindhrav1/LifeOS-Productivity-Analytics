"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LifeOSSidebar from "@/components/LifeOSSidebar";

type Reflection = {
  id: number;
  reflection_date: string;
  mood: number | null;
  reflection: string | null;
  gratitude: string | null;
  highlight: string | null;
  improvement: string | null;
  created_at: string;
  updated_at: string;
};

const moodEmojis: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

const moodLabels: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export default function JournalPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReflection, setSelectedReflection] =
    useState<Reflection | null>(null);

  useEffect(() => {
    async function loadJournal() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("daily_reflections")
        .select(
          `
          id,
          reflection_date,
          mood,
          reflection,
          gratitude,
          highlight,
          improvement,
          created_at,
          updated_at
          `
        )
        .eq("user_id", user.id)
        .order("reflection_date", { ascending: false });

      if (error) {
        console.error("Error loading journal:", error);
      }

      setReflections(data ?? []);
      setLoading(false);
    }

    loadJournal();
  }, []);

  const reflectionsWithMood = reflections.filter(
    (item) => item.mood !== null
  );

  const averageMood =
    reflectionsWithMood.length > 0
      ? (
          reflectionsWithMood.reduce(
            (total, item) => total + (item.mood ?? 0),
            0
          ) / reflectionsWithMood.length
        ).toFixed(1)
      : "0.0";

  const greatDays = reflections.filter(
    (item) => (item.mood ?? 0) >= 4
  ).length;

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  }

  return (
  <main className="min-h-screen bg-slate-50 text-slate-900">
    <LifeOSSidebar />

    <section className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Journal
            </p>

            <h1 className="mt-1 text-4xl font-bold text-slate-900">
              Your days tell a story.
            </h1>

            <p className="mt-2 text-slate-500">
              Review your reflections, moods, wins and lessons over time.
            </p>
          </div>

          
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            Loading your journal...
          </div>
        ) : (
          <>
            {/* KPI Cards */}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Journal entries
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {reflections.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Average mood
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <p className="text-3xl font-bold text-slate-900">
                    {averageMood}
                  </p>

                  <span className="text-sm text-slate-400">
                    / 5
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Good days
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {greatDays}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Mood 4 or 5
                </p>
              </div>
            </div>

            {/* Journal History */}

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Reflection history
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Your most recent reflections appear first.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {reflections.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <p className="font-medium text-slate-600">
                      No journal entries yet.
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Complete Daily Reflection on the Today page and it
                      will appear here automatically.
                    </p>
                  </div>
                ) : (
                  reflections.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedReflection(item)}
                      className="block w-full rounded-xl border border-slate-100 p-5 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatDate(item.reflection_date)}
                          </p>

                          {item.highlight && (
                            <p className="mt-2 text-sm text-slate-600">
                              <span className="font-medium">
                                Highlight:
                              </span>{" "}
                              {item.highlight}
                            </p>
                          )}
                        </div>

                        {item.mood !== null && (
                          <div className="text-right">
                            <span className="text-3xl">
                              {moodEmojis[item.mood] ?? "😐"}
                            </span>

                            <p className="mt-1 text-xs text-slate-400">
                              {moodLabels[item.mood]}
                            </p>
                          </div>
                        )}
                      </div>

                      {item.reflection && (
                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                          {item.reflection}
                        </p>
                      )}

                      <p className="mt-4 text-xs font-medium text-indigo-500">
                        View reflection →
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Reflection Detail Modal */}

      {selectedReflection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  Daily Reflection
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {formatDate(selectedReflection.reflection_date)}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReflection(null)}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {selectedReflection.mood !== null && (
              <div className="mt-6 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                <span className="text-4xl">
                  {moodEmojis[selectedReflection.mood] ?? "😐"}
                </span>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Mood
                  </p>

                  <p className="font-semibold text-slate-800">
                    {moodLabels[selectedReflection.mood]} ·{" "}
                    {selectedReflection.mood}/5
                  </p>
                </div>
              </div>
            )}

            {selectedReflection.reflection && (
              <div className="mt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Reflection
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                  {selectedReflection.reflection}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {selectedReflection.highlight && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    ⭐ Highlight
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedReflection.highlight}
                  </p>
                </div>
              )}

              {selectedReflection.gratitude && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    🙏 Gratitude
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedReflection.gratitude}
                  </p>
                </div>
              )}

              {selectedReflection.improvement && (
                <div className="rounded-xl border border-slate-100 p-4 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    🌱 Improvement
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedReflection.improvement}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReflection(null)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  </main>
);
}