import { createBrowserClient } from "@supabase/ssr";
let c: ReturnType<typeof createBrowserClient> | undefined;
export const supabase = () => (c ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));
export const errMsg = (e: unknown) => e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Something went wrong";
