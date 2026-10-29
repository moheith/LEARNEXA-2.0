"use client";

import { useEffect, useState } from "react";
import AppNav from "../../components/AppNav";
import { apiGet, apiPatch, apiPost } from "../../lib/api";
import { getApiBaseUrl } from "../../lib/config";

type Goal = { id: number; session_id: number; goal: string; completed: boolean };

export default function InsightsPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [reliability, setReliability] = useState<Record<string, number>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("");
  const [session, setSession] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([apiGet("/statistics"), apiGet("/reliability"), apiGet<Goal[]>("/goals")])
      .then(([statistics, reliabilityResponse, goalsResponse]) => {
        if (statistics.ok) setStats(statistics.data || {});
        if (reliabilityResponse.ok) setReliability(reliabilityResponse.data || {});
        if (goalsResponse.ok) setGoals(goalsResponse.data || []);
      });
  }, []);

  async function addGoal() {
    const response = await apiPost("/goals", { session_id: Number(session), goal });
    if (!response.ok) {
      setMessage(response.error || "Could not save goal.");
      return;
    }
    setGoal("");
    setSession("");
    const refreshed = await apiGet<Goal[]>("/goals");
    if (refreshed.ok) setGoals(refreshed.data || []);
  }

  async function suggest() {
    const response = await apiPost("/skill-suggestions", { name, category });
    setMessage(response.ok ? "Skill suggestion submitted." : response.error || "Could not submit suggestion.");
    if (response.ok) {
      setName("");
      setCategory("");
    }
  }

  async function downloadCalendar() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${getApiBaseUrl()}/calendar.ics`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      setMessage("Unable to download your calendar.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "learnexa.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen">
      <AppNav />
      <section className="page-container py-8">
        <h1 className="text-3xl font-bold">Your learning overview</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(stats).map(([key, value]) => (
            <div className="simple-card p-4" key={key}>
              <p className="text-xs capitalize text-[var(--muted)]">{key.replaceAll("_", " ")}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
        <div className="simple-card mt-5 p-5">
          <h2 className="font-bold">Reliability score: {reliability.score ?? "—"}%</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {reliability.completed_sessions || 0} completed sessions across {reliability.requests || 0} requests.
          </p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <section className="simple-card p-5">
            <h2 className="text-xl font-bold">Session goals</h2>
            <div className="mobile-form-row mt-3 flex gap-2">
              <input className="form-input" value={session} onChange={(event) => setSession(event.target.value)} placeholder="Session ID" />
              <input className="form-input" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Goal" />
              <button className="primary-button" onClick={addGoal}>Add</button>
            </div>
            <div className="mt-4 space-y-2">
              {goals.map((item) => (
                <label className="flex items-center gap-2 text-sm" key={item.id}>
                  <input type="checkbox" checked={item.completed} onChange={async () => {
                    await apiPatch(`/goals/${item.id}`, { completed: !item.completed });
                    setGoals((current) => current.map((goalItem) => goalItem.id === item.id ? { ...goalItem, completed: !goalItem.completed } : goalItem));
                  }} />
                  <span className={item.completed ? "line-through text-[var(--muted)]" : ""}>{item.goal}</span>
                </label>
              ))}
            </div>
          </section>
          <section className="simple-card p-5">
            <h2 className="text-xl font-bold">Keep learning</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Suggest a skill you would like to see in the exchange.</p>
            <div className="mobile-form-row mt-3 flex gap-2">
              <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Skill name" />
              <input className="form-input" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" />
              <button className="primary-button" onClick={suggest}>Suggest</button>
            </div>
            <button className="secondary-button mt-5" onClick={downloadCalendar}>Download calendar (.ics)</button>
            {message && <p className="mt-3 text-sm text-[var(--primary)]">{message}</p>}
          </section>
        </div>
      </section>
    </main>
  );
}
