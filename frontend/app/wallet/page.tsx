"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000/api";

type Transaction = {
  id: number;
  amount: number;
  type: string;
  status: string;
  description: string;
  created_at: string;
};

type WalletData = {
  balance: number;
  security_amount: number;
  reward_points: number;
  transactions: Transaction[];
};

export default function WalletPage() {
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  // =====================================================
  // LOAD WALLET
  // =====================================================

  async function loadWallet() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/wallet`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to load wallet");
        return;
      }

      setWallet(data);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to LEARNEXA backend.");
    }
  }

  useEffect(() => {
    loadWallet();
  }, []);

  // =====================================================
  // ADD SECURITY AMOUNT
  // =====================================================

  async function addSecurityAmount() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/wallet/security`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            amount: numericAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to add security amount.");
        return;
      }

      setMessage(
        `₹${numericAmount} security amount added successfully.`
      );

      setAmount("");

      await loadWallet();
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to LEARNEXA backend.");
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // REDEEM REWARD
  // =====================================================

  async function redeemPoints(points: number) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!wallet || wallet.reward_points < points) {
      setMessage(`You need at least ${points} reward points.`);
      return;
    }

    setRedeeming(points);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/wallet/redeem`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            points,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to redeem points.");
        return;
      }

      setMessage(
        `${points} points redeemed for ₹${data.demo_value}.`
      );

      await loadWallet();
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to LEARNEXA backend.");
    } finally {
      setRedeeming(null);
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  // =====================================================
  // HELPERS
  // =====================================================

  function transactionLabel(type: string) {
    switch (type) {
      case "security_hold":
        return "Security Amount";

      case "reward":
        return "Reward Redemption";

      default:
        return type;
    }
  }

  function formatDate(date: string) {
    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="page-container flex min-h-[70px] items-center justify-between gap-4">

          <Link
            href="/"
            className="text-xl font-bold tracking-wide"
          >
            LEARNEXA
          </Link>

          <nav className="hidden items-center gap-5 text-sm md:flex">
            <Link href="/" className="hover:text-blue-600">
              Dashboard
            </Link>

            <Link href="/profile" className="hover:text-blue-600">
              Profile
            </Link>

            <Link href="/requests" className="hover:text-blue-600">
              Requests
            </Link>

            <Link href="/sessions" className="hover:text-blue-600">
              Sessions
            </Link>

            <Link href="/feedback" className="hover:text-blue-600">
              Feedback
            </Link>

            <Link
              href="/wallet"
              className="font-semibold text-blue-600"
            >
              Wallet
            </Link>

            <ThemeToggle />

            <button
              onClick={logout}
              className="secondary-button"
            >
              Logout
            </button>
          </nav>

        </div>
      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="page-container py-8">

        {/* PAGE TITLE */}

        <div className="mb-7">
          <p className="mb-1 text-sm font-semibold text-blue-600">
            ACCOUNTABILITY & REWARDS
          </p>

          <h1 className="text-3xl font-bold">
            My Wallet
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Manage your demo security amount, track reward points,
            and view your skill-exchange transactions.
          </p>
        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
            {message}
          </div>
        )}

        {/* =================================================
            WALLET SUMMARY
        ================================================= */}

        {wallet && (
          <div className="mb-7 grid gap-4 md:grid-cols-3">

            <div className="simple-card p-5">
              <p className="text-sm text-[var(--muted)]">
                Available Balance
              </p>

              <p className="mt-2 text-3xl font-bold">
                ₹{wallet.balance.toFixed(2)}
              </p>
            </div>

            <div className="simple-card p-5">
              <p className="text-sm text-[var(--muted)]">
                Security Amount Held
              </p>

              <p className="mt-2 text-3xl font-bold">
                ₹{wallet.security_amount.toFixed(2)}
              </p>
            </div>

            <div className="simple-card p-5">
              <p className="text-sm text-[var(--muted)]">
                Reward Points
              </p>

              <p className="mt-2 text-3xl font-bold">
                {wallet.reward_points}
                <span className="ml-2 text-base font-medium">
                  pts
                </span>
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            SECURITY AMOUNT
        ================================================= */}

        <div className="mb-7 simple-card p-6">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Skill Exchange Security Amount
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Add a demo security amount for your college project.
              This does not process real payments.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input sm:max-w-xs"
            />

            <button
              onClick={addSecurityAmount}
              disabled={loading}
              className="primary-button"
            >
              {loading
                ? "Adding..."
                : "Add Security Amount"}
            </button>

          </div>

          <div className="mt-5 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
            <strong>Demo flow:</strong> Security amount → Skill
            Exchange → Session completion → Feedback → Rewards.
          </div>

        </div>

        {/* =================================================
            REWARD PROGRAM
        ================================================= */}

        <div className="mb-7 simple-card p-6">

          <h2 className="text-xl font-bold">
            Reward Program
          </h2>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Earn points by participating responsibly in LEARNEXA.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">

            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-2xl font-bold">
                +20
              </p>

              <p className="mt-1 text-sm">
                Complete a skill exchange
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-2xl font-bold">
                +5
              </p>

              <p className="mt-1 text-sm">
                Submit feedback
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-2xl font-bold">
                +25 / +50
              </p>

              <p className="mt-1 text-sm">
                Reliability bonus
              </p>
            </div>

          </div>

        </div>

        {/* =================================================
            REDEEM REWARDS
        ================================================= */}

        <div className="mb-7 simple-card p-6">

          <h2 className="text-xl font-bold">
            Redeem Rewards
          </h2>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Demo conversion: 50 points = ₹10 project value.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">

            {[50, 100, 200].map((points) => {

              const disabled =
                !wallet ||
                wallet.reward_points < points ||
                redeeming !== null;

              return (
                <div
                  key={points}
                  className="rounded-lg border border-[var(--border)] p-5"
                >

                  <p className="text-2xl font-bold">
                    {points} pts
                  </p>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    = ₹{points / 5} demo value
                  </p>

                  <button
                    onClick={() => redeemPoints(points)}
                    disabled={disabled}
                    className="primary-button mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {redeeming === points
                      ? "Redeeming..."
                      : "Redeem"}
                  </button>

                </div>
              );
            })}

          </div>

        </div>

        {/* =================================================
            TRANSACTIONS
        ================================================= */}

        <div className="simple-card overflow-hidden">

          <div className="border-b border-[var(--border)] p-6">
            <h2 className="text-xl font-bold">
              Recent Transactions
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Your LEARNEXA wallet activity.
            </p>
          </div>

          {!wallet ||
          wallet.transactions.length === 0 ? (

            <div className="p-8 text-center text-sm text-[var(--muted)]">
              No transactions yet.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-4">
                      Type
                    </th>

                    <th className="px-6 py-4">
                      Amount
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Description
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {wallet.transactions.map(
                    (transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-[var(--border)] last:border-b-0"
                      >

                        <td className="px-6 py-4 font-medium">
                          {transactionLabel(
                            transaction.type
                          )}
                        </td>

                        <td className="px-6 py-4">
                          ₹
                          {Number(
                            transaction.amount
                          ).toFixed(2)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="status">
                            {transaction.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {transaction.description}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(
                            transaction.created_at
                          )}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* =================================================
            PROJECT NOTICE
        ================================================= */}

        <div className="mt-7 rounded-lg border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">

          <strong>College Project Demo:</strong>{" "}
          LEARNEXA's wallet is a simulated reward and security
          system. No real money or payment gateway is used.

        </div>

      </section>

    </main>
  );
}