"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";

type Session = {
  id: number;
  request_id?: number;
  title: string;
  session_date?: string;
  date?: string;
  meeting_link?: string;
  link?: string;
  status: string;
};

type RequestItem = {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender?: string;
  receiver?: string;
  sender_name?: string;
  receiver_name?: string;
  status: string;
};

export default function SessionsPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const [requestId, setRequestId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const [skillBeingTaught, setSkillBeingTaught] = useState("");
  const [learnerGoal, setLearnerGoal] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [sessionResponse, requestResponse] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/sessions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch("http://127.0.0.1:5000/api/requests", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (
        sessionResponse.status === 401 ||
        requestResponse.status === 401
      ) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const sessionData = await sessionResponse.json();
      const requestData = await requestResponse.json();

      const sessionList = Array.isArray(sessionData)
        ? sessionData
        : sessionData.sessions || [];

      const requestList = Array.isArray(requestData)
        ? requestData
        : requestData.requests || [];

      setSessions(sessionList);

      setRequests(
        requestList.filter(
          (request: RequestItem) => request.status === "accepted"
        )
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to load sessions.");
    } finally {
      setLoading(false);
    }
  }

  async function scheduleSession(e: FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!requestId) {
      setMessage("Please select an accepted request.");
      return;
    }

    setMessage("Scheduling session...");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            request_id: Number(requestId),
            title,
            session_date: date,
            meeting_link: meetingLink,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Could not schedule the session."
        );
        return;
      }

      setMessage("Session scheduled successfully!");

      setRequestId("");
      setTitle("");
      setDate("");
      setMeetingLink("");
      setSkillBeingTaught("");
      setLearnerGoal("");
      setExpectedOutcome("");

      await loadSessions();
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    }
  }

  async function updateSession(
    sessionId: number,
    newStatus: "completed" | "cancelled"
  ) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const actionText =
      newStatus === "completed"
        ? "mark this session as completed"
        : "cancel this session";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText}?`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(sessionId);
    setMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/sessions/${sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Could not update the session."
        );
        return;
      }

      if (newStatus === "completed") {
        setMessage(
          "Session completed successfully! You can now give feedback."
        );
      } else {
        setMessage("Session cancelled successfully.");
      }

      await loadSessions();
    } catch (error) {
      console.error(error);
      setMessage("Unable to update the session.");
    } finally {
      setActionLoading(null);
    }
  }

  function getSessionDate(session: Session) {
    return session.session_date || session.date || "";
  }

  function getMeetingLink(session: Session) {
    return session.meeting_link || session.link || "";
  }

  function viewGoal() {
    if (
      !skillBeingTaught &&
      !learnerGoal &&
      !expectedOutcome
    ) {
      window.alert(
        "The session goal information is currently available while scheduling a session."
      );
      return;
    }

    window.alert(
      `Skill Being Taught:\n${skillBeingTaught || "Not specified"}\n\n` +
        `Learner's Goal:\n${learnerGoal || "Not specified"}\n\n` +
        `Expected Outcome:\n${expectedOutcome || "Not specified"}`
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-800 dark:text-white">
            Loading sessions...
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Please wait a moment.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* NAVIGATION */}
      <nav className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">

          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-blue-600"
          >
            LEARNEXA
          </Link>

          <div className="flex items-center gap-2">

            <Link
              href="/"
              className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Profile
            </Link>

            <Link
              href="/requests"
              className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Requests
            </Link>

            <Link
              href="/sessions"
              className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400"
            >
              Sessions
            </Link>

            <Link
              href="/feedback"
              className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Feedback
            </Link>

            <Link
              href="/wallet"
              className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Wallet
            </Link>

            <ThemeToggle />

          </div>
        </div>
      </nav>

      {/* MAIN */}
      <section className="mx-auto max-w-6xl px-5 py-8">

        {/* HEADER */}
        <div className="border-b border-slate-200 pb-6 dark:border-slate-800">

          <p className="text-sm font-medium text-blue-600">
            SKILL EXCHANGE
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Learning Sessions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Schedule your skill exchange sessions, define learning goals,
            attend sessions and track successful exchanges.
          </p>

        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
            {message}
          </div>
        )}

        {/* ACCOUNTABILITY INTRO */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              🎯
            </div>

            <div>

              <h2 className="font-semibold text-blue-900 dark:text-blue-200">
                Set a clear goal for every exchange
              </h2>

              <p className="mt-1 text-sm leading-6 text-blue-800 dark:text-blue-300">
                Both students should know what skill is being taught,
                what the learner wants to achieve and what the expected
                result is.
              </p>

            </div>

          </div>

        </div>

        {/* SCHEDULE SESSION */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Schedule a Session
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create a session with a student whose request has been accepted.
            </p>

          </div>

          {requests.length === 0 ? (

            <div className="p-6">

              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">

                <div className="text-3xl">
                  📋
                </div>

                <h3 className="mt-3 font-semibold text-slate-800 dark:text-white">
                  No accepted requests
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  You need an accepted skill exchange request before you can
                  schedule a session.
                </p>

                <Link
                  href="/requests"
                  className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  View Requests
                </Link>

              </div>

            </div>

          ) : (

            <form onSubmit={scheduleSession} className="p-6">

              <div className="grid gap-6 lg:grid-cols-2">

                {/* REQUEST */}
                <div>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Accepted Request
                  </label>

                  <select
                    value={requestId}
                    onChange={(e) => setRequestId(e.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >

                    <option value="">
                      Select an accepted request
                    </option>

                    {requests.map((request) => {

                      const studentName =
                        request.sender_name ||
                        request.receiver_name ||
                        request.sender ||
                        request.receiver ||
                        "Student";

                      return (
                        <option
                          key={request.id}
                          value={request.id}
                        >
                          Request #{request.id} — {studentName}
                        </option>
                      );
                    })}

                  </select>

                </div>

                {/* TITLE */}
                <div>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Session Title
                  </label>

                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Example: Java Skill Exchange"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                {/* DATE */}
                <div>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Date and Time
                  </label>

                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                {/* MEETING */}
                <div>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Meeting Link
                  </label>

                  <input
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                {/* SKILL */}
                <div>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    🎓 Skill Being Taught
                  </label>

                  <input
                    value={skillBeingTaught}
                    onChange={(e) =>
                      setSkillBeingTaught(e.target.value)
                    }
                    placeholder="Example: Java Basics"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    What skill will the teacher focus on?
                  </p>

                </div>

                {/* GOAL */}
                <div>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    📚 Learner&apos;s Goal
                  </label>

                  <input
                    value={learnerGoal}
                    onChange={(e) =>
                      setLearnerGoal(e.target.value)
                    }
                    placeholder="Example: Understand Java loops"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    What should the learner understand after the session?
                  </p>

                </div>

                {/* OUTCOME */}
                <div className="lg:col-span-2">

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    ✅ Expected Outcome
                  </label>

                  <textarea
                    value={expectedOutcome}
                    onChange={(e) =>
                      setExpectedOutcome(e.target.value)
                    }
                    rows={3}
                    placeholder="Example: Learner should be able to write and explain a simple Java loop program."
                    className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

              </div>

              {/* CHECKLIST */}
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">

                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Session Accountability
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-3">

                  <div>
                    <p className="text-sm font-medium">
                      ✓ Attend
                    </p>

                    <p className="text-xs text-slate-500">
                      Both students participate.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      ✓ Complete
                    </p>

                    <p className="text-xs text-slate-500">
                      Finish the agreed goal.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      ✓ Review
                    </p>

                    <p className="text-xs text-slate-500">
                      Give feedback afterwards.
                    </p>
                  </div>

                </div>

              </div>

              <button
                type="submit"
                className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Schedule Session
              </button>

            </form>

          )}

        </div>

        {/* HOW ACCOUNTABILITY WORKS */}
        <div className="mt-8">

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            How Accountability Works
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-4">

            <AccountabilityStep
              number="01"
              title="Set Goal"
              description="Agree on what will be taught and learned."
            />

            <AccountabilityStep
              number="02"
              title="Attend"
              description="Both students participate in the session."
            />

            <AccountabilityStep
              number="03"
              title="Complete"
              description="Finish the planned skill exchange."
            />

            <AccountabilityStep
              number="04"
              title="Review"
              description="Give feedback and build reliability."
            />

          </div>

        </div>

        {/* MY SESSIONS */}
        <div className="mt-10">

          <div className="flex items-end justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                My Sessions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your scheduled skill exchange sessions.
              </p>

            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {sessions.length}{" "}
              {sessions.length === 1 ? "session" : "sessions"}
            </div>

          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            {sessions.length === 0 ? (

              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900 md:col-span-2">

                <div className="text-3xl">
                  📅
                </div>

                <h3 className="mt-3 font-semibold text-slate-800 dark:text-white">
                  No sessions scheduled yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Accepted exchanges will appear here.
                </p>

              </div>

            ) : (

              sessions.map((session) => {

                const sessionDate = getSessionDate(session);
                const link = getMeetingLink(session);

                const isCompleted =
                  session.status === "completed";

                const isCancelled =
                  session.status === "cancelled";

                const isScheduled =
                  session.status === "scheduled";

                return (

                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                  >

                    {/* TITLE */}
                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                          Skill Exchange
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                          {session.title}
                        </h3>

                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isCompleted
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : isCancelled
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                        }`}
                      >
                        {session.status}
                      </span>

                    </div>

                    {/* DETAILS */}
                    <div className="mt-5 space-y-3">

                      <div className="flex items-center gap-3 text-sm">

                        <span className="text-slate-400">
                          📅
                        </span>

                        <span className="text-slate-600 dark:text-slate-300">
                          {sessionDate
                            ? new Date(sessionDate).toLocaleString()
                            : "Date not available"}
                        </span>

                      </div>

                      <div className="flex items-center gap-3 text-sm">

                        <span className="text-slate-400">
                          🎯
                        </span>

                        <span className="text-slate-600 dark:text-slate-300">
                          Accountability tracking enabled
                        </span>

                      </div>

                    </div>

                    {/* ACTIONS */}
                    <div className="mt-5 flex flex-wrap gap-3">

                      {/* JOIN */}
                      {isScheduled && link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Join Meeting
                        </a>
                      )}

                      {/* COMPLETE */}
                      {isScheduled && (
                        <button
                          type="button"
                          disabled={actionLoading === session.id}
                          onClick={() =>
                            updateSession(
                              session.id,
                              "completed"
                            )
                          }
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading === session.id
                            ? "Updating..."
                            : "✓ Complete Session"}
                        </button>
                      )}

                      {/* CANCEL */}
                      {isScheduled && (
                        <button
                          type="button"
                          disabled={actionLoading === session.id}
                          onClick={() =>
                            updateSession(
                              session.id,
                              "cancelled"
                            )
                          }
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
                        >
                          Cancel
                        </button>
                      )}

                      {/* COMPLETED → FEEDBACK */}
                      {isCompleted && (
                        <Link
                          href="/feedback"
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          ⭐ Give Feedback
                        </Link>
                      )}

                      {/* GOAL */}
                      {isScheduled && (
                        <button
                          type="button"
                          onClick={viewGoal}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          View Goal
                        </button>
                      )}

                      {/* CANCELLED */}
                      {isCancelled && (
                        <span className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                          This session was cancelled.
                        </span>
                      )}

                    </div>

                    {/* COMPLETED MESSAGE */}
                    {isCompleted && (
                      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">

                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                          ✓ Session completed
                        </p>

                        <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                          Please give feedback to help calculate your
                          exchange reliability and earn reward points.
                        </p>

                      </div>
                    )}

                  </div>

                );
              })

            )}

          </div>

        </div>

        {/* REWARD PREVIEW */}
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                🏆 REWARDS
              </p>

              <h2 className="mt-1 text-lg font-bold text-amber-900 dark:text-amber-200">
                Complete successful exchanges to earn points
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-amber-800 dark:text-amber-300">
                Completed sessions and useful feedback contribute to
                your reliability and reward points.
              </p>

            </div>

            <Link
              href="/wallet"
              className="shrink-0 rounded-lg border border-amber-300 bg-white px-5 py-3 text-center text-sm font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-amber-950"
            >
              View Wallet
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}

function AccountabilityStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
        {number}
      </div>

      <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}