"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, clearAuth } from "../lib/api";

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
  const [error, setError] = useState("");
  const [sendingRequest, setSendingRequest] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const userRes = await apiGet<User>("/me");
      if (!userRes.ok) {
        if (userRes.error === "HTTP 401") {
          clearAuth();
        } else {
          setError(userRes.error || "Failed to load profile");
        }
        return;
      }
      setUser(userRes.data || null);

      const recsRes = await apiGet<Recommendation[]>("/recommendations");
      if (!recsRes.ok) {
        setError(recsRes.error || "Failed to load recommendations");
        setRecs([]);
      } else {
        setRecs(Array.isArray(recsRes.data) ? recsRes.data : []);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLearningRequest(receiverId: number) {
    setSendingRequest(receiverId);
    try {
      const res = await apiPost("/requests", {
        receiver_id: receiverId,
        message: "Hi! I would like to exchange skills and learn together.",
      });

      if (!res.ok) {
        alert(`Error: ${res.error}`);
      } else {
        alert("✅ Learning request sent!");
      }
    } catch (err) {
      alert("Failed to send request");
    } finally {
      setSendingRequest(null);
    }
  }

  function logout() {
    clearAuth();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-lg font-semibold">Loading LEARNEXA...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-10 max-w-xl text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-5xl font-bold mb-3">LEARNEXA</h1>
          <p className="text-gray-600 mb-7">
            AI-powered student skill exchange and matching platform.
          </p>
          <div className="flex gap-3 justify-center">
            <Link className="btn" href="/login">
              Login
            </Link>
            <Link className="btn2" href="/register">
              Create account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">🎓 LEARNEXA</h1>
          <p className="text-gray-500">Welcome, {user.name} 👋</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn2" href="/profile">
            Profile
          </Link>
          <Link className="btn2" href="/requests">
            Requests
          </Link>
          <Link className="btn2" href="/sessions">
            Sessions
          </Link>
          <button className="btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* Skill Summary */}
      <section className="card p-6 mb-7">
        <h2 className="text-2xl font-bold mb-2">Your Skill Exchange</h2>
        <p className="text-gray-600 mb-4">
          <b>Can teach:</b> {user.teach?.map((x) => x.name).join(", ") || "No skills added"}
          <br />
          <b>Want to learn:</b> {user.learn?.map((x) => x.name).join(", ") || "No skills added"}
        </p>
        <Link className="btn" href="/profile">
          Update profile & skills
        </Link>
      </section>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-4 rounded-lg bg-red-100 text-red-700 border border-red-300">
          {error}
        </div>
      )}

      {/* Recommendations */}
      <h2 className="text-2xl font-bold mb-4">🤖 AI Recommended Learning Partners</h2>
      {recs.length === 0 ? (
        <div className="card p-6 text-center text-gray-500">
          <p>No recommendations yet. Update your profile with skills to get matches!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recs.map((r) => (
            <div className="card p-5" key={r.id}>
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{r.name}</h3>
                <span className="font-bold text-purple-700 text-lg">{r.score}%</span>
              </div>
              <p className="text-gray-500 my-3">{r.bio || "Student learner"}</p>
              <p className="text-sm mb-2">
                <b>Teaches:</b> {r.teach.join(", ") || "—"}
              </p>
              <p className="text-sm mb-4">
                <b>Wants to learn:</b> {r.learn.join(", ") || "—"}
              </p>
              <button
                className="btn mt-4 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => sendLearningRequest(r.id)}
                disabled={sendingRequest === r.id}
              >
                {sendingRequest === r.id ? "Sending..." : "Send Learning Request"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}