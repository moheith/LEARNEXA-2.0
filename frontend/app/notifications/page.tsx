"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../../components/AppNav";
import { apiGet, apiPatch } from "../../lib/api";
type Notification = { id:number; title:string; message:string; read:boolean; created_at:string };
export default function NotificationsPage() {
  const router = useRouter(); const [items,setItems] = useState<Notification[]>([]); const [error,setError] = useState("");
  async function load(){ const r=await apiGet<Notification[]>("/notifications"); if(!r.ok){ if(r.error?.includes("401")) router.replace("/login"); else setError(r.error||"Unable to load notifications"); return; } setItems(r.data||[]); }
  useEffect(()=>{ if(!localStorage.getItem("token")) router.replace("/login"); else load(); },[router]);
  async function mark(id:number){ await apiPatch(`/notifications/${id}`,{}); setItems(xs=>xs.map(x=>x.id===id?{...x,read:true}:x)); }
  return <main className="min-h-screen"><AppNav/><section className="page-container py-8"><h1 className="text-3xl font-bold">Notifications</h1><p className="mt-1 text-[var(--muted)]">Stay up to date with requests, sessions, and messages.</p>{error&&<p className="mt-4 text-red-600">{error}</p>}<div className="mt-6 space-y-3">{items.length===0?<div className="simple-card p-6 text-[var(--muted)]">You’re all caught up.</div>:items.map(n=><article key={n.id} className={`simple-card flex items-start justify-between gap-4 p-5 ${!n.read?"border-l-4 border-l-[var(--primary)]":""}`}><div><h2 className="font-semibold">{n.title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{n.message}</p><time className="mt-2 block text-xs text-[var(--muted)]">{new Date(n.created_at).toLocaleString()}</time></div>{!n.read&&<button className="secondary-button text-sm" onClick={()=>mark(n.id)}>Mark read</button>}</article>)}</div></section></main>;
}
