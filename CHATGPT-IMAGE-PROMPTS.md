# ChatGPT image prompts — ZICA Creative Quest

**Before each prompt:** attach the **official ZICA logo** and a **screenshot of the ZICA Pune website**, so ChatGPT matches the real brand colours. Then paste the prompt.

**Every word on the certificate is printed by the code** (name, title, date, ID, signatory). The background art must contain **no text, no letters, no logos, no signatures, no seals**. That is what makes each certificate correct for each student.

---

## 1. Certificate background — light (recommended, prints well)

```
Create a premium certificate background, A4 landscape, 3:2 wide image, high resolution.
Match the colour palette of the attached ZICA logo and ZICA Pune website.

Style: elegant, modern, cinematic creative-arts institute. Warm ivory / off-white paper base
with a very subtle paper texture. Decorative border: a thin dark navy outer frame and a fine
gold inner frame. Corner accents inspired by a 3D software viewport (matching the ZICA Pune visit deck):
a faint cyan perspective floor grid, a thin wireframe torus and cube, small amber
diamond-shaped keyframe markers along a timeline line at the bottom edge, and a soft
glow in selection orange (#FF7A1A), keyframe amber (#FFB547) and active cyan (#5CE1E6).
Keep all decoration within the outer 12% of the image.

KEEP THESE AREAS COMPLETELY EMPTY (plain ivory):
- the entire centre band (from 20% to 75% of the height, 15% to 85% of the width)
- top-left corner area (space for a logo)
- the bottom strip (bottom 22% of the height) except the border

ABSOLUTELY NO text, letters, numbers, words, logos, seals, stamps, signatures, ribbons with
writing, QR codes or people. Flat, front-on, no perspective, no mock-up, no shadows around
the page.
```

Save it as **`certificate-bg.jpg`**. Crop or resize to 3508×2480 (or 2339×1654) and keep it under 700 KB. Leave the setting `cert_theme` = `light`.

## 1b. Certificate background — dark (screen-first)

Use the same prompt as 1, replacing the style paragraph with:

```
Style: graphite viewport background (#0D0E13) with a faint cyan perspective grid, a soft
selection-orange glow top-right and a cyan glow bottom-left, fine amber (#FFB547) double
border, thin wireframe shapes and amber keyframe diamonds near the edges only.
```

Then set `cert_theme` = `dark` in the Settings tab and run `SheetsSync.gs → pushSettingsToSupabase`.

---

## 2. ZICA avatar — 3 matching poses

**If ZICA already has an official avatar or mascot, attach it and say "keep this exact character".**
Otherwise, generate the first pose, approve it, then ask for the other two with *"same character, same outfit, same style"*.

**Pose A — name screen, save as `avatar-hello.png`**
```
3D animated-film style character, a friendly Indian college student (around 18–20) with a
creative vibe: casual graphite-grey hoodie with an orange (#FF7A1A) accent, headphones around the
neck, sneakers. Full body, standing, warm smile, waving hello with one hand. Soft cinematic
rim light in cyan, warm amber key light. Clean 3D render, Pixar-like quality.
TRANSPARENT BACKGROUND (PNG), no floor, no shadow, no text, no logo on the clothes.
Vertical image, character centred with a little empty space around.
```

**Pose B — contact form, save as `avatar-point.png`**
```
Same character, same outfit and style as the attached image. Full body, excited expression,
pointing with one hand towards the right side of the image (as if pointing at a form).
TRANSPARENT BACKGROUND, no text, no shadow.
```

**Pose C — certificate offer, save as `avatar-certificate.png`**
```
Same character, same outfit and style. Proudly holding up a rolled certificate tied with a gold
ribbon in one hand, big smile, small golden sparkles around. TRANSPARENT BACKGROUND,
no readable text anywhere, no shadow.
```

Optional: ask for a female version of the same set ("same style and outfit colours, female
student, long hair in a ponytail") and use whichever fits the campaign.

---

## 3. Optional page background (behind the quiz)

```
Ultra-wide cinematic dark background for a creative-arts website, 16:9. Near-black base, a
glowing circular portal of light in the centre-left, floating 3D geometric shapes (cube, sphere,
ring), a faint cyan perspective grid floor, soft orange, amber and cyan volumetric light, a few amber
particles. Lots of dark empty space in the middle for text. No text, no logos, no people.
```

Save as `bg.jpg`, upload it to `assets/img/`, then set `bg_image_url` = `assets/img/bg.jpg`.

---

## Tips

- If ChatGPT sneaks text into the art, reply: *"Remove every letter and word, keep everything else identical."*
- Transparent PNG: if the background comes out white, ask *"export again with a transparent background"*, or use any background remover.
- Compress before uploading: tinypng.com / squoosh.app. Large images slow the site and the PDF.
