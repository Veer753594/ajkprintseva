# Phase 16 — Ayush Janseva Kendra — Final AutoPrint + Payment

## Included
- Customer signup/login with 10-digit mobile Login ID.
- Customer multi-file print order.
- Rates: B&W Document ₹5/page, Color Document ₹10/page, Color Photo A4 ₹100/page.
- Copies included in calculation.
- UPI ID: `7535948371@ybl`.
- UPI deep link, QR display and Cash Payment option.
- Admin payment verification and paper-type control.
- Admin **Approve for Auto Print** only after payment is marked Paid.
- Windows AutoPrint Agent with Agent Key authentication.
- Silent/background printing through SumatraPDF; browser print dialog is not used for approved jobs.
- Optional LibreOffice conversion for common Office files.
- Indian Tricolor-inspired UI: Saffron, White, Green with subtle Navy accents.

## Netlify
Publish directory: `public`
Functions directory: `netlify/functions`
Build command: leave blank.

Set these environment variables for the final setup:
- `AGENT_KEY` — long random secret shared only with the shop PC agent.
- `PHASE16_SECRET` — long random secret for session signing.

Do not publish the Windows agent `config.json` to GitHub.

## AutoPrint flow
1. Customer submits order.
2. Customer pays by UPI/QR or selects Cash.
3. Admin verifies payment and clicks **Mark Paid**.
4. Admin saves paper type and clicks **Approve for Auto Print**.
5. Windows agent polls the queue, claims the job and prints it silently.
6. Agent reports `Printed`, `Failed`, or order completion back to Netlify.

## Windows agent
See `agent/README.md`. Install SumatraPDF for silent PDF/image printing. Optional LibreOffice enables Office-document conversion to PDF before printing.

The agent supports B&W/Color, copies, Single/Double Side, A4 for photo jobs, and configurable printer/tray settings. The actual paper must be loaded in the printer.
