# Testing UnvibeCode with Planted Bugs

I wrote small apps with hidden bugs and ran [UnvibeCode](https://github.com/FinanceFlash/unvibecode) on them, to see what it finds, what it misses, and where its output is wrong. This is my work for the UnvibeCode Engineering Challenge 2026 (Track 1).

> All test apps here are **purpose-built test cases**, not real products. Nothing in this repo contains passwords, keys, or private code.

- UnvibeCode version tested: 
- Dates tested: 11 Oct and 14-15 Oct 2026
- OS: Windows

---

## What is in this repo

| Folder | What it is |
|---|---|
| `shopdesk-py/` | Small FastAPI order service with 10 planted bugs |
| `shopdesk-js/` | The same app translated to Express (Node.js) |
| `require-repro/` | 4-file test for `require("../x")` links |
| `event-repro/` | 4-file test for an event emitted under a name nobody listens to |
| `results/` | Screenshots of UnvibeCode output |
| `ANSWER_KEY.md` | List of every planted bug, kept outside the analyzed folders |

---

## How I tested

1. Built ShopDesk with bugs that look correct on a quick read.
2. Ran each bug through the app to confirm it really happens.
3. Ran UnvibeCode:
   ```bash
   py -m unvibecode review --repository "path\to\shopdesk-py"
   ```
4. Compared UnvibeCode's workflow map and risk findings with the answer key.
5. Ran the JS version through UnvibeCode **3 times** to see if results are stable.
6. Asked a VS Code assistant (gpt 6 asitra) to trace the workflows and run the app, and compared it with UnvibeCode.

---

## The test app (ShopDesk)

A tiny shop backend. Customers place orders through an API, the order is priced, stock is reserved, the card is charged, the order ships, and a receipt and ledger entry should follow. A payment gateway also calls a webhook, and there is an admin export.

Its README says things like "stock can never go negative" and "the webhook is idempotent". Several of those claims are false in the code, which is the point of the test.

### Planted bugs

| # | Bug | Survived the JS translation? |
|---|---|---|
| T1 | Wrong pricing file used, so the gold discount never applies | Yes |
| T2 | Stock check reads `STOCK_CHECK_ENABLED`, but the example env file sets `ENABLE_STOCK_CHECK`, so it is always off | Yes |
| T3 | `validatePayment` always returns true, and negative quantities are accepted | Yes |
| T4 | Typo in the express-shipping function name | **No** (the translation fixed it) |
| T5 | Auth skipped for any path starting with `/api/orders/public`, so anyone can export all orders | Yes |
| T6 | Ledger handler is never loaded, so API orders never reach the ledger | Yes |
| T7 | Webhook accepts unsigned requests when no secret is set, double-credits on retry, and emits `order.payed` (typo) | Yes |
| T8 | Stock is not released when a payment is declined | Yes |
| T9 | Example env file turns on a sandbox plugin that makes every charge succeed | Yes |
| T10 | Event bus swallows errors with an empty catch | Yes |

[ss: ShopDesk running, e.g. terminal output showing a negative-quantity order returning 200]

---

## Results

### Python version

UnvibeCode reported **0 risk findings** (6 candidate areas evaluated).

[ss: Python run, Risk Findings page]

[ss: Python run, Business Workflow page]

### JavaScript version: three runs on the same code

| Run | Workflows | Risk findings |
|---|---|---|
| 1 (11 Oct) | 2 | 1 (anonymous export, High) |
| 2 (11 Oct) | 1 | 0 (4 gaps retained) |
| 3 (14 Oct) | 3 | 1 (anonymous export, Critical) |

[]

[ss: run 2, Risk Findings]

[ss: run 3, Risk Findings]

The one bug it reported is real: `GET /api/orders/public-export` returns every order without logging in. I confirmed that by running the app.

### UnvibeCode vs a VS Code assistant

The assistant ran the app with test requests, and UnvibeCode read the code. Of the 9 planted bugs that survived the JS translation:

| | Found |
|---|---|
| VS Code assistant (ran the code) | All 9 |
| UnvibeCode | 1 clearly (T5, in 2 of 3 runs). T2 partly. |

[ss: VS Code assistant output, README claims vs what actually happens table]

---

## What I found about UnvibeCode

### 1. Connected Code Map: `../` requires are missing

In `require-repro`, `require("./b")` is linked but `require("../util")` is not, and `util.js` does not appear in the graph at all.

[ss: require-repro, Connected Code Map]

This is already reported in the project's issues (#84, #103). My repro confirms it independently.

In the larger JS app, `connections.jsonl` has 20 entries, which are 10 unique links listed twice. All 10 start in `main.js`, `plugins.js` or `middleware.js`. None start in `routes/` or `services/`.
<!-- VERIFY before publishing: open connections.jsonl from the shopdesk-js run and check the source_file column -->

[ss: shopdesk-js, Connected Code Map]

### 2. Results change between runs

Same code, three runs, three different reports (table above). Severity changed from High to Critical for the same bug.

### 3. A workflow claim that is not true

The workflow for the webhook says it "fans out" an `order.payed` event "to listeners". But `webhooks.js` emits `order.payed` and the only listener is registered for `order.paid`. Nothing receives the event. `event-repro/` shows this in 4 files: it prints `credit recorded for order 1` and never prints `receipt sent`.

[ss: shopdesk-js workflow text mentioning order.payed]

[ss: event-repro result in UnvibeCode]

GitHub issue: `[ISSUE LINK, add after filing]`

### 4. Small wording bug

The risk page says "0 candidate or duplicate records did not satisfy the reporting rules" while also showing 2 candidate areas evaluated.

[ss: require-repro, Risk Findings page]

---

## What worked well

- Installs with one command, no API key.
- Found a real unauthenticated-export bug and showed the supporting code.
- States clearly that "no findings" is not a guarantee of no defects.
- The Connected Code Map is quick to explore on small repos.

## Limits of my testing

- Small, purpose-built apps, tested by one person.
- The business analysis runs on a hosted model, so results can differ per run. I only ran 3 times.
- I planted the bugs, so "missed bugs" is a measure against my test, not against real projects.
- I did not test large or real-world repositories.

---

## Reproduce

```bash
# 1. install
py -m pip install --upgrade unvibecode

# 2. run on a test folder
py -m unvibecode review --repository "path\to\event-repro"

# 3. confirm the real behaviour of the repro
cd event-repro
node index.js
```

---

*Not affiliated with UnvibeCode or Alphashots.ai. Made as part of the UnvibeCode Engineering Challenge 2026.*
