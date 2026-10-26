"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/client";
import LifeOSSidebar from "@/components/LifeOSSidebar";

type Activity = {
  id: number | string;
  activity_date: string;
  routine_item_id: number | string | null;
  category_id: number | string | null;
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

type DailyMetric = {
  date: string;
  dailyScore: number | null;
  adherence: number | null;
};

type LostDriver = {
  title: string;
  minutes: number;
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
  "Unassigned",
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

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)}h`;
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

  const day = String(
    date.getDate()
  ).padStart(2, "0");

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
          value > 0 ? 2 : 0,
          Math.min(
            100,
            (value / maximum) * 100
          )
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
          style={{
            width: `${width}%`,
          }}
        />
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {note}
      </p>
    </div>
  );
}

/* ======================================================
   PERFORMANCE LINE CHART
====================================================== */

function PerformanceChart({
  metrics,
  periodDays,
}: {
  metrics: DailyMetric[];
  periodDays: 7 | 30;
}) {
  const width =
    periodDays === 30 ? 1200 : 900;

  const height = 300;

  const paddingLeft = 48;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth =
    width - paddingLeft - paddingRight;

  const chartHeight =
    height - paddingTop - paddingBottom;

  function xPosition(index: number) {
    if (metrics.length <= 1) {
      return paddingLeft;
    }

    return (
      paddingLeft +
      (index / (metrics.length - 1)) *
        chartWidth
    );
  }

  function yPosition(value: number) {
    return (
      paddingTop +
      chartHeight -
      (value / 100) * chartHeight
    );
  }

  function buildSegments(
    key: "dailyScore" | "adherence"
  ) {
    const segments: string[][] = [];
    let current: string[] = [];

    metrics.forEach((metric, index) => {
      const value = metric[key];

      if (value === null) {
        if (current.length > 0) {
          segments.push(current);
          current = [];
        }

        return;
      }

      current.push(
        `${xPosition(index)},${yPosition(
          value
        )}`
      );
    });

    if (current.length > 0) {
      segments.push(current);
    }

    return segments;
  }

  const scoreSegments =
    buildSegments("dailyScore");

  const adherenceSegments =
    buildSegments("adherence");

  return (
    <div className="mt-6 overflow-x-auto">
      <div
        style={{
          minWidth:
            periodDays === 30
              ? "1100px"
              : "700px",
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[300px] w-full"
          role="img"
          aria-label="Daily Score and Plan Adherence trend"
        >
          {/* Horizontal grid */}

          {[0, 25, 50, 75, 100].map(
            (value) => {
              const y = yPosition(value);

              return (
                <g key={value}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={
                      width - paddingRight
                    }
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />

                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#94a3b8"
                  >
                    {value}%
                  </text>
                </g>
              );
            }
          )}

          {/* Daily Score */}

          {scoreSegments.map(
            (segment, index) => (
              <polyline
                key={`score-${index}`}
                points={segment.join(" ")}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          )}

          {/* Plan Adherence */}

          {adherenceSegments.map(
            (segment, index) => (
              <polyline
                key={`adherence-${index}`}
                points={segment.join(" ")}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          )}

          {/* Data points */}

          {metrics.map((metric, index) => {
            const x = xPosition(index);

            return (
              <g key={metric.date}>
                {metric.dailyScore !==
                  null && (
                  <circle
                    cx={x}
                    cy={yPosition(
                      metric.dailyScore
                    )}
                    r="5"
                    fill="#6366f1"
                  >
                    <title>
                      {`${formatShortDate(
                        metric.date
                      )} — Daily Score: ${metric.dailyScore.toFixed(
                        0
                      )}%`}
                    </title>
                  </circle>
                )}

                {metric.adherence !==
                  null && (
                  <circle
                    cx={x}
                    cy={yPosition(
                      metric.adherence
                    )}
                    r="5"
                    fill="#94a3b8"
                  >
                    <title>
                      {`${formatShortDate(
                        metric.date
                      )} — Plan Adherence: ${metric.adherence.toFixed(
                        0
                      )}%`}
                    </title>
                  </circle>
                )}

                {(periodDays === 7 ||
                  index % 3 === 0 ||
                  index ===
                    metrics.length - 1) && (
                  <text
                    x={x}
                    y={height - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#94a3b8"
                  >
                    {formatShortDate(
                      metric.date
                    )}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            Daily Score
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Plan Adherence
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   PAGE
====================================================== */

export default function InsightsPage() {
  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [periodDays, setPeriodDays] =
    useState<7 | 30>(7);

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

      startDate.setDate(
        today.getDate() - 29
      );

      const startDateString =
        getDateString(startDate);

      const todayString =
        getDateString(today);

      const { data, error } =
        await supabase
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
          .lte(
            "activity_date",
            todayString
          )
          .order("activity_date", {
            ascending: true,
          });

      if (error) {
        console.error(
          "Error loading insight activities:",
          error
        );
      }

      setActivities(
        (data ?? []) as unknown as Activity[]
      );

      setLoading(false);
    }

    loadInsights();
  }, []);

  /* ====================================================
     ANALYTICS
  ==================================================== */

  const analytics = useMemo(() => {
    const today = new Date();

    const selectedDates: string[] = [];

    for (
      let index = periodDays - 1;
      index >= 0;
      index--
    ) {
      const date = new Date(today);

      date.setDate(
        today.getDate() - index
      );

      selectedDates.push(
        getDateString(date)
      );
    }

    const selectedDateSet =
      new Set(selectedDates);

    const selectedActivities =
      activities.filter((activity) =>
        selectedDateSet.has(
          activity.activity_date
        )
      );

    /* -----------------------------------------------
       DAILY SCORE / ADHERENCE
    ----------------------------------------------- */

    const resolvedRoutine =
      selectedActivities.filter(
        (activity) =>
          activity.routine_item_id !==
            null &&
          (activity.status ===
            "completed" ||
            activity.status === "lost")
      );

    const completedRoutine =
      resolvedRoutine.filter(
        (activity) =>
          activity.status ===
          "completed"
      );

    const completedAsPlanned =
      completedRoutine.filter(
        (activity) =>
          activity.as_planned === true
      );

    const dailyScore =
      resolvedRoutine.length > 0
        ? (completedRoutine.length /
            resolvedRoutine.length) *
          100
        : 0;

    const planAdherence =
      completedRoutine.length > 0
        ? (completedAsPlanned.length /
            completedRoutine.length) *
          100
        : 0;

    /* -----------------------------------------------
       TIME METRICS
    ----------------------------------------------- */

    let buildMinutes = 0;

    let completedMinutes = 0;

    // IMPORTANT:
    // This contains ONLY planned routine
    // activities that were marked Lost.
    let plannedRoutineLostMinutes = 0;

    let resolvedPlannedMinutes = 0;

    const categoryMinutes: Record<
      string,
      number
    > = {};

    categoryNames.forEach(
      (category) => {
        categoryMinutes[category] = 0;
      }
    );

    const buildFocusMinutes: Record<
      string,
      number
    > = {};

    buildFocusNames.forEach(
      (focus) => {
        buildFocusMinutes[focus] = 0;
      }
    );

    const lostDriverMap: Record<
      string,
      number
    > = {};

    selectedActivities.forEach(
      (activity) => {
        const category =
          getCategoryName(activity);

        // Resolved planned routine time
        if (
          activity.routine_item_id !==
            null &&
          (activity.status ===
            "completed" ||
            activity.status === "lost")
        ) {
          resolvedPlannedMinutes +=
            getDurationMinutes(
              activity.planned_start,
              activity.planned_end
            );
        }

        // Planned routine marked Lost
        if (
          activity.status === "lost" &&
          activity.routine_item_id !==
            null
        ) {
          const minutes =
            getDurationMinutes(
              activity.planned_start,
              activity.planned_end
            );

          plannedRoutineLostMinutes +=
            minutes;

          // Lost goes to Lost allocation,
          // not the original category.
          categoryMinutes["Lost"] +=
            minutes;

          lostDriverMap[
            activity.title
          ] =
            (lostDriverMap[
              activity.title
            ] ?? 0) + minutes;

          return;
        }

        // Only completed activities
        // contribute actual completed time.
        if (
          activity.status !==
          "completed"
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

        completedMinutes += minutes;

        if (
          category in categoryMinutes
        ) {
          categoryMinutes[
            category
          ] += minutes;
        }

        if (category === "Build") {
          buildMinutes += minutes;

          const validFocus =
            activity.build_focus &&
            [
              "Career",
              "Business",
              "Projects",
              "Learning",
            ].includes(
              activity.build_focus
            )
              ? activity.build_focus
              : "Unassigned";

          buildFocusMinutes[
            validFocus
          ] += minutes;
        }
      }
    );

    const buildPercent =
      completedMinutes > 0
        ? (buildMinutes /
            completedMinutes) *
          100
        : 0;

    const lostTimePercent =
      resolvedPlannedMinutes > 0
        ? (plannedRoutineLostMinutes /
            resolvedPlannedMinutes) *
          100
        : 0;

    const buildToLostRatio =
      plannedRoutineLostMinutes > 0
        ? buildMinutes /
          plannedRoutineLostMinutes
        : null;

    const lostDrivers: LostDriver[] =
      Object.entries(lostDriverMap)
        .map(
          ([title, minutes]) => ({
            title,
            minutes,
          })
        )
        .sort(
          (a, b) =>
            b.minutes - a.minutes
        )
        .slice(0, 5);

    /* -----------------------------------------------
       DAILY PERFORMANCE TREND
    ----------------------------------------------- */

    const dailyMetrics: DailyMetric[] =
      selectedDates.map((date) => {
        const dayActivities =
          selectedActivities.filter(
            (activity) =>
              activity.activity_date ===
              date
          );

        const dayRoutine =
          dayActivities.filter(
            (activity) =>
              activity.routine_item_id !==
                null &&
              (activity.status ===
                "completed" ||
                activity.status ===
                  "lost")
          );

        const dayCompleted =
          dayRoutine.filter(
            (activity) =>
              activity.status ===
              "completed"
          );

        const dayAsPlanned =
          dayCompleted.filter(
            (activity) =>
              activity.as_planned === true
          );

        const dayDailyScore =
          dayRoutine.length > 0
            ? (dayCompleted.length /
                dayRoutine.length) *
              100
            : null;

        const dayAdherence =
          dayCompleted.length > 0
            ? (dayAsPlanned.length /
                dayCompleted.length) *
              100
            : null;

        return {
          date,
          dailyScore:
            dayDailyScore,
          adherence:
            dayAdherence,
        };
      });

    return {
      dailyScore,
      planAdherence,
      buildMinutes,
      completedMinutes,
      plannedRoutineLostMinutes,
      resolvedPlannedMinutes,
      buildPercent,
      lostTimePercent,
      buildToLostRatio,
      categoryMinutes,
      buildFocusMinutes,
      lostDrivers,
      dailyMetrics,
    };
  }, [activities, periodDays]);

  const maximumCategoryMinutes =
    Math.max(
      ...Object.values(
        analytics.categoryMinutes
      ),
      1
    );

  const maximumBuildFocusMinutes =
    Math.max(
      ...Object.values(
        analytics.buildFocusMinutes
      ),
      1
    );

  const maximumLostDriverMinutes =
    Math.max(
      ...analytics.lostDrivers.map(
        (driver) => driver.minutes
      ),
      1
    );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <LifeOSSidebar />

      <section className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-10">
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                Insights
              </p>

              <h1 className="mt-1 text-4xl font-bold text-slate-900">
                Turn your days into data.
              </h1>

              <p className="mt-2 max-w-2xl text-slate-500">
                Understand your execution,
                schedule adherence, time
                allocation and investment in
                your future.
              </p>
            </div>

            {/* Period */}

            <div className="flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">

              <button
                type="button"
                onClick={() =>
                  setPeriodDays(7)
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  periodDays === 7
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                7 Days
              </button>

              <button
                type="button"
                onClick={() =>
                  setPeriodDays(30)
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  periodDays === 30
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                30 Days
              </button>

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

                <KpiCard
                  title="Daily Score"
                  value={`${analytics.dailyScore.toFixed(
                    1
                  )}%`}
                  note={`${periodDays}-day period`}
                />

                <KpiCard
                  title="Plan Adherence"
                  value={`${analytics.planAdherence.toFixed(
                    1
                  )}%`}
                  note={`${periodDays}-day period`}
                />

                <KpiCard
                  title="Build Hours"
                  value={formatHours(
                    analytics.buildMinutes
                  )}
                  note={`${periodDays}-day period`}
                />

                <KpiCard
                  title="Build %"
                  value={`${analytics.buildPercent.toFixed(
                    1
                  )}%`}
                  note="Share of completed time"
                />

                <KpiCard
                  title="Lost Time"
                  value={`${analytics.lostTimePercent.toFixed(
                    1
                  )}%`}
                  note={`${formatMinutes(
                    analytics.plannedRoutineLostMinutes
                  )} planned time lost`}
                />

              </div>

              {/* PERFORMANCE TREND */}

              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Performance Trend
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Daily Score and Plan
                    Adherence across the selected
                    period.
                  </p>
                </div>

                <PerformanceChart
                  metrics={
                    analytics.dailyMetrics
                  }
                  periodDays={periodDays}
                />

              </section>

              {/* TIME ALLOCATION + BUILD FOCUS */}

              <div className="mt-6 grid gap-6 lg:grid-cols-2">

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <h2 className="text-lg font-semibold text-slate-900">
                    Time Allocation
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Completed time plus Lost
                    planned time during the
                    selected period.
                  </p>

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

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <h2 className="text-lg font-semibold text-slate-900">
                    Build Focus
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Where your completed Build
                    time is being invested.
                  </p>

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

              {/* LOST TIME DRIVERS */}

              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Lost Time Drivers
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Planned routine activities
                      responsible for the most
                      Lost time.
                    </p>
                  </div>

                  <div className="text-left sm:text-right">

                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Build-to-Lost Ratio
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {analytics
                        .buildToLostRatio ===
                      null
                        ? "—"
                        : `${analytics.buildToLostRatio.toFixed(
                            1
                          )}x`}
                    </p>

                  </div>

                </div>

                <div className="mt-6 space-y-5">

                  {analytics.lostDrivers
                    .length > 0 ? (

                    analytics.lostDrivers.map(
                      (driver) => (
                        <MetricBar
                          key={driver.title}
                          label={driver.title}
                          value={driver.minutes}
                          maximum={
                            maximumLostDriverMinutes
                          }
                          displayValue={formatMinutes(
                            driver.minutes
                          )}
                        />
                      )
                    )

                  ) : (

                    <div className="rounded-xl bg-slate-50 p-5">

                      <p className="text-sm font-medium text-slate-700">
                        No Lost routine activities
                        in this period.
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Lost Time Drivers will
                        appear here when planned
                        routine activities are
                        marked Lost.
                      </p>

                    </div>

                  )}

                </div>

              </section>

              {/* EXPLANATION */}

              <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">

                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  LifeOS Analytics
                </p>

                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  One view of execution, time and
                  future investment.
                </h2>

                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                  Daily Score measures how many
                  resolved routine activities were
                  completed. Plan Adherence shows
                  how many completed routine
                  activities followed the original
                  plan. Build % shows the share of
                  completed time invested in Build,
                  while Lost Time measures planned
                  routine time marked Lost against
                  resolved planned routine time.
                </p>

              </section>

            </>

          )}

        </div>
      </section>
    </main>
  );
}