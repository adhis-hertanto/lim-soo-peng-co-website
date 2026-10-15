# Lim Soo Peng & Co LLC: website

One-page static site. Semantic HTML, CSS custom properties, vanilla JS. No build step.

## Run locally
```
python3 -m http.server 8000
```
Open http://localhost:8000. Any static server works. (Use a server, not `file://`, so fonts and the map script load.)

## Google Maps key
1. Copy `config.example.js` to `config.js` and replace `GOOGLE_MAPS_API_KEY` with your key (Maps JavaScript API enabled). `config.js` is git-ignored.
2. Restrict the key to your domain (HTTP referrers) in Google Cloud.
Without a key, the map shows the address and a "View on Google Maps" link.

## Deploy
Upload the folder as is (Netlify, Vercel, any static host). Publish directory: the project root.
Create `config.js` on the host, for example as the build command (set `GOOGLE_MAPS_API_KEY` as an environment variable):
```
echo "window.LSP_CONFIG={GOOGLE_MAPS_API_KEY:\"$GOOGLE_MAPS_API_KEY\"};" > config.js
```
If `config.js` is absent the page still works (404 on that script, map falls back).
Do not deploy `reference/`, `tools/` or `brand/fonts/source/` if you want a lean site; they are not referenced by the page.

## Structure
`library/` tokens, components and COMPONENTS.md; `index.html`, `privacy-policy.html`, `terms-of-use.html`; `scripts/`; `assets/`; `brand/`; `reference/` (design handoff, frames, copy, design system); `notes/` (decisions, pending client items). See `CLAUDE.md` for project rules.

## Images
Originals in `reference/source-images/`. Regenerate WebP and JPEG sets with `python3 tools/optimise-images.py` (needs Pillow).
