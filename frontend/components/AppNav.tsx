"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Bell, CalendarDays, LayoutDashboard, MessageSquare, Shield, Star, WalletCards } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "./BrandMark";
import ThemeToggle from "../app/ThemeToggle";

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
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
    ["/feedback", "Feedback", Star],
  ] as const;
  return (
    <header className="app-header">
      <div className="page-container flex flex-wrap items-center justify-between gap-4 py-3">
        <Link href="/" aria-label="LEARNEXA dashboard">
          <BrandMark compact />
        </Link>
        <nav className="app-nav-scroll flex flex-1 items-center justify-end gap-1">
          {links.map(([href, label, Icon]) => (
            <Link key={href} href={href} className={`app-nav-link ${pathname === href ? "app-nav-link-active" : ""}`}>
              <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          {admin && <Link href="/admin" className={`app-nav-link ${pathname === "/admin" ? "app-nav-link-active" : ""}`}><Shield size={16} /> <span className="hidden sm:inline">Admin</span></Link>}
          <Link href="/profile" className={`app-nav-link ${pathname === "/profile" ? "app-nav-link-active" : ""}`}><span className="hidden sm:inline">Profile</span><span className="sm:hidden">Me</span></Link>
          <ThemeToggle />
          <button type="button" className="app-logout" onClick={() => { localStorage.removeItem("token"); router.replace("/login"); }}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
