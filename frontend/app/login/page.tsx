"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);

      router.push("/");
    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 dark:bg-slate-950">

      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-3xl font-bold text-violet-600"
          >
            LEARNEXA
          </Link>

          <p className="mt-3 text-slate-500">
            Welcome back! Login to continue.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-3xl border bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >

          <h1 className="text-2xl font-bold">
            Login
          </h1>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <div className="mt-6">
            <label className="text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-violet-600 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-violet-600"
            >
              Create one
            </Link>
          </p>

        </form>
      </div>

    </main>
  );
}