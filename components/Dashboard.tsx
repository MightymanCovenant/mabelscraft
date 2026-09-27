"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, errMsg } from "@/lib/supabase/client";
import type { Product } from "./types";
import { CATEGORIES } from "./categories";
import ThemeToggle from "./ThemeToggle";
import ImageCarousel from "./ImageCarousel";
const STATUSES = ["received", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
type Order = { id: string; name: string; phone: string; address: string; total: number; status: string; payment_method: string; payment_status: string; order_items?: { name: string; qty: number }[] };
type Req = { id: string; name: string; phone: string; status: string; items?: { product: string; unit: string; qty: number; in_stock: number }[] };
export default function Dashboard({ orders, requests, products }: { orders: Order[]; requests: Req[]; products: Product[] }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [np, setNp] = useState<{ name: string; category: string; unit: string; price: number; stock: number }>({ name: "", category: CATEGORIES[0].id, unit: CATEGORIES[0].unit, price: 0, stock: 0 });
  const [npFiles, setNpFiles] = useState<File[]>([]);
  const [npPreviews, setNpPreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  useEffect(() => {
    const ch = supabase().channel("owner").on("postgres_changes", { event: "*", schema: "public" }, () => router.refresh()).subscribe();
    return () => { supabase().removeChannel(ch); };
  }, [router]);
  async function run(p: PromiseLike<{ error: unknown }>) {
    try { const { error } = await p; if (error) throw error; setErr(""); router.refresh(); } catch (e) { setErr(errMsg(e)); }
  }
  async function uploadPhotos(product: Product, files: FileList) {
    setUploading(product.id); setErr("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const path = `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${file.name.split(".").pop()}`;
        const { error: upErr } = await supabase().storage.from("product-images").upload(path, file);
        if (upErr) throw upErr;
        urls.push(supabase().storage.from("product-images").getPublicUrl(path).data.publicUrl);
      }
      const next = [...(product.images ?? (product.image_url ? [product.image_url] : [])), ...urls];
      const { error } = await supabase().from("products").update({ images: next, image_url: next[0] ?? null }).eq("id", product.id);
      if (error) throw error;
      router.refresh();
    } catch (e) { setErr(errMsg(e)); } finally { setUploading(null); }
  }
  function removePhoto(product: Product, url: string) {
    const next = (product.images ?? []).filter((u) => u !== url);
    run(supabase().from("products").update({ images: next, image_url: next[0] ?? null }).eq("id", product.id));
  }
  function pickNewItemPhotos(files: FileList) {
    const list = Array.from(files);
    setNpFiles((f) => [...f, ...list]);
    setNpPreviews((p) => [...p, ...list.map((f) => URL.createObjectURL(f))]);
  }
  function dropNewItemPhoto(i: number) {
    setNpFiles((f) => f.filter((_, j) => j !== i));
    setNpPreviews((p) => p.filter((_, j) => j !== i));
  }
  async function createProduct() {
    if (!np.name) return;
    setCreating(true); setErr("");
    try {
      const id = crypto.randomUUID();
      const urls: string[] = [];
      for (const file of npFiles) {
        const path = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${file.name.split(".").pop()}`;
        const { error: upErr } = await supabase().storage.from("product-images").upload(path, file);
        if (upErr) throw upErr;
        urls.push(supabase().storage.from("product-images").getPublicUrl(path).data.publicUrl);
      }
      const { error } = await supabase().from("products").insert({ id, ...np, images: urls, image_url: urls[0] ?? null }).select().single();
      if (error) throw error;
      setNp({ ...np, name: "" }); setNpFiles([]); setNpPreviews([]);
      router.refresh();
    } catch (e) { setErr(errMsg(e)); } finally { setCreating(false); }
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold text-accent sm:text-4xl">{"Mabel's shelf"}</h1>
        <div className="flex items-center gap-3"><ThemeToggle /><button className="btn-ghost" onClick={async () => { await supabase().auth.signOut(); router.push("/owner/login"); }}>Log out</button></div></div>
      {err && <p role="alert" className="mb-4 text-accent">{err}</p>}
      <h2 className="mb-3 text-2xl font-bold">Orders</h2>
      {orders.length === 0 && <p className="mb-6 text-muted">No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="card mb-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><b>{o.name}</b>
            <span className="flex items-center gap-2 text-muted">
              {o.phone} · ₦{Number(o.total).toLocaleString()}
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.payment_status === "paid" ? "bg-accent/15 text-accent" : "border border-line text-muted"}`}>
                {o.payment_method === "online" ? (o.payment_status === "paid" ? "Paid online" : "Online — unpaid") : "Pay on delivery"}
              </span>
            </span>
            <select className="field !mb-0 !w-auto" value={o.status} onChange={(e) => run(supabase().rpc("set_order_status", { p_id: o.id, p_status: e.target.value }))}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <p className="text-sm text-muted">{o.address}. {o.order_items?.map((i) => `${i.qty} x ${i.name}`).join(", ")}</p>
        </div>
      ))}
      <h2 className="mb-3 mt-8 text-2xl font-bold">Custom requests</h2>
      {requests.length === 0 && <p className="mb-6 text-muted">No requests yet.</p>}
      {requests.map((q) => (
        <div key={q.id} className="card mb-3">
          <b>{q.name}</b> <span className="text-muted">{q.phone}</span>
          <p className="text-sm text-muted">{q.items?.map((i) => `${i.qty} ${i.unit} ${i.product}${i.qty > i.in_stock ? ` (only ${i.in_stock} in stock)` : ""}`).join("; ")}</p>
          <button className="btn-ghost mt-2" onClick={() => run(supabase().from("custom_requests").update({ status: q.status === "new" ? "handled" : "new" }).eq("id", q.id))}>{q.status === "new" ? "Mark handled" : "Handled, undo"}</button>
        </div>
      ))}
      <h2 className="mb-3 mt-8 text-2xl font-bold">Stock</h2>
      {products.map((p) => {
        const imgs = p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [];
        return (
          <div key={p.id} className="card mb-3">
            <div className="grid gap-3 sm:grid-cols-[5rem_2fr_1fr_1fr_auto_auto] sm:items-end">
              <ImageCarousel images={imgs} className="h-20 w-20 overflow-hidden rounded-xl border border-line" />
              <div><b>{p.name}</b><p className="text-sm text-muted">{p.unit}</p></div>
              <label className="text-sm font-semibold">In stock<input className="field mt-1 !mb-0" type="number" min={0} defaultValue={p.stock} onBlur={(e) => +e.target.value !== p.stock && run(supabase().from("products").update({ stock: +e.target.value }).eq("id", p.id))} /></label>
              <label className="text-sm font-semibold">Price (₦)<input className="field mt-1 !mb-0" type="number" min={0} defaultValue={p.price} onBlur={(e) => +e.target.value !== p.price && run(supabase().from("products").update({ price: +e.target.value }).eq("id", p.id))} /></label>
              <label className="btn-ghost cursor-pointer text-center">{uploading === p.id ? "Uploading..." : "Add photos"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && e.target.files.length > 0 && uploadPhotos(p, e.target.files)} /></label>
              <button className="btn-ghost" onClick={() => run(supabase().from("products").delete().eq("id", p.id))}>Delete</button>
            </div>
            {imgs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {imgs.map((u) => (
                  <div key={u} className="relative h-14 w-14 overflow-hidden rounded-lg border border-line bg-cover bg-center" style={{ backgroundImage: `url(${u})` }}>
                    <button aria-label="Remove photo" onClick={() => removePhoto(p, u)} className="absolute right-0 top-0 rounded-bl bg-black/60 px-1 text-xs text-white">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="card">
        <div className="grid items-end gap-3 sm:grid-cols-[2fr_1.4fr_1fr_1fr_1fr]">
          <label className="text-sm font-semibold">New item<input className="field mt-1 !mb-0" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} /></label>
          <label className="text-sm font-semibold">Category<select className="field mt-1 !mb-0" value={np.category} onChange={(e) => { const c = CATEGORIES.find((x) => x.id === e.target.value)!; setNp({ ...np, category: c.id, unit: c.unit }); }}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <label className="text-sm font-semibold">Unit<select className="field mt-1 !mb-0" value={np.unit} onChange={(e) => setNp({ ...np, unit: e.target.value })}><option>yards</option><option>strands</option><option>pieces</option></select></label>
          <label className="text-sm font-semibold">Price (₦)<input className="field mt-1 !mb-0" type="number" min={0} value={np.price} onChange={(e) => setNp({ ...np, price: +e.target.value })} /></label>
          <label className="text-sm font-semibold">In stock<input className="field mt-1 !mb-0" type="number" min={0} value={np.stock} onChange={(e) => setNp({ ...np, stock: +e.target.value })} /></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="btn-ghost cursor-pointer text-center">+ Add photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) pickNewItemPhotos(e.target.files); e.target.value = ""; }} /></label>
          {npPreviews.map((u, i) => (
            <div key={u} className="relative h-14 w-14 overflow-hidden rounded-lg border border-line bg-cover bg-center" style={{ backgroundImage: `url(${u})` }}>
              <button aria-label="Remove photo" onClick={() => dropNewItemPhoto(i)} className="absolute right-0 top-0 rounded-bl bg-black/60 px-1 text-xs text-white">×</button>
            </div>
          ))}
        </div>
        <button className="btn mt-3" disabled={!np.name || creating} onClick={createProduct}>{creating ? "Adding..." : "Add item"}</button>
      </div>
      <p className="mt-2 text-xs text-muted">Pick your photos before pressing &quot;Add item&quot;, or add more later from the item&apos;s own &quot;Add photos&quot; button.</p>
    </main>
  );
}
