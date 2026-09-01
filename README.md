# Phase 16 — Ayush Janseva Kendra Print Service (Netlify Ready)

## Login
- One website URL for both roles.
- Customer Login ID is the customer's registered 10-digit mobile number.
- Customer chooses their own password during signup.
- Admin login is separate and cannot be created through customer signup.

## Prototype Admin Login
- Login ID: `admin`
- Password: `admin123`

For production, set these Netlify environment variables:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `PHASE16_SECRET`

## Deploy
Connect this repository to Netlify. `netlify.toml` configures:
- Publish directory: `public`
- Functions directory: `netlify/functions`
- `/api/*` -> Netlify Functions

Netlify Blobs are used for customer accounts, orders and uploaded files.
