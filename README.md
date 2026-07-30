# Wildhand — site with in-place admin editing

The public site and its admin editor are the **same page**. `/admin/` renders
the real homepage full-screen and layers editing on top, so admins (Matt & Kim)
see exactly what visitors see:

- **Text** — click any outlined text and retype it right on the page.
- **Images** — click the hero image and pick a replacement from your computer.
- **Save & Publish** — writes the changes so every visitor sees them.

## Run it

```bash
ADMIN_PASSWORD=your-secret node server.js
```

- Site: <http://localhost:8080/>
- Admin: <http://localhost:8080/admin/> (sign in with the password)

No dependencies — any machine with Node.js can run it. Without
`ADMIN_PASSWORD` set it falls back to the dev password `wildhand`.

## How it works

| Piece | Role |
|---|---|
| `index.html` | The public page. Editable regions are marked with `data-edit="key"` (text) and `data-edit-img="key"` (images). |
| `content/content.json` | The single source of truth for editable copy and image URLs. |
| `assets/js/hydrate.js` | On page load, applies `content.json` over the baked-in fallback copy. |
| `admin/index.html` | Login + toolbar. Frames the real page and injects the editor. |
| `admin/editor.js` | Makes `data-edit` regions `contenteditable`, handles click-to-replace images, collects changes. |
| `server.js` | Static hosting plus `POST /api/login`, `/api/save`, `/api/upload`. |

Saving merges the page's edits into `content/content.json` and stores uploaded
images under `assets/uploads/`. The HTML itself is never modified, so a bad
edit can always be undone by fixing (or reverting) `content.json`.

## Making more things editable

Add an attribute, add a default — done. The editor and hydration pick it up
automatically:

```html
<h2 data-edit="shop.heading">Visit the shop</h2>
<img src="assets/img/still.jpg" data-edit-img="shop.photo" alt="The still" />
```

New pages work the same way: include `assets/js/hydrate.js` at the bottom of
the page, and add an admin wrapper that frames it (copy `admin/index.html` and
change the iframe path), so every page gets a matching editable twin.

## Deployment notes

- The site needs the Node server (or any host that can run it — Render, Fly,
  Railway, a VPS) so saves persist. On purely static hosting (GitHub Pages),
  the pages render fine but **Save** has nowhere to write.
- Auth is a single shared password over a bearer token — fine behind HTTPS for
  a two-person team; put it behind a real login if the team grows.
- `assets/uploads/` holds admin-uploaded images; back it up along with
  `content/content.json` — together they are the entire editable state.
