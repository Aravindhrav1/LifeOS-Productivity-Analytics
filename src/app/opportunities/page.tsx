"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LifeOSSidebar from "@/components/LifeOSSidebar";

type Opportunity = {
  id: number;
  project_id: number | null;
  title: string;
  organization: string | null;
  contact_name: string | null;
  contact_details: string | null;
  opportunity_type: string | null;
  source: string | null;
  stage: string;
  priority: string;
  potential_value: number | null;
  date_added: string | null;
  last_contact_date: string | null;
  next_follow_up: string | null;
  next_action: string | null;
  notes: string | null;
  outcome: string | null;
};

const stages = [
  "idea",
  "researching",
  "contacted",
  "applied",
  "interview_meeting",
  "waiting",
  "negotiation",
  "successful",
  "dropped",
];

const stageLabels: Record<string, string> = {
  idea: "Idea",
  researching: "Researching",
  contacted: "Contacted",
  applied: "Applied",
  interview_meeting: "Interview / Meeting",
  waiting: "Waiting",
  negotiation: "Negotiation",
  successful: "Successful",
  dropped: "Dropped",
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNewOpportunity, setShowNewOpportunity] = useState(false);
  const [editingOpportunity, setEditingOpportunity] =
    useState<Opportunity | null>(null);

  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [opportunityType, setOpportunityType] = useState("job");
  const [source, setSource] = useState("");
  const [stage, setStage] = useState("idea");
  const [priority, setPriority] = useState("medium");
  const [potentialValue, setPotentialValue] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [notes, setNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // --------------------------------------------------
  // Load opportunities
  // --------------------------------------------------

  useEffect(() => {
    async function loadOpportunities() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("opportunities")
        .select(
          `
          id,
          project_id,
          title,
          organization,
          contact_name,
          contact_details,
          opportunity_type,
          source,
          stage,
          priority,
          potential_value,
          date_added,
          last_contact_date,
          next_follow_up,
          next_action,
          notes,
          outcome
          `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading opportunities:", error);
      }

      setOpportunities(data ?? []);
      setLoading(false);
    }

    loadOpportunities();
  }, []);

  // --------------------------------------------------
  // Reset form
  // --------------------------------------------------

  function resetForm() {
    setTitle("");
    setOrganization("");
    setOpportunityType("job");
    setSource("");
    setStage("idea");
    setPriority("medium");
    setPotentialValue("");
    setContactName("");
    setContactDetails("");
    setNextFollowUp("");
    setNextAction("");
    setNotes("");
  }

  // --------------------------------------------------
  // Create opportunity
  // --------------------------------------------------

  async function saveOpportunity() {
    if (!title.trim() || isSaving) return;

    setIsSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please sign in again.");
        return;
      }

      const { data, error } = await supabase
        .from("opportunities")
        .insert({
          user_id: user.id,
          title: title.trim(),
          organization: organization.trim() || null,
          opportunity_type: opportunityType || null,
          source: source.trim() || null,
          stage,
          priority,
          potential_value: potentialValue
            ? Number(potentialValue)
            : null,
          contact_name: contactName.trim() || null,
          contact_details: contactDetails.trim() || null,
          next_follow_up: nextFollowUp || null,
          next_action: nextAction.trim() || null,
          notes: notes.trim() || null,
        })
        .select(
          `
          id,
          project_id,
          title,
          organization,
          contact_name,
          contact_details,
          opportunity_type,
          source,
          stage,
          priority,
          potential_value,
          date_added,
          last_contact_date,
          next_follow_up,
          next_action,
          notes,
          outcome
          `
        )
        .single();

      if (error) {
        console.error("Error creating opportunity:", error);
        alert("Could not create opportunity. Check the console.");
        return;
      }

      setOpportunities((current) => [data, ...current]);

      resetForm();
      setShowNewOpportunity(false);
    } catch (error) {
      console.error("Unexpected opportunity error:", error);
    } finally {
      setIsSaving(false);
    }
  }

  // --------------------------------------------------
  // Open edit modal
  // --------------------------------------------------

  function openEditOpportunity(opportunity: Opportunity) {
    setEditingOpportunity(opportunity);

    setTitle(opportunity.title);
    setOrganization(opportunity.organization ?? "");
    setOpportunityType(opportunity.opportunity_type ?? "job");
    setSource(opportunity.source ?? "");
    setStage(opportunity.stage);
    setPriority(opportunity.priority);
    setPotentialValue(
      opportunity.potential_value?.toString() ?? ""
    );
    setContactName(opportunity.contact_name ?? "");
    setContactDetails(opportunity.contact_details ?? "");
    setNextFollowUp(opportunity.next_follow_up ?? "");
    setNextAction(opportunity.next_action ?? "");
    setNotes(opportunity.notes ?? "");
  }

  // --------------------------------------------------
  // Update opportunity
  // --------------------------------------------------

  async function updateOpportunity() {
    if (!editingOpportunity || !title.trim() || isSaving) return;

    setIsSaving(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("opportunities")
        .update({
          title: title.trim(),
          organization: organization.trim() || null,
          opportunity_type: opportunityType || null,
          source: source.trim() || null,
          stage,
          priority,
          potential_value: potentialValue
            ? Number(potentialValue)
            : null,
          contact_name: contactName.trim() || null,
          contact_details: contactDetails.trim() || null,
          next_follow_up: nextFollowUp || null,
          next_action: nextAction.trim() || null,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingOpportunity.id);

      if (error) {
        console.error("Error updating opportunity:", error);
        alert("Could not update opportunity.");
        return;
      }

      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.id === editingOpportunity.id
            ? {
                ...opportunity,
                title: title.trim(),
                organization: organization.trim() || null,
                opportunity_type: opportunityType || null,
                source: source.trim() || null,
                stage,
                priority,
                potential_value: potentialValue
                  ? Number(potentialValue)
                  : null,
                contact_name: contactName.trim() || null,
                contact_details: contactDetails.trim() || null,
                next_follow_up: nextFollowUp || null,
                next_action: nextAction.trim() || null,
                notes: notes.trim() || null,
              }
            : opportunity
        )
      );

      setEditingOpportunity(null);
      resetForm();
    } catch (error) {
      console.error("Unexpected update error:", error);
    } finally {
      setIsSaving(false);
    }
  }

  // --------------------------------------------------
  // Calculations
  // --------------------------------------------------

  const activeOpportunities = opportunities.filter(
    (opportunity) =>
      opportunity.stage !== "successful" &&
      opportunity.stage !== "dropped"
  );

  const waitingOpportunities = opportunities.filter(
    (opportunity) => opportunity.stage === "waiting"
  );

  const successfulOpportunities = opportunities.filter(
    (opportunity) => opportunity.stage === "successful"
  );

  const totalPipelineValue = activeOpportunities.reduce(
    (total, opportunity) =>
      total + Number(opportunity.potential_value ?? 0),
    0
  );

  // --------------------------------------------------
  // Form
  // --------------------------------------------------

  function OpportunityForm() {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Data Analyst - BBC"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Organization
            </label>

            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Company or organization"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Type
            </label>

            <select
              value={opportunityType}
              onChange={(e) => setOpportunityType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <option value="job">Job</option>
              <option value="business">Business</option>
              <option value="client">Client</option>
              <option value="collaboration">Collaboration</option>
              <option value="course">Course</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Stage
            </label>

            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              {stages.map((item) => (
                <option key={item} value={item}>
                  {stageLabels[item]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Priority
            </label>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Source
            </label>

            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="LinkedIn, referral, expo..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Potential value
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={potentialValue}
              onChange={(e) => setPotentialValue(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contact name
            </label>

            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contact details
            </label>

            <input
              type="text"
              value={contactDetails}
              onChange={(e) => setContactDetails(e.target.value)}
              placeholder="Email, phone or LinkedIn"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Next follow-up
          </label>

          <input
            type="date"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Next action
          </label>

          <input
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="e.g. Send CV to recruiter"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything important to remember..."
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
          />
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
  <main className="min-h-screen bg-slate-50 text-slate-900">
    <LifeOSSidebar />

    <section className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Opportunities
            </p>

            <h1 className="mt-1 text-4xl font-bold text-slate-900">
              Never lose an opportunity.
            </h1>

            <p className="mt-2 text-slate-500">
              Track jobs, business leads, collaborations and important
              follow-ups.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowNewOpportunity(true);
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + New Opportunity
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            Loading opportunities...
          </div>
        ) : (
          <>
            {/* KPI Cards */}

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Active
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {activeOpportunities.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Waiting
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {waitingOpportunities.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Successful
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {successfulOpportunities.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Pipeline value
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  £
                  {totalPipelineValue.toLocaleString("en-GB", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            {/* Active Pipeline */}

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Active pipeline
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {activeOpportunities.length} opportunities in progress
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {activeOpportunities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <p className="text-sm font-medium text-slate-600">
                      No active opportunities yet.
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Add your first job, lead or collaboration.
                    </p>
                  </div>
                ) : (
                  activeOpportunities.map((opportunity) => (
                    <button
                      type="button"
                      key={opportunity.id}
                      onClick={() => openEditOpportunity(opportunity)}
                      className="block w-full rounded-xl border border-slate-100 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {opportunity.title}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {opportunity.organization || "No organization"}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                              {stageLabels[opportunity.stage] ??
                                opportunity.stage}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                              {opportunity.priority}
                            </span>

                            {opportunity.opportunity_type && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                {opportunity.opportunity_type}
                              </span>
                            )}
                          </div>
                        </div>

                        {opportunity.potential_value !== null && (
                          <span className="font-semibold text-slate-700">
                            £
                            {Number(
                              opportunity.potential_value
                            ).toLocaleString("en-GB")}
                          </span>
                        )}
                      </div>

                      {opportunity.next_action && (
                        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Next action
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {opportunity.next_action}
                          </p>
                        </div>
                      )}

                      {opportunity.next_follow_up && (
                        <p className="mt-3 text-xs text-slate-400">
                          Follow up: {opportunity.next_follow_up}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </section>

            {/* Closed */}

            {(successfulOpportunities.length > 0 ||
              opportunities.some(
                (opportunity) => opportunity.stage === "dropped"
              )) && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Closed
                </h2>

                <div className="mt-5 space-y-3">
                  {opportunities
                    .filter(
                      (opportunity) =>
                        opportunity.stage === "successful" ||
                        opportunity.stage === "dropped"
                    )
                    .map((opportunity) => (
                      <button
                        type="button"
                        key={opportunity.id}
                        onClick={() => openEditOpportunity(opportunity)}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-100 p-4 text-left hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {opportunity.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {opportunity.organization || "No organization"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            opportunity.stage === "successful"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {stageLabels[opportunity.stage]}
                        </span>
                      </button>
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* New Opportunity Modal */}

      {showNewOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  New opportunity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Capture it now so it does not get forgotten.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowNewOpportunity(false);
                  resetForm();
                }}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <OpportunityForm />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowNewOpportunity(false);
                  resetForm();
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveOpportunity}
                disabled={!title.trim() || isSaving}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Add Opportunity"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Opportunity Modal */}

      {editingOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  Opportunity
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {editingOpportunity.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the stage and decide your next move.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingOpportunity(null);
                  resetForm();
                }}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <OpportunityForm />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingOpportunity(null);
                  resetForm();
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateOpportunity}
                disabled={!title.trim() || isSaving}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
            )}

      
    </section>
  </main>
);
}