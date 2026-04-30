# Eli Pixler Films · Wedding Portal Build

This folder is the working prototype. Unzip and open `index.html` in any modern browser.

## Files

| File | What it is |
| --- | --- |
| `index.html` | **Login screen.** Password: `2003` |
| `admin.html` | **Studio admin.** Create portals, drop in videos, edit your studio profile, email brides. |
| `client.html` | **Bride's portal.** Loads with `?bride=<slug>` — e.g. `client.html?bride=caroline-gabe` |
| `scripts/store.js` | LocalStorage data layer — portals, videos, profile, geocoded venues |
| `scripts/globe.js` | The dotted-earth WebGL globe used in the first-visit reveal and the hero |
| `scripts/earth-dots.js` | Pre-baked sphere coordinates for the globe |
| `styles/tokens.css` | Brand tokens — colors, fonts, ease curves |
| `styles/portal.css` | Shared portal-side styles |
| `fonts/LaLuxes-regular.otf` | Studio script display font |
| `assets/` | Cover photo, monogram, reel thumbnails |

## How to use

1. Open `index.html`. Enter `2003`.
2. **First thing:** fill in the Studio Profile at the top of admin (name, IG, email, phone). Hit Save. This populates the footer of every bride's page.
3. Create a portal — bride name, partner name, date, location (city or "lat, lng"), monogram (auto-fills from initials), bride's email.
4. Click **Add Videos** to expand. Drop video files (.mp4 / .mov / .webm) into the drop zone, OR paste a video URL.
5. Click **Preview** to see what the bride sees.
6. Click **Email Bride** to open mail with a pre-filled template.

## Where data lives

Everything is in `localStorage` under these keys:
- `epfilms.portals.v1` — portal records
- `epfilms.profile.v1` — your studio profile
- `epfilms.session.v1` — login state
- `epfilms.visited.v1` — which bride slugs have already seen the intro reveal

Open DevTools → Application → Local Storage to inspect or clear.

## Limitations of the prototype

- **Uploaded videos use blob URLs.** They play during the session but won't survive a hard refresh or storage clear — for production you'd swap `PortalStore.addVideo` over to upload to S3 / Cloudflare R2 / Mux.
- **The geocoder is a small built-in lookup table** in `store.js`. For real city support, swap `geocode()` to a geocoding API (Mapbox, Google) or accept "lat, lng" as the input.
- **No backend.** Multiple admins, real auth, sharing across devices = needs a server.
- **Shared password.** Per your spec — link is the secret. If you want per-portal passwords later, the schema already has `slug` as the unique handle.

## Next steps for a real build

- Backend: Postgres + S3 + an auth provider, or a BaaS (Supabase / Firebase)
- Video pipeline: Mux or Cloudflare Stream for transcoding, HLS playback, thumbnails
- Email: Resend or Postmark for the "email the bride" template
- Domain: a per-bride subdomain (`caroline-gabe.elipixlerfilms.com`) feels nicer than a query param
