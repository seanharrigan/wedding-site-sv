# Invitation V8 — Restart From Originals and Remove All Text

## Purpose

Create a completely clean invitation-suite base from each untouched original image. Do not use V2, V3, V4, V5, V6, or V7 as an input or visual reference. Repeated image-generation passes have introduced unwanted changes, so each V8 edit must begin directly from its corresponding `-original.png` file.

The only requested edit is the removal of every textual or letterform element. Everything else must remain exactly as it appears in the original source.

## Source and output files

Make four separate edits. Use only the corresponding original file as Image 1 and save a new V8 file. Never overwrite, rename, crop, or alter an original.

- `invitation-en-desktop-original.png` → `invitation-en-desktop-v8.png`
- `invitation-en-mobile-original.png` → `invitation-en-mobile-v8.png`
- `invitation-es-desktop-original.png` → `invitation-es-desktop-v8.png`
- `invitation-es-mobile-original.png` → `invitation-es-mobile-v8.png`

Preserve the exact source dimensions:

- Desktop: 1672 × 941 pixels
- Mobile: 941 × 1672 pixels

## Image-editing prompt

Use case: precise-object-edit

Asset type: blank master wedding invitation-suite image

Input image: Image 1 is the sole edit target and must be the corresponding untouched `-original.png` file. Do not use any later version as an input, reference, or source.

Primary request: Remove every visible letter, word, number, punctuation mark, and typographic or monogram element from every paper card in Image 1. This includes all wording on the large central cream invitation, all lettering on the olive-green card, all title/date/time lettering on the dark brown card, and the `SV` monogram on the small cream card. After the edit, every card face must be completely blank inside its decorative or embossed border.

Surface reconstruction: Reconstruct only the former text and monogram footprints using seamless samples of the exact local paper beneath and immediately surrounding each mark. Match each card's existing colour, paper grain, embossed texture, lighting, highlights, shadows, depth, and perspective. The cleared areas must look like untouched blank paper—not erased, blurred, cloned, smeared, softened, flattened, or patched.

Photograph lock: Preserve both photographs exactly as they appear in Image 1. Do not regenerate, repaint, replace, retouch, crop, scale, rotate, warp, sharpen, soften, relight, recolour, or reinterpret either photograph. Preserve the people, faces, bodies, clothing, scenery, and every photographic detail exactly. Preserve both Polaroid frames, apertures, borders, positions, angles, overlaps, lighting, and shadows.

Absolute preservation lock: Outside the precise footprints of the removed lettering and monogram, keep Image 1 unchanged. Preserve every card's shape, silhouette, scale, angle, placement, embossed border, paper texture, colour, highlight, shadow, and overlap. Preserve the envelope, folds, lace cut-outs, scallops, background, foliage shadows, crop, spacing, composition, perspective, depth, colour palette, and lighting. Do not add, remove, move, redraw, clean up, enhance, beautify, simplify, or redesign any physical element.

Avoid: any replacement wording, letters, numbers, punctuation, logos, monograms, symbols, decorations, watermarks, invented objects, altered photographs, changed card geometry, changed paper colour, damaged embossed borders, flat texture patches, blur, smearing, or any modification outside the original text footprints.

## Required workflow

Treat the four source images as four independent surgical edits. Do not create one layout and crop or reflow it for the others. Do not transfer pixels or design decisions between English and Spanish or between desktop and mobile. Each V8 must preserve the unique composition of its own original source.

## Mandatory rejection checklist

Reject an output unless every answer is yes:

1. Was the corresponding untouched `-original.png` the only source image?
2. Is every card face blank, including the central cream card, green card, brown card, and small former-SV card?
3. Are all letters, numbers, punctuation marks, and monogram letterforms removed?
4. Do the cleared areas retain continuous, natural paper grain and matching light without blur, smears, or flat patches?
5. Are both photographs pixel-faithful to the original source, with no AI reinterpretation or retouching?
6. Are the Polaroid frames, cards, envelope, embossed borders, lace, shadows, background, composition, and palette unchanged?
7. Does the output retain the exact source dimensions and aspect ratio?
8. Does a blink comparison show changes only where text or the `SV` monogram previously appeared?
