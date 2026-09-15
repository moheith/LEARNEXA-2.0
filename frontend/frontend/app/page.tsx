"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

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
        const userResponse = await fetch(
          "http://127.0.0.1:5000/api/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
          "http://127.0.0.1:5000/api/recommendations",
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
      const response = await fetch(
        "http://127.0.0.1:5000/api/requests",
        {
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
          NAVIGATION
      ========================= */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >
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

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">

            <Link
              href="/"
              className="rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              My Profile
            </Link>

            <Link
              href="/requests"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Requests
            </Link>

            <Link
              href="/sessions"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sessions
            </Link>

            <Link
              href="/feedback"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Feedback
            </Link>

            <Link
              href="/wallet"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Wallet
            </Link>

          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">

            <ThemeToggle />

            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Logout
            </button>

          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="border-t border-slate-200 px-5 py-3 lg:hidden dark:border-slate-800">

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold">

            <Link
              href="/"
              className="text-blue-600"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="hover:text-blue-600"
            >
              Profile
            </Link>

            <Link
              href="/requests"
              className="hover:text-blue-600"
            >
              Requests
            </Link>

            <Link
              href="/sessions"
              className="hover:text-blue-600"
            >
              Sessions
            </Link>

            <Link
              href="/feedback"
              className="hover:text-blue-600"
            >
              Feedback
            </Link>

            <Link
              href="/wallet"
              className="hover:text-blue-600"
            >
              Wallet
            </Link>

          </div>
        </div>

      </header>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* Welcome */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>

              <p className="text-sm font-semibold text-blue-600">
                STUDENT DASHBOARD
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Welcome,{" "}
                {user?.name?.split(" ")[0] ||
                  "Student"}
                !
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Find students who can teach you the
                skills you want to learn, while sharing
                the knowledge you already have.
              </p>

            </div>

            <Link
              href="/profile"
              className="inline-flex w-fit rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Manage My Skills
            </Link>

          </div>

        </section>

        {/* Statistics */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">

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

            <p className="text-sm font-semibold text-teal-600">
              MY SKILL EXCHANGE
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              What I Can Give & What I Want
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your selected skills are used to find
              suitable exchange partners.
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

          <div className="mt-5 grid gap-4 md:grid-cols-4">

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

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="text-sm font-semibold text-teal-600">
                AI MATCHING
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Recommended Learning Partners
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Students recommended according to your
                teaching and learning interests.
              </p>

            </div>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search students or skills"
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 md:w-72 dark:border-slate-700 dark:bg-slate-900"
            />

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
                Try changing your search or update
                your skills.
              </p>

              <Link
                href="/profile"
                className="mt-5 inline-block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
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
            <p className="text-sm font-semibold text-blue-600">
              QUICK ACCESS
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

      {/* Message */}
      {message && (

        <div className="fixed bottom-5 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2">

          <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {message}
          </div>

        </div>

      )}

    </main>
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

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
      className={`rounded-xl border p-6 ${
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
    <article className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">

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
        className="mt-6 w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
    >
      <div className="text-2xl">
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