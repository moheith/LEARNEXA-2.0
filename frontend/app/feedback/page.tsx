"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000/api";

type Session = {
  id: number;
  title: string;
  session_date?: string;
  date?: string;
  status: string;
};

export default function FeedbackPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");

  const [rating, setRating] = useState(0);
  const [skillTaught, setSkillTaught] = useState("");
  const [useful, setUseful] = useState("");
  const [comment, setComment] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const data = await response.json();

      const sessionList = Array.isArray(data)
        ? data
        : Array.isArray(data.sessions)
        ? data.sessions
        : [];

      setSessions(sessionList);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback() {
    setMessage("");

    if (!selectedSession) {
      setMessage("Please select a session.");
      return;
    }

    if (rating === 0) {
      setMessage("Please give a rating.");
      return;
    }

    if (!skillTaught) {
      setMessage("Please tell us whether the agreed skill was taught.");
      return;
    }

    if (!useful) {
      setMessage("Please tell us whether the session was useful.");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: Number(selectedSession),
            rating: rating,
            comment: comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to submit feedback.");
        return;
      }

      setMessage("Feedback submitted successfully!");

      setSelectedSession("");
      setRating(0);
      setSkillTaught("");
      setUseful("");
      setComment("");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-[var(--card)]">
        <div className="page-container flex min-h-[70px] items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-[var(--primary)]"
            >
              LEARNEXA
            </Link>

            <p className="hidden text-xs text-[var(--muted)] sm:block">
              Student Skill Exchange
            </p>
          </div>

          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
            <Link href="/" className="hover:text-[var(--primary)]">
              Dashboard
            </Link>

            <Link href="/profile" className="hover:text-[var(--primary)]">
              Profile
            </Link>

            <Link href="/requests" className="hover:text-[var(--primary)]">
              Requests
            </Link>

            <Link href="/sessions" className="hover:text-[var(--primary)]">
              Sessions
            </Link>

            <span className="font-semibold text-[var(--primary)]">
              Feedback
            </span>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <div className="page-container py-8">
        {/* Page heading */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
            FEEDBACK & ACCOUNTABILITY
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Review your skill exchange
          </h1>

          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Your feedback helps LEARNEXA maintain a reliable and useful
            learning community.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Feedback form */}
          <section className="simple-card p-6">
            <h2 className="text-xl font-bold">
              Give Feedback
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Complete this after finishing a skill exchange session.
            </p>

            {/* Session */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold">
                Select Session
              </label>

              {loading ? (
                <div className="rounded-lg border p-3 text-sm text-[var(--muted)]">
                  Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-lg border p-4 text-sm text-[var(--muted)]">
                  No sessions available yet.
                  <div className="mt-2">
                    <Link
                      href="/sessions"
                      className="font-semibold text-[var(--primary)]"
                    >
                      Go to Sessions →
                    </Link>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="form-input"
                >
                  <option value="">Choose a session</option>

                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Rating */}
            <div className="mt-6">
              <label className="mb-3 block text-sm font-semibold">
                Overall Rating
              </label>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition ${
                      star <= rating
                        ? "text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                    title={`${star} star`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <p className="mt-2 text-sm text-[var(--muted)]">
                {rating === 0
                  ? "Select a rating from 1 to 5."
                  : `${rating} out of 5 stars`}
              </p>
            </div>

            {/* Skill taught */}
            <div className="mt-6">
              <label className="mb-3 block text-sm font-semibold">
                Was the agreed skill taught?
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSkillTaught("yes")}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                    skillTaught === "yes"
                      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                      : ""
                  }`}
                >
                  ✓ Yes
                </button>

                <button
                  type="button"
                  onClick={() => setSkillTaught("partially")}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                    skillTaught === "partially"
                      ? "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                      : ""
                  }`}
                >
                  Partially
                </button>

                <button
                  type="button"
                  onClick={() => setSkillTaught("no")}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                    skillTaught === "no"
                      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                      : ""
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Useful */}
            <div className="mt-6">
              <label className="mb-3 block text-sm font-semibold">
                Was the session useful?
              </label>

              <div className="flex flex-wrap gap-3">
                {["yes", "somewhat", "no"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setUseful(value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold capitalize ${
                      useful === value
                        ? "border-[var(--primary)] bg-blue-50 text-[var(--primary)] dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold">
                Additional Comments
              </label>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="Share your experience with this learning partner..."
                className="form-input resize-none"
              />
            </div>

            {/* Message */}
            {message && (
              <div className="mt-5 rounded-lg border px-4 py-3 text-sm font-medium">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={submitFeedback}
              disabled={submitting}
              className="primary-button mt-6 w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </section>

          {/* Reliability */}
          <aside className="space-y-6">
            <section className="simple-card p-6">
              <h2 className="text-xl font-bold">
                My Exchange Reliability
              </h2>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Your reliability will improve as you complete successful
                exchanges.
              </p>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Reliability Score
                  </span>

                  <span className="text-lg font-bold text-[var(--primary)]">
                    0%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-full w-0 rounded-full bg-[var(--primary)]" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">0</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Completed
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">—</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Avg Rating
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">0</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Cancelled
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">0</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Reward Points
                  </p>
                </div>
              </div>
            </section>

            {/* How it works */}
            <section className="simple-card p-6">
              <h2 className="text-lg font-bold">
                How Accountability Works
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[var(--primary)] dark:bg-blue-900/20">
                    1
                  </span>

                  <div>
                    <p className="font-semibold">
                      Complete the exchange
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Both students attend and complete their planned
                      learning session.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[var(--primary)] dark:bg-blue-900/20">
                    2
                  </span>

                  <div>
                    <p className="font-semibold">
                      Give honest feedback
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Rate the session and tell us whether your learning goal
                      was achieved.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[var(--primary)] dark:bg-blue-900/20">
                    3
                  </span>

                  <div>
                    <p className="font-semibold">
                      Build your reputation
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Successful exchanges can improve your reliability and
                      reward points.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Reward preview */}
            <section className="simple-card p-6">
              <p className="text-sm font-semibold text-[var(--primary)]">
                REWARD SYSTEM
              </p>

              <h2 className="mt-2 text-lg font-bold">
                Earn points through good exchanges
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                In the future, successful skill exchanges can earn reward
                points. These points can be used for benefits or discounts
                inside the LEARNEXA platform.
              </p>

              <div className="mt-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Current Points
                  </span>

                  <span className="font-bold text-[var(--primary)]">
                    0 pts
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}