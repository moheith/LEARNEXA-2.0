"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:5000/api";

type Skill = {
  id: number;
  name: string;
  category?: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  bio?: string;
  availability?: string;
  teach?: Skill[];
  learn?: Skill[];
  teach_skills?: Skill[];
  learn_skills?: Skill[];
};

type Recommendation = {
  id: number;
  name: string;
  bio?: string;
  teach: string[];
  learn: string[];
  score: number;
};

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadDashboard() {
      try {
        // Load user profile
        const userResponse = await fetch(`${API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

        const teachingSkills = Array.isArray(userData.teach)
          ? userData.teach
          : Array.isArray(userData.teach_skills)
          ? userData.teach_skills
          : [];

        const learningSkills = Array.isArray(userData.learn)
          ? userData.learn
          : Array.isArray(userData.learn_skills)
          ? userData.learn_skills
          : [];

        setUser({
          ...userData,
          teach: teachingSkills,
          learn: learningSkills,
        });

        // Load AI recommendations
        const recommendationResponse = await fetch(
          `${API_BASE}/recommendations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (recommendationResponse.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }

        const recommendationData =
          await recommendationResponse.json();

        if (Array.isArray(recommendationData)) {
          setRecommendations(recommendationData);
        } else if (
          recommendationData &&
          Array.isArray(recommendationData.recommendations)
        ) {
          setRecommendations(
            recommendationData.recommendations
          );
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);

        setMessage(
          "Unable to connect to LEARNEXA server."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  // Hide notification after 3 seconds
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  // Search recommendations
  const filteredRecommendations = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return recommendations;
    }

    return recommendations.filter((person) => {
      const teaching = person.teach || [];
      const learning = person.learn || [];

      const skills = [...teaching, ...learning]
        .join(" ")
        .toLowerCase();

      return (
        person.name.toLowerCase().includes(query) ||
        skills.includes(query)
      );
    });
  }, [recommendations, search]);

  // Send learning request
  async function sendRequest(receiverId: number) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setSending(receiverId);

    try {
      const response = await fetch(`${API_BASE}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_id: receiverId,
          message:
            "Hi! I found your profile through LEARNEXA and would like to exchange skills with you.",
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            "Unable to send learning request."
        );
        return;
      }

      setMessage(
        "Learning request sent successfully."
      );
    } catch (error) {
      console.error(
        "Request sending error:",
        error
      );

      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setSending(null);
    }
  }

  // Logout
  function logout() {
    localStorage.removeItem("token");
    router.replace("/login");
  }

  // Loading screen
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <h2 className="mt-5 font-bold text-slate-800 dark:text-white">
            Loading LEARNEXA
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Preparing your learning dashboard...
          </p>
        </div>
      </main>
    );
  }

  const teachSkills = user?.teach || [];
  const learnSkills = user?.learn || [];

  const teachCount = teachSkills.length;
  const learnCount = learnSkills.length;
  const matchCount = recommendations.length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      {/* =========================
          TOP HEADER
      ========================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">

        <div className="flex h-[76px] items-center gap-6 px-5 lg:px-8">

          {/* Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3 transition-transform duration-200 hover:scale-[1.03] active:scale-95"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm transition-transform duration-200 group-hover:rotate-3 group-hover:scale-105 group-active:scale-90">
              L
            </div>

            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight">
                LEARNEXA
              </h1>

              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Student Skill Exchange
              </p>
            </div>
          </Link>

          {/* Search */}
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search students or skills..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-800 dark:focus:ring-blue-950"
            />
          </div>

          {/* Right controls */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Logout
            </button>
          </div>

        </div>
      </header>

      {/* =========================
          MAIN LAYOUT
      ========================= */}

      <div className="flex">

        {/* =========================
            LEFT SIDEBAR
        ========================= */}

        <aside className="sticky top-[76px] hidden h-[calc(100vh-76px)] w-60 shrink-0 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">

          <div className="flex h-full flex-col p-4">

            <div className="mb-5 px-3 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Main Menu
              </p>
            </div>

            <nav className="space-y-1">

              <SidebarLink
                href="/"
                icon="▣"
                label="Dashboard"
                active
              />

              <SidebarLink
                href="/profile"
                icon="👤"
                label="My Profile"
              />

              <SidebarLink
                href="/requests"
                icon="↗"
                label="Requests"
              />

              <SidebarLink
                href="/sessions"
                icon="◷"
                label="Sessions"
              />

              <SidebarLink
                href="/feedback"
                icon="★"
                label="Feedback"
              />

              <SidebarLink
                href="/wallet"
                icon="◉"
                label="Wallet"
              />

            </nav>

            {/* Sidebar bottom */}
            <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">

              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">

                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  Skill Exchange
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Learn from others and share what you know.
                </p>

              </div>

            </div>

          </div>
        </aside>

        {/* =========================
            MOBILE NAVIGATION
        ========================= */}

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95">

          <div className="flex items-center justify-around">

            <MobileNavLink
              href="/"
              icon="▣"
              label="Home"
              active
            />

            <MobileNavLink
              href="/profile"
              icon="👤"
              label="Profile"
            />

            <MobileNavLink
              href="/requests"
              icon="↗"
              label="Requests"
            />

            <MobileNavLink
              href="/sessions"
              icon="◷"
              label="Sessions"
            />

            <MobileNavLink
              href="/wallet"
              icon="◉"
              label="Wallet"
            />

          </div>
        </div>

        {/* =========================
            CONTENT
        ========================= */}

        <div className="min-w-0 flex-1">

          <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

            {/* Page heading */}
            <section className="mb-7">

              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Student Dashboard
              </p>

              <div className="mt-1 flex flex-col justify-between gap-4 md:flex-row md:items-end">

                <div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    Dashboard
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage your skills and discover learning partners.
                  </p>
                </div>

                <Link
                  href="/profile"
                  className="inline-flex w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 hover:shadow-md active:scale-95"
                >
                  Manage My Skills
                </Link>

              </div>

            </section>

            {/* Statistics */}
            <section className="grid gap-4 sm:grid-cols-3">

              <DashboardStat
                title="Skills to Learn"
                value={learnCount}
                text="Your learning goals"
              />

              <DashboardStat
                title="Skills to Teach"
                value={teachCount}
                text="Skills you can share"
              />

              <DashboardStat
                title="AI Matches"
                value={matchCount}
                text="Recommended students"
              />

            </section>

            {/* My Skill Exchange */}
            <section className="mt-8">

              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                  My Skill Exchange
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  What I Can Give & What I Want
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Your selected skills are used to find suitable exchange partners.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">

                <SkillExchangeBox
                  title="I Can Teach"
                  description="Skills I can share with other students"
                  skills={teachSkills}
                  type="teach"
                  emptyText="You have not selected any teaching skills yet."
                />

                <SkillExchangeBox
                  title="I Want to Learn"
                  description="Skills I want to learn from other students"
                  skills={learnSkills}
                  type="learn"
                  emptyText="You have not selected any learning skills yet."
                />

              </div>
            </section>

            {/* How exchange works */}
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

              <h3 className="font-bold">
                How Skill Exchange Works
              </h3>

              <div className="mt-5 grid gap-5 md:grid-cols-4">

                <ExchangeStep
                  number="1"
                  title="Choose Skills"
                  text="Select what you can teach and what you want to learn."
                />

                <ExchangeStep
                  number="2"
                  title="AI Finds Matches"
                  text="LEARNEXA compares your skills with other students."
                />

                <ExchangeStep
                  number="3"
                  title="Send Request"
                  text="Connect with a student who looks like a good match."
                />

                <ExchangeStep
                  number="4"
                  title="Exchange Skills"
                  text="Learn together through a scheduled learning session."
                />

              </div>

            </section>

            {/* Recommendations */}
            <section className="mt-10">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                  AI Matching
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Recommended Learning Partners
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Students recommended according to your teaching and learning interests.
                </p>
              </div>

              {filteredRecommendations.length === 0 ? (

                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">

                  <div className="text-3xl">
                    🔍
                  </div>

                  <h3 className="mt-3 font-bold">
                    No learning partners found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Try changing your search or update your skills.
                  </p>

                  <Link
                    href="/profile"
                    className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Update My Skills
                  </Link>

                </div>

              ) : (

                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                  {filteredRecommendations.map(
                    (person) => (
                      <PartnerCard
                        key={person.id}
                        person={person}
                        sending={
                          sending === person.id
                        }
                        onSend={() =>
                          sendRequest(person.id)
                        }
                      />
                    )
                  )}

                </div>

              )}

            </section>

            {/* Quick Access */}
            <section className="mt-10">

              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Quick Access
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Manage Your Exchange
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <QuickLink
                  href="/requests"
                  title="Requests"
                  description="View and manage learning requests."
                  icon="📩"
                />

                <QuickLink
                  href="/sessions"
                  title="Sessions"
                  description="Schedule and manage skill sessions."
                  icon="📅"
                />

                <QuickLink
                  href="/feedback"
                  title="Feedback"
                  description="Rate completed learning exchanges."
                  icon="⭐"
                />

                <QuickLink
                  href="/wallet"
                  title="Wallet & Rewards"
                  description="View security amounts and reward points."
                  icon="💰"
                />

              </div>

            </section>

            {/* Footer */}
            <footer className="mt-14 border-t border-slate-200 py-6 text-center dark:border-slate-800">

              <p className="text-sm font-semibold">
                LEARNEXA
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Learn • Exchange • Grow
              </p>

            </footer>

          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2">

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {message}
          </div>

        </div>
      )}

    </main>
  );
}


/* =================================
   SIDEBAR LINK
================================= */

function SidebarLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-transform duration-200 group-hover:scale-110 ${
          active
            ? "bg-blue-600 text-white"
            : "bg-slate-100 dark:bg-slate-800"
        }`}
      >
        {icon}
      </span>

      {label}
    </Link>
  );
}


/* =================================
   MOBILE NAV LINK
================================= */

function MobileNavLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-[60px] flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${
        active
          ? "text-blue-600"
          : "text-slate-500 dark:text-slate-400"
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}


/* =================================
   DASHBOARD STAT
================================= */

function DashboardStat({
  title,
  value,
  text,
}: {
  title: string;
  value: number;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {text}
      </p>

    </div>
  );
}


/* =================================
   SKILL EXCHANGE BOX
================================= */

function SkillExchangeBox({
  title,
  description,
  skills,
  type,
  emptyText,
}: {
  title: string;
  description: string;
  skills: Skill[];
  type: "teach" | "learn";
  emptyText: string;
}) {
  const isTeach = type === "teach";

  return (
    <div
      className={`rounded-xl border p-6 transition-all duration-200 hover:shadow-sm ${
        isTeach
          ? "border-teal-200 bg-teal-50/40 dark:border-teal-900 dark:bg-teal-950/20"
          : "border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20"
      }`}
    >

      <div className="flex items-start justify-between gap-4">

        <div>
          <h3 className="text-lg font-bold">
            {title}
          </h3>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isTeach
              ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          }`}
        >
          {skills.length} skills
        </span>

      </div>

      <div className="mt-5 flex flex-wrap gap-2">

        {skills.length > 0 ? (

          skills.map((skill) => (
            <span
              key={skill.id}
              className="rounded-md border border-white bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {skill.name}
            </span>
          ))

        ) : (

          <p className="text-sm text-slate-400">
            {emptyText}
          </p>

        )}

      </div>

    </div>
  );
}


/* =================================
   EXCHANGE STEP
================================= */

function ExchangeStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {number}
      </div>

      <div>
        <h4 className="text-sm font-bold">
          {title}
        </h4>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {text}
        </p>
      </div>

    </div>
  );
}


/* =================================
   PARTNER CARD
================================= */

function PartnerCard({
  person,
  sending,
  onSend,
}: {
  person: Recommendation;
  sending: boolean;
  onSend: () => void;
}) {
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(person.score || 0)
    )
  );

  const teachingSkills = person.teach || [];
  const learningSkills = person.learn || [];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">

      {/* Person */}
      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {person.name
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>

          <div>
            <h3 className="font-bold">
              {person.name}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Learning partner
            </p>
          </div>

        </div>

        <div className="text-right">

          <p className="text-lg font-bold text-teal-600">
            {score}%
          </p>

          <p className="text-[10px] font-semibold uppercase text-slate-400">
            Match
          </p>

        </div>

      </div>

      {/* Bio */}
      <p className="mt-4 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">
        {person.bio ||
          "Student interested in exchanging knowledge and skills."}
      </p>

      {/* Can Teach */}
      <div className="mt-5">

        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Can Teach
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">

          {teachingSkills.length > 0 ? (

            teachingSkills
              .slice(0, 5)
              .map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                >
                  {skill}
                </span>
              ))

          ) : (

            <span className="text-xs text-slate-400">
              Not specified
            </span>

          )}

        </div>

      </div>

      {/* Wants to Learn */}
      <div className="mt-4">

        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Wants to Learn
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">

          {learningSkills.length > 0 ? (

            learningSkills
              .slice(0, 5)
              .map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {skill}
                </span>
              ))

          ) : (

            <span className="text-xs text-slate-400">
              Not specified
            </span>

          )}

        </div>

      </div>

      {/* Request */}
      <button
        type="button"
        onClick={onSend}
        disabled={sending}
        className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending
          ? "Sending..."
          : "Send Learning Request"}
      </button>

    </article>
  );
}


/* =================================
   QUICK ACCESS
================================= */

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
    >

      <div className="text-2xl transition-transform duration-200 group-hover:scale-110">
        {icon}
      </div>

      <h3 className="mt-3 font-bold">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      <p className="mt-4 text-xs font-bold text-blue-600">
        Open →
      </p>

    </Link>
  );
}