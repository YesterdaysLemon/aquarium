# Reef Shark v2 anyCreature pilot

This specimen is a zoo-only experiment for testing whether the open-source
[anyCreature](https://github.com/Ariescar/anyCreature) workflow is a useful
authoring path for the aquarium's fish.

## Provenance

- Generator: `anyCreature` 1.2.0 at commit
  [`ab5b1ce5c13e632f00f7f7cbfdb7a746e315000d`](https://github.com/Ariescar/anyCreature/tree/ab5b1ce5c13e632f00f7f7cbfdb7a746e315000d)
- Generator license: [MIT](https://github.com/Ariescar/anyCreature/blob/ab5b1ce5c13e632f00f7f7cbfdb7a746e315000d/LICENSE)
- Authored input: [`tools/anycreature/reef-shark-v2.json`](../tools/anycreature/reef-shark-v2.json)
- Generated output: `public/assets/creatures/reef-shark-v2.glb`
- The generator source is not vendored or shipped by this project.

The JSON specification was authored for this aquarium. It describes a
spine-tail skeleton, two skinned body volumes, dorsal and pectoral fins, a split
caudal fin, eyes, vertex colors, ambient occlusion, and three animation loops.
The GLB was compiled locally from that specification with the pinned engine.

## Rebuild

From a checkout of this repository, clone `anyCreature` separately, check out
the pinned commit, and run:

```powershell
node <anyCreature-checkout>\engine\cli.js tools\anycreature\reef-shark-v2.json public\assets\creatures\reef-shark-v2.glb
```

The compiler must finish with `checks: all green`. The current output reports:

- 57,852 bytes
- 822 exported triangles
- one skinned mesh with 11 joints
- three materials
- `idle`, `cruise`, and `burst` animation clips

## Integration boundary

This model is retained as the historical failed-method specimen. It is no longer
selected by the zoo; Reef Shark v3 replaces it in **anyCreature collection**.
The live aquarium and its fish school continue to use the procedural models.

This is intentionally an evaluation specimen, not a wholesale migration. A
school-wide replacement should happen only if the model remains visually clear,
animates without seams, and meets desktop and mobile rendering budgets.

## Known fidelity limits

The body and tail are separate generated surface islands. Their bind-pose
overlap passes the compiler's containment and adjacency checks, but those checks
do not weld the surfaces, so the join remains visible. The first animation also
places almost all of the lateral wave in the tail joints; the torso receives
only a small rigid yaw rather than a smoothly propagated spine curve.

A serious shark revision should use one continuous centerline volume where
possible, distribute small phase-offset rotations through the body and tail,
and treat a watertight or visually buried body-tail junction as an additional
project-side validation gate.

Reef Shark v3 applies those corrections and is documented in the
[collection study](anycreature-collection.md).
