# Coral Bloom implementation

Coral Bloom replaces every previously bundled GLB with a code-native reef scene. It keeps the existing camera and schooling interaction while moving geometry, palette, animation, and underwater light into the application itself.

## Asset boundary

- Thirteen assets marked `free` by the Polyfork Coral Reef API are loaded from `https://polyfork.dev/cdn`.
- Paid assets and public preview meshes are not downloaded, copied, committed, or used as production fallbacks.
- The Polyfork props retain their authored materials and receive the app's caustic and reef-health shader extension at runtime.
- All creatures, terrain, arches, coral branches, sponge gardens, particles, and water effects are original procedural Three.js work in this repository.

The exact free asset IDs are recorded in `public/assets/manifest.json` so the external surface is easy to audit.

## Asset zoo

The separate `/zoo` route is a visual provenance audit. It normalizes each of the thirteen free Polyfork GLBs onto its own labeled pedestal, then presents the seven procedural creatures and five representative code-grown environment or shader families in a second pavilion. Cyan labels mean `free pack`; coral labels mean `generated`.

The gallery uses orbit, zoom, and pan controls so each specimen can be inspected independently. Its reef-health slider drives the same shader uniform as the composed aquarium and makes the shared color-stress and caustic treatment visible across both asset sources.

## Scene-wide controls

`reefHealth` is a value from 0 to 1. It is shared by every reef material. Lower values desaturate and stress the palette; higher values restore saturated coral colors and stronger caustic response. The HUD slider changes it live.

The underwater look has three coordinated layers:

1. A displaced translucent water surface above the scene.
2. Animated caustics added to every standard reef material.
3. A depth-tested caustic field, light shafts, fog banks, bubbles, and marine snow.

## Validation targets

- No local `.glb`, `.gltf`, `.fbx`, or `.obj` is required by the build.
- All seven selectable species are procedural and remain followable.
- Every free Polyfork asset listed in the manifest appears in the composed scene.
- Reef health updates both original geometry and external props without reloading.
- Desktop and mobile views have no clipped controls, WebGL shader errors, or missing models.
