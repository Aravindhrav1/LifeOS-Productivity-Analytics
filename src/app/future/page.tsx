"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/client";
import LifeOSSidebar from "@/components/LifeOSSidebar";

type Goal = {
  id: number;
  title: string;
  description: string | null;
  area: string | null;
  status: string;
  priority: string;
  target_date: string | null;
  progress: number;
};

type Project = {
  id: number;
  goal_id: number | null;
  title: string;
  description: string | null;
  area: string | null;
  status: string;
  priority: string;
  target_date: string | null;
  progress: number;
  next_action: string | null;
};

const areas = [
  "Career",
  "Business",
  "Projects",
  "Learning",
  "Finance",
  "Health",
  "Personal",
];

export default function FuturePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // GOAL FORM
  // --------------------------------------------------

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalArea, setGoalArea] = useState("Career");
  const [goalPriority, setGoalPriority] = useState("medium");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalProgress, setGoalProgress] = useState(0);

  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);

  // --------------------------------------------------
  // PROJECT FORM
  // --------------------------------------------------

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectGoalId, setProjectGoalId] = useState("");
  const [projectArea, setProjectArea] = useState("Career");
  const [projectPriority, setProjectPriority] = useState("medium");
  const [projectTargetDate, setProjectTargetDate] = useState("");
  const [projectProgress, setProjectProgress] = useState(0);
  const [projectNextAction, setProjectNextAction] = useState("");

  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  useEffect(() => {
    async function loadFuture() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const [goalResult, projectResult] = await Promise.all([
        supabase
          .from("goals")
          .select(
            "id, title, description, area, status, priority, target_date, progress"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("projects")
          .select(
            "id, goal_id, title, description, area, status, priority, target_date, progress, next_action"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (goalResult.error) {
        console.error("Error loading goals:", goalResult.error);
      }

      if (projectResult.error) {
        console.error(
          "Error loading projects:",
          projectResult.error
        );
      }

      setGoals(goalResult.data ?? []);
      setProjects(projectResult.data ?? []);
      setLoading(false);
    }

    loadFuture();
  }, []);

  // --------------------------------------------------
  // GOAL HELPERS
  // --------------------------------------------------

  function resetGoalForm() {
    setGoalTitle("");
    setGoalDescription("");
    setGoalArea("Career");
    setGoalPriority("medium");
    setGoalTargetDate("");
    setGoalProgress(0);
    setEditingGoal(null);
  }

  function openNewGoal() {
    resetGoalForm();
    setShowGoalModal(true);
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal);

    setGoalTitle(goal.title);
    setGoalDescription(goal.description ?? "");
    setGoalArea(goal.area ?? "Career");
    setGoalPriority(goal.priority ?? "medium");
    setGoalTargetDate(goal.target_date ?? "");
    setGoalProgress(goal.progress ?? 0);

    setShowGoalModal(true);
  }

  function closeGoalModal() {
    setShowGoalModal(false);
    resetGoalForm();
  }

  // --------------------------------------------------
  // CREATE / UPDATE GOAL
  // --------------------------------------------------

  async function saveGoal(markCompleted = false) {
    if (!goalTitle.trim() || isSavingGoal) return;

    setIsSavingGoal(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please sign in again.");
        return;
      }

      const progress = markCompleted ? 100 : goalProgress;
      const shouldComplete = markCompleted || progress === 100;

      if (editingGoal) {
        const { error } = await supabase
          .from("goals")
          .update({
            title: goalTitle.trim(),
            description: goalDescription.trim() || null,
            area: goalArea,
            priority: goalPriority,
            target_date: goalTargetDate || null,
            progress,
            status: shouldComplete
              ? "completed"
              : editingGoal.status === "completed"
              ? "active"
              : editingGoal.status,
            completed_date: shouldComplete
              ? new Date().toISOString().split("T")[0]
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingGoal.id);

        if (error) {
          console.error("Error updating goal:", error);
          alert("Could not update goal.");
          return;
        }

        setGoals((currentGoals) =>
          currentGoals.map((goal) =>
            goal.id === editingGoal.id
              ? {
                  ...goal,
                  title: goalTitle.trim(),
                  description:
                    goalDescription.trim() || null,
                  area: goalArea,
                  priority: goalPriority,
                  target_date: goalTargetDate || null,
                  progress,
                  status: shouldComplete
                    ? "completed"
                    : editingGoal.status === "completed"
                    ? "active"
                    : editingGoal.status,
                }
              : goal
          )
        );
      } else {
        const { data, error } = await supabase
          .from("goals")
          .insert({
            user_id: user.id,
            title: goalTitle.trim(),
            description: goalDescription.trim() || null,
            area: goalArea,
            status: shouldComplete ? "completed" : "active",
            priority: goalPriority,
            start_date: new Date().toISOString().split("T")[0],
            target_date: goalTargetDate || null,
            progress,
            completed_date: shouldComplete
              ? new Date().toISOString().split("T")[0]
              : null,
          })
          .select(
            "id, title, description, area, status, priority, target_date, progress"
          )
          .single();

        if (error) {
          console.error("Error creating goal:", error);
          alert("Could not create goal.");
          return;
        }

        setGoals((currentGoals) => [data, ...currentGoals]);
      }

      closeGoalModal();
    } catch (error) {
      console.error("Unexpected goal save error:", error);
    } finally {
      setIsSavingGoal(false);
    }
  }

  // --------------------------------------------------
  // DELETE GOAL
  // --------------------------------------------------

  async function deleteGoal() {
    if (!editingGoal || isDeletingGoal) return;

    const confirmed = window.confirm(
      `Delete "${editingGoal.title}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeletingGoal(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", editingGoal.id);

      if (error) {
        console.error("Error deleting goal:", error);
        alert("Could not delete goal.");
        return;
      }

      setGoals((currentGoals) =>
        currentGoals.filter(
          (goal) => goal.id !== editingGoal.id
        )
      );

      // Because project.goal_id uses ON DELETE SET NULL,
      // unlink it locally too.
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.goal_id === editingGoal.id
            ? { ...project, goal_id: null }
            : project
        )
      );

      closeGoalModal();
    } catch (error) {
      console.error("Unexpected goal delete error:", error);
    } finally {
      setIsDeletingGoal(false);
    }
  }

  // --------------------------------------------------
  // PROJECT HELPERS
  // --------------------------------------------------

  function resetProjectForm() {
    setProjectTitle("");
    setProjectDescription("");
    setProjectGoalId("");
    setProjectArea("Career");
    setProjectPriority("medium");
    setProjectTargetDate("");
    setProjectProgress(0);
    setProjectNextAction("");
    setEditingProject(null);
  }

  function openNewProject() {
    resetProjectForm();
    setShowProjectModal(true);
  }

  function openEditProject(project: Project) {
    setEditingProject(project);

    setProjectTitle(project.title);
    setProjectDescription(project.description ?? "");
    setProjectGoalId(
      project.goal_id !== null
        ? String(project.goal_id)
        : ""
    );
    setProjectArea(project.area ?? "Career");
    setProjectPriority(project.priority ?? "medium");
    setProjectTargetDate(project.target_date ?? "");
    setProjectProgress(project.progress ?? 0);
    setProjectNextAction(project.next_action ?? "");

    setShowProjectModal(true);
  }

  function closeProjectModal() {
    setShowProjectModal(false);
    resetProjectForm();
  }

  // --------------------------------------------------
  // CREATE / UPDATE PROJECT
  // --------------------------------------------------

  async function saveProject(markCompleted = false) {
    if (!projectTitle.trim() || isSavingProject) return;

    setIsSavingProject(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please sign in again.");
        return;
      }

      const progress = markCompleted
        ? 100
        : projectProgress;

      const shouldComplete =
        markCompleted || progress === 100;

      const goalId = projectGoalId
        ? Number(projectGoalId)
        : null;

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update({
            goal_id: goalId,
            title: projectTitle.trim(),
            description:
              projectDescription.trim() || null,
            area: projectArea,
            priority: projectPriority,
            target_date: projectTargetDate || null,
            progress,
            next_action: shouldComplete
              ? null
              : projectNextAction.trim() || null,
            status: shouldComplete
              ? "completed"
              : editingProject.status === "completed"
              ? "planned"
              : editingProject.status,
            completed_date: shouldComplete
              ? new Date().toISOString().split("T")[0]
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingProject.id);

        if (error) {
          console.error(
            "Error updating project:",
            error
          );
          alert("Could not update project.");
          return;
        }

        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project.id === editingProject.id
              ? {
                  ...project,
                  goal_id: goalId,
                  title: projectTitle.trim(),
                  description:
                    projectDescription.trim() || null,
                  area: projectArea,
                  priority: projectPriority,
                  target_date:
                    projectTargetDate || null,
                  progress,
                  next_action: shouldComplete
                    ? null
                    : projectNextAction.trim() ||
                      null,
                  status: shouldComplete
                    ? "completed"
                    : editingProject.status ===
                      "completed"
                    ? "planned"
                    : editingProject.status,
                }
              : project
          )
        );
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            goal_id: goalId,
            title: projectTitle.trim(),
            description:
              projectDescription.trim() || null,
            area: projectArea,
            status: shouldComplete
              ? "completed"
              : "planned",
            priority: projectPriority,
            start_date: new Date()
              .toISOString()
              .split("T")[0],
            target_date: projectTargetDate || null,
            progress,
            next_action: shouldComplete
              ? null
              : projectNextAction.trim() || null,
            completed_date: shouldComplete
              ? new Date()
                  .toISOString()
                  .split("T")[0]
              : null,
          })
          .select(
            "id, goal_id, title, description, area, status, priority, target_date, progress, next_action"
          )
          .single();

        if (error) {
          console.error(
            "Error creating project:",
            error
          );
          alert("Could not create project.");
          return;
        }

        setProjects((currentProjects) => [
          data,
          ...currentProjects,
        ]);
      }

      closeProjectModal();
    } catch (error) {
      console.error(
        "Unexpected project save error:",
        error
      );
    } finally {
      setIsSavingProject(false);
    }
  }

  // --------------------------------------------------
  // DELETE PROJECT
  // --------------------------------------------------

  async function deleteProject() {
    if (!editingProject || isDeletingProject) return;

    const confirmed = window.confirm(
      `Delete "${editingProject.title}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeletingProject(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", editingProject.id);

      if (error) {
        console.error(
          "Error deleting project:",
          error
        );
        alert("Could not delete project.");
        return;
      }

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) =>
            project.id !== editingProject.id
        )
      );

      closeProjectModal();
    } catch (error) {
      console.error(
        "Unexpected project delete error:",
        error
      );
    } finally {
      setIsDeletingProject(false);
    }
  }

  // --------------------------------------------------
  // CALCULATIONS
  // --------------------------------------------------

  const activeGoals = goals.filter(
    (goal) => goal.status !== "completed"
  );

  const activeProjects = projects.filter(
    (project) => project.status !== "completed"
  );

  const completedGoals = goals.filter(
    (goal) => goal.status === "completed"
  );

  const completedProjects = projects.filter(
    (project) => project.status === "completed"
  );

  const overallProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce(
            (total, goal) =>
              total + (goal.progress ?? 0),
            0
          ) / activeGoals.length
        )
      : 0;


  // --------------------------------------------------
  // PROJECT FORM
  // --------------------------------------------------

  function ProjectForm() {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Project title
          </label>

          <input
            type="text"
            value={projectTitle}
            onChange={(e) =>
              setProjectTitle(e.target.value)
            }
            placeholder="e.g. Build Power BI Portfolio"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Related goal
          </label>

          <select
            value={projectGoalId}
            onChange={(e) =>
              setProjectGoalId(e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <option value="">
              No related goal
            </option>

            {activeGoals
              .filter(
                (goal) =>
                  !editingProject ||
                  goal.id !== undefined
              )
              .map((goal) => (
                <option
                  key={goal.id}
                  value={goal.id}
                >
                  {goal.title}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>

          <textarea
            value={projectDescription}
            onChange={(e) =>
              setProjectDescription(e.target.value)
            }
            rows={3}
            placeholder="What are you building or completing?"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Area
            </label>

            <select
              value={projectArea}
              onChange={(e) =>
                setProjectArea(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Priority
            </label>

            <select
              value={projectPriority}
              onChange={(e) =>
                setProjectPriority(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <option value="low">Low</option>
              <option value="medium">
                Medium
              </option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Target date
          </label>

          <input
            type="date"
            value={projectTargetDate}
            onChange={(e) =>
              setProjectTargetDate(e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Next action
          </label>

          <input
            type="text"
            value={projectNextAction}
            onChange={(e) =>
              setProjectNextAction(e.target.value)
            }
            placeholder="What should you do next?"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
          />
        </div>

        {editingProject && (
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Progress
              </label>

              <span className="text-xl font-bold text-indigo-600">
                {projectProgress}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={projectProgress}
              onChange={(e) =>
                setProjectProgress(
                  Number(e.target.value)
                )
              }
              className="mt-4 w-full cursor-pointer"
            />

            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
  <main className="min-h-screen bg-slate-50 text-slate-900">
    <LifeOSSidebar />

    <section className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-10">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Future
            </p>

            <h1 className="mt-1 text-4xl font-bold text-slate-900">
              Build your future.
            </h1>

            <p className="mt-2 text-slate-500">
              Turn long-term direction into
              measurable progress.
            </p>
          </div>

        
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            Loading your future...
          </div>
        ) : (
          <>
            {/* KPI */}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Active goals
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {activeGoals.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Active projects
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {activeProjects.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Overall progress
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {overallProgress}%
                </p>
              </div>
            </div>

            {/* ACTIVE */}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* GOALS */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Goals
                    </h2>

                    <p className="text-sm text-slate-400">
                      {activeGoals.length} active
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openNewGoal}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    + New Goal
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  {activeGoals.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                      <p className="text-sm font-medium text-slate-600">
                        No active goals.
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Create a goal for the future
                        you are building.
                      </p>
                    </div>
                  ) : (
                    activeGoals.map((goal) => (
                      <button
                        type="button"
                        key={goal.id}
                        onClick={() =>
                          openEditGoal(goal)
                        }
                        className="block w-full rounded-xl border border-slate-100 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                      >
                        <div className="flex justify-between gap-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {goal.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {goal.area ?? "General"} ·{" "}
                              {goal.priority}
                            </p>

                            {goal.target_date && (
                              <p className="mt-1 text-xs text-slate-400">
                                Target:{" "}
                                {goal.target_date}
                              </p>
                            )}
                          </div>

                          <span className="font-semibold text-indigo-600">
                            {goal.progress ?? 0}%
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  goal.progress ?? 0,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>

              {/* PROJECTS */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Projects
                    </h2>

                    <p className="text-sm text-slate-400">
                      {activeProjects.length} active
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openNewProject}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    + New Project
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  {activeProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                      <p className="text-sm font-medium text-slate-600">
                        No active projects.
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Turn your goals into
                        actionable projects.
                      </p>
                    </div>
                  ) : (
                    activeProjects.map((project) => (
                      <button
                        type="button"
                        key={project.id}
                        onClick={() =>
                          openEditProject(project)
                        }
                        className="block w-full rounded-xl border border-slate-100 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                      >
                        <div className="flex justify-between gap-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {project.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {project.area ??
                                "General"}{" "}
                              · {project.priority}
                            </p>

                            {project.target_date && (
                              <p className="mt-1 text-xs text-slate-400">
                                Target:{" "}
                                {project.target_date}
                              </p>
                            )}
                          </div>

                          <span className="font-semibold text-indigo-600">
                            {project.progress ?? 0}%
                          </span>
                        </div>

                        {project.next_action && (
                          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Next action
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              {
                                project.next_action
                              }
                            </p>
                          </div>
                        )}

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  project.progress ??
                                    0,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* COMPLETED SUMMARY */}

            {(completedGoals.length > 0 ||
              completedProjects.length > 0) && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Completed
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {completedGoals.length} goals ·{" "}
                  {completedProjects.length} projects
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {completedGoals.map((goal) => (
                    <button
                      key={`goal-${goal.id}`}
                      type="button"
                      onClick={() =>
                        openEditGoal(goal)
                      }
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-4 text-left hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {goal.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Goal · {goal.area}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        Completed
                      </span>
                    </button>
                  ))}

                  {completedProjects.map(
                    (project) => (
                      <button
                        key={`project-${project.id}`}
                        type="button"
                        onClick={() =>
                          openEditProject(project)
                        }
                        className="flex items-center justify-between rounded-xl border border-slate-100 p-4 text-left hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {project.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Project ·{" "}
                            {project.area}
                          </p>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          Completed
                        </span>
                      </button>
                    )
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* GOAL MODAL */}

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  {editingGoal
                    ? "Edit Goal"
                    : "New Goal"}
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {editingGoal
                    ? editingGoal.title
                    : "Create a new goal"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeGoalModal}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700">
      Goal title
    </label>

    <input
      type="text"
      value={goalTitle}
      onChange={(e) => setGoalTitle(e.target.value)}
      placeholder="e.g. Become a Data Analyst"
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
    />
  </div>

  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700">
      Description
    </label>

    <textarea
      value={goalDescription}
      onChange={(e) => setGoalDescription(e.target.value)}
      rows={3}
      placeholder="What does success look like?"
      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
    />
  </div>

  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Area
      </label>

      <select
        value={goalArea}
        onChange={(e) => setGoalArea(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
      >
        {areas.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Priority
      </label>

      <select
        value={goalPriority}
        onChange={(e) => setGoalPriority(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>
  </div>

  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700">
      Target date
    </label>

    <input
      type="date"
      value={goalTargetDate}
      onChange={(e) => setGoalTargetDate(e.target.value)}
      className="w-full rounded-xl border border-slate-200 px-4 py-3"
    />
  </div>

  {editingGoal && (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          Progress
        </label>

        <span className="text-xl font-bold text-indigo-600">
          {goalProgress}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={goalProgress}
        onChange={(e) => setGoalProgress(Number(e.target.value))}
        className="mt-4 w-full cursor-pointer"
      />

      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )}
</div>

            <div className="mt-6 space-y-3">
              {editingGoal && (
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={deleteGoal}
                    disabled={
                      isDeletingGoal ||
                      isSavingGoal
                    }
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
                  >
                    {isDeletingGoal
                      ? "Deleting..."
                      : "Delete Goal"}
                  </button>

                  {editingGoal.status !==
                    "completed" && (
                    <button
                      type="button"
                      onClick={() =>
                        saveGoal(true)
                      }
                      disabled={
                        isSavingGoal ||
                        isDeletingGoal
                      }
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
                    >
                      ✓ Mark Complete
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeGoalModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    saveGoal(false)
                  }
                  disabled={
                    !goalTitle.trim() ||
                    isSavingGoal ||
                    isDeletingGoal
                  }
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingGoal
                    ? "Saving..."
                    : editingGoal
                    ? "Save Changes"
                    : "Create Goal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT MODAL */}

      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  {editingProject
                    ? "Edit Project"
                    : "New Project"}
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {editingProject
                    ? editingProject.title
                    : "Create a new project"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeProjectModal}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              {ProjectForm()}
            </div>

            <div className="mt-6 space-y-3">
              {editingProject && (
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={deleteProject}
                    disabled={
                      isDeletingProject ||
                      isSavingProject
                    }
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
                  >
                    {isDeletingProject
                      ? "Deleting..."
                      : "Delete Project"}
                  </button>

                  {editingProject.status !==
                    "completed" && (
                    <button
                      type="button"
                      onClick={() =>
                        saveProject(true)
                      }
                      disabled={
                        isSavingProject ||
                        isDeletingProject
                      }
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
                    >
                      ✓ Mark Complete
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeProjectModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    saveProject(false)
                  }
                  disabled={
                    !projectTitle.trim() ||
                    isSavingProject ||
                    isDeletingProject
                  }
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingProject
                    ? "Saving..."
                    : editingProject
                    ? "Save Changes"
                    : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
              )}
    </section>
  </main>
);
}