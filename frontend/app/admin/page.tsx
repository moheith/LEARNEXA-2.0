"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../../components/AppNav";
import { apiGet, apiPatch } from "../../lib/api";

type Resource = {
  name: string;
  columns: string[];
  items: Record<string, unknown>[];
};

const resources = [
  "users",
  "skills",
  "user_skills",
  "requests",
  "sessions",
  "feedback",
  "wallets",
  "transactions",
  "notifications",
  "conversations",
  "messages",
  "goals",
  "reports",
  "skill_suggestions",
];

export default function AdminPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [resource, setResource] = useState<Resource | null>(null);
  const [selected, setSelected] = useState("users");
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");

  async function loadResource(name: string) {
    const endpoint = name === "users" ? "/admin/users?per_page=500" : `/admin/${name}`;
    const response = await apiGet<{ items: Record<string, unknown>[] } | Record<string, unknown>[]>(
      endpoint,
    );
    if (!response.ok) {
      setError(response.error || "Unable to load admin data.");
      return;
    }
    const items = Array.isArray(response.data) ? response.data : response.data?.items || [];
    setResource({
      name,
      items,
      columns: items.length ? Object.keys(items[0]) : [],
    });
  }

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    Promise.all([
      apiGet<Record<string, number>>("/admin/dashboard"),
      apiGet<Record<string, unknown>[]>("/admin/reports"),
    ]).then(([dashboardResponse, reportsResponse]) => {
      if (!dashboardResponse.ok || !reportsResponse.ok) {
        setError("Admin access required.");
        return;
      }
      setDashboard(dashboardResponse.data || {});
      setReports(reportsResponse.data || []);
      loadResource("users");
    });
  }, [router]);

  async function resolveReport(id: number) {
    const response = await apiPatch(`/admin/reports/${id}`, {
      status: "resolved",
    });
    if (response.ok) {
      setReports((items) =>
        items.map((item) => (item.id === id ? { ...item, status: "resolved" } : item)),
      );
    }
  }

  return (
    <main className="min-h-screen">
      <AppNav />
      <section className="page-container py-8">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
        <p className="mt-1 text-[var(--muted)]">
          Complete operational view of users and LEARNEXA activity.
        </p>
        {error && <div className="simple-card mt-6 p-5 text-red-600">{error}</div>}

        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(dashboard).map(([key, value]) => (
            <div className="simple-card p-4" key={key}>
              <p className="text-xs capitalize text-[var(--muted)]">
                {key.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <section className="simple-card mt-8 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
            <div>
              <h2 className="text-xl font-bold">All stored data</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Inspect users, skills, exchanges, messaging, wallets, moderation, and suggestions.
              </p>
            </div>
            <select
              className="form-input w-auto"
              value={selected}
              onChange={(event) => {
                const value = event.target.value;
                setSelected(value);
                loadResource(value);
              }}
            >
              {resources.map((name) => (
                <option key={name} value={name}>
                  {name.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          {!resource || resource.items.length === 0 ? (
            <p className="p-6 text-[var(--muted)]">No records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-[var(--border)]">
                  <tr>
                    {resource.columns.map((column) => (
                      <th className="whitespace-nowrap px-4 py-3 capitalize" key={column}>
                        {column.replaceAll("_", " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resource.items.map((item, index) => (
                    <tr className="border-b border-[var(--border)] last:border-0" key={String(item.id ?? index)}>
                      {resource.columns.map((column) => (
                        <td className="max-w-[280px] truncate px-4 py-3" key={column}>
                          {String(item[column] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Reports</h2>
          <div className="mt-3 space-y-3">
            {reports.length ? reports.map((report) => (
              <div className="simple-card flex flex-wrap justify-between gap-3 p-4" key={String(report.id)}>
                <span>
                  #{String(report.id)} · {String(report.reason)}{" "}
                  <small className="text-[var(--muted)]">({String(report.status)})</small>
                </span>
                {report.status === "open" && (
                  <button className="secondary-button text-sm" onClick={() => resolveReport(Number(report.id))}>
                    Resolve
                  </button>
                )}
              </div>
            )) : <div className="simple-card p-5 text-[var(--muted)]">No reports.</div>}
          </div>
        </section>
      </section>
    </main>
  );
}
