---
name: github-brand
description: GitHub brand design system for presentations — dark-mode-first, developer-friendly, bold and modern.
---

# GitHub Brand Design System

When creating or styling PowerPoint slides, follow these design guidelines for a GitHub-branded look — dark, bold, and developer-friendly.

## Color Palette

| Role            | Hex      | Usage                              |
|-----------------|----------|------------------------------------|
| Background Dark | 0D1117   | Primary slide background           |
| Background Mid  | 161B22   | Card/section backgrounds           |
| Surface         | 21262D   | Elevated containers, callout boxes |
| Border          | 30363D   | Borders, dividers, table lines     |
| Primary Text    | F0F6FC   | Headings, body text on dark bg     |
| Secondary Text  | 8B949E   | Captions, subtle info              |
| Accent Blue     | 58A6FF   | Links, primary accents             |
| Accent Green    | 3FB950   | Success, positive indicators       |
| Accent Orange   | D29922   | Warnings, highlights               |
| Accent Red      | F85149   | Errors, negative indicators        |
| Accent Purple   | BC8CFF   | Secondary accent, tags             |
| White           | FFFFFF   | Text on colored backgrounds        |

## Typography

- **Title slides:** fontSize 40–48, bold, color `F0F6FC`
- **Section headers:** fontSize 30–36, bold, color `58A6FF`
- **Slide headings:** fontSize 24–28, bold, color `F0F6FC`
- **Body text:** fontSize 16–18, color `F0F6FC`
- **Captions / footnotes:** fontSize 12–14, color `8B949E`
- **Code snippets:** fontSize 14, fontFace `Cascadia Code` or `Courier New`, color `F0F6FC`, background fill `161B22`
- **Font family:** Prefer Mona Sans, fall back to Segoe UI or Inter.

## Layout Principles

- **Slide background:** Set slide background fill to `0D1117`.
- **Format:** Always use 16:9 format with 10x5.625 inches
- **Title position:** x: 0.7, y: 0.4, w: 8.6, h: 0.9
- **Subtitle position:** x: 0.7, y: 1.3, w: 8.6, h: 0.6
- **Body content area:** x: 0.7, y: 2.0, w: 8.6, h: 4.5
- **Two-column layout:** Left column w: 4.0, right column x: 5.5, w: 4.0
- **Generous spacing** between elements — let the dark background breathe.

## Shapes & Accents

- Use a gradient accent bar at the top of slides: rect shape at y: 0, h: 0.06, full width, fill `58A6FF`.
- Rounded rectangles for cards with fill `21262D`, border color `30363D`, corner radius where supported.
- Use `58A6FF` accent circles for numbered steps or icons.
- Octocats and GitHub logos can be referenced but avoid embedding external images unless a URL is provided.

## Tables

- Header row: fill `21262D`, color `F0F6FC`, bold, fontSize 14
- Body rows: alternating fills `0D1117` and `161B22`, color `F0F6FC`, fontSize 13
- Border: pt 1, color `30363D`

## Charts

- Use the accent color sequence: `58A6FF`, `3FB950`, `D29922`, `F85149`, `BC8CFF`, `8B949E`
- Chart background: transparent or `0D1117`
- Labels and titles: color `F0F6FC`

## Code Blocks

When showing code on slides, use a container with:
- fill `161B22`, border color `30363D`
- Text fontFace `Cascadia Code` or `Courier New`, fontSize 14, color `F0F6FC`
- Add 0.3" internal padding

## Do's and Don'ts

- ✅ Dark background everywhere — this is a dark-theme design
- ✅ High contrast — use `F0F6FC` text on dark backgrounds
- ✅ Use accent blue (`58A6FF`) sparingly for emphasis
- ✅ Keep slides minimal — one idea per slide
- ❌ Don't use white or light slide backgrounds
- ❌ Don't use more than 2 accent colors per slide
- ❌ Don't use small text — minimum 14pt
