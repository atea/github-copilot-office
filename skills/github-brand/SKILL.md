---
name: github-brand
description: Official GitHub brand identity for presentations — neutrals + GitHub Green hero color, with Copilot (purple) and Security (blue) theme variants. Sourced from brand.github.com.
---

# GitHub Brand Identity

Use this skill when creating or styling presentations that represent **GitHub**, **GitHub Copilot**, or **GitHub Security**. It is based on the official GitHub Brand Toolkit at <https://brand.github.com>.

The brand should feel **technical, sophisticated, serious, and uncomplicated**. It is anchored around **neutrals** with **GitHub Green** as the singular hero color, used sparingly.

> ⚠️ **Trademark notice.** GITHUB®, the Invertocat, OCTOCAT®, and the Mona Sans wordmark are registered trademarks of GitHub, Inc. Do not modify the logos, do not use them as your own brand, and do not imply affiliation. See <https://brand.github.com/foundations/logo#legal>.

---

## 1. Color

Source: <https://brand.github.com/foundations/color>

### 1.1 Primary palette (use this for all general GitHub content)

GitHub Green is the hero. Most of the canvas should be black, white, or neutral gray; green appears in **small moments** (≈5% of the surface).

| Token         | Hex       | Notes                                              |
|---------------|-----------|----------------------------------------------------|
| GITHUB GREEN  | `#0FBF3E` | Hero accent. Sparingly. Pantone 360.               |
| GRAY 1        | `#F2F5F3` | Lightest neutral, near-white background            |
| GRAY 2        | `#E4EBE6` | Light surface / subtle fill                        |
| GRAY 3        | `#B6BFB8` | Borders, dividers, muted UI                        |
| GRAY 4        | `#909692` | Secondary text on light, mid-contrast              |
| GRAY 5        | `#232925` | Dark surface / card on near-black                  |
| GRAY 6        | `#101411` | Near-black background (use with white text)        |
| BLACK         | `#000000` | Process Black                                      |
| WHITE         | `#FFFFFF` | Primary background or primary text on dark         |
| GREEN 1       | `#BFFFD1` | Tint, illustrations only                           |
| GREEN 2       | `#8CF2A6` | Tint, illustrations only                           |
| GREEN 3       | `#5FED83` | Tint, illustrations only                           |
| GREEN 4       | `#0FBF3E` | = GitHub Green (hero)                              |
| GREEN 5       | `#08872B` | Shade, hover states, dense data                    |
| GREEN 6       | `#0A241B` | Deep green, illustration backgrounds               |

### 1.2 Copilot Theme (use for Copilot-related content — including this add-in)

Anchor on neutrals + GitHub Green; inject **Copilot Purple** as the supporting accent. Recommended proportion:

> **80% Black or White · 10% Neutral · 5% GitHub Green · 5% Copilot Purple**

Purple should sit on neutral backgrounds — never let purple compete with green for attention.

| Token            | Hex       | Notes                                  |
|------------------|-----------|----------------------------------------|
| COPILOT PURPLE   | `#8534F3` | Hero accent for Copilot. Pantone 2685. |
| PURPLE 1         | `#C898FD` | Light tint                             |
| PURPLE 2         | `#B870FF` | Tint                                   |
| PURPLE 3         | `#8534F3` | = Copilot Purple                       |
| PURPLE 4         | `#43179E` | Shade                                  |
| PURPLE 5         | `#26115F` | Deep                                   |
| PURPLE 6         | `#160048` | Deepest                                |
| ORANGE 1         | `#F4A876` | Secondary illustration tint            |
| ORANGE 2         | `#F08A3A` | Secondary illustration                 |
| ORANGE 3         | `#FE4C25` | Secondary illustration                 |
| ORANGE 4         | `#C53211` | Secondary illustration                 |
| ORANGE 5         | `#801E0F` | Secondary illustration                 |
| ORANGE 6         | `#500A00` | Secondary illustration                 |

Oranges are reserved for **illustrations and key art only** — not for typography, UI fills, or chart series in a corporate deck.

### 1.3 Security Theme (use for GitHub Security / GHAS content)

Same structure as Copilot, with **Security Blue** as the accent. Proportion: **80% Black/White · 10% Neutral · 5% Green · 5% Blue**.

| Token            | Hex       | Notes                                  |
|------------------|-----------|----------------------------------------|
| SECURITY BLUE    | `#3094FF` | Hero accent for Security. Pantone 279. |
| BLUE 1           | `#9EECFF` | Light tint                             |
| BLUE 2           | `#3094FF` | = Security Blue                        |
| BLUE 3           | `#1A61FE` | Shade                                  |
| BLUE 4           | `#0527FC` | Deep                                   |
| BLUE 5           | `#212183` | Deeper                                 |
| BLUE 6           | `#001C4D` | Deepest                                |
| LIME 1–6         | `#DCFF96` → `#703100` | Illustration accents only |

### 1.4 Color application rules

- ✅ Default to **black or white slide backgrounds**. Use neutrals (`GRAY 1–6`) for cards and surfaces.
- ✅ Reserve **GitHub Green** for the most important accent on the slide — a single CTA, a key number, an underline, a small graphic device.
- ✅ For Copilot decks, layer **purple over neutral** (not over green). For Security decks, layer **blue over neutral**.
- ✅ Always check contrast. When in doubt, use the **highest contrast** option.
- ❌ Do **not** mix Copilot Purple and Security Blue in the same deck.
- ❌ Do **not** use green and purple/blue side-by-side in the same element — they should support, not compete.
- ❌ Do **not** use orange or lime as primary accents — they are illustration support only.
- ❌ Do **not** invent gradients or tints outside of this palette.

### 1.5 Chart palette

For data viz, build sequences from the palette of the active theme:

- **Core:** `#0FBF3E`, `#232925`, `#909692`, `#08872B`, `#B6BFB8`
- **Copilot:** `#0FBF3E`, `#8534F3`, `#232925`, `#B870FF`, `#909692`
- **Security:** `#0FBF3E`, `#3094FF`, `#232925`, `#1A61FE`, `#909692`

---

## 2. Typography

Source: <https://brand.github.com/foundations/typography>

The brand centers on **Mona Sans** (super family) and **Mona Sans Mono** (code companion). Both are open source: <https://github.com/github/mona-sans>.

### 2.1 Font choices

| Use                                  | Font                                | Fallback chain                              |
|--------------------------------------|-------------------------------------|---------------------------------------------|
| All headings, body, UI text          | **Mona Sans**                       | `Mona Sans, "Segoe UI", Inter, Arial, sans-serif` |
| Code, terminal output, monospace     | **Mona Sans Mono** (or Monaspace)   | `"Mona Sans Mono", Monaspace, "Cascadia Code", "Courier New", monospace` |

Always use the **latest version** of Mona Sans (v2.0+ supports the OPS2 optical-size feature, which auto-tunes letterspacing).

### 2.2 Type scale (PowerPoint, 16:9 / 10 × 5.625 in)

The brand defines three categories: **Title**, **Headline**, **Body**. Sizes below are starting points — adjust for the canvas, but keep the **hierarchy and weight relationships** consistent.

| Role                | Size (pt) | Weight                  | Color (light bg)   | Color (dark bg)   |
|---------------------|-----------|-------------------------|--------------------|-------------------|
| H1 — Title slide    | 48–64     | Mona Sans **Display**   | `#101411`          | `#FFFFFF`         |
| H2 — Section head   | 36–44     | Mona Sans **Bold**      | `#101411`          | `#FFFFFF`         |
| H3 — Slide heading  | 28–32     | Mona Sans **Bold**      | `#101411`          | `#FFFFFF`         |
| H4 — Subheading     | 20–24     | Mona Sans **Medium**    | `#232925`          | `#F2F5F3`         |
| Body Large          | 18–20     | Mona Sans **Medium**    | `#232925`          | `#F2F5F3`         |
| Body                | 14–16     | Mona Sans **Regular**   | `#232925`          | `#F2F5F3`         |
| Caption / footnote  | 11–12     | Mona Sans **Regular**   | `#909692`          | `#B6BFB8`         |
| Code / inline data  | 14        | Mona Sans **Mono**      | `#101411` on `#F2F5F3` card | `#F2F5F3` on `#232925` card |

### 2.3 Typography rules

- ✅ Use Mona Sans **Regular**, **Medium**, **Bold**, and **Display** widths.
- ✅ Bias toward **readability and clear hierarchy**. One H1 per slide.
- ✅ Use Mona Sans Mono only for **code, terminal output, file paths, identifiers**.
- ❌ Do **not** use the other Mona Sans width styles (Condensed, Extended, etc.) — those are reserved for special events like GitHub Universe.
- ❌ Do **not** use Mona Sans Mono for **uppercase multi-line text** — readability gets awkward.
- ❌ Do **not** enable ligatures in headlines or body copy.
- ❌ Do **not** apply manual letterspacing/tracking. Mona Sans v2.0+ handles this via the OPS2 feature.

---

## 3. Logo

Source: <https://brand.github.com/foundations/logo>

Official logo files are bundled with this skill in `references/GitHub Logos/` as SVG, PDF, and PNG. Always prefer **SVG** for slide assets.

### 3.1 Logo inventory (in this skill)

All paths are relative to this skill folder.

#### Invertocat (the cat-mark, on its own)

Use in GitHub-owned environments or where the brand is already established.

| Variant                          | Path                                                                      |
|----------------------------------|---------------------------------------------------------------------------|
| Invertocat — Black               | `references/GitHub Logos/SVG/GitHub_Invertocat_Black.svg`                 |
| Invertocat — White               | `references/GitHub Logos/SVG/GitHub_Invertocat_White.svg`                 |
| Invertocat — Black w/ clearspace | `references/GitHub Logos/SVG/GitHub_Invertocat_Black_Clearspace.svg`      |
| Invertocat — White w/ clearspace | `references/GitHub Logos/SVG/GitHub_Invertocat_White_Clearspace.svg`      |

#### GitHub wordmark lockup (Invertocat + "GitHub" wordmark) — **default for corporate decks**

| Variant                  | Path                                                                  |
|--------------------------|-----------------------------------------------------------------------|
| GitHub Lockup — Black    | `references/GitHub Logos/SVG/GitHub_Lockup_Black.svg`                 |
| GitHub Lockup — White    | `references/GitHub Logos/SVG/GitHub_Lockup_White.svg`                 |
| Black w/ clearspace      | `references/GitHub Logos/SVG/GitHub_Lockup_Black_Clearspace.svg`      |
| White w/ clearspace      | `references/GitHub Logos/SVG/GitHub_Lockup_White_Clearspace.svg`      |

#### GitHub Copilot product lockup — **use for Copilot-themed decks**

The full "GitHub Copilot" wordmark with the Invertocat. Use anywhere Copilot needs distinct identification.

| Variant                          | Path                                                                          |
|----------------------------------|-------------------------------------------------------------------------------|
| GitHub Copilot Lockup — Black    | `references/GitHub Logos/SVG/GitHub_Copilot_Lockup_Black.svg`                 |
| GitHub Copilot Lockup — White    | `references/GitHub Logos/SVG/GitHub_Copilot_Lockup_White.svg`                 |
| Black w/ clearspace              | `references/GitHub Logos/SVG/GitHub_Copilot_Lockup_Black_Clearspace.svg`      |
| White w/ clearspace              | `references/GitHub Logos/SVG/GitHub_Copilot_Lockup_White_Clearspace.svg`      |

#### Copilot icon / Copilot wordmark (no GitHub mark)

Use these only where GitHub's platform context is **already obvious** (e.g. inside github.com, inside the IDE). For external-facing decks, prefer the **GitHub Copilot Lockup** above.

| Variant                          | Path                                                                  |
|----------------------------------|-----------------------------------------------------------------------|
| Copilot Icon — Black             | `references/GitHub Logos/SVG/Copilot_Icon_Black.svg`                  |
| Copilot Icon — White             | `references/GitHub Logos/SVG/Copilot_Icon_White.svg`                  |
| Copilot Lockup — Black           | `references/GitHub Logos/SVG/Copilot_Lockup_Black.svg`                |
| Copilot Lockup — White           | `references/GitHub Logos/SVG/Copilot_Lockup_White.svg`                |

(each also available in `_Clearspace.svg`)

> 📌 **Note from brand.github.com:** As of 2025, GitHub Copilot **no longer has a standalone hero logo**. In any context that clearly relates to GitHub, use the **GitHub Copilot Lockup** (above), not the Copilot icon alone.

PDF and PNG mirrors of every variant exist under `references/GitHub Logos/PDF/` and `references/GitHub Logos/PNG/` — use only when SVG cannot be embedded.

### 3.2 Choosing the right logo

Decision tree for picking a variant:

1. **Is GitHub already obvious from context** (e.g. inside GitHub.com, on a GitHub-owned event stage)?
   → Use the **Invertocat** alone.
2. **Is this a corporate / external presentation about GitHub the company or platform?**
   → Use the **GitHub Lockup** (Invertocat + wordmark). This is the default for most decks.
3. **Is this deck specifically about GitHub Copilot?**
   → Use the **GitHub Copilot Lockup**.
4. **Is this deck specifically about GitHub Security / GHAS?**
   → Use the **GitHub Lockup** + Security Blue accents (no separate Security lockup is required).

### 3.3 Color (which black/white variant to use)

Per the brand: the Invertocat and wordmark should appear in **white, black, or — in rare cases — gray or green**. When in doubt, choose the **highest contrast** option.

| Slide background                         | Use                                       |
|------------------------------------------|-------------------------------------------|
| White (`#FFFFFF`) or near-white          | **Black** logo                            |
| Light gray (`#F2F5F3`, `#E4EBE6`)        | **Black** logo                            |
| Dark gray / black (`#101411`, `#232925`) | **White** logo                            |
| GitHub Green (`#0FBF3E`)                 | **Black** logo (better contrast)          |
| Copilot Purple (`#8534F3`)               | **White** logo                            |
| Security Blue (`#3094FF`)                | **White** logo                            |
| Photographic / busy                      | Avoid — move logo to a clean area first   |

### 3.4 Clearspace and minimum size

Use the `_Clearspace` SVG variants when placing the logo — they include the official padding so the mark doesn't crowd against other elements.

- **Clearspace:** never let other elements enter the bounding box of the `_Clearspace` variant.
- **Minimum size on slides:** the GitHub wordmark lockup should be **≥ 0.4" / 24 px tall**. The Invertocat alone should be **≥ 0.25" / 16 px**. Below those thresholds, switch to the Invertocat-only variant.
- **Maximum size:** the logo should sit high in the visual hierarchy but is rarely the largest element on a slide — let typography or imagery be the hero, and let the logo confirm authorship.

### 3.5 Placement on slides

- **Title slide:** GitHub Lockup centered or top-left, large but not dominant.
- **Content slides:** small lockup or Invertocat in a corner — typically **bottom-left** or **bottom-right**, aligned to the slide margin.
- **Closing / thank-you slide:** lockup centered, mid-to-large.
- **Never** place two GitHub logos on the same slide.
- **Never** place a GitHub logo on a busy photo without a solid backing area.

### 3.6 Logo don'ts (from brand.github.com)

- ❌ Don't rearrange the elements of the logo (mark + wordmark relationship is fixed).
- ❌ Don't use illustrations, mascots, or Mona (the character) as a substitute for the logo.
- ❌ Don't add shadows, glows, gradients, outlines, or any graphic effects.
- ❌ Don't place the logo over busy backgrounds or low-contrast surfaces.
- ❌ Don't recolor the logo outside of black, white, gray, or green.
- ❌ Don't compress, distort, skew, stretch, or rotate the logo.
- ❌ Don't use deprecated logo versions (pre-2025 Copilot logo, pre-2015 Invertocat, etc.).

---

## 4. PowerPoint layout principles

### 4.1 Canvas

- **Format:** 16:9, **10 × 5.625 in**.
- **Default background:** White (`#FFFFFF`) for primary brand decks, or near-black (`#101411`) for the dark variant. Choose one and stay consistent within a deck.
- **Margins:** 0.5"–0.7" gutter on all sides. Generous whitespace is part of the brand feel.

### 4.2 Suggested grid

- **Title position:** `x: 0.7, y: 0.4, w: 8.6, h: 0.9`
- **Subtitle position:** `x: 0.7, y: 1.3, w: 8.6, h: 0.6`
- **Body content area:** `x: 0.7, y: 2.0, w: 8.6, h: 4.5`
- **Two-column:** Left col `w: 4.0`, right col `x: 5.5, w: 4.0`
- **Logo footer slot:** `x: 0.5, y: 5.0, w: 1.5, h: 0.4` (bottom-left) or `x: 8.0, y: 5.0` (bottom-right)

### 4.3 Surfaces, cards, dividers

- **Card on light bg:** fill `#F2F5F3`, border `#E4EBE6` (1 pt), small corner radius (4–8 px equivalent).
- **Card on dark bg:** fill `#232925`, border `#101411` (1 pt).
- **Divider line:** `#B6BFB8` on light, `#232925` on dark, 1 pt.
- **Accent bar:** a 4–8 px high rect filled with `#0FBF3E` (or `#8534F3` for Copilot, `#3094FF` for Security) along the top edge of the slide is an acceptable single accent device — use at most once per slide.

### 4.4 Tables

- Header row: fill `#232925` on dark or `#F2F5F3` on light; bold 14 pt.
- Body rows: alternate `transparent` / 4% surface tint.
- Borders: 1 pt `#B6BFB8` (light) or `#232925` (dark).

### 4.5 Code blocks

- Container fill: `#F2F5F3` (light deck) or `#232925` (dark deck).
- Border: 1 pt matching surface neutral.
- Font: Mona Sans Mono 14 pt (`#101411` on light / `#F2F5F3` on dark).
- Internal padding: 0.3".

---

## 5. Quick recipe — Copilot-themed slide (this add-in's default)

1. **Background:** white `#FFFFFF` (or `#101411` for dark variant).
2. **Logo:** `references/GitHub Logos/SVG/GitHub_Copilot_Lockup_Black.svg` in bottom-left, height ≈ 0.4".
3. **Title:** Mona Sans Display 48 pt, color `#101411`.
4. **Body:** Mona Sans Regular 16 pt, color `#232925`.
5. **One accent device:** either a 6 px **GitHub Green** (`#0FBF3E`) bar at the top, **or** a single key word/number in **Copilot Purple** (`#8534F3`). Not both.
6. **Caption / metadata:** Mona Sans Regular 12 pt, color `#909692`.

That's a textbook on-brand Copilot slide.
