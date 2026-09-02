"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "../../lib/api";

type Skill = {
  id: number;
  name: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  bio: string;
  availability: string;
  teach: Skill[];
  learn: Skill[];
};

export default function Profile() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [teach, setTeach] = useState<number[]>([]);
  const [learn, setLearn] = useState<number[]>([]);
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

      const [skillsRes, userRes] = await Promise.all([
        apiGet<Skill[]>("/skills"),
        apiGet<User>("/me"),
      ]);

      if (!skillsRes.ok || !userRes.ok) {
        setError("Failed to load data");
        return;
      }

      setSkills(skillsRes.data || []);
      const userData = userRes.data;
      if (userData) {
        setUser(userData);
        setTeach(userData.teach?.map((x) => x.id) || []);
        setLearn(userData.learn?.map((x) => x.id) || []);
        setBio(userData.bio || "");
        setAvailability(userData.availability || "");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  function toggleSkill(
    arr: number[],
    setArr: React.Dispatch<React.SetStateAction<number[]>>,
    id: number
  ) {
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  }

  async function handleSave() {
    if (!user) return;

    if (teach.length === 0 || learn.length === 0) {
      setError("Please select at least one skill to teach and learn");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const res = await apiPost("/profile", {
      bio,
      availability,
      teach,
      learn,
    });

    setSaving(false);

    if (!res.ok) {
      setError(res.error || "Failed to save profile");
      return;
    }

    setSuccess("✅ Profile saved successfully!");
    setTimeout(() => setSuccess(""), 3000);
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <Link href="/" className="text-purple-700 hover:text-purple-900 font-medium">
        ← Back to Dashboard
      </Link>

      <div className="card p-7 mt-4">
        <h1 className="text-3xl font-bold">{user?.name || "Profile"}</h1>
        <p className="text-gray-500 mb-6">{user?.email}</p>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-100 text-red-700 border border-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-lg bg-green-100 text-green-700 border border-green-300">
            {success}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short bio (optional)
          </label>
          <textarea
            className="input mb-3"
            placeholder="Tell others about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={saving}
            rows={3}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability (e.g., Mon-Fri 6-9 PM)
          </label>
          <input
            className="input mb-6"
            placeholder="Mon-Fri 6-9 PM, Weekends"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="mb-6">
          <h2 className="font-bold text-xl mb-3">Skills I can teach</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {skills.map((s) => (
              <button
                type="button"
                key={"t" + s.id}
                onClick={() => toggleSkill(teach, setTeach, s.id)}
                className={teach.includes(s.id) ? "btn" : "btn2"}
                disabled={saving}
              >
                {s.name}
              </button>
            ))}
          </div>
          {teach.length === 0 && (
            <p className="text-sm text-gray-500">Please select at least one skill</p>
          )}
        </div>

        <div className="mb-7">
          <h2 className="font-bold text-xl mb-3">Skills I want to learn</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {skills.map((s) => (
              <button
                type="button"
                key={"l" + s.id}
                onClick={() => toggleSkill(learn, setLearn, s.id)}
                className={learn.includes(s.id) ? "btn" : "btn2"}
                disabled={saving}
              >
                {s.name}
              </button>
            ))}
          </div>
          {learn.length === 0 && (
            <p className="text-sm text-gray-500">Please select at least one skill</p>
          )}
        </div>

        <button
          className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </main>
  );
}