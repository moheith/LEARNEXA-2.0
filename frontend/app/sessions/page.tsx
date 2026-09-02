"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "../../lib/api";

type Session = {
  id: number;
  student1: string;
  student2: string;
  topic: string;
  date: string;
  time: string;
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
      <Link
        href="/"
        className="text-purple-700 hover:text-purple-900 font-medium"
      >
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
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold">{session.topic}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {session.student1} ↔ {session.student2}
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

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">📅 Date:</span> {session.date}
              </div>
              <div>
                <span className="font-medium">🕐 Time:</span> {session.time}
              </div>
            </div>
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
          The backend normally returns an array.

          We check it before using .map().
          This prevents "recs.map is not a function".
        */
        if (Array.isArray(recData)) {
          setRecs(recData);
        } else if (Array.isArray(recData.recommendations)) {
          setRecs(recData.recommendations);
        } else {
          setRecs([]);
        }
      } catch (err: any) {
        console.error("Home page error:", err);
        setError(err.message || "Something went wrong");
        setRecs([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  async function sendRequest(receiverId: number) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            receiver_id: receiverId,
            message:
              "Hi! I would like to exchange skills and learn together.",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to send learning request");
        return;
      }

      alert("Learning request sent successfully! ✅");
    } catch (err) {
      console.error(err);
      alert("Unable to connect to the server.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-lg font-semibold">
            Loading LEARNEXA...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            # LEARNEXA
          </h1>

          <p className="text-gray-600 mt-2">
            Welcome,{" "}
            <span className="font-semibold">
              {user?.name || "Student"}
            </span>{" "}
            👋
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/profile"
            className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold"
          >
            Profile
          </Link>

          <Link
            href="/requests"
            className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold"
          >
            Requests
          </Link>

          <Link
            href="/sessions"
            className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold"
          >
            Sessions
          </Link>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-gray-200 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ---------------- ERROR ---------------- */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700">
          {error}
        </div>
      )}

      {/* ---------------- SKILL EXCHANGE ---------------- */}
      <section className="card p-6 mb-7">
        <h2 className="text-2xl font-bold mb-3">
          Your Skill Exchange
        </h2>

        <p className="text-gray-600">
          <b>Learn:</b>{" "}
          {user?.learn && user.learn.length > 0
            ? user.learn.map((skill) => skill.name).join(", ")
            : "No skills selected"}
        </p>

        <p className="text-gray-600 mt-2">
          <b>Teach:</b>{" "}
          {user?.teach && user.teach.length > 0
            ? user.teach.map((skill) => skill.name).join(", ")
            : "No skills selected"}
        </p>

        <Link
          href="/profile"
          className="inline-block mt-5 px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold"
        >
          Update profile & skills
        </Link>
      </section>

      {/* ---------------- AI RECOMMENDATIONS ---------------- */}
      <section>
        <h2 className="text-2xl font-bold mb-5">
          🤖 AI Recommended Learning Partners
        </h2>

        {recs.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">🔍</div>

            <h3 className="font-bold text-lg">
              No learning partners found
            </h3>

            <p className="text-gray-500 mt-2">
              Update your teaching and learning skills to get
              better AI recommendations.
            </p>

            <Link
              href="/profile"
              className="inline-block mt-4 px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold"
            >
              Update Skills
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recs.map((r) => (
              <div
                className="card p-5"
                key={r.id}
              >
                {/* Partner name */}
                <h3 className="text-xl font-bold mb-2">
                  {r.name}
                </h3>

                {/* Match percentage */}
                <div className="text-3xl font-bold text-purple-600 mb-3">
                  {r.score}%
                </div>

                {/* Bio */}
                <p className="text-gray-600 mb-4">
                  {r.bio ||
                    "Interested to teach and learn new things."}
                </p>

                {/* Teaches */}
                <div className="mb-3">
                  <p className="font-semibold">
                    Teaches:
                  </p>

                  <p className="text-gray-600">
                    {r.teach && r.teach.length > 0
                      ? r.teach.join(", ")
                      : "Not specified"}
                  </p>
                </div>

                {/* Wants */}
                <div className="mb-5">
                  <p className="font-semibold">
                    Wants:
                  </p>

                  <p className="text-gray-600">
                    {r.learn && r.learn.length > 0
                      ? r.learn.join(", ")
                      : "Not specified"}
                  </p>
                </div>

                {/* Request button */}
                <button
                  onClick={() => sendRequest(r.id)}
                  className="w-full px-4 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                >
                  Send Learning Request
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  bio?: string;
  availability?: string;
  teach?: { id: number; name: string }[];
  learn?: { id: number; name: string }[];
};

type Recommendation = {
  id: number;
  name: string;
  bio: string;
  teach: string[];
  learn: string[];
  score: number;
};

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        // Get current user
        const meResponse = await fetch(
          "http://127.0.0.1:5000/api/me",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        if (meResponse.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const meData = await meResponse.json();

        if (!meResponse.ok) {
          throw new Error(meData.error || "Failed to load profile");
        }

        setUser(meData);

        // Get AI recommendations
        const recResponse = await fetch(
          "http://127.0.0.1:5000/api/recommendations",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        if (recResponse.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const recData = await recResponse.json();

        if (!recResponse.ok) {
          throw new Error(
            recData.error || "Failed to load recommendations"
          );
        }

        // IMPORTANT: Only store arrays
        if (Array.isArray(recData)) {
          setRecs(recData);
        } else {
          setRecs([]);
        }
      } catch (error) {
        console.error("Home page error:", error);
        setRecs([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  async function sendRequest(receiverId: number) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            receiver_id: receiverId,
            message:
              "Hi! I would like to exchange skills and learn together.",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to send learning request");
        return;
      }

      alert("Learning request sent successfully! ✅");
    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-lg font-semibold">
            Loading LEARNEXA...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <h1 className="text-3xl font-bold">
            # LEARNEXA
          </h1>

          <p className="text-gray-600 mt-2">
            Welcome,{" "}
            <span className="font-semibold">
              {user?.name || "Student"}
            </span>{" "}
            👋
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <Link
            href="/profile"
            className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold"
          >
            Profile
          </Link>

          <Link
            href="/requests"
            className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold"
          >
            Requests
          </Link>

          <Link
            href="/sessions"
            className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold"
          >
            Sessions
          </Link>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-gray-200 font-semibold"
          >
            Logout
          </button>

        </div>
      </div>

      {/* SKILL EXCHANGE */}
      <section className="card p-6 mb-7">

        <h2 className="text-2xl font-bold mb-3">
          Your Skill Exchange
        </h2>

        <p className="text-gray-600">
          <b>Learn:</b>{" "}
          {user?.learn && user.learn.length > 0
            ? user.learn.map((skill) => skill.name).join(", ")
            : "No skills selected"}
        </p>

        <p className="text-gray-600 mt-2">
          <b>Teach:</b>{" "}
          {user?.teach && user.teach.length > 0
            ? user.teach.map((skill) => skill.name).join(", ")
            : "No skills selected"}
        </p>

        <Link
          href="/profile"
          className="inline-block mt-5 px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold"
        >
          Update profile & skills
        </Link>

      </section>

      {/* AI RECOMMENDATIONS */}
      <section>

        <h2 className="text-2xl font-bold mb-5">
          🤖 AI Recommended Learning Partners
        </h2>

        {recs.length === 0 ? (

          <div className="card p-6 text-center">

            <div className="text-4xl mb-3">
              🔍
            </div>

            <h3 className="font-bold text-lg">
              No learning partners found
            </h3>

            <p className="text-gray-500 mt-2">
              Update your teaching and learning skills to
              get better AI recommendations.
            </p>

            <Link
              href="/profile"
              className="inline-block mt-4 px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold"
            >
              Update Skills
            </Link>

          </div>

        ) : (

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            {recs.map((r) => (

              <div
                className="card p-5"
                key={r.id}
              >

                <h3 className="text-xl font-bold mb-2">
                  {r.name}
                </h3>

                <div className="text-3xl font-bold text-purple-600 mb-3">
                  {r.score}%
                </div>

                <p className="text-gray-600 mb-4">
                  {r.bio ||
                    "Interested to teach and learn new things."}
                </p>

                <div className="mb-3">

                  <p className="font-semibold">
                    Teaches:
                  </p>

                  <p className="text-gray-600">
                    {r.teach && r.teach.length > 0
                      ? r.teach.join(", ")
                      : "Not specified"}
                  </p>

                </div>

                <div className="mb-5">

                  <p className="font-semibold">
                    Wants:
                  </p>

                  <p className="text-gray-600">
                    {r.learn && r.learn.length > 0
                      ? r.learn.join(", ")
                      : "Not specified"}
                  </p>

                </div>

                <button
                  onClick={() => sendRequest(r.id)}
                  className="w-full px-4 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                >
                  Send Learning Request
                </button>

              </div>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}