# Ocean Slice Aquarium

A lightweight React Three Fiber aquarium designed for static hosting on a subdomain.

## Local development

```powershell
npm install
npm run dev
```

## Production build

```powershell
npm run build
docker build -t ocean-slice-aquarium .
docker run --rm -p 8080:80 ocean-slice-aquarium
```

Then open `http://localhost:8080`.

## Reef system

Every swimming creature, the reef terrain, and the underwater shaders are generated directly in Three.js. Thirteen free props from the [Polyfork Coral Reef kit](https://polyfork.dev/kit/coral-reef-a7128a) are loaded from Polyfork's public CDN at runtime; no paid or preview-only assets are copied into this repository.

One scene-wide reef-health value drives the color stress response across both the procedural geometry and Polyfork props. The same material extension adds animated caustics to every reef surface.

Open `/zoo` for an orbitable provenance playground. It displays each of the 13 free Polyfork specimens on a cyan pedestal and each generated creature or scene family on a warm pedestal, with a live reef-health shader control shared by both collections.

The zoo's **anyCreature collection** toggle swaps all seven creature exhibits to locally generated, skinned GLBs built from project-authored specifications with the open-source `anyCreature` compiler. They are evaluation specimens only; the live aquarium fish remain procedural.

## Planning

- [Coral Bloom implementation](docs/coral-bloom.md) records the asset boundary, procedural replacements, and visual validation targets.
- [Polyfork method study](docs/polyfork-method-study.md) records the observed generator contract and the reversible fish construction experiment in the asset zoo.
- [Reef Shark v2 pilot](docs/reef-shark-v2.md) records the pinned anyCreature source, rebuild recipe, output budget, and zoo-only integration boundary.
- [Sea Turtle v1 pilot](docs/sea-turtle-v1.md) records the second anyCreature experiment and why rigid-shell anatomy fits the workflow better.
- [anyCreature collection study](docs/anycreature-collection.md) records the complete seven-creature pass, sequential methodology corrections, export budgets, and remaining tool friction.
