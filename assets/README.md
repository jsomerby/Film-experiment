# Landing page hero video — assets & how to finish

The hero loop was generated on **Higgsfield (Kling 3.0, multi-shot, 1080p, silent)** as a
single stitched montage: **whiskey barrel pour → juniper berries in a hand-crank grinder →
hand-picking chamomile**, warm golden-hour grade, no faces, rugged waxed-canvas wardrobe.

Two orientations were produced:

| Use | Aspect | Source resolution | Higgsfield job ID |
|-----|--------|-------------------|-------------------|
| Desktop hero | 16:9 | 1920×1080 | `c4909940-5c23-4f32-b40a-4587f2ad2b95` |
| Mobile hero  | 9:16 | 1080×1920 | `efd85b14-f932-4fc2-ab38-734fc91efc4e` |

> This sandbox can't reach the Higgsfield CDN (network egress is allow-listed), so the raw
> files aren't committed here. **Download both clips from your Higgsfield library**, then run
> the encode step below and drop the outputs into `assets/video/` and `assets/img/`.

## Why 1080p and not 4K (the SEO answer)

A full-screen *background* loop should be **1080p**, not 4K. A 4K hero balloons to 15–30 MB+,
which wrecks Largest Contentful Paint and Core Web Vitals — and Google uses those as ranking
signals, so 4K would actively *hurt* SEO. 1080p with good compression stays razor-sharp on
virtually every display while keeping the page fast. The **poster image** (not the video) is
the LCP element, so it's preloaded with `fetchpriority="high"`.

## Encode step (run locally; needs ffmpeg)

From the folder containing the two downloaded source files (`desktop-src.mp4`, `mobile-src.mp4`):

```bash
# --- Desktop 16:9 ---
# H.264 MP4 (universal fallback)
ffmpeg -i desktop-src.mp4 -an -c:v libx264 -profile:v high -crf 24 -preset slow \
  -pix_fmt yuv420p -movflags +faststart assets/video/hero-desktop.mp4
# WebM (VP9, smaller; served first)
ffmpeg -i desktop-src.mp4 -an -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 \
  assets/video/hero-desktop.webm

# --- Mobile 9:16 ---
ffmpeg -i mobile-src.mp4 -an -c:v libx264 -profile:v high -crf 24 -preset slow \
  -pix_fmt yuv420p -movflags +faststart assets/video/hero-mobile.mp4
ffmpeg -i mobile-src.mp4 -an -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 \
  assets/video/hero-mobile.webm

# --- Poster (LCP element): grab the first frame of the desktop clip ---
ffmpeg -i desktop-src.mp4 -frames:v 1 -q:v 2 assets/img/hero-poster.png
#   then convert to WebP (cwebp from libwebp):
cwebp -q 80 assets/img/hero-poster.png -o assets/img/hero-poster.webp
```

`-an` strips audio (the loop is silent anyway). Target ~2–5 MB per MP4; nudge `-crf` up
(higher = smaller) if a file is heavier than that.

## Wiring

`/index.html` is a drop-in demo of the hero. The `<video>` already has the correct
production attributes (`autoplay muted loop playsinline preload="metadata" poster=...`),
serves the mobile encode to portrait viewports via `<source media>`, and falls back to the
still poster for `prefers-reduced-motion` users. Lift the `.hero` block into your real site.

## Regenerating

To re-roll a scene or tweak the look, re-run the Kling 3.0 multi-shot generation with the
same prompt (warm golden-hour, no faces, waxed canvas; whiskey from the bunghole on the
**long side** of the barrel) and a new start frame.
