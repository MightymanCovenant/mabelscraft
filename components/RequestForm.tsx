"use client";
import { useState } from "react";
import { supabase, errMsg } from "@/lib/supabase/client";
import type { Product } from "./types";
type Row = { id: string; qty: number };
export default function RequestForm({ products }: { products: Product[] }) {
  const [rows, setRows] = useState<Row[]>([{ id: products[0]?.id ?? "", qty: 1 }]);
  const [f, setF] = useState({ name: "", phone: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const upd = (i: number, r: Partial<Row>) => setRows(rows.map((x, j) => (j === i ? { ...x, ...r } : x)));
  async function send() {
    if (!f.name || !f.phone) return setErr("Add your name and phone so Mabel can reach you.");
    setBusy(true); setErr("");
    try {
      const items = rows.map((r) => { const p = products.find((x) => x.id === r.id); return { product: p?.name, unit: p?.unit, qty: r.qty, in_stock: p?.stock ?? 0 }; });
      const { error } = await supabase().rpc("submit_request", { p_name: f.name, p_phone: f.phone, p_address: f.address, p_items: items });
      if (error) throw error;
      setOk(true);
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }
  if (ok) return <section className="card my-8 text-center"><h2 className="text-3xl font-bold text-accent">Request sent!</h2><p className="mt-2 text-muted">Mabel will confirm what she has and the price.</p></section>;
  if (products.length === 0) return null;
  return (
    <section className="my-12">
      <h2 className="text-3xl font-bold">List exactly what you want</h2>
      <p className="mb-4 text-muted">Need more than we have on the shelf? Tell us and we will source the rest.</p>
      <div className="card">
        {rows.map((r, i) => {
          const p = products.find((x) => x.id === r.id);
          const have = Math.min(r.qty, p?.stock ?? 0), short = Math.max(0, r.qty - (p?.stock ?? 0)), tot = r.qty || 1;
          return (
            <div key={i} className="mb-4 rounded-2xl border border-dashed border-line p-3">
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <label className="text-sm font-semibold">What do you want?
                  <select className="field mt-1" value={r.id} onChange={(e) => upd(i, { id: e.target.value })}>{products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
                <label className="text-sm font-semibold">How many?
                  <input className="field mt-1" type="number" min={1} value={r.qty} onChange={(e) => upd(i, { qty: Math.max(1, +e.target.value || 1) })} /></label>
              </div>
              <div className="flex h-6 overflow-hidden rounded-full border border-line bg-bg">
                <div className="h-full transition-all duration-700" style={{ width: `${(have / tot) * 100}%`, background: "repeating-linear-gradient(45deg,rgb(var(--accent)) 0 8px,rgb(var(--gold)) 8px 16px)", backgroundSize: "22px 22px", animation: "stripes 1.2s linear infinite" }} />
                <div className="h-full transition-all duration-700" style={{ width: `${(short / tot) * 100}%`, background: "repeating-linear-gradient(90deg,transparent 0 6px,rgb(var(--accent)/.3) 6px 12px)" }} />
              </div>
              <p className="mt-2 text-sm text-muted">{short ? `${have} ${p?.unit} ready now, ${short} we will source for you` : `All ${r.qty} ${p?.unit ?? ""} are in stock.`}</p>
            </div>
          );
        })}
        <button className="btn-ghost mb-5" onClick={() => setRows([...rows, { id: products[0]?.id ?? "", qty: 1 }])}>+ Add another item</button>
        {(["name", "phone", "address"] as const).map((k) => (
          <label key={k} className="block text-sm font-semibold capitalize">{k}<input className="field mt-1" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
        ))}
        {err && <p role="alert" className="mb-3 text-accent">{err}</p>}
        <button className="btn" disabled={busy || products.length === 0} onClick={send}>{busy ? "Working..." : "Send my request"}</button>
      </div>
    </section>
  );
}
