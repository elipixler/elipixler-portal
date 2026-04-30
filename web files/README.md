# Eli Pixler Studios — Client Wedding Portal

A private delivery site for wedding films. Two sides:

- **Studio side** — a password-gated admin (`index.html` → `admin.html`) where Eli creates a portal per bride and uploads/links videos.
- **Bride side** — a public, slug-addressed page (`client.html?bride=<slug>`) where the couple watches their highlight + full film and a grid of vertical reels, with one-tap "Save to Phone."

> This kit is a **fully click-thru prototype**. Data is persisted in `localStorage` so you can create portals, add videos, and watch the bride flow without any backend. The production build will swap the store for Supabase — see `scripts/store.js` for the seam.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Login screen. Centered card on cream. Password gates access. |
| `admin.html` | Create-portal form + list of portals with expandable per-portal video panel. |
| `client.html` | Public bride page. Hero / Feature Films / Reels grid / Footer + lightbox. |
| `styles/tokens.css` | Brand tokens (color, type, motion). Mirrors the root design system. |
| `styles/portal.css` | Portal-specific overrides (button styles, fields, cards). |
| `scripts/store.js` | `PortalStore` (CRUD) + `Session` (login). Single seam to swap for Supabase. |
| `assets/` | Logo, monogram, default cover, reel thumbnails. |
| `fonts/` | La Luxes Serif. Cormorant Garamond + Playfair Display load from Google Fonts via tokens. |

## How to demo it

1. Open `index.html`. Password is **`2003`**.
2. You land on `admin.html`. There's already one seeded portal (Madison & Zac).
3. Create a new portal — bride's name is the only required field. Slug auto-fills.
4. Click **Add Videos** on a portal. Drop in any `.mp4`, Vimeo URL, Google Drive link, or Dropbox link with a title.
5. Click **Preview** to open the bride-facing page in a new tab. Or **Copy Link** to grab the shareable URL.
6. On the bride page, hover any feature film thumbnail (it auto-plays muted as a preview). Click to open the lightbox.
7. Reels (vertical 9:16) sit below in their own grid — each has a **Play** and **Save** pill. Save uses iOS native share sheet on iOS Safari, falls back to opening the video in a new tab elsewhere.

## Switching from prototype to production

`scripts/store.js` is the only file that talks to data. To swap localStorage for Supabase:

```js
// in store.js, replace the body of PortalStore.list/get/create/update/remove/addVideo/removeVideo
// with awaited Supabase calls. Everything else (admin.html, client.html) stays as-is.
```

The schema implied by the prototype:

```
portals (
  id, slug, bride, partner, date,
  cover, highlight, full,
  created_at
)
videos (id, portal_id, title, date, url, thumb)
```

## What's still loose / decisions to confirm

- **Save-to-phone**: today this uses `navigator.share` with a fetched file (works on iOS Safari for direct `.mp4`s; CORS must allow it). For Vimeo/Drive embeds we fall back to opening the source — those services don't allow direct download. Tell me if you want a download proxy.
- **Cover photo upload**: the form takes a URL, not a file. If you want drag-and-drop upload to Supabase Storage, I'll wire it.
- **Auth**: a single shared password is fine for a studio portal but anyone who has the link can see the films. If you want per-bride access codes, say the word.
- **Vendor portal**: this kit is bride-side only. The vendor-share site is a separate kit (`ui_kits/vendor-share/`) — not built yet.
