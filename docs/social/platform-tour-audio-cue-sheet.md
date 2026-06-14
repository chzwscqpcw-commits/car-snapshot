# Platform Tour — audio cue sheet

For `docs/social/platform-tour.html` (VO-led walkthrough template).
**Total length: 31.0s.** This reel is **VO-led**, so unlike the looping reels the
audio is a **single take, not a seamless loop** — the bed/blips sit *under* your
narration. Build the bed track at **31,000 ms** to cover the full reel.

This uses a **digital / UI** diegetic palette (no engine sounds — it's a product tour).
Keep the **shared brand layer** identical to every other reel: the scan whoosh, the
end-card sting, and the ambient bed (brand guide §8 "Audio — the sonic signature").

## Layering (three stems, mixed down to one WAV)

1. **Voice-over** — your recorded narration (see `platform-tour-vo-script.md`), the lead.
   Mix it **on top**, ~-3 dB; duck the bed under it.
2. **Shared brand layer** — bed + scan whoosh + end-sting (identical across all reels).
3. **Per-reel UI blips** — soft data sounds as each tool scene lands (rising pitch).

### The bed (carries the gaps + the end-card hold)

The assembler synthesises **three bed options** (all 31s, in C major to sit with the
blips/end-sting) — audition them by ear in the "Platform Tour" preset:
- **Ambient pad** — calm, breathing drone. *On by default.* This is the baseline bed
  and the shared "low calm pad" of the brand sonic signature (guide §8).
- **Sub-pulse (~84bpm)** — soft lub-dub heartbeat for gentle forward motion. Loads at
  gain 0; raise to taste.
- **Arp motif** — soft C–E–G–C plucks with reverb shimmer. Loads at gain 0; raise to taste.

Keep whichever bed combo you choose **well under the VO** (~-18 to -22 dB). The pad
alone is the safe, on-brand default; pulse/arp add momentum if a section feels static.

## Timeline

| Time | On-screen event | VO line | Sound | Layer / source |
|------|-----------------|---------|-------|----------------|
| 0.00s | Plate area, ambient | — | low ambient/musical bed (ducked) | **shared bed** |
| 0.5–4.0s | Hook + reg **types in** | L1 "Every car… free." | fast soft **key clicks** under the typing | per-reel (reuse scan-reveal keys) |
| **4.3s** | **Scan beam** sweeps | L2 "Type any plate…" | **electric scan whoosh + low hum** | **shared brand sound** (`Sound Effects/mixkit-speeding-swoosh-1484.wav`) |
| 4.7s | Vehicle identified | (L2 tail) | soft "data found" tone | per-reel |
| 7.4s | MOT scene lands | L3 "Its full MOT history…" | UI blip (pitch step 1) | per-reel |
| 11.1s | Mileage scene | L4 "…been clocked." | UI blip (pitch step 2) | per-reel |
| 11.9–12.4s | Clocked row + flag appear | (L4 tail) | soft **warn tick** (low, not alarmist) | per-reel |
| 14.9s | ULEZ scene | L5 "ULEZ-compliant…" | UI blip (pitch step 3) | per-reel |
| 18.7s | Valuation scene + £ counts up | L6 "…actually worth — today." | **count-up tick** rising to a soft resolve chime at settle | per-reel |
| 22.5s | Free close | L7 "No signup, no email…" | light positive accent | per-reel |
| 26.8s | Screen powers down (HUD off) | — | soft **power-down** whoosh | shared (matches Metro/scan power-down) |
| **27.0s** | Bolt drives in | — | **brand end-sting** (electric zap) | **shared brand sting** |
| 27.5s | "Free Plate Check" resolves | (opt. soft tag) | chime tail | shared brand sting |
| 27.5–31.0s | Hold on brand end | — | ambient tail | shared bed |

## Notes

- **Duck the bed and blips under the VO** — narration is the message here; everything
  else supports it. The blips should be *felt*, not heard over the voice.
- The clocking warn tick is **low and matter-of-fact** — we inform, we don't manufacture
  fear (brand guide §1, §9).
- The count-up tick + resolve chime should peak as the £ value settles (~20.2s).
- Source the UI blips/keys/power-down free (mixkit/UI packs); the **scan whoosh and
  end-sting come from the shared layer** so the post is recognisably Free Plate Check.
- In the soundtrack assembler, add a **"Platform Tour"** cue-sheet preset mirroring this,
  or — simplest — export a 31s bed+stings stem and lay your VO over it in the editor.
