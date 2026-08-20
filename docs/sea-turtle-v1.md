# Sea Turtle v1 anyCreature pilot

This is the second zoo-only evaluation of the open-source
[anyCreature](https://github.com/Ariescar/anyCreature) workflow. It deliberately
tests an animal whose anatomy matches the generator better than the shark: a
rigid central shell with separately articulated appendages.

## Provenance

- Generator: `anyCreature` 1.2.0 at commit
  [`ab5b1ce5c13e632f00f7f7cbfdb7a746e315000d`](https://github.com/Ariescar/anyCreature/tree/ab5b1ce5c13e632f00f7f7cbfdb7a746e315000d)
- Generator license: [MIT](https://github.com/Ariescar/anyCreature/blob/ab5b1ce5c13e632f00f7f7cbfdb7a746e315000d/LICENSE)
- Authored input: [`tools/anycreature/sea-turtle-v1.json`](../tools/anycreature/sea-turtle-v1.json)
- Generated output: `public/assets/creatures/sea-turtle-v1.glb`
- The generator source is not vendored or shipped by this project.

The specification describes a flattened shell volume, a partially buried neck
and head volume, four mirrored skinned flippers, eyes, a short tail, vertex
colors, ambient occlusion, and three animation loops.

## Rebuild

From a checkout of this repository, clone `anyCreature` separately, check out
the pinned commit, and run:

```powershell
node <anyCreature-checkout>\engine\cli.js tools\anycreature\sea-turtle-v1.json public\assets\creatures\sea-turtle-v1.glb
```

The compiler must finish with `checks: all green`. The current exported GLB is:

- 53,368 bytes
- 561 triangles
- one skinned mesh with 15 joints
- four materials
- `idle`, `cruise`, and `glide` animation clips

## Evaluation

The turtle is a better fit for this generator than an axially flexible fish.
The rigid shell remains stable while the flippers can be separate skinned plates
without creating an anatomically surprising seam. The generated stroke is also
a natural match for independent joint tracks.

The main remaining fidelity limits are the polygonal flipper primitive and the
lack of a shell-scute or patterned-surface primitive. The flipper outline can be
improved in the JSON specification; convincing scutes would require extending
the generator or adding a project-side material/texture pass.

The model appears under **anyCreature collection** in `/zoo`. The live aquarium
still uses the original procedural sea turtle.
