"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000/api";

type RequestItem = {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_name?: string;
  receiver_name?: string;
  message?: string;
  status: string;
  created_at?: string;
};

export default function RequestsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const meResponse = await fetch(
        `${API_BASE}/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!meResponse.ok) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const me = await meResponse.json();
      setUser(me);

      const response = await fetch(
        `${API_BASE}/requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to load requests.");
        return;
      }

      setRequests(
        Array.isArray(data)
          ? data
          : data.requests || []
      );

    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRequest(
    requestId: number,
    status: "accepted" | "rejected"
  ) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            data.error ||
            "Could not update request."
        );
        return;
      }

      loadRequests();

    } catch (error) {
      setError("Unable to update request.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Loading requests...
      </main>
    );
  }

  const incoming = requests.filter(
    (request) =>
      request.receiver_id === user?.id
  );

  const outgoing = requests.filter(
    (request) =>
      request.sender_id === user?.id
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">

      <nav className="border-b bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <Link
            href="/"
            className="text-2xl font-bold text-violet-600"
          >
            LEARNEXA
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-lg px-3 py-2 text-sm hover:bg-slate-100 sm:block dark:hover:bg-slate-800"
            >
              Dashboard
            </Link>

            <ThemeToggle />
          </div>

        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-10">

        <h1 className="text-3xl font-bold">
          Skill Exchange Requests
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your learning partner requests.
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20">
            {error}
          </div>
        )}

        {/* INCOMING */}

        <div className="mt-8">

          <h2 className="text-xl font-bold">
            Incoming Requests
          </h2>

          <div className="mt-4 space-y-4">

            {incoming.length === 0 ? (
              <div className="rounded-2xl border bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                No incoming requests.
              </div>
            ) : (
              incoming.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >

                  <div className="flex flex-col justify-between gap-5 sm:flex-row">

                    <div>
                      <h3 className="font-semibold">
                        {request.sender_name ||
                          "Student"}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {request.message ||
                          "I would like to exchange skills with you."}
                      </p>

                      <span className="mt-3 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
                        {request.status}
                      </span>
                    </div>

                    {request.status === "pending" && (
                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            updateRequest(
                              request.id,
                              "accepted"
                            )
                          }
                          className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          Accept
                        </button>

                        <button
                          onClick={() =>
                            updateRequest(
                              request.id,
                              "rejected"
                            )
                          }
                          className="rounded-xl bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600"
                        >
                          Reject
                        </button>

                      </div>
                    )}

                    {request.status === "accepted" && (
                      <Link
                        href="/sessions"
                        className="rounded-xl bg-violet-600 px-5 py-2 text-center text-sm font-medium text-white"
                      >
                        Schedule Session
                      </Link>
                    )}

                  </div>

                </div>
              ))
            )}

          </div>
        </div>

        {/* OUTGOING */}

        <div className="mt-10">

          <h2 className="text-xl font-bold">
            Sent Requests
          </h2>

          <div className="mt-4 space-y-4">

            {outgoing.length === 0 ? (
              <div className="rounded-2xl border bg-white p-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                You haven't sent any requests.
              </div>
            ) : (
              outgoing.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >

                  <div className="flex items-center justify-between gap-4">

                    <div>
                      <h3 className="font-semibold">
                        To:{" "}
                        {request.receiver_name ||
                          "Student"}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {request.message}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        request.status === "accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : request.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {request.status}
                    </span>

                  </div>

                  {request.status === "pending" && (
                    <p className="mt-4 text-sm text-slate-500">
                      Waiting for the student to respond.
                    </p>
                  )}

                  {request.status === "accepted" && (
                    <Link
                      href="/sessions"
                      className="mt-5 inline-block text-sm font-medium text-violet-600"
                    >
                      Go to Sessions →
                    </Link>
                  )}

                </div>
              ))
            )}

          </div>
        </div>

      </section>
    </main>
  );
}