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
