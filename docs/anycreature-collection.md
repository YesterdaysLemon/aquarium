# anyCreature collection study

The Reef Zoo includes a complete alternate creature set generated offline with
[anyCreature](https://github.com/Ariescar/anyCreature) 1.2.0 at pinned commit
[`ab5b1ce5c13e632f00f7f7cbfdb7a746e315000d`](https://github.com/Ariescar/anyCreature/tree/ab5b1ce5c13e632f00f7f7cbfdb7a746e315000d).
Every GLB comes from a project-authored JSON specification. The MIT-licensed
compiler is not vendored or shipped with the aquarium.

Select **anyCreature collection** in `/zoo` to compare all seven models with the
current procedural set and the Polyfork-method study. The live aquarium remains
on the procedural creatures; this collection is an evaluation wall.

## Art direction

The goal is family resemblance with the free Polyfork Coral Reef props rather
than biological realism in isolation:

- broad, memorable silhouettes that read from the default camera;
- faceted low-poly surfaces with 12–16-sided primary volumes;
- muted reef colors, high roughness, and at most four materials per animal;
- chunky, slightly toy-like exaggeration instead of fragile detail;
- vertex color, ambient occlusion, and the shared reef shader instead of image
  textures or copied pack media.

## Visual reference pass

The second-generation fish and jellyfish begin from real animals rather than
from the first generic fish spec. The references are used only for visual
observation; no source media is copied into the project.

| Aquarium specimen | Reference analogue | Dominant forms carried into v2 |
| --- | --- | --- |
| Ember Fish | [Ocellaris clownfish](https://australian.museum/learn/animals/fishes/western-clown-anemonefish-amphiprion-ocellaris-cuvier-1830/) | Compact laterally compressed oval, blunt snout, continuous low fins, rounded fan tail. |
| Lagoon Tang | [Regal blue tang](https://australian.museum/learn/animals/fishes/blue-tang-paracanthurus-hepatus/) | Deep thin disc, small pointed face, long perimeter fins, narrow caudal wrist, yellow crescent tail and dark palette mark. |
| Sunfin Tang | [Indian sailfin tang](https://www.fishbase.se/FieldGuide/FieldGuideSummary.php?GenusName=Zebrasoma&SpeciesName=desjardinii&pda=1&sps=) | Short pointed face framed by equally dominant dorsal and anal sails, producing a tall diamond silhouette. |
| Reef Grouper | [Coral rockcod](https://reeflifesurvey.com/species/cephalopholis-miniata/) | Thick three-dimensional body, steep blunt head, visible heavy jaw, late taper and broad rounded tail. |
| Moon Jelly | [Moon jelly](https://australian.museum/learn/animals/jellyfish/moon-jelly/) | Shallow saucer bell, four central lobes, four short oral arms and a ring of fine marginal tentacles. |

## Iteration ledger

| Iteration | Creature | Pain point observed | Method correction carried forward |
| --- | --- | --- | --- |
| 0 | Reef Shark v2 | `touch` proved overlap but did not weld separate body and tail surfaces; motion began abruptly in the tail. | Treat surface continuity and motion continuity as project-side gates, not implied compiler guarantees. |
| 1 | Sea Turtle v1 | Polygonal fins initially looked like rectangular paddles. | Choose anatomy that fits rigid-core construction and use tapered, convex outlines for articulated plates. |
| 2 | Reef Grouper v1 | Reversed body chains invert the intuitive `around` direction; tail plates anchored on a tiny surface could float. | Use one nose-to-tail volume, trust the reported world normal, and embed caudal plates at the terminal joint center. |
| 3 | Lagoon Tang v1 | Long dorsal plates could be centered on a curved host while all vertices remained detached; sharp body-to-peduncle taper crowded rings. | Include a deliberately buried root strip, soften the radius profile, and let silhouette replace unsupported painted markings. |
| 4 | Sunfin Tang v1 | Earlier species rediscovered frame and attachment mistakes during compile. | Apply verified top/belly directions and embedded roots from the initial specification; exaggerate one species-defining sail. |
| 5 | Ember Fish v1 | The source icon suggests bands, but the generator has no flush surface-decal primitive. | Use honest raised accent studs and palette rhythm rather than floating fake paint. |
| 6 | Moon Jelly v1 | A short vertical bell widened faster than its joint spacing could support, and a vertebrate template was inappropriate. | Select primitives by anatomy, lengthen the bell before adding resolution, and embrace a solid faceted jelly rather than fake translucency. |
| 7 | Reef Shark v3 | The first shark remained the collection's known methodological failure. | Rebuild with one 11-joint nose-to-tail volume and grow a low-amplitude wave continuously from chest to caudal fin. |
| 8 | Collection wall | Correct fish were presented nose-on, collapsing their authored profiles into colored ovals. | Evaluate from the production camera and rotate specimens into alternating three-quarter side views. |
| 9 | Collection critique | The four fish inherited one nose-to-tail template, so color and one novelty fin did most of the species work. | Write a reference-shape sheet before touching the spec: head mass, body depth, cross-section, taper onset, peduncle, tail plan and fin envelope. |
| 10 | Ember Fish v2 | Clownfish bands are visually tempting, but surface detail would not repair a generic silhouette. | Make the body shorter and deeper first; use a blunt face, long low median fins and one rounded tail instead of the collection's shared fork. |
| 11 | Lagoon Tang v2 | A deep body alone still reads as an anonymous tang. | Compress the body in 3D, sharpen the face, narrow the caudal wrist and treat the yellow tail plus raised palette mark as one graphic read. |
| 12 | Sunfin Tang v2 | Exaggerating only the dorsal fin produced a fish with a hat rather than a sailfin body envelope. | Pair a towering dorsal with an almost equally strong anal sail so the entire silhouette becomes a diamond. |
| 13 | Reef Grouper v2 | The first grouper tapered early and ended in the same forked tail as the tangs. | Allocate mass to a wide blunt head and jaw, keep body thickness late into the torso, then finish with a stout wrist and rounded tail. |
| 14 | Moon Jelly v2 | The first bell was a tall mushroom with a few long tubes; it missed the top-view identity of *Aurelia*. | Design top and side views together: shallow saucer, four central lobes, four oral arms and eight short rim tentacles. |
| 15 | v2 compiler pass | Species-specific fast tapers and compact joint spacing repeatedly crossed slope and dead-rhythm gates. | Distribute radius changes across more of the body and make joint spacing intentionally uneven without weakening the reference silhouette. |

## Export budgets

The triangle counts below are parsed from the exported GLBs, not copied from the
compiler's pre-export `faces` field. Normal splitting and material boundaries can
make those numbers differ.

| Creature | Bytes | Triangles | Joints | Materials | Clips |
| --- | ---: | ---: | ---: | ---: | --- |
| Ember Fish v2 | 43,880 | 384 | 7 | 4 | `idle`, `cruise`, `burst` |
| Lagoon Tang v2 | 51,344 | 468 | 7 | 4 | `idle`, `cruise`, `burst` |
| Sunfin Tang v2 | 44,296 | 412 | 7 | 4 | `idle`, `cruise`, `burst` |
| Reef Grouper v2 | 53,196 | 488 | 8 | 4 | `idle`, `cruise`, `burst` |
| Moon Jelly v2 | 76,128 | 828 | 6 | 3 | `idle`, `pulse`, `drift` |
| Sea Turtle v1 | 53,368 | 561 | 15 | 4 | `idle`, `cruise`, `glide` |
| Reef Shark v3 | 62,764 | 696 | 11 | 3 | `idle`, `cruise`, `burst` |

The five v2 rebuilds and the retained turtle and shark each complete with
`checks: all green` and no geometry warnings. The jelly is deliberately the
largest at 76 KB and 828 exported triangles because its radial fringe and four
oral arms are the anatomy; the six vertebrates remain below 64 KB and 700
triangles.

The replaced v1 GLBs and specifications remain in the repository and are listed
as historical studies in `public/assets/manifest.json`; the zoo displays the v2
collection by default.

## Rebuild

Clone `anyCreature` separately, check out the pinned commit, then compile a spec:

```powershell
node <anyCreature-checkout>\engine\cli.js tools\anycreature\ember-fish-v2.json public\assets\creatures\ember-fish-v2.glb
```

The same input/output naming convention applies to the other six collection
specifications. A rebuild is acceptable only when the compiler reports
`checks: all green`; exported GLB budgets are inspected separately.

## Remaining friction

- Adjacency and containment checks do not guarantee a watertight union.
- Animation is authored as low-level joint tracks; the compiler has no spline
  or travelling-wave authoring helper.
- `around` is local to the host section and must be verified from the reported
  world normal.
- `fin` is an extruded polygon, not a curved membrane or flush decal.
- Shell scutes, longitudinal bands, and other surface patterns need a new
  generator primitive or a project-side material pass.
- There is no bundled visual preview, so production-camera browser QA remains
  part of the authoring loop.

Those constraints are manageable when treated as part of the method. The tool
is strongest for rapid, deterministic low-poly silhouettes and rigid-core
creatures; it should not be mistaken for a full surface-modeling or animation
package.
