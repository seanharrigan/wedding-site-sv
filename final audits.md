# Final audits

Reference notes only. No recommendations in this document have been implemented as part of these audits.

## Production, UX and consistency audit

### Summary

The site has a strong visual foundation: the mocha, cream and olive palette, typography pairing, and invitation-led entrance feel cohesive. The main production risks are reliability, interaction state, asset weight and CSS complexity rather than the overall design direction.

### Verified passes

- JavaScript parses successfully.
- No syntax or whitespace errors were found in tracked changes at the time of review.
- All 24 referenced image assets existed.
- All 165 `data-i18n` keys used by the page had English and Spanish translations.
- The browser tab title was `Sean and Valeria`.
- Mobile viewport settings and reduced-motion support were present.

### Findings

| Priority | Finding | Why it matters |
| --- | --- | --- |
| Launch blocker | The guest-password flow currently stops at the “under construction” state; only the admin route enters the site. | Guests cannot reach the invitation or site until this is changed for launch. |
| Launch blocker | Check-in shows the thank-you animation even with incomplete fields. It only attempts delivery when the party field has text, and still looks successful if delivery fails. | Incomplete or lost check-ins can appear received. |
| Launch blocker | The password gate is client-side only: hashes and the local-storage access flag ship with the site. | It is a visual gate, not genuine access protection. It is not suitable for protecting guest data. |
| High | The temporary `Animations` navigation item and section remain in the live build. | It makes the navigation feel unfinished. |
| High | CSS is fragile: more than 7,200 lines across the page and overrides, with 1,855 `!important` declarations. | New visual tweaks can unexpectedly undo prior work, especially on mobile, the header, travel accordions and check-in. |
| High | The check-in confirmation has 39 overlapping style rules and references the older `invitation-envelope-closed-*-v1` artwork. | Its envelope/Catrina composition is vulnerable to shifting and can show outdated art. |
| High | The desktop canvas cap is `2016px`, not roughly 70% of a 15-inch MacBook viewport. | The intended 13-inch rule exists, but the large-screen cap needs measured calibration at 100% browser zoom. |
| Medium | The desktop nav has competing responsive font rules, while the temporary Animation link adds another item. | At laptop widths it is vulnerable to crowding and uneven spacing. |
| Medium | Frosted/lens effects use multiple backdrop filters and live pointer animation. | They need a physical iPhone performance check. Reduced-motion support is present. |
| Medium | The check-in custom selects and desktop date picker are themed, but need keyboard, mobile Safari and narrow-width regression testing. | Custom controls have a higher usability/accessibility risk than native controls. |
| Medium | Date constraints are hard-coded around the wedding week. | They must be updated if plans change, and become unusable after the event. |
| Low | The social title currently uses `Sean & Valeria`; the requested wording was “The wedding of Sean Valeria, Tepoztlán, 2026.” | Choose and use one exact public wording across Open Graph, Twitter and metadata. |
| Low | The favicon uses the 1200×630 social preview image. | A dedicated square favicon will render more crisply in browser tabs. |
| Low | The repository contains roughly 350 MB of tracked art, including large variants. | It makes future deployment and maintenance less manageable, even though not every file is downloaded by visitors. |

### Recommended implementation order

1. Remove the temporary Animation section and navigation link.
2. Decide the guest access flow, then make the password gate match it.
3. Validate check-in fields before showing success, send only complete submissions, and distinguish delivery failure from success.
4. Update the confirmation envelope to current desktop/mobile artwork.
5. Consolidate CSS before more visual polish, especially header, check-in, travel accordions and mobile title rules.
6. Calibrate the desktop canvas at measured 13-inch, 15-inch and wide-monitor viewports.
7. Run final device QA on iPhone Safari, desktop Chrome and desktop Safari.

## Mobile loading and scrolling performance audit

### Conclusion

The slow mobile experience is primarily caused by image weight and short-lived caching, not an unhealthy GitHub Pages server.

The live HTML reached first byte in approximately 0.12 seconds. The inconsistent behaviour matches a cold-versus-warm cache pattern: GitHub Pages serves the tested HTML, CSS and assets with `cache-control: max-age=600`, so a phone may need to revalidate/download large resources again after about ten minutes or after iOS clears storage.

### Main causes

- The intro can download the closed envelope plus both English and Spanish open-invitation PNGs: roughly **9 MB** combined.
- Both language invitation images are present in the page. CSS hides one visually, but that does not reliably prevent it being downloaded and decoded.
- The English open invitation is marked high priority despite not being immediately visible.
- Each large travel image is roughly **2.4–3.2 MB**. Opening “Where to stay” can introduce around **11 MB** of neighbourhood photos.
- The page references about **40 MB** of image assets overall.
- The site has many full-screen `backdrop-filter`, mask, shadow, clip-path and animation rules. These are secondary to the downloads, but can make scrolling less smooth while images decode.

### Measured live delivery examples

| Resource | Transfer size | Measured total time |
| --- | ---: | ---: |
| Home HTML | 44.6 KB | 0.14 s |
| Main stylesheet | 334.6 KB | 0.47 s |
| Closed mobile envelope | 2.68 MB | 0.97 s |
| English mobile invitation | 3.23 MB | 1.44 s |
| Spanish mobile invitation | 3.08 MB | 0.80 s |
| Tepozteco mobile/travel image | 3.01 MB | 0.66 s |

These measurements were from a fast connection. A cold phone connection will be considerably slower, particularly while the browser decodes several PNGs.

### Not primary causes

- The Catrina frames are small: approximately 280 KB total.
- The site’s JavaScript is approximately 82 KB.
- Hosting latency is not the main issue.

### Recommended performance work

1. Create high-quality WebP or AVIF versions of large phone images, retaining PNG only where it is truly needed.
2. Load only the selected language’s open invitation after language selection; do not place both versions in the initial download path.
3. Defer hidden invitation artwork and use asynchronous decoding for non-critical imagery.
4. Create dedicated smaller mobile files for Travel and neighbourhood photos.
5. Reduce full-screen frosted/filter work on mobile while scrolling.
6. Consider a service worker or CDN layer for stronger repeat-visit caching; GitHub Pages currently gives these assets a ten-minute cache lifetime.

### Performance target

Reduce the initial mobile image transfer from roughly **9–10 MB** to under **2 MB**, while keeping later images lazy-loaded. This should make cold first opens substantially faster without changing the visual direction.
