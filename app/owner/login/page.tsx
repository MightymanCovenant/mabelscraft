"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, errMsg } from "@/lib/supabase/client";
export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const { error } = await supabase().auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      r.push("/owner"); r.refresh();
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <h1 className="mb-6 text-4xl font-extrabold text-accent">Owner login</h1>
      <form onSubmit={go} className="card">
        <label className="block text-sm font-semibold">Email<input className="field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm font-semibold">Password<input className="field mt-1" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {err && <p role="alert" className="mb-3 text-accent">{err}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Working..." : "Log in"}</button>
      </form>
    </main>
  );
}
