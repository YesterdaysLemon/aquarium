# Lifelike Aquarium Scene Plan

This document is a planning and visual-audit pass for the next implementation phase. It is based on the current React Three Fiber aquarium, current optimized assets, and browser screenshots taken from the local app on 2026-06-11. The intended composition remains a central reef inside a cylindrical ocean slice.

## Current-State Findings

### Scene And Composition

- The reef is visually readable as the central anchor of the ocean slice. The hidden sand/floor meshes solved earlier clipping and fog issues, but the baked sandbar should be restored and tuned because the larger source model already provides a good central reef-and-seabed composition.
- The bottom mist hides the empty base, but it is now doing too much worldbuilding work. It should become one layer in a fuller seabed system: sand slope, rock rubble, sediment clouds, small suspended particles, and distant fade.
- The cylindrical aquarium boundary is mostly hidden. Keep the central-object composition, but add stronger foreground/background parallax around it: foreground kelp, midground reef, background haze, and shadowed rock silhouettes.
- The light rays are coherent and stable, but they still read as graphic shafts rather than sunlight filtered through a moving surface. They need surface-caustic linkage, varied opacity, softer falloff, and fewer repeated lanes.

### Reef And Environment Asset

- The environment GLB is about 12.5 MB and already uses meshopt, WebP textures, and quantization. It is not tiny, but the current visual bottleneck is art direction more than raw weight.
- The source model includes baked sand/floor meshes, kelp, and sand textures. These should remain part of the baseline environment instead of being hidden wholesale.
- Kelp is baked into the model and should be preserved, but it can be supplemented by foreground/background fronds, sway shaders, particles, and lighting so the baked geometry reads less rigid.
- There is not enough secondary environment detail: floating rocks, rubble, shells, suspended debris, small coral/sea plants, and far-background silhouettes are missing.
- The reef texture is acceptable from overview, but in follow camera the close rock surface becomes repetitive and high-contrast. The camera plan should account for close-up material limits.

### Fish And Movement

- Fish are visible and varied, and the current species-specific schooling is a good base.
- Follow mode now tracks outer tang fish and avoids the worst reef collision behavior, but the selected fish is not communicated to the user. The user sees next/previous buttons without knowing which fish is selected or what will be selected next.
- Follow mode can still let the reef dominate the shot when the selected fish passes near the model. This is not only a camera distance issue; the camera needs line-of-sight/occlusion tests and target scoring.
- Fish movement lacks local intent. Schools move believably enough at a distance, but individual fish need more micro-behavior: grazing passes near rocks, hesitation, short acceleration bursts, small altitude changes, and predator-aware scatter events.

### UI And User Flow

- The current HUD is functional but tool-like. It exposes camera/follow/quality controls without helping the user understand the aquarium as a living scene.
- The fish follow controls are icon-only and generic. There is no selected-fish portrait, species name, or visual picker.
- On mobile, controls fit, but the top toolbar is crowded. A fish picker with visual thumbnails should use a bottom sheet or compact carousel instead of adding more top-row buttons.
- The credits page is adequate for attribution, but the main scene needs a clearer path between passive viewing, auto-tour, and intentional fish selection.

## Target Experience

The aquarium should feel like a quiet underwater observation window rather than a model viewer. The default experience should be passive and alive: fish circulate, schools split and merge, kelp moves slowly, particles drift, and the reef appears to continue below the camera-visible volume.

The user flow should support three modes:

1. **Watch**: default overview with slow ambient camera drift disabled by default but available as an auto-tour.
2. **Follow**: selected fish or species tracking, side-on and tangent to the scene boundary.
3. **Inspect**: user picks a fish visually, sees a selected side-profile icon/name, and can cycle between nearby fish of that species.

## Scene Redesign Plan

### Grounding The Reef

- Replace the current hidden-floor workaround with a tuned version of the baked seabed:
  - Restore the baked sand/floor meshes and control their visibility with lighting, haze, and camera framing rather than broad runtime hiding.
  - Keep a broad, shallow sand read below the reef, with edges always below the main camera line.
  - A low-opacity sediment/mist volume hugging the bowl instead of covering the reef.
  - Rock rubble and small broken stones around the base to break the silhouette.
  - A few detached floating or fallen rocks at varying depths to create scale and parallax.
- Keep the visible sand floor subtle. It should appear through haze near the reef base, not as a bright flat platform.
- If future asset work is needed, split the environment only for optimization and control, not to remove the central reef/sandbar composition:
  - `reef-core.glb`: main rock structure, ship/chest props, and baked hard-surface details.
  - `seabed.glb`: restored sandbar, sand bowl, and low rubble.
  - `vegetation.glb`: baked kelp/grass clusters plus optional supplements.
  - `background-rocks.glb`: low-detail silhouettes outside the swim volume.

### Kelp And Vegetation

- Preserve the baked kelp and supplement it with a more lifelike vegetation system:
  - Use a small set of additional curved frond meshes with alpha-tested leaf cards or denser geometry.
  - Add vertex-shader sway using per-instance phase and amplitude.
  - Vary height, color, width, bend, and leaf density per instance.
  - Place kelp in clusters instead of evenly around the reef.
- Avoid hiding the baked kelp wholesale. Hide only clearly broken pieces if necessary, and supplement with instanced fronds so the overall read improves without rebuilding the whole environment.

### Water And Atmosphere

- Keep bottom fog depth-tested. Do not allow atmospheric effects to render over the reef or fish except as very light distance haze.
- Add layered water cues:
  - Fine drifting particles in the whole water column.
  - Larger slow bubbles only near vents or reef crevices.
  - Subtle surface caustics linked visually to the light direction.
  - A distant blue-green background gradient that darkens below and behind the reef.
- Tune light rays as a single system:
  - Either parallel cylinders from a high surface plane or cone shafts sharing one vanishing point.
  - Avoid repeating identical widths and spacing.
  - Use depth test and soft alpha so rays do not flatten over foreground objects.

### Fish Habitat Behavior

- Give species different habitat preferences:
  - Blue/yellow tangs: outer reef schooling and follow-camera candidates.
  - Clownfish: reef/kelp edges with short darting behavior.
  - Goldfish/koi: slower midwater paths, less realistic for ocean but visually distinct.
  - Puffer: solitary, hesitant, close to rocks.
  - Shark: wider outer orbit, causes temporary avoidance/scatter.
- Add behavior states:
  - Cruise, graze, avoid predator, avoid obstacle, regroup, and burst.
  - State changes should be deterministic and cheap, but visible enough to break carousel motion.
- Add target scoring for follow mode:
  - Prefer fish outside the reef radius.
  - Prefer fish with clear camera line of sight.
  - Avoid fish too close to kelp or large colliders.
  - Avoid selecting the same species repeatedly in auto-tour.

## Fish Selection UX

### Selected Fish Panel

Add a compact selected-fish panel that appears when follow mode is active:

- Side-profile fish icon or thumbnail.
- Species name.
- Small status text such as `Following`, `Schooling`, or `Auto tour`.
- Previous/next fish buttons.
- Optional `Auto` toggle to let the camera switch targets periodically.

Desktop placement: bottom-left or lower-center, away from the top toolbar and credits link.

Mobile placement: bottom sheet above the credits link, collapsible to just the fish thumbnail and species name.

### Visual Fish Picker

Add a visual picker for species selection:

- Use one thumbnail button per species, not text-only controls.
- Thumbnail source should be a side profile of the actual GLB fish model.
- Selected species gets a clear ring and optional label.
- Clicking a species switches follow mode to a matching fish and starts the selected-fish panel.

Recommended thumbnail pipeline:

1. Create a small orthographic thumbnail renderer for each fish GLB.
2. Render side-profile PNG/WebP assets at build time or as a one-time script into `public/assets/fish-icons`.
3. Store metadata in `public/assets/manifest.json`:
   - species id
   - display name
   - model path
   - icon path
   - schooling/predator flags
4. Use the same manifest for fish spawning, picker UI, and credits/debug display.

Runtime fallback: if static icon generation is delayed, render thumbnails in a hidden R3F scene or use simple color/species chips temporarily. Static icons are preferred for performance and layout stability.

### Revised Control Model

- Top HUD:
  - Brand
  - Pause/resume
  - Camera mode
  - Quality
  - Optional settings/hitbox toggle only in a debug menu
- Fish panel:
  - Selected fish thumbnail
  - Previous/next
  - Auto-tour toggle
  - Species picker entry point
- Debug controls should not be first-class in the main production UI. Hitboxes can move behind a long-press, URL flag, or settings drawer.

## Asset Pipeline Plan

### Current Asset Facts

- Environment GLB: about 12.5 MB.
- Raw underwater environment archive: about 77 MB in `models/`.
- Fish GLBs are small, roughly 59-108 KB each.
- Environment textures include several 2048x2048 rock/chest/cannon maps and 1024x1024 sand/vegetation maps.

### Next Asset Work

- Reprocess the environment into separate GLBs only if needed for optimization or material control.
- Keep the higher-quality baked reef/sandbar/kelp model as the baseline, and supplement weak vegetation only where the camera exposes it.
- Generate static fish side-profile icons.
- Add low-cost environment detail:
  - 12-24 instanced rubble rocks.
  - 3-5 background rock silhouettes.
  - 40-80 tiny suspended debris particles.
  - 8-16 improved kelp fronds with shader sway.
- Consider KTX2/Basis texture compression if environment size grows past the current budget.

### Quality Targets

- High quality:
  - Full reef core.
  - Improved kelp and rubble.
  - More particles.
  - Higher DPR cap.
- Low quality:
  - Fewer fish.
  - Fewer particles.
  - Lower DPR.
  - Disable or reduce raymarch volumes.
  - Use fewer kelp instances and static sway.

## Implementation Phases

### Phase 1: Planning-To-Code Data Model

- Introduce `fishSpecies.ts` with ids, names, model paths, icon paths, behavior tags, and follow eligibility.
- Update `manifest.json` to include fish icon metadata.
- Move follow-target selection into a dedicated controller/helper so UI and camera share the same selected fish state.

### Phase 2: Fish Picker And Follow Flow

- Add selected-fish panel.
- Add visual species buttons with side-profile thumbnails.
- Add auto-tour state separate from manual follow mode.
- Add line-of-sight scoring before auto-selecting a fish.

### Phase 3: Environment Art Pass

- Restore the baked seabed instead of hiding all floor/sand meshes.
- Split or re-export environment layers only if runtime control is not enough.
- Add rubble/floating rock/debris instances.
- Replace or supplement low-poly kelp with shader-sway fronds.

### Phase 4: Lighting And Water Pass

- Tune rays against final environment layout.
- Link caustics direction and color to light source.
- Add subtle surface shimmer and water-column particles.
- Verify fog never dominates reef or fish in overview/follow/mobile views.

### Phase 5: QA And Performance

- Desktop overview screenshot.
- Desktop follow screenshot for at least three selected species.
- Mobile overview and fish-picker screenshots.
- Check console logs for WebGL shader warnings.
- Confirm low-quality mode reduces fish/effects cost.
- Confirm `/credits` still works through Docker/Nginx SPA fallback.

## Acceptance Criteria For The Next Implementation

- Reef appears grounded by the baked sandbar plus rubble/mist, not floating.
- Baked kelp remains visible but is supported by lighting, particles, and optional supplemental fronds so it reads less rigid in primary camera views.
- Fish can be selected visually by species thumbnail.
- Follow mode clearly shows which fish/species is selected.
- Auto-tour switches between visually clear targets and avoids reef-blocked shots.
- Bottom haze hides the lower scene without obscuring most reef stone or fish.
- Light rays share a coherent direction/source and do not look like independent image sheets.
- Mobile UI remains usable with no clipped labels or overlapping controls.

## Open Decisions

- Keep the current underwater environment as the long-term central reef/sandbar baseline unless a later model is clearly better and license-compatible.
- Whether goldfish/koi should remain in an ocean scene or be treated as stylized aquarium inhabitants.
- Fish icons should start as committed static visual assets. A build-time renderer can replace them later if exact GLB thumbnails become necessary.
- Keep the main scene as a cylindrical ocean slice.
