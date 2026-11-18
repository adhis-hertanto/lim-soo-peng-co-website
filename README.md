# Lim Soo Peng & Co LLC: website

One-page static site. Semantic HTML, CSS custom properties, vanilla JS. No build step.

## Run locally
```
python3 -m http.server 8000
```
Open http://localhost:8000. Any static server works. (Use a server, not `file://`, so fonts load.)

## Deploy
Upload the folder as is (Netlify, Vercel, any static host). Publish directory: the project root.
Do not deploy `reference/`, `tools/` or `brand/fonts/source/` if you want a lean site; they are not referenced by the page.

## Structure
`library/` tokens, components and COMPONENTS.md; `index.html`, `privacy-policy.html`, `terms-of-use.html`; `scripts/`; `assets/`; `brand/`; `reference/` (design handoff, frames, copy, design system); `notes/` (decisions, pending client items). See `CLAUDE.md` for project rules.

## Images
Originals in `reference/source-images/`. Regenerate WebP and JPEG sets with `python3 tools/optimise-images.py` (needs Pillow).
