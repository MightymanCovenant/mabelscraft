import { serverClient } from "@/lib/supabase/server";
import Shop from "@/components/Shop";
import RequestForm from "@/components/RequestForm";
import ThemeToggle from "@/components/ThemeToggle";
import PatternBg from "@/components/PatternBg";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { data } = await serverClient().from("products").select("*").eq("active", true).order("name");
  const products = data ?? [];
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-5">
      <div className="flex justify-end pt-4"><ThemeToggle /></div>
      <header className="relative overflow-hidden rounded-3xl py-14 text-center">
        <PatternBg />
        <h1 className="text-4xl font-extrabold text-accent sm:text-6xl md:text-7xl">{"Mabel's Craft"}</h1>
        <p className="mx-auto mt-4 max-w-md px-4 text-muted">Ankara, beads, gele and beaded caps — made and delivered within Port Harcourt.</p>
      </header>
      <Shop products={products} />
      <RequestForm products={products} />
    </main>
  );
}
