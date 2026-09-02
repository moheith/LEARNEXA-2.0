"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    const res = await apiPost("/login", { email, password });
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Login failed");
      return;
    }

    const data = res.data as any;
    if (data.token) {
      localStorage.setItem("token", data.token);
      router.push("/");
    } else {
      setError("No token received from server");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-6">Login to LEARNEXA</p>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-100 text-red-700 border border-red-300">
            {error}
          </div>
        )}

        <input
          className="input mb-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          className="input mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button
          type="submit"
          className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-5 text-center">
          New student?{" "}
          <Link className="text-purple-700 font-semibold hover:underline" href="/register">
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}