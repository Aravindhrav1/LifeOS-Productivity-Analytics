"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import Link from "next/link";
import LifeOSSidebar from "@/components/LifeOSSidebar";


type RoutineItem = {
  id: number;
  time: string;
  endTime: string | null;
  activity: string;
  type: string;
  icon: string;
  done: boolean;
  status: string;
  actualStart: string | null;
  actualEnd: string | null;
  asPlanned: boolean;
  isManual: boolean;
  buildFocus: string | null;
};

export default function Home() {
  const [userName, setUserName] = useState("");
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [routineLoading, setRoutineLoading] = useState(true);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0);
  const [yesterdayScore, setYesterdayScore] = useState<number | null>(null);

  const [yesterdayLostMinutes, setYesterdayLostMinutes] =
  useState<number | null>(null);

  const [weeklyBuildMinutes, setWeeklyBuildMinutes] = useState(0);

  const [reflectionMood, setReflectionMood] = useState<number | null>(null);
const [reflectionText, setReflectionText] = useState("");
const [reflectionGratitude, setReflectionGratitude] = useState("");
const [reflectionHighlight, setReflectionHighlight] = useState("");
const [reflectionImprovement, setReflectionImprovement] = useState("");
const [reflectionSaved, setReflectionSaved] = useState(false);
const [isSavingReflection, setIsSavingReflection] = useState(false);

const [showQuickCapture, setShowQuickCapture] = useState(false);
const [quickTitle, setQuickTitle] = useState("");
const [quickDescription, setQuickDescription] = useState("");
const [quickType, setQuickType] = useState("project");
const [quickPriority, setQuickPriority] = useState("medium");
const [quickNextAction, setQuickNextAction] = useState("");
const [isSavingQuickCapture, setIsSavingQuickCapture] = useState(false);

  const completedActivities = routine.filter((item) => item.done);

// Only routine activities count towards Plan Adherence.
// Manually logged activities are excluded.
const completedPlannedActivities = completedActivities.filter(
  (item) => !item.isManual
);

const completedAsPlanned = completedPlannedActivities.filter(
  (item) => item.asPlanned
);

const planAdherence =
  completedPlannedActivities.length > 0
    ? Math.round(
        (completedAsPlanned.length /
          completedPlannedActivities.length) *
          100
      )
    : 0;

        // Daily Score:
// Score only activities that already have an outcome.
// Future/planned activities do not reduce the score yet.
// Completed = success, Lost = unsuccessful.
// Manual activities are excluded.

const plannedActivities = routine.filter(
  (item) => !item.isManual
);

const scoredActivities = plannedActivities.filter(
  (item) =>
    item.status === "completed" ||
    item.status === "lost"
);

const completedPlannedCount = scoredActivities.filter(
  (item) => item.status === "completed"
).length;

const dailyScore =
  scoredActivities.length > 0
    ? Math.round(
        (completedPlannedCount / scoredActivities.length) * 100
      )
    : 0;

    // Today's Lost Time in minutes
const lostMinutes = routine
  .filter(
    (item) =>
      item.status === "lost" ||
      (item.done && item.type === "Lost")
  )
  .reduce((total, item) => {
    return (
      total +
      getDurationMinutes(
        item.status === "lost"
          ? item.time
          : item.actualStart ?? item.time,
        item.status === "lost"
          ? item.endTime
          : item.actualEnd ?? item.endTime
      )
    );
  }, 0);

  // Build Focus totals
const buildFocusMinutes = {
  Career: 0,
  Business: 0,
  Projects: 0,
  Learning: 0,
};

routine
  .filter(
    (item) =>
      item.done &&
      item.type === "Build" &&
      item.buildFocus
  )
  .forEach((item) => {
    const minutes = getDurationMinutes(
      item.actualStart ?? item.time,
      item.actualEnd ?? item.endTime
    );

    const focus = item.buildFocus as keyof typeof buildFocusMinutes;

    if (focus in buildFocusMinutes) {
      buildFocusMinutes[focus] += minutes;
    }
  });

function formatBuildFocusTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

    function getDurationMinutes(
  start: string | null,
  end: string | null
) {
  if (!start || !end) return 0;

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  const startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;

  // Handles activities such as Sleep: 23:00 → 07:00
  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }

  return endTotal - startTotal;
}

const futureBuildingMinutes = routine
  .filter((item) => item.done && item.type === "Build")
  .reduce((total, item) => {
    return (
      total +
      getDurationMinutes(
        item.actualStart ?? item.time,
        item.actualEnd ?? item.endTime
      )
    );
  }, 0);

const futureBuildingHours = Math.floor(
  futureBuildingMinutes / 60
);

const futureBuildingRemainingMinutes =
  futureBuildingMinutes % 60;

const futureBuildingDisplay =
  futureBuildingHours > 0
    ? `${futureBuildingHours}h ${futureBuildingRemainingMinutes}m`
    : `${futureBuildingRemainingMinutes}m`;

    const categoryMinutes = routine
  .filter((item) => item.done)
  .reduce<Record<string, number>>((totals, item) => {
    const minutes = getDurationMinutes(
      item.actualStart ?? item.time,
      item.actualEnd ?? item.endTime
    );

    totals[item.type] = (totals[item.type] ?? 0) + minutes;

    return totals;
  }, {});

// Planned activities marked as Lost keep their original category
// in the database, so add their planned duration to Lost instead.
categoryMinutes["Lost"] = lostMinutes;

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;

  return `${hours}h ${remainingMinutes}m`;
}

const timeAllocation = [
  {
    name: "Build",
    minutes: categoryMinutes["Build"] ?? 0,
    color: "bg-indigo-500",
  },
  {
    name: "Maintain",
    minutes: categoryMinutes["Maintain"] ?? 0,
    color: "bg-slate-500",
  },
  {
    name: "Enjoy",
    minutes: categoryMinutes["Enjoy"] ?? 0,
    color: "bg-sky-500",
  },
  {
    name: "Sleep",
    minutes: categoryMinutes["Sleep"] ?? 0,
    color: "bg-violet-400",
  },
  {
    name: "Lost",
    minutes: categoryMinutes["Lost"] ?? 0,
    color: "bg-rose-400",
  },
];

const totalAllocatedMinutes = timeAllocation.reduce(
  (total, category) => total + category.minutes,
  0
);

  // Activity selected when the user clicks the completion circle.
  const [completingActivity, setCompletingActivity] =
    useState<RoutineItem | null>(null);

  // Activity selected when the user wants to enter different actual times.
  const [adjustingActivity, setAdjustingActivity] =
    useState<RoutineItem | null>(null);

  const [actualStart, setActualStart] = useState("");
const [actualEnd, setActualEnd] = useState("");

const [showAddActivity, setShowAddActivity] = useState(false);
const [isSavingActivity, setIsSavingActivity] = useState(false);

const [newActivityTitle, setNewActivityTitle] = useState("");
const [newActivityCategory, setNewActivityCategory] = useState("Lost");

const [newActivityBuildFocus, setNewActivityBuildFocus] =
  useState("Projects");

const [newActivityStart, setNewActivityStart] = useState("");
const [newActivityEnd, setNewActivityEnd] = useState("");

  useEffect(() => {
    async function loadTodayRoutine() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user:", userError);
        setRoutineLoading(false);
        return;
      }

      if (!user) {
        console.log("No signed-in user.");
        setRoutineLoading(false);
        return;
      }

      const displayName =
  user.user_metadata?.display_name ||
  user.user_metadata?.full_name ||
  user.email?.split("@")[0] ||
  "";

setUserName(displayName);

      // JavaScript:
      // Sunday = 0, Monday = 1 ... Saturday = 6
      //
      // LifeOS:
      // Monday = 1 ... Sunday = 7
     const selectedDate = new Date();
selectedDate.setDate(selectedDate.getDate() + selectedDateOffset);

const jsDay = selectedDate.getDay();
const todayDay = jsDay === 0 ? 7 : jsDay;

      // --------------------------------------------------
      // 1. Load today's reusable routine template
      // --------------------------------------------------

      const { data: routineData, error: routineError } = await supabase
        .from("routine_items")
        .select(`
          id,
          title,
          start_time,
          end_time,
          days_of_week,
          category_id,
          categories (
            name,
            icon
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .contains("days_of_week", [todayDay])
        .order("start_time", { ascending: true });

      if (routineError) {
        console.error("Error loading today's routine:", routineError);
        setRoutineLoading(false);
        return;
      }

      // --------------------------------------------------
      // 2. Build today's LOCAL YYYY-MM-DD date
      // --------------------------------------------------

      const currentDate = new Date();
currentDate.setDate(currentDate.getDate() + selectedDateOffset);

const activityDate = [
  currentDate.getFullYear(),
  String(currentDate.getMonth() + 1).padStart(2, "0"),
  String(currentDate.getDate()).padStart(2, "0"),
].join("-");

      console.log("Today's date:", activityDate);
      console.log("Routine items found:", routineData?.length ?? 0);

      // --------------------------------------------------
      // 3. Snapshot today's routine into daily_activities
      // --------------------------------------------------
      //
      // The unique index on:
      // user_id + activity_date + routine_item_id
      //
      // prevents duplicate snapshots.

      if (routineData && routineData.length > 0) {
        const dailyActivities = routineData.map((item: any) => ({
          user_id: user.id,
          activity_date: activityDate,
          routine_item_id: item.id,
          category_id: item.category_id,
          title: item.title,
          planned_start: item.start_time,
          planned_end: item.end_time,
          status: "planned",
          as_planned: false,
        }));

        const {
          data: createdActivities,
          error: snapshotError,
        } = await supabase
          .from("daily_activities")
          .upsert(dailyActivities, {
            onConflict: "user_id,activity_date,routine_item_id",
            ignoreDuplicates: true,
          })
          .select();

        if (snapshotError) {
          console.error(
            "Error creating today's activities:",
            snapshotError
          );
        } else {
          console.log(
            "Today's daily activities are ready:",
            createdActivities
          );
        }
      }

// --------------------------------------------------
// Sync TODAY'S still-planned activities with Settings
// --------------------------------------------------

if (
  selectedDateOffset === 0 &&
  routineData &&
  routineData.length > 0
) {
  for (const item of routineData) {
    const { error: syncError } = await supabase
      .from("daily_activities")
      .update({
        category_id: item.category_id,
        title: item.title,
        planned_start: item.start_time,
        planned_end: item.end_time,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("activity_date", activityDate)
      .eq("routine_item_id", item.id)
      .eq("status", "planned");

    if (syncError) {
      console.error("Error syncing today's routine:", syncError);
    }
  }
}

      // --------------------------------------------------
      // 4. Load TODAY'S permanent records
      // --------------------------------------------------

      const {
        data: todayActivities,
        error: todayActivitiesError,
      } = await supabase
        .from("daily_activities")
        .select(`
          id,
          routine_item_id,
          build_focus,
          title,
          planned_start,
          planned_end,
          actual_start,
          actual_end,
          status,
          as_planned,
          category_id,
          categories (
            name,
            icon
          )
        `)
        .eq("user_id", user.id)
        .eq("activity_date", activityDate)
        .order("planned_start", { ascending: true });

      if (todayActivitiesError) {
        console.error(
          "Error loading today's daily activities:",
          todayActivitiesError
        );
        setRoutineLoading(false);
        return;
      }

      // --------------------------------------------------
      // 5. Format database records for dashboard
      // --------------------------------------------------

      const formattedRoutine: RoutineItem[] = (
        todayActivities ?? []
      ).map((item: any) => ({
        // This ID is daily_activities.id
        id: item.id,

        time:
  item.planned_start?.slice(0, 5) ??
  item.actual_start?.slice(0, 5) ??
  "",

endTime:
  item.planned_end?.slice(0, 5) ??
  item.actual_end?.slice(0, 5) ??
  null,

        activity: item.title,

        type: item.categories?.name ?? "Maintain",
        icon: item.categories?.icon ?? "",

        done: item.status === "completed",
        status: item.status,

        actualStart:
          item.actual_start?.slice(0, 5) ?? null,

        actualEnd:
          item.actual_end?.slice(0, 5) ?? null,

        asPlanned: item.as_planned ?? false,
        isManual: item.routine_item_id === null,
        buildFocus: item.build_focus ?? null,
      }));

      setRoutine(formattedRoutine);

// --------------------------------------------------
// 6. Calculate yesterday's Daily Score
// --------------------------------------------------

const yesterdayDate = new Date();
yesterdayDate.setDate(yesterdayDate.getDate() - 1);

const yesterdayActivityDate = [
  yesterdayDate.getFullYear(),
  String(yesterdayDate.getMonth() + 1).padStart(2, "0"),
  String(yesterdayDate.getDate()).padStart(2, "0"),
].join("-");

const { data: yesterdayActivities, error: yesterdayError } =
  await supabase
    .from("daily_activities")
    .select(`
  status,
  routine_item_id,
  actual_start,
  actual_end,
  planned_start,
  planned_end,
  categories (
    name
  )
`)
    .eq("user_id", user.id)
    .eq("activity_date", yesterdayActivityDate)

if (yesterdayError) {
  console.error(
    "Error loading yesterday's activities:",
    yesterdayError
  );

  setYesterdayScore(null);
  setYesterdayLostMinutes(null);
} else {
  const yesterdayPlanned = yesterdayActivities ?? [];

  const yesterdayScoredActivities = yesterdayPlanned.filter(
  (item) =>
    item.routine_item_id !== null &&
    (
      item.status === "completed" ||
      item.status === "lost"
    )
);

const yesterdayCompleted =
  yesterdayScoredActivities.filter(
    (item) => item.status === "completed"
  ).length;

const calculatedYesterdayScore =
  yesterdayScoredActivities.length > 0
    ? Math.round(
        (yesterdayCompleted /
          yesterdayScoredActivities.length) *
          100
      )
    : 0;

  setYesterdayScore(calculatedYesterdayScore);

  // Calculate yesterday's Lost Time.
const calculatedYesterdayLostMinutes = yesterdayPlanned
  .filter(
    (item: any) =>
      item.status === "lost" ||
      (
        item.status === "completed" &&
        item.categories?.name === "Lost"
      )
  )
  .reduce((total: number, item: any) => {
    const start =
      item.status === "lost"
        ? item.planned_start?.slice(0, 5) ?? null
        : item.actual_start?.slice(0, 5) ??
          item.planned_start?.slice(0, 5) ??
          null;

    const end =
      item.status === "lost"
        ? item.planned_end?.slice(0, 5) ?? null
        : item.actual_end?.slice(0, 5) ??
          item.planned_end?.slice(0, 5) ??
          null;

    return total + getDurationMinutes(start, end);
  }, 0);

setYesterdayLostMinutes(calculatedYesterdayLostMinutes);

}

// --------------------------------------------------
// 7. Calculate this week's Build Time
// --------------------------------------------------

const today = new Date();

const monday = new Date(today);
const day = monday.getDay();
const differenceToMonday = day === 0 ? -6 : 1 - day;

monday.setDate(monday.getDate() + differenceToMonday);

const weekStart = [
  monday.getFullYear(),
  String(monday.getMonth() + 1).padStart(2, "0"),
  String(monday.getDate()).padStart(2, "0"),
].join("-");

const { data: weeklyActivities, error: weeklyError } =
  await supabase
    .from("daily_activities")
    .select(`
      status,
      actual_start,
      actual_end,
      planned_start,
      planned_end,
      categories (
        name
      )
    `)
    .eq("user_id", user.id)
    .gte("activity_date", weekStart)
    .lte("activity_date", activityDate)
    .eq("status", "completed");

if (weeklyError) {
  console.error("Error loading weekly Build time:", weeklyError);
} else {
  const totalWeeklyBuildMinutes = (weeklyActivities ?? [])
    .filter((item: any) => item.categories?.name === "Build")
    .reduce((total: number, item: any) => {
      const start =
        item.actual_start?.slice(0, 5) ??
        item.planned_start?.slice(0, 5) ??
        null;

      const end =
        item.actual_end?.slice(0, 5) ??
        item.planned_end?.slice(0, 5) ??
        null;

      return total + getDurationMinutes(start, end);
    }, 0);

  setWeeklyBuildMinutes(totalWeeklyBuildMinutes);
}

// --------------------------------------------------
// 8. Load today's reflection
// --------------------------------------------------

const { data: todayReflection, error: reflectionError } =
  await supabase
    .from("daily_reflections")
    .select(`
      mood,
      reflection,
      gratitude,
      highlight,
      improvement
    `)
    .eq("user_id", user.id)
    .eq("reflection_date", activityDate)
    .maybeSingle();

if (reflectionError) {
  console.error("Error loading today's reflection:", reflectionError);
} else if (todayReflection) {
  setReflectionMood(todayReflection.mood);
  setReflectionText(todayReflection.reflection ?? "");
  setReflectionGratitude(todayReflection.gratitude ?? "");
  setReflectionHighlight(todayReflection.highlight ?? "");
  setReflectionImprovement(todayReflection.improvement ?? "");
  setReflectionSaved(true);
}

      setRoutineLoading(false);
    }

   loadTodayRoutine();
}, [selectedDateOffset]);

  // --------------------------------------------------
  // Re-open a completed activity
  // --------------------------------------------------

  // --------------------------------------------------
// Save Quick Capture
// --------------------------------------------------

async function saveQuickCapture() {
  if (isSavingQuickCapture) return;

  if (!quickTitle.trim()) {
    alert("Please enter a title.");
    return;
  }

  setIsSavingQuickCapture(true);

  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Unable to find your signed-in account.");
      return;
    }

    const { error } = await supabase
      .from("ideas")
      .insert({
        user_id: user.id,
        title: quickTitle.trim(),
        description: quickDescription.trim() || null,
        idea_type: quickType,
        status: "captured",
        priority: quickPriority,
        next_action: quickNextAction.trim() || null,
      });

    if (error) {
      console.error("Error saving Quick Capture:", JSON.stringify(error, null, 2));
      alert("Quick Capture could not be saved.");
      return;
    }

    setQuickTitle("");
    setQuickDescription("");
    setQuickType("project");
    setQuickPriority("medium");
    setQuickNextAction("");
    setShowQuickCapture(false);
  } catch (error) {
    console.error("Unexpected Quick Capture error:", error);
    alert("Something went wrong while saving.");
  } finally {
    setIsSavingQuickCapture(false);
  }
}

  // --------------------------------------------------
// Save Daily Reflection
// --------------------------------------------------

async function saveDailyReflection() {
  if (isSavingReflection) return;

  setIsSavingReflection(true);

  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Unable to find your signed-in account.");
      return;
    }

    const currentDate = new Date();
currentDate.setDate(currentDate.getDate() + selectedDateOffset);

const reflectionDate = [
  currentDate.getFullYear(),
  String(currentDate.getMonth() + 1).padStart(2, "0"),
  String(currentDate.getDate()).padStart(2, "0"),
].join("-");

    const { error } = await supabase
      .from("daily_reflections")
      .upsert(
        {
          user_id: user.id,
          reflection_date: reflectionDate,
          mood: reflectionMood,
          reflection: reflectionText.trim() || null,
          gratitude: reflectionGratitude.trim() || null,
          highlight: reflectionHighlight.trim() || null,
          improvement: reflectionImprovement.trim() || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,reflection_date",
        }
      );

    if (error) {
      console.error("Error saving reflection:", error);
      alert("Reflection could not be saved.");
      return;
    }

    setReflectionSaved(true);
  } catch (error) {
    console.error("Unexpected reflection error:", error);
    alert("Something went wrong while saving your reflection.");
  } finally {
    setIsSavingReflection(false);
  }
}

  async function reopenActivity(id: number) {
    const supabase = createClient();

    const { error } = await supabase
      .from("daily_activities")
      .update({
        status: "planned",
        as_planned: false,
        actual_start: null,
        actual_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error reopening activity:", error);
      return;
    }

    setRoutine((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              done: false,
              status: "planned",
              asPlanned: false,
              actualStart: null,
              actualEnd: null,
            }
          : item
      )
    );
  }

  // --------------------------------------------------
  // Complete exactly as planned
  // --------------------------------------------------

  async function completeAsPlanned(id: number) {
    const supabase = createClient();

    const activity = routine.find(
      (item) => item.id === id
    );

    if (!activity) return;

    const { error } = await supabase
      .from("daily_activities")
      .update({
        status: "completed",
        as_planned: true,
        actual_start: activity.time,
        actual_end: activity.endTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(
        "Error completing activity as planned:",
        error
      );
      return;
    }

    setRoutine((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              done: true,
              status: "completed",
              asPlanned: true,
              actualStart: item.time,
              actualEnd: item.endTime,
            }
          : item
      )
    );

    setCompletingActivity(null);
  }

  // --------------------------------------------------
  // Open Adjust Time modal
  // --------------------------------------------------

  function openAdjustTime(activity: RoutineItem) {
    setCompletingActivity(null);

    setAdjustingActivity(activity);

    setActualStart(
      activity.actualStart ?? activity.time
    );

    setActualEnd(
      activity.actualEnd ?? activity.endTime ?? ""
    );
  }

  // --------------------------------------------------
  // Save adjusted actual times
  // --------------------------------------------------

  async function saveAdjustedTime() {
    if (!adjustingActivity) return;

    if (!actualStart || !actualEnd) {
      alert("Please enter both start and end times.");
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("daily_activities")
      .update({
        status: "completed",
        as_planned: false,
        actual_start: actualStart,
        actual_end: actualEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", adjustingActivity.id);

    if (error) {
      console.error(
        "Error saving adjusted time:",
        error
      );
      return;
    }

    setRoutine((current) =>
      current.map((item) =>
        item.id === adjustingActivity.id
          ? {
            ...item,
            done: true,
            status: "completed",
            asPlanned: false,
            actualStart,
            actualEnd,
  }
          : item
      )
    );

    setAdjustingActivity(null);
    setActualStart("");
    setActualEnd("");
  }

async function markActivityAsLost(activity: RoutineItem) {
  const confirmed = window.confirm(
    `Mark ${activity.activity} as Lost?`
  );

  if (!confirmed) return;

  const supabase = createClient();

  const { error } = await supabase
    .from("daily_activities")
    .update({
      status: "lost",
      as_planned: false,
      actual_start: null,
      actual_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", activity.id);

  if (error) {
    console.error("Error marking activity as Lost:", error);
    alert("The activity could not be marked as Lost.");
    return;
  }

  setRoutine((current) =>
    current.map((item) =>
      item.id === activity.id
        ? {
            ...item,
            done: false,
            status: "lost",
            asPlanned: false,
            actualStart: null,
            actualEnd: null,
          }
        : item
    )
  );

  setCompletingActivity(null);
}

async function deleteManualActivity(activity: RoutineItem) {
  if (!activity.isManual) return;

  const confirmed = window.confirm(
    `Delete "${activity.activity}"? This activity will be permanently removed.`
  );

  if (!confirmed) return;

  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("Unable to find your signed-in account.");
    return;
  }

  const { error } = await supabase
    .from("daily_activities")
    .delete()
    .eq("id", activity.id)
    .eq("user_id", user.id)
    .is("routine_item_id", null);

  if (error) {
    console.error("Error deleting activity:", error);
    alert("The activity could not be deleted.");
    return;
  }

  setRoutine((current) =>
    current.filter((item) => item.id !== activity.id)
  );
}

async function saveNewActivity() {
  // Prevent the function from running twice while already saving.
  if (isSavingActivity) return;

  // Validate required fields.
  if (
    !newActivityTitle.trim() ||
    !newActivityStart ||
    !newActivityEnd
  ) {
    alert("Please enter the activity name, start time and end time.");
    return;
  }

  // Lock the button immediately.
  setIsSavingActivity(true);

  try {
    const supabase = createClient();

    // Get the signed-in user.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Unable to get signed-in user:", userError);
      alert("Unable to find your signed-in account.");
      return;
    }

    // Find the selected category.
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, name, icon")
      .eq("user_id", user.id)
      .eq("name", newActivityCategory)
      .single();

    if (categoryError || !category) {
      console.error("Unable to find category:", categoryError);
      alert("Unable to find the selected category.");
      return;
    }

    // Create today's local YYYY-MM-DD date.
    const currentDate = new Date();
currentDate.setDate(currentDate.getDate() + selectedDateOffset);

const activityDate = [
  currentDate.getFullYear(),
  String(currentDate.getMonth() + 1).padStart(2, "0"),
  String(currentDate.getDate()).padStart(2, "0"),
].join("-");

    // Store these before resetting the form.
    const title = newActivityTitle.trim();
    const startTime = newActivityStart;
    const endTime = newActivityEnd;

    // Save ONE manual activity to Supabase.
    const { data: newActivity, error: activityError } =
      await supabase
        .from("daily_activities")
        .insert({
          user_id: user.id,
          activity_date: activityDate,

          // Manual activity — not from the routine.
          routine_item_id: null,
          category_id: category.id,
          build_focus:
          newActivityCategory === "Build"
          ? newActivityBuildFocus
          : null,
          title: title,

          // No planned time because this was unplanned.
          planned_start: null,
          planned_end: null,

          actual_start: startTime,
          actual_end: endTime,

          status: "completed",
          as_planned: false,
        })
        .select()
        .single();

    if (activityError || !newActivity) {
      console.error("Error adding activity:", activityError);
      alert("The activity could not be saved.");
      return;
    }

    // Add it to the dashboard immediately.
    // The ID check also prevents the same database record
    // from appearing twice in the frontend.
    setRoutine((current) => {
      const alreadyExists = current.some(
        (item) => item.id === newActivity.id
      );

      if (alreadyExists) {
        return current;
      }

      return [
        ...current,
        {
  id: newActivity.id,
  time: startTime,
  endTime: endTime,
  activity: title,
  type: category.name,
  icon: category.icon ?? "",
  done: true,
  status: "completed",
  actualStart: startTime,
  actualEnd: endTime,
  asPlanned: false,
  isManual: true,
  buildFocus:
  newActivityCategory === "Build"
    ? newActivityBuildFocus
    : null,
        },
      ];
    });

    // Close and reset the Add Activity form.
    setShowAddActivity(false);
    setNewActivityTitle("");
    setNewActivityCategory("Lost");
    setNewActivityBuildFocus("Projects");
    setNewActivityStart("");
    setNewActivityEnd("");
  } catch (error) {
    console.error("Unexpected error adding activity:", error);
    alert("Something went wrong while adding the activity.");
  } finally {
    // Always unlock the button, even if Supabase fails.
    setIsSavingActivity(false);
  }
}

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto min-h-screen max-w-[1500px]">

        {/* Sidebar */}

        <LifeOSSidebar />

        {/* Main Content */}

        <section className="min-w-0 flex-1 p-4 sm:p-6 lg:ml-64 lg:p-10">

          {/* Header */}

          <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">
  {userName ? `Hi, ${userName} 👋` : "TODAY"}
</p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Build a better day.
              </h2>

              <p className="mt-2 text-slate-500">
                Focus on the system. The results will
                follow.
              </p>
            </div>

            <button
              onClick={() => setShowQuickCapture(true)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm sm:w-auto"
              >
              + Quick Capture
            </button>
          </header>

{/* Date Selector */}
<div className="mb-6 flex flex-wrap gap-2">
  {[
    { label: "2 Days Ago", value: -2 },
    { label: "Yesterday", value: -1 },
    { label: "Today", value: 0 },
  ].map((day) => (
    <button
      key={day.value}
      type="button"
      onClick={() => setSelectedDateOffset(day.value)}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        selectedDateOffset === day.value
          ? "bg-indigo-600 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {day.label}
    </button>
  ))}
</div>

          {/* KPI Cards */}

          <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Daily score
              </p>

              <p className="mt-2 text-3xl font-bold">
                {dailyScore}%
              </p>

              <p
  className={`mt-1 text-xs ${
    yesterdayScore === null
      ? "text-slate-400"
      : dailyScore > yesterdayScore
      ? "text-emerald-600"
      : dailyScore < yesterdayScore
      ? "text-rose-500"
      : "text-slate-400"
  }`}
>
  {yesterdayScore === null
    ? "No comparison available"
    : dailyScore > yesterdayScore
    ? `↑ ${dailyScore - yesterdayScore}% from yesterday`
    : dailyScore < yesterdayScore
    ? `↓ ${yesterdayScore - dailyScore}% from yesterday`
    : "Same as yesterday"}
</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Future building
              </p>

              <p className="mt-2 text-3xl font-bold">
                {futureBuildingDisplay}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Target: 3 hours
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Plan adherence
              </p>

              <p className="mt-2 text-3xl font-bold">
                {planAdherence}%
              </p>

              <p className="mt-1 text-xs text-slate-400">
                 {completedAsPlanned.length} of {completedPlannedActivities.length} completed as planned
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Lost time
              </p>

              <p className="mt-2 text-3xl font-bold">
                {formatMinutes(lostMinutes)}
              </p>

              <p
  className={`mt-1 text-xs ${
    yesterdayLostMinutes === null
      ? "text-slate-400"
      : lostMinutes < yesterdayLostMinutes
      ? "text-emerald-600"
      : lostMinutes > yesterdayLostMinutes
      ? "text-rose-500"
      : "text-slate-400"
  }`}
>
  {yesterdayLostMinutes === null
    ? "No comparison available"
    : lostMinutes < yesterdayLostMinutes
    ? `↓ ${yesterdayLostMinutes - lostMinutes}m from yesterday`
    : lostMinutes > yesterdayLostMinutes
    ? `↑ ${lostMinutes - yesterdayLostMinutes}m from yesterday`
    : "Same as yesterday"}
</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">

            {/* Today's Timeline */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h3 className="font-semibold">
                    {selectedDateOffset === 0
  ? "Today's timeline"
  : selectedDateOffset === -1
  ? "Yesterday's timeline"
  : "2 days ago"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Planned vs actual
                  </p>
                </div>

                <button
                  onClick={() => setShowAddActivity(true)}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  + Add activity
                </button>
              </div>

              <div className="divide-y divide-slate-100">

                {routineLoading && (
                  <div className="p-5 text-sm text-slate-400">
                    Loading today&apos;s routine...
                  </div>
                )}

                {!routineLoading &&
                  routine.length === 0 && (
                    <div className="p-5 text-sm text-slate-400">
                      No routine activities scheduled
                      for today.
                    </div>
                  )}

                {!routineLoading &&
                  routine.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[110px_1fr_auto] sm:px-5"
                    >
                      <span className="col-span-2 text-xs font-medium text-slate-400 sm:col-span-1 sm:text-sm">
                        {item.time}
                        {item.endTime
                          ? ` – ${item.endTime}`
                          : ""}
                      </span>

                      <div>
                        <p className="text-sm font-medium">
                          {item.activity}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-slate-400">
                            {item.type}
                          </p>

                          {item.status === "lost" && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                            Lost
                          </span>
                          )}

                          {item.done &&
                            item.asPlanned && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                As planned
                              </span>
                            )}

                          {item.done &&
                            !item.asPlanned &&
                            item.actualStart &&
                            item.actualEnd && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                Actual{" "}
                                {item.actualStart} –{" "}
                                {item.actualEnd}
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
  {item.isManual && (
    <button
      type="button"
      onClick={() => deleteManualActivity(item)}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-xs text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
      aria-label={`Delete ${item.activity}`}
      title="Delete activity"
    >
      🗑
    </button>
  )}

  {!item.isManual && (
    <button
      type="button"
      onClick={() => {
        if (item.done || item.status === "lost") {
          reopenActivity(item.id);
          return;
        }

        setCompletingActivity(item);
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
        item.done
          ? "bg-emerald-100 text-emerald-700"
          : "border border-slate-200 text-slate-300 hover:border-indigo-300 hover:text-indigo-500"
      }`}
      aria-label={
        item.done
          ? `Reopen ${item.activity}`
          : `Complete ${item.activity}`
      }
    >
      {item.done ? "✓" : item.status === "lost" ? "↺" : "○"}
    </button>
  )}
</div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Right Column */}

            <div className="space-y-6">

              {/* Time Allocation */}

<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <h3 className="font-semibold">
    Time allocation
  </h3>

  <div className="mt-5 space-y-4">
    {timeAllocation.map((category) => {
      const width =
        totalAllocatedMinutes > 0
          ? (category.minutes / totalAllocatedMinutes) * 100
          : 0;

      return (
        <div key={category.name}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{category.name}</span>

            <span className="font-medium">
              {formatMinutes(category.minutes)}
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${category.color}`}
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      );
    })}
  </div>
</section>

              {/* Future */}

              <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs font-medium text-indigo-300">
                      BUILD
                    </p>

                    <h3 className="mt-1 text-xl font-semibold">
                      Invest in your future
                    </h3>
                  </div>

                  <span className="text-2xl">🚀</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Career", formatBuildFocusTime(buildFocusMinutes.Career)],
                    ["Business", formatBuildFocusTime(buildFocusMinutes.Business)],
                    ["Projects", formatBuildFocusTime(buildFocusMinutes.Projects)],
                    ["Learning", formatBuildFocusTime(buildFocusMinutes.Learning)],
                  ].map(([name, time]) => (
                    <div
                      key={name}
                      className="rounded-xl bg-white/10 p-3"
                    >
                      <p className="text-xs text-slate-300">
                        {name}
                      </p>

                      <p className="mt-1 font-semibold">
                        {time}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Reflection */}

              {/* Reflection */}

<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <h3 className="font-semibold">
      Daily reflection
    </h3>

    {reflectionSaved && (
      <span className="text-xs font-medium text-emerald-600">
        ✓ Saved
      </span>
    )}
  </div>

  <p className="mt-4 text-sm text-slate-500">
    How are you feeling today?
  </p>

  <div className="mt-3 flex justify-between">
    {[
      [1, "😞"],
      [2, "😐"],
      [3, "🙂"],
      [4, "😄"],
      [5, "🤩"],
    ].map(([value, emoji]) => (
      <button
        key={value}
        type="button"
        onClick={() => {
          setReflectionMood(Number(value));
          setReflectionSaved(false);
        }}
        className={`flex h-10 w-10 items-center justify-center rounded-xl text-2xl transition ${
          reflectionMood === Number(value)
            ? "bg-indigo-100 ring-2 ring-indigo-500"
            : "hover:bg-slate-100"
        }`}
      >
        {emoji}
      </button>
    ))}
  </div>

  <textarea
    value={reflectionText}
    onChange={(e) => {
      setReflectionText(e.target.value);
      setReflectionSaved(false);
    }}
    placeholder="How did you spend your day?"
    className="mt-5 min-h-24 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
  />

  <input
    type="text"
    value={reflectionHighlight}
    onChange={(e) => {
      setReflectionHighlight(e.target.value);
      setReflectionSaved(false);
    }}
    placeholder="✨ Highlight of the day"
    className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
  />

  <input
    type="text"
    value={reflectionGratitude}
    onChange={(e) => {
      setReflectionGratitude(e.target.value);
      setReflectionSaved(false);
    }}
    placeholder="🙏 What are you grateful for?"
    className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
  />

  <input
    type="text"
    value={reflectionImprovement}
    onChange={(e) => {
      setReflectionImprovement(e.target.value);
      setReflectionSaved(false);
    }}
    placeholder="🎯 What could be better tomorrow?"
    className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
  />

  <button
    type="button"
    onClick={saveDailyReflection}
    disabled={isSavingReflection}
    className="mt-3 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {isSavingReflection
      ? "Saving..."
      : reflectionSaved
      ? "Saved ✓"
      : "Save reflection"}
  </button>
</section>
            </div>
          </div>
        </section>
      </div>

{/* ----------------------------------------------
    Quick Capture Modal
---------------------------------------------- */}

{showQuickCapture && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

      <h3 className="text-lg font-semibold text-slate-900">
        Quick Capture
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Capture it now. Organise it later.
      </p>

      <div className="mt-6 space-y-4">

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">
            Title
          </label>

          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">
            Type
          </label>

          <select
            value={quickType}
            onChange={(e) => setQuickType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="business">Business</option>
            <option value="career">Career</option>
            <option value="project">Project</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">
            Priority
          </label>

          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">
            Notes
          </label>

          <textarea
            value={quickDescription}
            onChange={(e) => setQuickDescription(e.target.value)}
            placeholder="Add a little context..."
            className="min-h-20 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">
            Next action
          </label>

          <input
            type="text"
            value={quickNextAction}
            onChange={(e) => setQuickNextAction(e.target.value)}
            placeholder="What's the next step?"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>

      </div>

      <div className="mt-6 flex justify-end gap-3">

        <button
          type="button"
          onClick={() => {
            setShowQuickCapture(false);
            setQuickTitle("");
            setQuickDescription("");
            setQuickType("project");
            setQuickPriority("medium");
            setQuickNextAction("");
          }}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveQuickCapture}
          disabled={isSavingQuickCapture}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSavingQuickCapture ? "Saving..." : "Capture"}
        </button>

      </div>
    </div>
  </div>
)}

{/* ----------------------------------------------
    Add Activity Modal
---------------------------------------------- */}

{showAddActivity && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-slate-900">
        Add activity
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Record something that was not in your planned routine.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">
            Activity
          </label>

          <input
            type="text"
            value={newActivityTitle}
            onChange={(e) => setNewActivityTitle(e.target.value)}
            placeholder="e.g. Instagram scrolling"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-500">
            Category
          </label>

          <select
            value={newActivityCategory}
            onChange={(e) => setNewActivityCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="Build">Build 🚀</option>
            <option value="Maintain">Maintain 🏠</option>
            <option value="Enjoy">Enjoy ❤️</option>
            <option value="Sleep">Sleep 😴</option>
            <option value="Lost">Lost 🔴</option>
          </select>

{newActivityCategory === "Build" && (
  <div className="mt-3">
    <label className="mb-1 block text-sm font-medium text-slate-700">
      Build focus
    </label>

    <select
      value={newActivityBuildFocus}
      onChange={(e) => setNewActivityBuildFocus(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
    >
      <option value="Career">Career</option>
      <option value="Business">Business</option>
      <option value="Projects">Projects</option>
      <option value="Learning">Learning</option>
    </select>
  </div>
)}

        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-500">
              Actual start
            </label>

            <input
              type="time"
              value={newActivityStart}
              onChange={(e) => setNewActivityStart(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-500">
              Actual end
            </label>

            <input
              type="time"
              value={newActivityEnd}
              onChange={(e) => setNewActivityEnd(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => {
            setShowAddActivity(false);
            setNewActivityTitle("");
            setNewActivityCategory("Lost");
            setNewActivityStart("");
            setNewActivityEnd("");
          }}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
        >
          Cancel
        </button>

        <button
          onClick={saveNewActivity}
          disabled={isSavingActivity}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
          {isSavingActivity ? "Adding..." : "Add Activity"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ----------------------------------------------
          Completion Choice Modal
      ---------------------------------------------- */}

      {completingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Complete activity
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {completingActivity.activity}
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-400">
                PLANNED TIME
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {completingActivity.time}
                {completingActivity.endTime
                  ? ` – ${completingActivity.endTime}`
                  : ""}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() =>
                  completeAsPlanned(
                    completingActivity.id
                  )
                }
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                ✓ As Planned
              </button>

              <button
                onClick={() =>
                  openAdjustTime(completingActivity)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                🕐 Adjust Time
              </button>

              <button
                 onClick={() => markActivityAsLost(completingActivity)}
                 className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                 🔴 Mark as Lost
              </button>

              <button
                onClick={() =>
                  setCompletingActivity(null)
                }
                className="w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------
          Adjust Actual Time Modal
      ---------------------------------------------- */}

      {adjustingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Adjust actual time
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {adjustingActivity.activity}
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-400">
                PLANNED TIME
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {adjustingActivity.time}
                {adjustingActivity.endTime
                  ? ` – ${adjustingActivity.endTime}`
                  : ""}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Actual start
                </label>

                <input
                  type="time"
                  value={actualStart}
                  onChange={(e) =>
                    setActualStart(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Actual end
                </label>

                <input
                  type="time"
                  value={actualEnd}
                  onChange={(e) =>
                    setActualEnd(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setAdjustingActivity(null);
                  setActualStart("");
                  setActualEnd("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>

              <button
                onClick={saveAdjustedTime}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Save & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}