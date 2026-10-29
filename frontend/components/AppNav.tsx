"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Bell, CalendarDays, LayoutDashboard, MessageSquare, Shield, WalletCards } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AppNav() {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAdmin(payload.role === "admin");
      }
    } catch { /* the API remains the source of truth */ }
  }, []);
  const links = [
    ["/", "Dashboard", LayoutDashboard],
    ["/messages", "Messages", MessageSquare],
    ["/notifications", "Alerts", Bell],
    ["/sessions", "Calendar", CalendarDays],
    ["/wallet", "Wallet", WalletCards],
    ["/discover", "Discover", LayoutDashboard],
    ["/insights", "Insights", Activity],
  ] as const;
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="page-container flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="font-extrabold tracking-widest text-[var(--primary)]">LEARNEXA</Link>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map(([href, label, Icon]) => (
            <Link key={href} href={href} className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm ${pathname === href ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--background)]"}`}>
              <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          {admin && <Link href="/admin" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-[var(--background)]"><Shield size={16} /> Admin</Link>}
          <Link href="/profile" className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--background)]">Profile</Link>
        </nav>
      </div>
    </header>
  );
}
