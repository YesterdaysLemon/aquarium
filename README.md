# Ocean Slice Aquarium

A lightweight React Three Fiber aquarium designed for static hosting on a subdomain.

## Local development

```powershell
npm ci
npm run dev
```

## Production build

```powershell
npm run build
docker build -t ocean-slice-aquarium .
docker run --rm -p 8080:80 ocean-slice-aquarium
```

Then open `http://localhost:8080`.

## Assets

The app serves only optimized web assets from `public/assets`. Raw archives and source model formats stay in `models/` and are excluded from Docker builds.

The living-fish pass keeps the original reef and controls, with 53 fish across 10 species (27 fish on narrow screens), Blender-finished models, animated fins, habitat behavior, and surface-following underwater light. New GLBs and model portraits are in `public/assets/living-fish`; the original fish assets and manifest remain as legacy sources.

Run `npm test` for model integrity and deterministic swimming checks. See [Living fish authoring and validation](docs/living-fish.md) for the Blender source and reproduction instructions. Normal development uses the supplied web assets and does not need Blender or `prepare-assets`.

## Planning

- [Lifelike scene plan](docs/lifelike-scene-plan.md) tracks the current visual audit and the next implementation direction for scene realism, environment assets, fish selection, and camera flow.

## Site identity and publishing

Production is https://fish.alirezaafshan.com/ and the creator link points to https://alirezaafshan.com/. Canonical metadata, social cards, structured data, robots.txt, and the sitemap use that production origin. The build prerenders the same credits component used by the app, with a separate canonical URL and readable HTML without JavaScript. The creator link remains a normal HTML anchor on both pages.

Pushes to `main` run the production build, fish checks, and Nginx configuration validation before notifying Deploy Manager. Verify its release receipt and the public build assets before declaring a deployment complete.

## X / Twitter Player Card

The homepage's static HTML advertises a 480 × 480 Player Card pointing to `https://fish.alirezaafshan.com/embed`. Sharing the homepage is the intended entry point. The card has its own square screenshot (`public/player-preview.png`), while Open Graph and the credits page retain the regular social image. No X API key is needed for this metadata.

`/embed` runs the existing aquarium with a compact fish selector, pause, camera, and auto-tour controls. It always uses the low-quality roster and capped pixel ratio, respects reduced motion, and suspends rendering and the tour while hidden or outside the visible frame. The full aquarium opens in a new tab from the card.

Vite builds `embed/index.html` as a second entry. Nginx serves it at `/embed`, normalizes `/embed/` and `/embed/index.html`, and allows framing by the same origin and X/Twitter origins using the HTTP `Content-Security-Policy: frame-ancestors` header. Don't add `X-Frame-Options: SAMEORIGIN` or `DENY` to this route at the proxy/CDN. `/credits` must keep `summary_large_image` metadata and no player tags.

This follows the metadata and framing setup observed in [Tweetcraft](https://tweetcraft.jai.vin/r/ti9bwes4ryguhkra?c=fsk94) and the [X Player Card sample](https://github.com/xdevplatform/cards-player-samples/blob/main/player/page.html). Interactive use is experimental: local iframe behavior does not establish that X will render a card for this domain, or that all X clients will support it. The former Player Card documentation currently redirects to the general developer documentation. After an authorized deployment, check raw homepage metadata as `Twitterbot`, the player/image HTTPS responses, the final framing headers, and playback in actual X clients before describing the in-feed experience as verified. A new query string can provide a fresh share URL if an old card is cached.
