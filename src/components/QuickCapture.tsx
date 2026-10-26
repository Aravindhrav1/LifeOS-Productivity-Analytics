"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

type CapturedIdea = {
  id: number;
  title: string;
  description: string | null;
  idea_type: string | null;
  status: string | null;
  priority: string | null;
  next_action: string | null;
  created_at?: string | null;
  completed_at?: string | null;
};

type InboxTab = "active" | "completed";

export default function QuickCapture() {
  const [showCapture, setShowCapture] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [inboxTab, setInboxTab] = useState<InboxTab>("active");

  const [ideas, setIdeas] = useState<CapturedIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("project");
  const [priority, setPriority] = useState("medium");
  const [nextAction, setNextAction] = useState("");

  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState("");

  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // Load Quick Capture items
  // --------------------------------------------------

  async function loadIdeas() {
    setLoadingIdeas(true);

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Unable to load signed-in user:", userError);
      setLoadingIdeas(false);
      return;
    }

    const { data, error } = await supabase
      .from("ideas")
      .select(`
        id,
        title,
        description,
        idea_type,
        status,
        priority,
        next_action,
        created_at,
        completed_at
      `)
      .eq("user_id", user.id)
      .in("status", ["captured", "completed"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading Quick Capture:", error);
      setLoadingIdeas(false);
      return;
    }

    setIdeas((data ?? []) as CapturedIdea[]);
    setLoadingIdeas(false);
  }

  useEffect(() => {
    loadIdeas();
  }, []);

  // --------------------------------------------------
  // Reset form
  // --------------------------------------------------

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("project");
    setPriority("medium");
    setNextAction("");
    setReminderDate("");
    setReminderTime("");
    setReminderMinutes("");
  }

  // --------------------------------------------------
  // Save Quick Capture
  // --------------------------------------------------

  async function saveCapture() {
    if (saving) return;

    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    const wantsReminder =
      reminderDate !== "" ||
      reminderTime !== "" ||
      reminderMinutes !== "";

    if (
      wantsReminder &&
      (!reminderDate || !reminderTime || reminderMinutes === "")
    ) {
      alert(
        "For a reminder, please choose the date, time and reminder option."
      );
      return;
    }

    setSaving(true);

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

      // Save capture
      const { data: capturedIdea, error: ideaError } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          idea_type: type,
          status: "captured",
          priority,
          next_action: nextAction.trim() || null,
          completed_at: null,
        })
        .select(`
          id,
          title,
          description,
          idea_type,
          status,
          priority,
          next_action,
          created_at,
          completed_at
        `)
        .single();

      if (ideaError || !capturedIdea) {
        console.error("Error saving Quick Capture:", ideaError);
        alert(
          `Quick Capture could not be saved.${
            ideaError?.message ? `\n\n${ideaError.message}` : ""
          }`
        );
        return;
      }

      // --------------------------------------------------
      // Optional reminder
      // --------------------------------------------------

      if (wantsReminder) {
        const { data: category, error: categoryError } =
          await supabase
            .from("categories")
            .select("id")
            .eq("user_id", user.id)
            .eq("name", "Maintain")
            .single();

        if (categoryError || !category) {
          console.error(
            "Unable to find Maintain category:",
            categoryError
          );

          setIdeas((current) => [
            capturedIdea as CapturedIdea,
            ...current,
          ]);

          resetForm();
          setShowCapture(false);

          alert(
            "The capture was saved, but the reminder could not be created because the Maintain category was not found."
          );

          return;
        }

        const [hour, minute] = reminderTime
          .split(":")
          .map(Number);

        const totalMinutes = hour * 60 + minute + 15;

        const endHour =
          Math.floor(totalMinutes / 60) % 24;

        const endMinute =
          totalMinutes % 60;

        const reminderEndTime =
          `${String(endHour).padStart(2, "0")}:${String(
            endMinute
          ).padStart(2, "0")}`;

        const { error: reminderError } = await supabase
          .from("daily_activities")
          .insert({
            user_id: user.id,
            activity_date: reminderDate,
            routine_item_id: null,
            category_id: category.id,
            build_focus: null,
            title: title.trim(),
            planned_start: reminderTime,
            planned_end: reminderEndTime,
            actual_start: null,
            actual_end: null,
            reminder_minutes: Number(reminderMinutes),
            status: "planned",
            as_planned: false,
          });

        if (reminderError) {
          console.error(
            "Quick Capture saved but reminder failed:",
            reminderError
          );

          alert(
            `The capture was saved, but the reminder could not be created.${
              reminderError.message
                ? `\n\n${reminderError.message}`
                : ""
            }`
          );
        }
      }

      setIdeas((current) => [
        capturedIdea as CapturedIdea,
        ...current,
      ]);

      resetForm();
      setShowCapture(false);
      setInboxTab("active");

      if (wantsReminder) {
        alert(
          "Captured ✓\nYour notification has also been scheduled."
        );
      }
    } catch (error) {
      console.error(
        "Unexpected Quick Capture error:",
        error
      );

      alert("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // Mark capture as Done
  // --------------------------------------------------

  async function completeCapture(id: number) {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Unable to find your signed-in account.");
      return;
    }

    const completedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("ideas")
      .update({
        status: "completed",
        completed_at: completedAt,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(`
        id,
        title,
        description,
        idea_type,
        status,
        priority,
        next_action,
        created_at,
        completed_at
      `)
      .single();

    if (error || !data) {
      console.error(
        "Error completing Quick Capture:",
        error
      );

      alert(
        `Could not mark as done.${
          error?.message ? `\n\n${error.message}` : ""
        }`
      );

      return;
    }

    setIdeas((current) =>
      current.map((idea) =>
        idea.id === id
          ? (data as CapturedIdea)
          : idea
      )
    );
  }

  // --------------------------------------------------
  // Delete Capture
  // --------------------------------------------------

  async function deleteCapture(id: number) {
    const confirmed = window.confirm(
      "Permanently delete this Quick Capture?"
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
      .from("ideas")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Error deleting Quick Capture:",
        error
      );

      alert(
        `Could not delete capture.\n\n${error.message}`
      );

      return;
    }

    setIdeas((current) =>
      current.filter((idea) => idea.id !== id)
    );
  }

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  function priorityStyle(priorityValue: string | null) {
    if (priorityValue === "high") {
      return "bg-rose-50 text-rose-600";
    }

    if (priorityValue === "low") {
      return "bg-slate-100 text-slate-500";
    }

    return "bg-amber-50 text-amber-700";
  }

  function formatCompletedDate(value?: string | null) {
    if (!value) return "";

    const date = new Date(value);

    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const activeIdeas = ideas.filter(
    (idea) => idea.status === "captured"
  );

  const completedIdeas = ideas
    .filter((idea) => idea.status === "completed")
    .sort((a, b) => {
      const aTime = a.completed_at
        ? new Date(a.completed_at).getTime()
        : 0;

      const bTime = b.completed_at
        ? new Date(b.completed_at).getTime()
        : 0;

      return bTime - aTime;
    });

  const visibleIdeas =
    inboxTab === "active"
      ? activeIdeas
      : completedIdeas;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <>
      {/* HEADER BUTTONS */}

      <div className="flex w-full gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() => {
            setInboxTab("active");
            setShowInbox(true);
          }}
          className="relative flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm sm:flex-none"
        >
          📥 Inbox

          {activeIdeas.length > 0 && (
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {activeIdeas.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowCapture(true)}
          className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:flex-none"
        >
          + Quick Capture
        </button>
      </div>

      {/* ==================================================
          QUICK CAPTURE MODAL
      ================================================== */}

      {showCapture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Quick Capture
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Capture it now. Organise it later.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCapture(false);
                  resetForm();
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="e.g. Send email to Expo"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Type
                  </label>

                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="business">
                      Business
                    </option>

                    <option value="career">
                      Career
                    </option>

                    <option value="project">
                      Project
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>
                  </select>
                </div>

              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">
                  Notes
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
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
                  value={nextAction}
                  onChange={(e) =>
                    setNextAction(e.target.value)
                  }
                  placeholder="What's the next step?"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Notification */}

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    🔔 Notification
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Optional — remind me about this later.
                  </p>
                </div>

                <div className="mt-4 space-y-3">

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Date
                    </label>

                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) =>
                        setReminderDate(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Time
                      </label>

                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) =>
                          setReminderTime(e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Notify
                      </label>

                      <select
                        value={reminderMinutes}
                        onChange={(e) =>
                          setReminderMinutes(e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="">
                          Off
                        </option>

                        <option value="0">
                          At time
                        </option>

                        <option value="5">
                          5 min before
                        </option>

                        <option value="10">
                          10 min before
                        </option>

                        <option value="15">
                          15 min before
                        </option>
                      </select>
                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => {
                  setShowCapture(false);
                  resetForm();
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveCapture}
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Capture"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ==================================================
          INBOX
      ================================================== */}

      {showInbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

            {/* Header */}

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  Quick Capture
                </p>

                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  Inbox
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Capture now. Complete when it's done.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInbox(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>

            </div>

            {/* Tabs */}

            <div className="mt-5 flex rounded-xl bg-slate-100 p-1">

              <button
                type="button"
                onClick={() =>
                  setInboxTab("active")
                }
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  inboxTab === "active"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Active ({activeIdeas.length})
              </button>

              <button
                type="button"
                onClick={() =>
                  setInboxTab("completed")
                }
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  inboxTab === "completed"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                ✓ Completed ({completedIdeas.length})
              </button>

            </div>

            {/* Items */}

            <div className="mt-5">

              {loadingIdeas ? (

                <p className="text-sm text-slate-400">
                  Loading captures...
                </p>

              ) : visibleIdeas.length === 0 ? (

                <div className="rounded-xl bg-slate-50 p-7 text-center">

                  <p className="text-2xl">
                    {inboxTab === "active"
                      ? "📥"
                      : "✓"}
                  </p>

                  <p className="mt-2 font-medium text-slate-700">
                    {inboxTab === "active"
                      ? "Inbox clear"
                      : "No completed captures yet"}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {inboxTab === "active"
                      ? "Your active Quick Captures will appear here."
                      : "Items you finish will appear here with the completion time."}
                  </p>

                </div>

              ) : (

                <div className="space-y-3">

                  {visibleIdeas.map((idea) => (

                    <div
                      key={idea.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h4 className="font-semibold text-slate-900">
                              {idea.title}
                            </h4>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityStyle(
                                idea.priority
                              )}`}
                            >
                              {idea.priority ?? "medium"}
                            </span>

                          </div>

                          <p className="mt-1 text-xs font-medium capitalize text-indigo-500">
                            {idea.idea_type ?? "capture"}
                          </p>

                          {idea.description && (
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {idea.description}
                            </p>
                          )}

                          {idea.next_action && (
                            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">

                              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                Next action
                              </p>

                              <p className="mt-1 text-sm text-slate-700">
                                {idea.next_action}
                              </p>

                            </div>
                          )}

                          {idea.status === "completed" &&
                            idea.completed_at && (

                              <div className="mt-3 inline-flex items-center rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                                ✓ Completed{" "}
                                {formatCompletedDate(
                                  idea.completed_at
                                )}
                              </div>

                            )}

                        </div>

                        <div className="flex shrink-0 items-center gap-2">

                          {idea.status === "captured" && (
                            <button
                              type="button"
                              onClick={() =>
                                completeCapture(idea.id)
                              }
                              className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              ✓ Done
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              deleteCapture(idea.id)
                            }
                            title="Permanently delete"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-xs text-rose-500 transition hover:bg-rose-50"
                          >
                            🗑
                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>

        </div>
      )}
    </>
  );
}