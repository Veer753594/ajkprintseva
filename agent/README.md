# Ayush Janseva AutoPrint Agent — Phase 16 Final

Windows shop-PC agent for silent/background printing. The browser Print dialog is NOT used.

## Flow
Customer submits -> payment submitted -> Admin verifies payment -> Admin clicks **Approve for Auto Print** -> agent claims the job -> downloads file -> SumatraPDF prints directly to the selected Windows printer -> agent reports Printed/Failed.

## Windows setup
1. Install a supported Windows printer and test a normal Windows print first.
2. Install **SumatraPDF**. The agent uses its silent command-line printing (`-silent -print-to`) so no browser/system print dialog is required.
3. Optional: install **LibreOffice** if you want common Word/Excel/PowerPoint files converted to PDF automatically before printing.
4. Copy `config.example.json` to `config.json`.
5. Put the live Netlify URL in `apiBase`, the exact same secret as Netlify `AGENT_KEY` in `agentKey`, and the exact Windows printer name in `printerName`.
6. Run `npm install` and then `npm start`, or build the EXE with `npm run build-exe`.
7. Keep the agent PC powered on and connected to the internet.

## Important
- Never upload `config.json` to GitHub. It contains the secret Agent Key.
- Auto Print is only queued when the order payment is `Paid` and the admin status is `Approved`.
- B&W/Color and copies/duplex are sent as SumatraPDF print settings.
- Photo jobs request A4 and can use `binByPaper` if your printer exposes separate trays. The actual paper must be loaded in the printer.
- If your printer driver uses a special paper/tray name, use `sumatrapdf -list-printers` to inspect available printer defaults/trays and adjust `binByPaper`/paper settings.

## Troubleshooting: `/var/task/config.json`
If the Windows agent reports an error mentioning `/var/task/config.json`, that error is from the Netlify server function, not the Windows PC. The fixed `netlify/functions/agent.mjs` never reads a local config.json; it authenticates only with the Netlify `AGENT_KEY` environment variable.
After replacing the Netlify files, trigger a fresh Netlify deploy. Then restart the Windows agent.

## Windows config
The Windows agent reads `config.json` from the same directory as `agent.mjs`, not from the current working directory. This lets `START-AGENT.bat` work even when launched from another directory.
