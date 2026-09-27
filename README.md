# Mabel's Craft

## Database
1. Create a Supabase project, run `supabase/schema.sql` in the SQL editor (or paste in one go — it's safe to re-run).
2. In Auth, create Mabel's user, then run: `insert into owners (user_id) select id from auth.users;`
3. Turn on Realtime for `orders` and `custom_requests` (Database > Replication).
4. In Storage, confirm the `product-images` bucket exists (the schema creates it) and is public.

## Paystack
1. Create a Paystack account at https://dashboard.paystack.com and grab your keys from Settings > API Keys & Webhooks.
2. Start with the **test** keys (`pk_test_...` / `sk_test_...`) — safe to use while building, no real money moves.
3. Only switch to **live** keys (`pk_live_...` / `sk_live_...`) once Mabel is ready to take real payments. Live keys belong to her Paystack account only — don't reuse them for any other business.

## Environment
`cp .env.example .env.local`, then fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings > API
- `SUPABASE_SERVICE_ROLE_KEY` — same page, the **service_role** secret. Never expose this to the browser; it's only read by the two files under `app/api/paystack`.
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY` — from Paystack, as above.

## Run
`npm install && npm run dev`, then visit `/owner/login`.

## How payment works
- Customer picks "Pay online" or "Pay on delivery" at checkout.
- Either way, the order is created first and stock is deducted immediately (this is unchanged from before).
- For online payment, Paystack's popup opens in the browser. When it reports success, the browser asks our own server (`/api/paystack/verify`) to confirm — our server checks with Paystack directly, using the secret key, that the exact amount was actually paid, before marking the order paid. The browser's word alone is never trusted.
- If a customer closes the Paystack popup without paying, the order is still saved (as "Online — unpaid") so Mabel can follow up; cancelling that order in the dashboard restores the stock automatically.
