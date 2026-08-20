# Polyfork method study

This note records what the free Coral Reef specimens actually do and how the asset zoo's fish experiment applies the same general web-asset method without presenting our creatures as Polyfork products.

## Observed construction contract

The public asset metadata, parameter schemas, and free generator modules agree on a compact pipeline:

1. Generate a deterministic low-poly silhouette from code, using hand-built rings, facets, or very low-resolution primitives.
2. Rebuild meaningful dimensions instead of stretching the finished mesh. Repeated details keep a fixed real-world pitch as length or health changes.
3. Convert rigid geometry to non-indexed triangles, remove UVs and normals, and assign semantic color zones through the `color` vertex attribute.
4. Merge rigid zones, compute hard face normals, and render them with one rough `MeshStandardMaterial` using `vertexColors: true` and `flatShading: true`.
5. Keep articulated parts separate only when their pivots need to move.
6. Author every kit part in metres, resting on `y=0`, facing `+Z`, with a shared palette and scale.

The thirteen free specimens used here range from 365 to 572 triangles. They carry no texture maps. Their authored palette and silhouette are part of the model; the aquarium's animated caustic and reef-health shader is an additional presentation layer applied after loading.

## Fish experiment

`PolyforkMethodCreature.tsx` is a reversible study, available only through the asset zoo's **Pack-method study** toggle. It currently affects the Ember Fish, Lagoon Tang, Sunfin Tang, Reef Grouper, and Reef Shark. The jelly and turtle retain their current builds because their construction problems are materially different.

For each finned species the study:

- rebuilds body girth and length from the live reef-health value;
- uses a low-resolution, non-indexed faceted body;
- paints belly, body, face patch, dorsal shadow, fins, and eyes into vertex colors;
- shares one vertex-color reef material across body and moving parts;
- keeps tail and side fins separate for animation.

The study build uses 144 rendered triangles per fish across the faceted body, four fins, and two low-poly eyes. That puts the complete moving creature below the 365–572 triangle range of the free reef props while retaining separate animated pivots.

This is an application-specific learning exercise, not a copy of a paid asset or a general asset generator. Polyfork's public license permits using and modifying the free assets in projects but does not permit redistributing their source files as assets or using them to build a commercial asset-generation product.

## References

- [Polyfork agent documentation](https://polyfork.dev/llms.txt)
- [Polyfork licensing](https://polyfork.dev/licensing)
- Public per-asset metadata and `-params.json` files under `https://polyfork.dev/api/assets/` and `https://polyfork.dev/cdn/`
