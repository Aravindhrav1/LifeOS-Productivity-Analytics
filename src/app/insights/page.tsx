"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LifeOSSidebar from "@/components/LifeOSSidebar";

type Activity = {
  id: number;
  activity_date: string;
  routine_item_id: number | null;
  category_id: number;
  title: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: string | null;
  as_planned: boolean | null;
  build_focus: string | null;
  categories:
    | {
        name: string;
        icon: string | null;
      }
    | {
        name: string;
        icon: string | null;
      }[]
    | null;
};

type Reflection = {
  id: number;
  reflection_date: string;
  mood: number | null;
};

type DailyMetric = {
  date: string;
  dailyScore: number;
  adherence: number;
  buildMinutes: number;
  lostMinutes: number;
  mood: number | null;
};

const categoryNames = [
  "Build",
  "Maintain",
  "Enjoy",
  "Sleep",
  "Lost",
];

const buildFocusNames = [
  "Career",
  "Business",
  "Projects",
  "Learning",
];

function getCategoryName(activity: Activity) {
  if (Array.isArray(activity.categories)) {
    return activity.categories[0]?.name ?? "";
  }

  return activity.categories?.name ?? "";
}

function timeToMinutes(time: string | null) {
  if (!time) return null;

  const [hours, minutes] = time
    .slice(0, 5)
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function getDurationMinutes(
  start: string | null,
  end: string | null
) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (
    startMinutes === null ||
    endMinutes === null
  ) {
    return 0;
  }

  let difference = endMinutes - startMinutes;

  // Handles overnight activities such as 23:00 → 07:00.
  if (difference < 0) {
    difference += 24 * 60;
  }

  return difference;
}

function formatMinutes(minutes: number) {
  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const mins = roundedMinutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${mins}m`;
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  return `${year}-${month}-${day}`;
}

function MetricBar({
  label,
  value,
  maximum,
  displayValue,
}: {
  label: string;
  value: number;
  maximum: number;
  displayValue: string;
}) {
  const width =
    maximum > 0
      ? Math.max(
          2,
          Math.min(100, (value / maximum) * 100)
        )
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm text-slate-600">
          {label}
        </span>

        <span className="text-sm font-semibold text-slate-800">
          {displayValue}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [activities, setActivities] = useState<
    Activity[]
  >([]);

  const [reflections, setReflections] = useState<
    Reflection[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date();
      const startDate = new Date();

      startDate.setDate(today.getDate() - 29);

      const startDateString =
        getDateString(startDate);

      const todayString = getDateString(today);

      const [
        activityResult,
        reflectionResult,
      ] = await Promise.all([
        supabase
          .from("daily_activities")
          .select(`
            id,
            activity_date,
            routine_item_id,
            category_id,
            title,
            planned_start,
            planned_end,
            actual_start,
            actual_end,
            status,
            as_planned,
            build_focus,
            categories (
              name,
              icon
            )
          `)
          .eq("user_id", user.id)
          .gte(
            "activity_date",
            startDateString
          )
          .lte("activity_date", todayString)
          .order("activity_date", {
            ascending: true,
          }),

        supabase
          .from("daily_reflections")
          .select(`
            id,
            reflection_date,
            mood
          `)
          .eq("user_id", user.id)
          .gte(
            "reflection_date",
            startDateString
          )
          .lte(
            "reflection_date",
            todayString
          )
          .order("reflection_date", {
            ascending: true,
          }),
      ]);

      if (activityResult.error) {
        console.error(
          "Error loading insight activities:",
          activityResult.error
        );
      }

      if (reflectionResult.error) {
        console.error(
          "Error loading insight reflections:",
          reflectionResult.error
        );
      }

      setActivities(
        (activityResult.data ?? []) as Activity[]
      );

      setReflections(
        (reflectionResult.data ??
          []) as Reflection[]
      );

      setLoading(false);
    }

    loadInsights();
  }, []);

  const analytics = useMemo(() => {
    const today = new Date();

    const last7Dates: string[] = [];

    for (let index = 6; index >= 0; index--) {
      const date = new Date(today);

      date.setDate(today.getDate() - index);

      last7Dates.push(getDateString(date));
    }

    const reflectionMoodByDate = new Map<
      string,
      number | null
    >();

    reflections.forEach((reflection) => {
      reflectionMoodByDate.set(
        reflection.reflection_date,
        reflection.mood
      );
    });

    const dailyMetrics: DailyMetric[] =
      last7Dates.map((date) => {
        const dayActivities = activities.filter(
          (activity) =>
            activity.activity_date === date
        );

        // Only routine-based activities are part
        // of the Daily Score and Plan Adherence.
        const plannedActivities =
          dayActivities.filter(
            (activity) =>
              activity.routine_item_id !== null
          );

        // Only activities that have reached an
        // outcome are scored.
        // Future/planned activities are ignored.
        const scoredPlannedActivities =
          plannedActivities.filter(
            (activity) =>
              activity.status === "completed" ||
              activity.status === "lost"
          );

        const completedPlannedActivities =
          scoredPlannedActivities.filter(
            (activity) =>
              activity.status === "completed"
          );

        const dailyScore =
          scoredPlannedActivities.length > 0
            ? Math.round(
                (completedPlannedActivities.length /
                  scoredPlannedActivities.length) *
                  100
              )
            : 0;

        // Plan Adherence only evaluates activities
        // that were actually completed.
        const asPlannedCompleted =
          completedPlannedActivities.filter(
            (activity) =>
              activity.as_planned === true
          );

        const adherence =
          completedPlannedActivities.length > 0
            ? Math.round(
                (asPlannedCompleted.length /
                  completedPlannedActivities.length) *
                  100
              )
            : 0;

        let buildMinutes = 0;
        let lostMinutes = 0;

        dayActivities.forEach((activity) => {
          const category =
            getCategoryName(activity);

          // A planned activity explicitly marked Lost
          // keeps its original category in Supabase.
          // Its planned duration therefore belongs to Lost.
          if (
            activity.status === "lost" &&
            activity.routine_item_id !== null
          ) {
            lostMinutes += getDurationMinutes(
              activity.planned_start,
              activity.planned_end
            );

            return;
          }

          if (activity.status !== "completed") {
            return;
          }

          const minutes = getDurationMinutes(
            activity.actual_start ??
              activity.planned_start,
            activity.actual_end ??
              activity.planned_end
          );

          if (category === "Build") {
            buildMinutes += minutes;
          }

          // Supports manually logged Lost activities.
          if (category === "Lost") {
            lostMinutes += minutes;
          }
        });

        return {
          date,
          dailyScore,
          adherence,
          buildMinutes,
          lostMinutes,
          mood:
            reflectionMoodByDate.get(date) ??
            null,
        };
      });

    // Only include days where an activity actually
    // reached an outcome when calculating Avg Score.
    const daysWithScoredActivity =
      dailyMetrics.filter((metric) =>
        activities.some(
          (activity) =>
            activity.activity_date ===
              metric.date &&
            activity.routine_item_id !== null &&
            (activity.status === "completed" ||
              activity.status === "lost")
        )
      );

    const averageDailyScore =
      daysWithScoredActivity.length > 0
        ? Math.round(
            daysWithScoredActivity.reduce(
              (total, metric) =>
                total + metric.dailyScore,
              0
            ) /
              daysWithScoredActivity.length
          )
        : 0;

    // Plan Adherence only averages days where
    // at least one planned activity was completed.
    const daysWithCompletedPlanned =
      dailyMetrics.filter((metric) => {
        return activities.some(
          (activity) =>
            activity.activity_date ===
              metric.date &&
            activity.routine_item_id !== null &&
            activity.status === "completed"
        );
      });

    const averageAdherence =
      daysWithCompletedPlanned.length > 0
        ? Math.round(
            daysWithCompletedPlanned.reduce(
              (total, metric) =>
                total + metric.adherence,
              0
            ) /
              daysWithCompletedPlanned.length
          )
        : 0;

    const weeklyBuildMinutes =
      dailyMetrics.reduce(
        (total, metric) =>
          total + metric.buildMinutes,
        0
      );

    const weeklyLostMinutes =
      dailyMetrics.reduce(
        (total, metric) =>
          total + metric.lostMinutes,
        0
      );

    const moods = dailyMetrics
      .map((metric) => metric.mood)
      .filter(
        (mood): mood is number =>
          mood !== null
      );

    const averageMood =
      moods.length > 0
        ? (
            moods.reduce(
              (total, mood) =>
                total + mood,
              0
            ) / moods.length
          ).toFixed(1)
        : "0.0";

    const categoryMinutes: Record<
      string,
      number
    > = {};

    categoryNames.forEach((category) => {
      categoryMinutes[category] = 0;
    });

    const buildFocusMinutes: Record<
      string,
      number
    > = {};

    buildFocusNames.forEach((focus) => {
      buildFocusMinutes[focus] = 0;
    });

    const last7Set = new Set(last7Dates);

    activities
      .filter((activity) =>
        last7Set.has(activity.activity_date)
      )
      .forEach((activity) => {
        const category =
          getCategoryName(activity);

        // Planned routine item marked Lost.
        // Do not add it to its original category.
        if (
          activity.status === "lost" &&
          activity.routine_item_id !== null
        ) {
          const minutes =
            getDurationMinutes(
              activity.planned_start,
              activity.planned_end
            );

          categoryMinutes["Lost"] += minutes;

          return;
        }

        // Planned activities with no outcome do not
        // contribute to actual time allocation.
        if (
          activity.status !== "completed"
        ) {
          return;
        }

        const minutes =
          getDurationMinutes(
            activity.actual_start ??
              activity.planned_start,
            activity.actual_end ??
              activity.planned_end
          );

        if (category in categoryMinutes) {
          categoryMinutes[category] +=
            minutes;
        }

        if (
          category === "Build" &&
          activity.build_focus &&
          activity.build_focus in
            buildFocusMinutes
        ) {
          buildFocusMinutes[
            activity.build_focus
          ] += minutes;
        }
      });

    return {
      dailyMetrics,
      averageDailyScore,
      averageAdherence,
      weeklyBuildMinutes,
      weeklyLostMinutes,
      averageMood,
      categoryMinutes,
      buildFocusMinutes,
    };
  }, [activities, reflections]);

  const maximumCategoryMinutes = Math.max(
    ...Object.values(
      analytics.categoryMinutes
    ),
    1
  );

  const maximumBuildFocusMinutes = Math.max(
    ...Object.values(
      analytics.buildFocusMinutes
    ),
    1
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <LifeOSSidebar />

      <section className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-10">
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                Insights
              </p>

              <h1 className="mt-1 text-4xl font-bold text-slate-900">
                Turn your days into data.
              </h1>

              <p className="mt-2 text-slate-500">
                Understand how you spend your
                time, follow your plan and invest
                in your future.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              Loading insights...
            </div>
          ) : (
            <>
              {/* KPI CARDS */}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Avg Daily Score
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {analytics.averageDailyScore}%
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Last 7 days
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Plan Adherence
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {analytics.averageAdherence}%
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    7-day average
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Future Building
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatMinutes(
                      analytics.weeklyBuildMinutes
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Last 7 days
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Lost Time
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatMinutes(
                      analytics.weeklyLostMinutes
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Last 7 days
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Average Mood
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {analytics.averageMood}
                    <span className="ml-1 text-base font-normal text-slate-400">
                      / 5
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Journal entries
                  </p>
                </div>
              </div>

              {/* 7 DAY PERFORMANCE */}

              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    7-Day Performance
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Daily Score, adherence, Build
                    time, Lost time and mood.
                  </p>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <div className="min-w-[750px]">
                    <div className="grid grid-cols-7 gap-3">
                      {analytics.dailyMetrics.map(
                        (metric) => (
                          <div
                            key={metric.date}
                            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                          >
                            <p className="text-xs font-medium text-slate-400">
                              {formatShortDate(
                                metric.date
                              )}
                            </p>

                            <div className="mt-4">
                              <p className="text-xs text-slate-400">
                                Score
                              </p>

                              <p className="mt-1 text-xl font-bold text-slate-900">
                                {
                                  metric.dailyScore
                                }
                                %
                              </p>
                            </div>

                            <div className="mt-4">
                              <p className="text-xs text-slate-400">
                                Adherence
                              </p>

                              <p className="mt-1 font-semibold text-slate-700">
                                {
                                  metric.adherence
                                }
                                %
                              </p>
                            </div>

                            <div className="mt-4">
                              <p className="text-xs text-slate-400">
                                Build
                              </p>

                              <p className="mt-1 font-semibold text-indigo-600">
                                {formatMinutes(
                                  metric.buildMinutes
                                )}
                              </p>
                            </div>

                            <div className="mt-4">
                              <p className="text-xs text-slate-400">
                                Lost
                              </p>

                              <p className="mt-1 font-semibold text-slate-700">
                                {formatMinutes(
                                  metric.lostMinutes
                                )}
                              </p>
                            </div>

                            <div className="mt-4">
                              <p className="text-xs text-slate-400">
                                Mood
                              </p>

                              <p className="mt-1 text-lg">
                                {metric.mood ===
                                null
                                  ? "—"
                                  : metric.mood ===
                                      1
                                    ? "😞"
                                    : metric.mood ===
                                        2
                                      ? "😕"
                                      : metric.mood ===
                                          3
                                        ? "😐"
                                        : metric.mood ===
                                            4
                                          ? "🙂"
                                          : "😄"}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* TIME ALLOCATION */}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Time Allocation
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Actual completed time plus
                      Lost time over the last 7
                      days.
                    </p>
                  </div>

                  <div className="mt-6 space-y-5">
                    {categoryNames.map(
                      (category) => (
                        <MetricBar
                          key={category}
                          label={category}
                          value={
                            analytics
                              .categoryMinutes[
                              category
                            ]
                          }
                          maximum={
                            maximumCategoryMinutes
                          }
                          displayValue={formatMinutes(
                            analytics
                              .categoryMinutes[
                              category
                            ]
                          )}
                        />
                      )
                    )}
                  </div>
                </section>

                {/* BUILD FOCUS */}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Build Focus
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Where your Future Building
                      time is going.
                    </p>
                  </div>

                  <div className="mt-6 space-y-5">
                    {buildFocusNames.map(
                      (focus) => (
                        <MetricBar
                          key={focus}
                          label={focus}
                          value={
                            analytics
                              .buildFocusMinutes[
                              focus
                            ]
                          }
                          maximum={
                            maximumBuildFocusMinutes
                          }
                          displayValue={formatMinutes(
                            analytics
                              .buildFocusMinutes[
                              focus
                            ]
                          )}
                        />
                      )
                    )}
                  </div>
                </section>
              </div>

              {/* ANALYTICS NOTE */}

              <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  LifeOS Analytics
                </p>

                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  Your data becomes more valuable
                  over time.
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  LifeOS is collecting planned
                  activity, actual activity,
                  adherence, Build focus, Lost time
                  and mood data. As more days are
                  recorded, this page will reveal
                  stronger patterns in consistency,
                  time allocation and progress
                  toward your future.
                </p>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}