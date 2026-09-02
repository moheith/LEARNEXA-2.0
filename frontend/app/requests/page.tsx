"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "../../lib/api";

type RequestRow = {
  id: number;
  sender: string;
  receiver: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
};

export default function Requests() {
  const router = useRouter();
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadRequests();
  }, [router]);

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const res = await apiGet<RequestRow[]>("/requests");

      if (!res.ok) {
        setError(res.error || "Failed to load requests");
        setRows([]);
        return;
      }

      setRows(res.data || []);
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  async function updateRequest(id: number, status: string) {
    setUpdating(id);
    try {
      const res = await apiPatch(`/requests/${id}`, { status });

      if (!res.ok) {
        alert(res.error || "Failed to update request");
        return;
      }

      await loadRequests();
    } catch (err) {
      alert("Connection error");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Link
        href="/"
        className="text-purple-700 hover:text-purple-900 font-medium"
      >
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold my-6">Learning Requests</h1>

      {error && (
        <div className="p-4 mb-4 rounded-lg bg-red-100 text-red-700 border border-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="card p-5 mb-4 text-center">
          <p className="text-gray-600">Loading requests...</p>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="card p-5 text-center">
          <p className="text-gray-500">No learning requests yet.</p>
          <Link href="/" className="text-purple-700 hover:underline mt-2 inline-block">
            Browse recommendations
          </Link>
        </div>
      )}

      {!loading &&
        rows.map((r) => (
          <div className="card p-5 mb-4" key={r.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500">
                  <b>{r.sender}</b> → <b>{r.receiver}</b>
                </p>
              </div>
              <p className="text-sm font-medium">
                Status:{" "}
                <span
                  className={
                    r.status === "accepted"
                      ? "text-green-600"
                      : r.status === "rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }
                >
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </p>
            </div>

            <p className="text-gray-600 my-3 italic">"{r.message}"</p>

            {r.status === "pending" && (
              <div className="flex gap-2 mt-4">
                <button
                  className="btn flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => updateRequest(r.id, "accepted")}
                  disabled={updating === r.id}
                >
                  {updating === r.id ? "..." : "Accept"}
                </button>

                <button
                  className="btn2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => updateRequest(r.id, "rejected")}
                  disabled={updating === r.id}
                >
                  {updating === r.id ? "..." : "Reject"}
                </button>
              </div>
            )}
          </div>
        ))}
    </main>
  );
}