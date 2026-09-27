import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";

// The client tells us which order and which Paystack reference it used, but
// we never trust that on its own: we re-fetch the order's real total and
// ask Paystack directly (with the secret key, server-side only) whether that
// exact reference actually paid that exact amount before marking anything paid.
export async function POST(req: Request) {
  try {
    const { order_id, reference } = await req.json();
    if (!order_id || !reference) return NextResponse.json({ error: "Missing order_id or reference" }, { status: 400 });

    const sb = admin();
    const { data: order, error: oErr } = await sb.from("orders").select("id,total,payment_status").eq("id", order_id).single();
    if (oErr || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.payment_status === "paid") return NextResponse.json({ ok: true, already: true });

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    });
    const json = await res.json();
    const tx = json?.data;
    const expectedKobo = Math.round(Number(order.total) * 100);

    if (!res.ok || !json?.status || tx?.status !== "success" || tx?.amount !== expectedKobo) {
      return NextResponse.json({ error: "Payment could not be verified" }, { status: 400 });
    }

    const { error: uErr } = await sb.from("orders").update({ payment_status: "paid", payment_reference: reference }).eq("id", order_id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Verification failed" }, { status: 500 });
  }
}
