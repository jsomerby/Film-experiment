# New Alchemy Distilling — Apple Brandy Back Labels

Reconstructed back labels rebuilt to the new **2.8" × 3.9" tapered (tumbler) die line**,
re-laid out with **text on the left** and an **etched landscape illustration on the right**.

## Files

| File | Description |
|------|-------------|
| `back-label-18yr.svg` | "18 YEAR" expression (Barreled in 2008) |
| `back-label-23yr.svg` | "23 YEAR" expression (Barreled in 2003) |
| `preview-18yr.png` / `preview-23yr.png` | Raster previews (system serif fallback) |

## Geometry

- viewBox is `0 0 280 390`, where **1 unit = 1/100 inch** (so 280 × 390 = 2.8" × 3.9").
- The die path is the tapered tumbler shape: `M0 0 H280 L268 390 H12 Z`
  (top edge full width, sides drawing in ~0.12" each toward the base).
- A double keyline border follows the same taper.

## Fonts — swap these for your licensed/active families

Everything is set in **three free Google Fonts**, chosen to match the original photos as
closely as possible. The originals read as a classic **Caslon** family (warm, slightly
rustic American old-style serif — *not* a cold modern Didone), so the type system is built
around Caslon. All text is **live/real** (not outlined) and referenced by name, so you can
drop in your licensed equivalents by editing the `.brand` / `.display` / `.body` rules in
each SVG's `<style>` block.

| Role in label | Used here (free Google Font) | Why it matches the originals | Closest paid/active substitutes |
|---|---|---|---|
| Display titles — `APPLE BRANDY`, `18/23 YEAR`, big numerals (`2008`, `750 ML`, `C-37`) | **Libre Caslon Display** | High-contrast Caslon display cut — matches the elegant bracketed serifs of the title | Adobe Caslon, ITC Caslon 224, Big Caslon, Canela |
| Engraved roman caps — `NEW ALCHEMY DISTILLING`, section + spec labels | **Libre Caslon Text** (caps, letter-spaced) | Same Caslon family in a cleaner text weight; matches the refined inscriptional caps | Adobe Caslon SC, LTC Caslon, Copperplate |
| Body copy & fine print — description, producer line, government warning | **EB Garamond** | Old-style Garalde serif, period-correct and legible at tiny sizes | Adobe Garamond, Sabon, Caslon Pro Text |

> The originals are most likely a commercial **Caslon** (e.g. Adobe Caslon / Caslon 540).
> Libre Caslon is the closest free, web-active match. If you license Adobe Caslon, swap the
> `.display` and `.brand` families to it and the labels will track the source almost exactly.

### CSS hooks
In each SVG `<style>` block:
```css
.display { font-family: 'Playfair Display', Georgia, serif; }  /* titles & numerals */
.brand   { font-family: 'Cinzel', 'Times New Roman', serif; }  /* engraved caps    */
.body    { font-family: 'EB Garamond', Georgia, serif; }       /* running text     */
```
Replace the first family in each rule to retypeset the whole label.

## Notes

- The etched landscape on the right is **original line art** (strokes only, no raster),
  so it scales cleanly and prints crisp at any size. Recolor via the `stroke` values
  inside the `translate(158,108)` group.
- Ink color is `#2b2521`; paper is `#f3ead4`. Change these two values to retheme.
- The Google Fonts `@import` is only for on-screen preview. For print/Illustrator,
  install the chosen fonts locally (or convert text to outlines before sending to print).
- Text is live/editable (not outlined) so copy, vintages, barrel numbers and bottle
  counts can be updated directly.
