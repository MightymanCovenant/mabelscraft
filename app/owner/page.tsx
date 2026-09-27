import { serverClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
export const dynamic = "force-dynamic";
export default async function Owner() {
  const sb = serverClient();
  const [o, r, p] = await Promise.all([
    sb.from("orders").select("*, order_items(name, qty)").order("created_at", { ascending: false }).limit(50),
    sb.from("custom_requests").select("*").order("created_at", { ascending: false }).limit(50),
    sb.from("products").select("*").order("name"),
  ]);
  return <Dashboard orders={o.data ?? []} requests={r.data ?? []} products={p.data ?? []} />;
}
