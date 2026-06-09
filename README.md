# Ocean Slice Aquarium

A lightweight React Three Fiber aquarium designed for static hosting on a subdomain.

## Local development

```powershell
npm install
npm run prepare-assets
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
