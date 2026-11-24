# Character watermark cleanup

The root `character-animation.mp4` and all 62 production WebP frames have been
refreshed to remove the embedded MINIMAX / Hailuo AI corner lettering. The
watermarked source remains available in Git history before this change.

The video keeps its 2944 × 1248 dimensions, 24 FPS, 124 frames, 5.166667-second
duration, and original audio. The production frames still use 736 × 312, 12 FPS,
and the existing sequence boundaries. No poses or movements were generated.

## Repair method

The built-in image generation tool repaired a stationary 848 × 320 crop of the
laptop corner, desk, and background. The resulting plate is saved at
[`scripts/assets/character-corner-clean.png`](../scripts/assets/character-corner-clean.png).
FFmpeg composites that plate only over a mask of the original bright lettering,
with a small feather at the mask edge. The face, hands, and other animation areas
are outside the repair mask. Video re-encoding can introduce small compression
differences elsewhere; the source's framing and timing are preserved.

The mask is calibrated for this specific supplied clip, not arbitrary footage.
The reconstructed background behind the lettering is an approximation. It was
reviewed across the original six animation sequences.

To reproduce from an original watermarked copy stored at a separate path:

```sh
npm run character:clean -- /path/to/original-watermarked.mp4
npm run character:extract
```

The cleanup script checks dimensions, frame count, frame rate, and duration before
replacing the output. Ordinary frame extraction now uses the already cleaned
root MP4. Animation asset URLs include `?v=clean-1` so cached watermarked frames
and the reduced-motion poster are refreshed. The player, interaction zones,
timing, and lazy-loading architecture are preserved.

The cleaned WebP payload is 441,168 bytes, plus a 5,923-byte manifest. The MP4
is 4,117,081 bytes and remains outside the website's runtime downloads.

## Verification

- Source dimensions, frame count, frame rate, exact video-stream duration, and
  all sequence metadata match the original. The copied audio has the same SHA-256.
- A scan of the original watermark region across all 124 frames found no pixels
  above the lettering brightness threshold after repair. Samples across the six
  sequences and the actual rendered browser canvas were also reviewed.
- Build, lint, TypeScript, and all 16 existing character browser regression
  groups pass against the production build. Checks include the versioned URLs,
  actual left/right canvas pixels, rapid reversals, five viewport sizes, mobile
  scrolling, pause/resume, and the reduced-motion poster.

## Final image-editing prompt

> Use case: precise-object-edit. Input image 1 is the edit target: an exact 848 × 320 crop of the bottom-right corner of a video. Remove only the white MINIMAX symbol and lettering, white vertical separator, and Hailuo AI symbol and lettering. Reconstruct the obscured small parts of the muted grey-brown laptop lid, its existing sharply defined right edge and lower edge, the warm wooden desk, and the nearly black background. Keep the same exact crop, dimensions, framing, perspective, lighting, colours, focus, laptop geometry, desk edge, and all other visible pixels as closely as possible. In particular keep the laptop's sloping right edge and bottom edge fixed in position, and preserve the straight slanted front edge of the desk across the bottom. Output the same 848 × 320 landscape crop. No logo, lettering, watermark, blur rectangle, added objects, camera changes, or new texture. This output will be used only to repair the watermark pixels in the existing video.
