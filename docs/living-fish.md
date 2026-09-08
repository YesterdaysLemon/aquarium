# Living fish pass — 2026-09-08

Started from clean commit `5b853c0` on a new local branch `codex/living-aquarium`. The existing main checkout had no uncommitted source changes to discard. The separate older coral-reef worktree was not used.

## Preserved character

The central rock arch, supplied reef/kelp/sandbar, deep blue water, quiet follow-camera tour, glass controls, fish picker, and credits route remain. The seven original inhabitants stay, including the deliberately fanciful freshwater goldfish and koi.

## Models and movement

- Ten original models replace the live fish meshes. Added green chromis, anthias, and bannerfish. High quality has 53 fish; narrow screens use 27 and retain every species.
- Shaped bodies, countershading, species markings, fine gill seams, fin rays, smaller shark eyes, and a trailing bannerfish pennant. Shared GLB geometry with one visible mesh per fish; no external texture requests for fish.
- Models were built from original parametric surfaces, welded and finished through the user's Blender MCP, and exported as isolated GLBs. Each picker portrait is a real Blender render of its corresponding mesh.
- Fixed 60 Hz steering with bounded catch-up, species habitat depths, personal space, forward-facing neighbor perception, same-species alignment/cohesion, slower foraging/hovering phases, and short predator escape responses. Shark patrols without perpetual pursuit. Follow selection keeps the same fish identity.
- Tail/body deformation responds to swimming effort and has matching shadow deformation. Fish, water caustics, kelp, particles, and rays freeze when paused.

## Light and water

Warm directional sunlight, cool fill, less ambient wash, ACES tone mapping, and a shadow camera covering the reef. Surface light patterns use world coordinates on rock, sand, and fish. The original kelp has small anchored sway with matching shadows. The flat caustic plane's coordinate bug was corrected. Light-ray noise animates gently; fewer noise octaves and fewer rays on phones reduce work.

## Reproduce assets

1. `npm ci`
2. `npm run fish-sources`
3. Run `scripts/finish-fish-blender.py` in Blender, for example `blender --background --python scripts/finish-fish-blender.py`. In Blender's Python console, use `exec(compile(open(r'ABSOLUTE_PATH_TO_SCRIPT').read(), r'ABSOLUTE_PATH_TO_SCRIPT', 'exec'), {'__file__': r'ABSOLUTE_PATH_TO_SCRIPT'})`.
4. The script creates its own scene, exports only the selected fish from that scene, renders fitted transparent PNG portraits, and writes `docs/living-fish-studio.blend` as a separate library. It does not clear or save over another open project.
5. `npm test` and `npm run build`.

`src/fishModels.ts` defines the reef fish surfaces, `src/distinctFishModels.ts` defines separate shark and puffer anatomy, and `src/swimAnimation.ts` animates their tagged fins and bodies. `src/schoolSimulation.ts` contains the simulation. `public/assets/living-fish/manifest.json` describes the new assets. The original `public/assets/manifest.json` describes the retained legacy model pack.

## Verification

- Production TypeScript/Vite build. Vite still reports the existing large application bundle warning.
- Ten GLBs verified to contain one mesh and one scene with vertex colors; all ten portraits exist.
- Both population rosters; two identical 120-second simulation runs; finite positions, speed/depth/radius limits; stable follow identity; foraging, hovering, and explicit predator response.
- Edge browser: all ten species buttons, next/previous fish, camera reset, overview/follow, paused frames identical after camera settles, resume changes the frame, 390×844 layout without document overflow or broken images, scrollable picker, and credits route. No browser errors in this verification pass.

This remains an artistic aquarium simulation with approximate obstacle volumes, not a fluid or biological model. The reef geometry and baked textures are inherited. Browser checks cover desktop and phone emulation, not measured performance on physical phones. This pass is local and is not deployed.

## Second iteration

- Corrected the swimming wave to travel from head to tail. The caudal fin now rotates around its attachment as one blade; paired fins have anatomical pivots. Sharks have a slower stroke, while puffers keep a rigid rounded body and flutter their small paddles.
- Rebuilt the shark with a long tapered body, swept pectorals, two dorsal fins, asymmetric tail, five gills, and an underslung mouth. Rebuilt the puffer with an ovoid body, protruding eyes, small spines, paddle fins, and a rounded tail. Both use distinct source geometry. All ten meshes and portraits were refreshed through the live Blender MCP.
- Added optical camera zoom through toolbar buttons, mouse wheel, keyboard plus/minus, and a two-pointer pinch handler. Reset restores the default zoom. Toolbar and wheel zoom were verified in the browser; physical touch pinch remains unverified.
- Added an original fish favicon, PNG/ICO fallbacks, Apple and app icons, a web manifest, and social preview metadata. Rebuild these assets with `npm run brand-assets`.
- Asset checks now validate fin tags and span coordinates on all ten GLBs, alongside the population and deterministic simulation checks.
