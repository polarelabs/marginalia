# Marginalia

A hand-drawn, pixel-art video player skin for **Video.js v10**, built for the Video.js v10 Skins Design Challenge.

**Live demo:** https://marginalia-nu-six.vercel.app/
**Mux playback ID:** `8gi016wF2YOjW8Z02aFvb73jIwwiXJ8vWe015l02GFlUUUk`

## The idea

Most players hide the video behind chrome. Marginalia treats the video like a print taped into a sketchbook, and treats the controls like notes scribbled in the margin.

- **Play** is a yellow sticky note with a red marker circle that redraws itself on every press.
- **Seek** is a pencil line that gets inked in red as you play. A pixel astronaut rides it, leaves sparks while playing, and hops when you scrub.
- **Volume** is a hand-drawn squiggle that inks in blue.
- **A mascot** slides out from between the two prints to announce what just happened ("Rolling!", "Volume 65%", "Shhh… muted").
- **THE END** is a red rubber stamp that slams onto the screen, with a small shake, when the video finishes.
- **Controls tuck away** two seconds after playback starts. Hover the bottom of the player, press a key, or touch the screen to bring them back.
- **Extras:** playback speed, picture-in-picture, captions (when the video has a track), and a `?` keyboard cheat sheet.

## Built with

Next.js 16, Tailwind CSS 4, `@videojs/react` 10 and `@videojs/mux-video`. Video is hosted on Mux and streamed over HLS. Fonts are Caveat, Patrick Hand and Silkscreen.

Video.js components render no styles of their own. The skin styles them through their `data-*` attributes and CSS variables (for example `--media-slider-fill` drives the red ink on the seek line), so every control is a real Video.js component.

## Accessibility

- Full keyboard control: `Space`/`K` play, `M` mute, `F` fullscreen, `←`/`→` skip 5s, `?` shortcuts, `Esc` closes the cheat sheet.
- A visible two-tone focus ring on every control, readable over bright and dark video.
- Hidden controls reappear on keyboard focus.
- Playback changes are announced to screen readers through Video.js's status announcer.
- Tap targets of at least 44px on phones. Responsive layouts for portrait and landscape.
- `prefers-reduced-motion` turns off the wobble, sparks, slide and zoom animations.

## Run it locally

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. To use your own video, set `PLAYBACK_ID` in `src/components/marginalia/MarginaliaPlayer.tsx` to any public Mux playback ID.

## Files

- `src/components/marginalia/MarginaliaSkin.tsx`: the skin (components, mascot, auto-hide)
- `src/components/marginalia/marginalia.css`: all styling, including mobile and fullscreen
- `src/components/marginalia/SketchDefs.tsx`: SVG filters for the wobbling hand-drawn lines