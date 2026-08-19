# Coral Bloom implementation

Coral Bloom replaces every previously bundled GLB with a code-native reef scene. It keeps the existing camera and schooling interaction while moving geometry, palette, animation, and underwater light into the application itself.

## Asset boundary

- Thirteen assets marked `free` by the Polyfork Coral Reef API are loaded from `https://polyfork.dev/cdn`.
- Paid assets and public preview meshes are not downloaded, copied, committed, or used as production fallbacks.
- The Polyfork props retain their authored materials and receive the app's caustic and reef-health shader extension at runtime.
- All creatures, terrain, arches, coral branches, sponge gardens, particles, and water effects are original procedural Three.js work in this repository.

The exact free asset IDs are recorded in `public/assets/manifest.json` so the external surface is easy to audit.

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
