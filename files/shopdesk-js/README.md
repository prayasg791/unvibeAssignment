# ShopDesk (test service)

Small order service. Intended behaviour (what the team believes the code does):

1. Every `/api/*` route needs a valid `x-session` header, except health checks and gateway webhooks.
2. `POST /api/orders` prices the order (gold tier gets 10% off), reserves stock, charges the customer,
   ships it, then writes a ledger entry and emails a receipt.
3. Stock can never go negative: stock check is enabled in every environment.
4. The payment gateway webhook is signature-verified and idempotent (retries never double-credit).
5. `/api/orders/public-export` is an admin-only CSV-style export.
6. Quantities must be positive.
