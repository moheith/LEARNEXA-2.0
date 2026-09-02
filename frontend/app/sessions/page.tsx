"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "../../lib/api";

type Session = {
  id: number;
  title: string;
  date: string;
  link?: string;
  status: "scheduled" | "completed" | "cancelled";
};

export default function Sessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadSessions();
  }, [router]);

  async function loadSessions() {
    try {
      setLoading(true);
      setError("");

      const res = await apiGet<Session[]>("/sessions");

      if (!res.ok) {
        setError(res.error || "Failed to load sessions");
        setSessions([]);
        return;
      }

      setSessions(res.data || []);
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "scheduled":
        return "text-blue-600 bg-blue-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Link href="/" className="text-purple-700 hover:text-purple-900 font-medium">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold my-6">Learning Sessions</h1>

      {error && (
        <div className="p-4 mb-4 rounded-lg bg-red-100 text-red-700 border border-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="card p-5 mb-4 text-center">
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="card p-5 text-center">
          <p className="text-gray-500">
            No learning sessions yet. Accept a learning request to schedule one!
          </p>
          <Link href="/" className="text-purple-700 hover:underline mt-2 inline-block">
            Browse recommendations
          </Link>
        </div>
      )}

      {!loading &&
        sessions.map((session) => (
          <div className="card p-5 mb-4" key={session.id}>
            <div className="flex justify-between items-start mb-3 gap-4">
              <div>
                <h3 className="text-lg font-bold">{session.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {session.date ? new Date(session.date).toLocaleString() : "Date not set"}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  session.status
                )}`}
              >
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </span>
            </div>

            {session.link && (
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">🔗 Meeting:</span>{" "}
                <a
                  href={session.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-700 hover:underline break-all"
                >
                  {session.link}
                </a>
              </div>
            )}
          </div>
        ))}

      {!loading && sessions.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Total sessions: {sessions.length}</p>
        </div>
      )}
    </main>
  );
}
