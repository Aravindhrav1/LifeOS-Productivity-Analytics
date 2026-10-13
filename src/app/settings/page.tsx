"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import LifeOSSidebar from "@/components/LifeOSSidebar";

type Category = {
  id: number;
  name: string;
  type: string;
  icon: string | null;
};

type RoutineItem = {
  id: number;
  title: string;
  category_id: number;
  start_time: string;
  end_time: string | null;
  days_of_week: number[];
  is_active: boolean;
  sort_order: number;
};

const days = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 7, label: "Sun" },
];

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([
    1, 2, 3, 4, 5,
  ]);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
const [deleteConfirmation, setDeleteConfirmation] = useState("");
const [deletingAccount, setDeletingAccount] = useState(false);
const [accountDeleteError, setAccountDeleteError] = useState("");

  async function loadData() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not signed in.");
      setLoading(false);
      return;
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id, name, type, icon")
      .eq("user_id", user.id);

    if (categoryError) {
      setMessage(categoryError.message);
      setLoading(false);
      return;
    }

    setCategories(categoryData ?? []);

    const { data: routineData, error: routineError } = await supabase
      .from("routine_items")
      .select(
        "id, title, category_id, start_time, end_time, days_of_week, is_active, sort_order"
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("start_time", { ascending: true });

    if (routineError) {
      setMessage(routineError.message);
    } else {
      setRoutine(routineData ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setTitle("");
    setCategoryId("");
    setStartTime("");
    setEndTime("");
    setSelectedDays([1, 2, 3, 4, 5]);
    setEditingId(null);
    setShowForm(false);
  }

  function toggleDay(day: number) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  }

  function startEdit(item: RoutineItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setCategoryId(String(item.category_id));
    setStartTime(item.start_time.slice(0, 5));
    setEndTime(item.end_time ? item.end_time.slice(0, 5) : "");
    setSelectedDays(item.days_of_week);
    setMessage("");
    setShowForm(true);

    window.scrollTo({
      top: 500,
      behavior: "smooth",
    });
  }

  async function saveRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title || !categoryId || !startTime || selectedDays.length === 0) {
      setMessage("Please complete all required routine fields.");
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not signed in.");
      setSaving(false);
      return;
    }

    const routineData = {
      user_id: user.id,
      title: title.trim(),
      category_id: Number(categoryId),
      start_time: startTime,
      end_time: endTime || null,
      days_of_week: selectedDays,
      is_active: true,
    };

    if (editingId !== null) {
      const { error } = await supabase
        .from("routine_items")
        .update(routineData)
        .eq("id", editingId)
        .eq("user_id", user.id);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("Routine updated successfully.");
    } else {
      const { error } = await supabase.from("routine_items").insert({
        ...routineData,
        sort_order: routine.length + 1,
      });

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("Routine added successfully.");
    }

    resetForm();
    await loadData();
    setSaving(false);
  }

  async function deleteRoutine(id: number) {
    const confirmed = window.confirm(
      "Delete this routine activity? This cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not signed in.");
      setDeletingId(null);
      return;
    }

    const { error } = await supabase
      .from("routine_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      setDeletingId(null);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setMessage("Routine deleted.");
    await loadData();
    setDeletingId(null);
  }

async function deleteAccount() {
  if (deleteConfirmation !== "DELETE" || deletingAccount) return;

  const confirmed = window.confirm(
    "Permanently delete your LifeOS account and all of your data? This cannot be undone."
  );

  if (!confirmed) return;

  setDeletingAccount(true);
  setAccountDeleteError("");

  try {
    const response = await fetch("/api/delete-account", {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      setAccountDeleteError(
        result.error || "Could not delete your account."
      );
      setDeletingAccount(false);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();

    window.location.href = "/signup";
  } catch (error) {
    console.error("Account deletion failed:", error);
    setAccountDeleteError(
      "Something went wrong while deleting your account."
    );
    setDeletingAccount(false);
  }
}

  function categoryFor(id: number) {
    return categories.find((category) => category.id === id);
  }

  function formatTime(time: string) {
    return time?.slice(0, 5);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
  <LifeOSSidebar />

  <section className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-10">
    <div className="mx-auto max-w-6xl">

        <div className="mt-6">
          <p className="text-sm font-medium text-indigo-600">SETTINGS</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Build your system.
          </h1>

          <p className="mt-2 text-slate-500">
            Configure how LifeOS plans and tracks your days.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Time categories</h2>

          <p className="mt-1 text-sm text-slate-500">
            Your five core LifeOS time buckets.
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading...</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="text-2xl">{category.icon}</div>
                  <p className="mt-3 font-semibold">{category.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {category.type}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Weekly routine</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create and manage your normal weekly schedule.
              </p>
            </div>

            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setMessage("");
                  setShowForm(true);
                }
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {showForm ? "Cancel" : "+ Add routine"}
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={saveRoutine}
              className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5"
            >
              <div className="mb-5">
                <p className="font-semibold">
                  {editingId !== null
                    ? "Edit routine activity"
                    : "Add routine activity"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Choose when this activity normally happens.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Activity
                  </label>

                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Wake up"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Category
                  </label>

                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
                  >
                    <option value="">Choose category</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Start time
                  </label>

                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    End time
                  </label>

                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-medium">Repeat on</p>

                <div className="flex flex-wrap gap-2">
                  {days.map((day) => {
                    const selected = selectedDays.includes(day.id);

                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          selected
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save changes"
                      : "Save routine"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          )}

          {message && (
            <p className="mt-4 text-sm text-slate-600">{message}</p>
          )}

          <div className="mt-6">
            {routine.length === 0 && !loading ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="font-medium">No routine yet.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Add your first activity to start building your LifeOS
                  schedule.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {routine.map((item) => {
                  const category = categoryFor(item.category_id);

                  return (
                    <div
                      key={item.id}
                      className="grid gap-4 py-4 lg:grid-cols-[120px_1fr_auto_auto] lg:items-center"
                    >
                      <div className="text-sm font-semibold text-indigo-600">
                        {formatTime(item.start_time)}
                        {item.end_time
                          ? ` – ${formatTime(item.end_time)}`
                          : ""}
                      </div>

                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {category?.icon} {category?.name}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {days
                          .filter((day) =>
                            item.days_of_week.includes(day.id)
                          )
                          .map((day) => (
                            <span
                              key={day.id}
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500"
                            >
                              {day.label}
                            </span>
                          ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => deleteRoutine(item.id)}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deletingId === item.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
                  </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Account</h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your LifeOS account and personal data.
            </p>

            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/40 p-5">
              <h3 className="font-semibold text-rose-700">
                Danger zone
              </h3>

              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Permanently delete your LifeOS account and all of your
                data. This action cannot be undone.
              </p>

              {!showDeleteAccount ? (
                <button
                  type="button"
                  onClick={() => {
                    setAccountDeleteError("");
                    setShowDeleteAccount(true);
                  }}
                  className="mt-5 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Delete my account
                </button>
              ) : (
                <div className="mt-5 max-w-md">
                  <p className="text-sm font-medium text-slate-700">
                    Type{" "}
                    <span className="font-bold text-rose-600">
                      DELETE
                    </span>{" "}
                    to confirm.
                  </p>

                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) =>
                      setDeleteConfirmation(e.target.value)
                    }
                    disabled={deletingAccount}
                    placeholder="DELETE"
                    className="mt-3 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 outline-none focus:border-rose-400 disabled:opacity-50"
                  />

                  {accountDeleteError && (
                    <p className="mt-3 text-sm text-rose-600">
                      {accountDeleteError}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={deleteAccount}
                      disabled={
                        deleteConfirmation !== "DELETE" ||
                        deletingAccount
                      }
                      className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingAccount
                        ? "Deleting account..."
                        : "Permanently delete account"}
                    </button>

                    <button
                      type="button"
                      disabled={deletingAccount}
                      onClick={() => {
                        setShowDeleteAccount(false);
                        setDeleteConfirmation("");
                        setAccountDeleteError("");
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </section>
  </main>
);
}