"use client";
import { useEffect, useState } from "react";
import { supabase, errMsg } from "@/lib/supabase/client";
import type { Product } from "./types";
import PolicyModal from "./PolicyModal";
import ImageCarousel from "./ImageCarousel";
import { CATEGORIES, catLabel } from "./categories";
type Outcome = "cod" | "paid" | "unpaid";
export default function Shop({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [f, setF] = useState({ name: "", phone: "", address: "", note: "", email: "" });
  const [method, setMethod] = useState<"cod" | "online">("cod");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ id: string; outcome: Outcome } | null>(null);
  const [policy, setPolicy] = useState<"cart" | "checkout" | null>(null);
  const [cat, setCat] = useState<string>("all");
  useEffect(() => { try { setCart(JSON.parse(localStorage.getItem("cart") || "{}")); } catch {} }, []);
  const set = (id: string, q: number) => {
    if (q > 0 && !(cart[id] > 0) && !sessionStorage.getItem("seenPolicy")) { sessionStorage.setItem("seenPolicy", "1"); setPolicy("cart"); }
    setCart((c) => { const n = { ...c, [id]: Math.max(0, q) }; localStorage.setItem("cart", JSON.stringify(n)); return n; });
  };
  const shown = cat === "all" ? products : products.filter((p) => p.category === cat);
  const lines = products.filter((p) => cart[p.id] > 0);
  const total = lines.reduce((s, p) => s + p.price * cart[p.id], 0);
  const catsInUse = CATEGORIES.filter((c) => products.some((p) => p.category === c.id));

  async function order() {
    if (!f.name || !f.phone || !f.address) return setErr("Add your name, phone and a full Port Harcourt address.");
    if (method === "online" && !f.email) return setErr("Add your email — Paystack needs it to send your receipt.");
    setBusy(true); setErr("");
    try {
      const { data, error } = await supabase().rpc("place_order", { p_name: f.name, p_phone: f.phone, p_address: f.address, p_note: f.note, p_items: lines.map((p) => ({ id: p.id, qty: cart[p.id] })), p_payment_method: method });
      if (error) throw error;
      const orderId = String(data.id), orderTotal = Number(data.total);
      localStorage.removeItem("cart"); setCart({});
      if (method === "cod") { setDone({ id: orderId, outcome: "cod" }); setPolicy("checkout"); setBusy(false); return; }
      const { default: PaystackPop } = await import("@paystack/inline-js");
      const popup = new PaystackPop();
      const reference = `${orderId}_${Date.now()}`;
      popup.checkout({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: f.email,
        amount: Math.round(orderTotal * 100),
        currency: "NGN",
        reference,
        onSuccess: async () => {
          try {
            const r = await fetch("/api/paystack/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: orderId, reference }) });
            const j = await r.json();
            if (!r.ok || j.error) setErr(`We could not confirm the payment. Please message Mabel your order code: ${orderId.slice(0, 8)}`);
            else setDone({ id: orderId, outcome: "paid" });
          } catch { setErr(`We could not confirm the payment. Please message Mabel your order code: ${orderId.slice(0, 8)}`); }
          setBusy(false); setPolicy("checkout");
        },
        onCancel: () => { setDone({ id: orderId, outcome: "unpaid" }); setPolicy("checkout"); setBusy(false); },
        onError: () => { setErr(`Payment failed. Your order is saved — message Mabel your order code: ${orderId.slice(0, 8)}`); setBusy(false); },
      });
    } catch (e) { setErr(errMsg(e)); setBusy(false); }
  }

  if (done) return (
    <section className="card my-8 text-center">
      <h2 className="text-3xl font-bold text-accent">{done.outcome === "paid" ? "Paid — order placed!" : "Order placed!"}</h2>
      <p className="mt-2 text-muted">
        {done.outcome === "paid" && "Payment received. Mabel will call you to confirm delivery."}
        {done.outcome === "cod" && "Mabel will call you to confirm. Pay the rider on delivery."}
        {done.outcome === "unpaid" && "Payment wasn't completed. Your order is saved — Mabel will follow up, or contact her to arrange payment."}
        {" "}Order code: {done.id.slice(0, 8)}
      </p>
      {policy === "checkout" && <PolicyModal title="Your delivery, in short" onClose={() => setPolicy(null)} />}
    </section>
  );
  return (
    <section className="my-8">
      {policy === "cart" && <PolicyModal onClose={() => setPolicy(null)} />}
      <h2 className="mb-4 text-3xl font-bold">Shop</h2>
      <p className="mb-4 text-sm text-muted">Delivery within Port Harcourt only &middot; estimated 45–90 minutes &middot; pay online or on delivery.</p>
      {catsInUse.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button onClick={() => setCat("all")} className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${cat === "all" ? "border-accent bg-accent text-white" : "border-line text-muted hover:border-accent"}`}>All</button>
          {catsInUse.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${cat === c.id ? "border-accent bg-accent text-white" : "border-line text-muted hover:border-accent"}`}>{c.label}</button>
          ))}
        </div>
      )}
      {products.length === 0 && <p className="text-muted">Nothing in the shop yet. Check back soon.</p>}
      {products.length > 0 && shown.length === 0 && <p className="text-muted">Nothing in this category yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => {
          const imgs = p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [];
          return (
            <div key={p.id} className="card overflow-hidden !p-0 transition hover:shadow-[0_0_24px_rgb(var(--accent)/.3)]">
              <ImageCarousel images={imgs} className="aspect-[4/3] w-full" />
              <div className="p-4">
                <span className="mb-1 inline-block text-xs font-semibold uppercase tracking-wide text-gold">{catLabel(p.category)}</span>
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-sm text-muted">₦{p.price.toLocaleString()} per {p.unit.replace(/s$/, "")} · {p.stock > 0 ? `${p.stock} ${p.unit} left` : "Sold out"}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button className="btn-ghost" disabled={p.stock < 1} onClick={() => set(p.id, (cart[p.id] || 0) - 1)} aria-label="Remove one">-</button>
                  <span className="w-8 text-center font-semibold">{cart[p.id] || 0}</span>
                  <button className="btn-ghost" disabled={(cart[p.id] || 0) >= p.stock} onClick={() => set(p.id, (cart[p.id] || 0) + 1)} aria-label="Add one">+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {lines.length > 0 && (
        <div className="card mt-6">
          <h3 className="mb-3 text-2xl font-bold">Checkout: ₦{total.toLocaleString()}</h3>
          <div className="mb-4 flex gap-2">
            <button type="button" onClick={() => setMethod("online")} className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${method === "online" ? "border-accent bg-accent text-white" : "border-line text-muted hover:border-accent"}`}>Pay online (card / transfer)</button>
            <button type="button" onClick={() => setMethod("cod")} className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${method === "cod" ? "border-accent bg-accent text-white" : "border-line text-muted hover:border-accent"}`}>Pay on delivery</button>
          </div>
          {(["name", "phone", "address", ...(method === "online" ? ["email" as const] : []), "note"] as const).map((k) => (
            <label key={k} className="block text-sm font-semibold capitalize">{k === "note" ? "Note (optional)" : k === "address" ? "Address (Port Harcourt)" : k}
              <input className="field mt-1" type={k === "email" ? "email" : "text"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </label>
          ))}
          {err && <p role="alert" className="mb-3 text-accent">{err}</p>}
          <button className="btn" disabled={busy} onClick={order}>{busy ? "Working..." : method === "online" ? "Pay now" : "Place order (pay on delivery)"}</button>
        </div>
      )}
    </section>
  );
}
