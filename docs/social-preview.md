# Portfolio link preview

The WhatsApp / Open Graph sharing image is
[`public/whatsapp-preview-v1.jpg`](../public/whatsapp-preview-v1.jpg).
It is a 1200 × 630 JPEG (88,795 bytes). Vite copies it into the build root.

`index.html` includes static Open Graph and Twitter Card metadata, with absolute
HTTPS image URLs for the custom domain recorded in `CNAME`:
`https://mekaylad.teodordev.co.za/`. The tags are available in the initial HTML
without executing JavaScript. The metadata follows the
[Open Graph protocol](https://ogp.me/).

Deploy the production build to that domain before testing a new share in WhatsApp.
Local browser checks verify the metadata and image, but do not verify WhatsApp's
actual rendering or refresh an existing preview. For a future replacement, save
the new image with a new versioned filename and update all sharing-image URLs in the
metadata. If the site domain changes, update the canonical, Open Graph URL, and
all sharing-image URLs together.

## Image provenance

Created with the built-in image generation tool, using the existing
`public/animations/character/look-left/frame_0007.webp` as a character reference.
Only the sharing graphic was generated; the portfolio's animation assets were
not modified. The selected output was resized and JPEG-encoded with FFmpeg for
the final web asset.

Final generation prompt:

> Use case: ads-marketing. Asset type: a finished flat WhatsApp / Open Graph link-preview banner for Mekayla DeWee's existing developer portfolio. Create one landscape image, exact canvas 1200 by 630 pixels, approximately 1.9:1 aspect ratio. This is the actual graphic, not a phone mockup or webpage screenshot.
>
> Input image 1 is the visual reference for the portfolio's existing stylized 3D laptop character: preserve her recognizable face, dark ponytail, silver over-ear headphones, pale lavender knitted sweater, and grey open laptop. Use the same character and laptop, with natural proportions, as the visual on the right half. Keep her head and the visible laptop comfortably within the canvas. Do not introduce another person or add props.
>
> Design: professional dark black / very dark aubergine background (#0a0a0a), restrained hot pink (#ff1493) edge lighting and a very faint technical grid, matching a dark-and-pink developer portfolio. Crisp, spacious editorial composition. The left half has large readable modern geometric typography inspired by Orbitron, with generous margins of at least 60px. Type hierarchy strong enough to read at small chat-preview size. The first name is white and surname hot pink. Keep the text and character separate with no overlap. No dense UI, buttons, badges, excessive neon, stock icons, or random code.
>
> Exact text, verbatim, with no extra words: very large two-line name 'MEKAYLA' then 'DEWEE'; a clear smaller subtitle 'JUNIOR SOFTWARE DEVELOPER'; a secondary line 'Java · Spring Boot · React · TypeScript'. Spell MEKAYLA exactly M-E-K-A-Y-L-A and DEWEE exactly D-E-W-E-E. Render all text accurately and legibly. The character illustration should blend into the dark background naturally. A polished, attractive portfolio share card, with a simple composition and strong contrast.
