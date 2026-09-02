# Phase 16 — Ayush Janseva Kendra (Netlify Fixed)

## Important fixes
- Fixed Admin Print File error: browser printing now fetches the protected Netlify Blob with the logged-in admin token.
- Customer Login ID remains the registered 10-digit mobile number.
- Customer chooses password during signup.
- Added per-file print type and page count.
- Pricing: B&W Document ₹5/page, Color Document ₹10/page, Color Photo A4 ₹100/page. Copies are included in the calculation.
- Added UPI payment intent for `7535948371@ybl`.
- Customer can mark payment as submitted; admin can verify and mark Paid.

## Netlify settings
- Publish directory: `public`
- Functions directory: `netlify/functions`
- Build command: leave blank
- No environment variables are required for this prototype. For production, set `PHASE16_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` in Netlify.

## Default admin
- Login ID: `admin`
- Password: `admin123`

After updating the GitHub repository, trigger a new Netlify deploy.
