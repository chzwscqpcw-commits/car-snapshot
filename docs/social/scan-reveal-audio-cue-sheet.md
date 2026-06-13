# Scan Reveal — audio cue sheet

For `docs/social/scan-reveal.html` (flagship "scan reveal" format).
**Loop length: ~10.5s** — make the WAV 10,500 ms for a seamless loop.

This reel uses a **digital / UI** body palette (no engine sounds — there's no car
turning over). Keep the **shared brand layer** identical to every other reel:
the scan whoosh, the end-card sting, and the ambient bed (see the brand guide,
§8 "Audio — the sonic signature").

| Time | On-screen event | Sound | Layer / source |
|------|-----------------|-------|----------------|
| 0.00s | Plate area, ambient | low ambient/musical bed | **shared bed** |
| 1.00–1.35s | Reg **types in** (8 chars) | fast soft **key clicks**, one per character | per-reel (new) |
| ~1.41s | Reg locks (glow up) | tiny **confirm blip** | per-reel (new) |
| **1.70s** | **Scan beam** sweeps down | **electric scan whoosh + low hum** | **shared brand sound** (reuse `Sound Effects/mixkit-speeding-swoosh-1484.wav`) |
| 2.05s | Vehicle identified (Ford Fiesta · 2019) | soft "data found" tone | per-reel (new) |
| 2.30s | Row 1 — MOT | data blip (pitch step 1) | per-reel (new) |
| 2.56s | Row 2 — Tax | data blip (pitch step 2) | per-reel (new) |
| 2.82s | Row 3 — Mileage | data blip (pitch step 3) | per-reel (new) |
| 3.08s | Row 4 — ULEZ | data blip (pitch step 4) | per-reel (new) |
| 3.34s | Row 5 — Value | data blip (pitch step 5) | per-reel (new) |
| 3.70s | Scan "Done" (turns emerald) | **complete chime** (resolve) | per-reel (new) |
| 4.10s | "All of it. Free." | light positive accent | per-reel (new) |
| 6.40s | Screen powers down (HUD off) | soft **power-down** whoosh | shared (matches Metro power-down) |
| **6.95s** | Bolt drives in | **brand end-sting** (electric zap) | **shared brand sting** |
| 7.45s | "Free Plate Check" resolves | chime tail | shared brand sting |
| 7.5–10.5s | Hold on brand → loop | ambient tail | shared bed |

Notes:
- The 5 row blips should **rise in pitch** — a satisfying "data populating" build.
- The data blips/keys are *soft and clean*, not frantic (brand: confident, not hyperactive).
- Sounds to source (free, e.g. mixkit/UI packs): key clicks, UI blips, confirm
  chime, power-down. The scan whoosh and end-sting come from the shared layer.
