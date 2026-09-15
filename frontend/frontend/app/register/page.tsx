"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Registration failed.");
        return;
      }

      router.push("/login");
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
            Create your student account.
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="rounded-3xl border bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >

          <h1 className="text-2xl font-bold">
            Create Account
          </h1>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <div className="mt-6">
            <label className="text-sm font-medium">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Your name"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="you@example.com"
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
              minLength={6}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-violet-600 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-600"
            >
              Login
            </Link>
          </p>

        </form>
      </div>

    </main>
  );
}