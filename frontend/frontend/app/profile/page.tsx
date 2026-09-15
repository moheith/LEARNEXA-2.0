"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";

type Skill = {
  id: number;
  name: string;
  category?: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("");

  const [skills, setSkills] = useState<Skill[]>([]);
  const [teachSkills, setTeachSkills] = useState<number[]>([]);
  const [learnSkills, setLearnSkills] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const [userResponse, skillsResponse] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch("http://127.0.0.1:5000/api/skills"),
      ]);

      if (userResponse.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      if (!userResponse.ok) {
        setMessage("Unable to load your profile.");
        return;
      }

      const userData = await userResponse.json();
      const skillsData = await skillsResponse.json();

      setBio(userData.bio || "");
      setAvailability(userData.availability || "");

      if (Array.isArray(skillsData)) {
        setSkills(skillsData);
      } else {
        setSkills(skillsData.skills || []);
      }

      setTeachSkills(
        (userData.teach_skills || []).map(
          (skill: Skill) => skill.id
        )
      );

      setLearnSkills(
        (userData.learn_skills || []).map(
          (skill: Skill) => skill.id
        )
      );
    } catch (error) {
      console.error("Profile loading error:", error);
      setMessage("Unable to connect to LEARNEXA server.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSkill(
    skillId: number,
    type: "teach" | "learn"
  ) {
    if (type === "teach") {
      setTeachSkills((current) => {
        if (current.includes(skillId)) {
          return current.filter((id) => id !== skillId);
        }

        return [...current, skillId];
      });
    } else {
      setLearnSkills((current) => {
        if (current.includes(skillId)) {
          return current.filter((id) => id !== skillId);
        }

        return [...current, skillId];
      });
    }
  }

  async function saveProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bio,
            availability,
            teach_skills: teachSkills,
            learn_skills: learnSkills,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setMessage(
          data.message || "Could not save your profile."
        );
        return;
      }

      setMessage("Profile saved successfully.");
    } catch (error) {
      console.error("Profile save error:", error);
      setMessage("Unable to connect to LEARNEXA server.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <h2 className="mt-5 font-bold text-slate-800 dark:text-white">
            Loading your profile
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Please wait...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      {/* Navigation */}

      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              L
            </div>

            <div>
              <h1 className="text-lg font-bold">
                LEARNEXA
              </h1>

              <p className="hidden text-[10px] text-slate-500 sm:block dark:text-slate-400">
                Student Skill Exchange
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">

            <Link
              href="/"
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="rounded-md bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              My Profile
            </Link>

            <Link
              href="/requests"
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Requests
            </Link>

            <Link
              href="/sessions"
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sessions
            </Link>

          </nav>

          <ThemeToggle />

        </div>

        {/* Mobile navigation */}

        <div className="border-t border-slate-200 px-5 py-2 md:hidden dark:border-slate-800">
          <div className="flex justify-between text-xs font-semibold">

            <Link href="/">
              Dashboard
            </Link>

            <Link href="/profile">
              Profile
            </Link>

            <Link href="/requests">
              Requests
            </Link>

            <Link href="/sessions">
              Sessions
            </Link>

          </div>
        </div>
      </header>

      {/* Page */}

      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* Page heading */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            MY PROFILE
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Your Learning Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Keep your information and skills updated so LEARNEXA
            can find better learning partners for you.
          </p>
        </div>

        {/* Basic information */}

        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <h2 className="font-bold">
              Basic Information
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Information that other students can see.
            </p>
          </div>

          <div className="space-y-5 p-6">

            <div>
              <label className="text-sm font-semibold">
                About Me
              </label>

              <textarea
                value={bio}
                onChange={(event) =>
                  setBio(event.target.value)
                }
                rows={4}
                placeholder="Example: I am a BCA student interested in web development and artificial intelligence."
                className="mt-2 w-full resize-none rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />

              <p className="mt-1 text-xs text-slate-400">
                Write a short introduction about yourself.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold">
                Availability
              </label>

              <input
                value={availability}
                onChange={(event) =>
                  setAvailability(event.target.value)
                }
                placeholder="Example: Monday to Friday, 6 PM - 9 PM"
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />

              <p className="mt-1 text-xs text-slate-400">
                Let potential learning partners know when you
                are usually available.
              </p>
            </div>

          </div>
        </section>

        {/* Skills */}

        <section className="mt-6 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">

            <div className="flex items-center justify-between gap-4">

              <div>
                <h2 className="font-bold">
                  Skills & Learning Goals
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Select what you can teach and what you want
                  to learn.
                </p>
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-lg font-bold text-blue-600">
                  {teachSkills.length + learnSkills.length}
                </p>

                <p className="text-[10px] uppercase text-slate-400">
                  Selected
                </p>
              </div>

            </div>

          </div>

          <div className="p-6">

            {/* Teach skills */}

            <div>

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="font-bold">
                    Skills I Can Teach
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Choose skills that you are comfortable
                    helping other students with.
                  </p>
                </div>

                <span className="rounded-md bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  {teachSkills.length} selected
                </span>

              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {skills.map((skill) => {
                  const selected = teachSkills.includes(
                    skill.id
                  );

                  return (
                    <button
                      key={`teach-${skill.id}`}
                      type="button"
                      onClick={() =>
                        toggleSkill(skill.id, "teach")
                      }
                      className={`rounded-lg border p-4 text-left ${
                        selected
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40"
                          : "border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500"
                      }`}
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div>
                          <p className="text-sm font-semibold">
                            {skill.name}
                          </p>

                          {skill.category && (
                            <p className="mt-1 text-xs text-slate-400">
                              {skill.category}
                            </p>
                          )}
                        </div>

                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            selected
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-700"
                          }`}
                        >
                          {selected ? "✓" : "+"}
                        </span>

                      </div>

                    </button>
                  );
                })}

              </div>
            </div>

            {/* Learn skills */}

            <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="font-bold">
                    Skills I Want to Learn
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Choose the skills you are currently
                    interested in learning.
                  </p>
                </div>

                <span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {learnSkills.length} selected
                </span>

              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {skills.map((skill) => {
                  const selected = learnSkills.includes(
                    skill.id
                  );

                  return (
                    <button
                      key={`learn-${skill.id}`}
                      type="button"
                      onClick={() =>
                        toggleSkill(skill.id, "learn")
                      }
                      className={`rounded-lg border p-4 text-left ${
                        selected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                          : "border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500"
                      }`}
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div>
                          <p className="text-sm font-semibold">
                            {skill.name}
                          </p>

                          {skill.category && (
                            <p className="mt-1 text-xs text-slate-400">
                              {skill.category}
                            </p>
                          )}
                        </div>

                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-700"
                          }`}
                        >
                          {selected ? "✓" : "+"}
                        </span>

                      </div>

                    </button>
                  );
                })}

              </div>
            </div>

            {/* Save */}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center dark:border-slate-800">

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>

              {message && (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {message}
                </p>
              )}

            </div>

          </div>
        </section>

        {/* Help section */}

        <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-950 dark:bg-blue-950/30">

          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">
            How LEARNEXA uses your skills
          </h3>

          <p className="mt-2 text-sm leading-6 text-blue-700 dark:text-blue-400">
            Your teaching and learning skills are used by the
            AI recommendation system to identify students who
            may be good learning partners for you.
          </p>

        </section>

      </div>
    </main>
  );
}