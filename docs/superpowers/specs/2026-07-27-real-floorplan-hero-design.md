# Real floor-plan hero viewport — design spec

Date: 2026-07-27
Status: approved (pending spec review sign-off)

## Problem

The interactive three.js hero scene graph (`static/js/scene-builder.js` +
`static/js/data.js`) currently renders a fully synthetic apartment: 4 equal
rooms (living, kitchen, bedroom, office) in a symmetric 2×2 grid, 19 invented
furniture boxes, and a made-up belief distribution on every object.

The paper's own evidence figure (`vm_scene_graph/data/evidence_figure_hm3d_00829/`)
is built from a real HM3D-sem scan (scene 00829, 5 rooms, 492 labeled
objects), including a real object the paper walks through in detail — the
sectional sofa `0_3_15` in the living+dining room, with a real text-belief
distribution and 301 real observations. The ask: make the hero viewport's
layout and objects reflect that real scene instead of the invented grid.

## Non-goals

- Pixel-exact floor plan tracing. The wall builder only draws axis-aligned
  box segments, so curved/angled real edges (e.g. the oval tub) can't be
  represented exactly regardless of effort.
- Representing all 492 real objects. Density stays close to today's 19
  (target ~18-22) for hero-scale readability and performance.
- Changes to `correction-stepper.js` or `belief-lab.js`. Both are confirmed
  self-contained: the correction stepper runs its own scripted
  office-desk/kitchen-counter mug narrative over its own mini-map (not tied
  to `data.OBJECTS`/`ROOMS`), and the belief lab is an independent
  sofa/couch/loveseat phrase-voting demo. Neither reads the hero's data.
- Changes to `retrieval-engine.js` / `evidence-panel.js` logic — both are
  already generic over `data.OBJECTS` and need no code changes, only new
  data to operate on.

## Approach

Rectangles sized by real proportions, one room (living+dining) given a
2-rectangle L-shape since that's the one non-rectangular silhouette visible
in the real render (`panel2_scene_graph_new/scene_dollhouse_rgb_az205.png`)
that actually reads as "not a grid." The other four rooms are simple
rectangles — accurate enough at hero scale, much cheaper than hand-tracing
polygons.

Room areas are sized from `panel2_scene_graph_new/room_colors.json`'s
`points` field, used as an area proxy (the scan is a uniform-density point
grid, confirmed by the visible grid pattern in the renders, so point count
tracks floor area including walls):

| room | points | share |
|---|---:|---:|
| living + dining (0_3) | 472,458 | 45.1% |
| bedroom (0_0) | 277,862 | 26.5% |
| bathroom 2 / laundry (0_2) | 145,875 | 13.9% |
| bathroom · tub (0_1) | 89,626 | 8.6% |
| kitchen (0_4) | 61,161 | 5.8% |

Adjacency (which rooms cluster together, which are large vs. small) comes
from the topdown/dollhouse renders: bedroom + both bathrooms cluster on one
side, living+dining + kitchen (as an open-plan nook) take the other — the
two clusters are ~49%/51% of floor area, close enough to split the existing
footprint in half.

The existing outer shell footprint (13.4 × 9.4, interior 13.2 × 9.2) is kept
unchanged — nothing in `orbit-controls.js` or `scene-graph-viewer.js`
derives camera framing from room geometry, so reusing it avoids touching the
camera/lighting/point-cloud-bounds code at all.

## Room layout

West column (x ∈ [-6.6, -0.1], width 6.5) stacked bedroom → bathtub →
laundry, north to south. East column (x ∈ [-0.1, 6.6], width 6.7) is
living+dining as an L covering most of the column with a kitchen nook cut
out of its south-east corner.

| id | name | color | center [x,z] | rect (w×d) |
|---|---|---|---|---|
| `bedroom` | bedroom | `#22c55e` | `[-3.35, 2.1]` | 6.5 × 5.0, z∈[-0.4,4.6] |
| `bathtub` | bathroom · tub | `#3b82f6` | `[-3.35, -1.2]` | 6.5 × 1.6, z∈[-2.0,-0.4] |
| `laundry` | bath 2 / laundry | `#8b5cf6` | `[-3.35, -3.3]` | 6.5 × 2.6, z∈[-4.6,-2.0] |
| `living` | living + dining | `#f97316` | `[3.25, 1.15]` | L: rect A 6.7×6.9 z∈[-2.3,4.6] ∪ rect B 3.7×2.3 z∈[-4.6,-2.3] x∈[-0.1,3.6] |
| `kitchen` | kitchen | `#ec4899` | `[5.1, -3.45]` | 3.0 × 2.3, x∈[3.6,6.6] z∈[-4.6,-2.3] |

This reproduces the real proportions closely: living+dining ≈54.7 m²
(target 54.8), bedroom ≈32.5 m² (target 32.2), laundry ≈16.9 m² (target
16.9), bathtub ≈10.4 m² (target 10.4), kitchen ≈6.9 m² (target 7.0), out of
~121.4 m² total — all within rounding of the real point-count shares.

`scene-builder.js`'s `wallDefs` (`_buildStaticShell`) becomes:

```js
const wallDefs = [
  // outer shell — unchanged
  [0, 4.6, 13.2, true], [0, -4.6, 13.2, true],
  [-6.6, 0, 9.2, false], [6.6, 0, 9.2, false],
  // hallway divider: west cluster vs. living/kitchen, open gap z∈(-2.4,2.4)
  [-0.1, 3.5, 2.2, false], [-0.1, -3.5, 2.2, false],
  // bedroom / bathtub, door gap toward the hallway (x∈[-1.1,-0.1])
  [-3.85, -0.4, 5.5, true],
  // bathtub / laundry, door gap toward the hallway (x∈[-1.1,-0.1])
  [-3.85, -2.0, 5.5, true],
  // kitchen west wall (vs. living wing), door gap z∈[-3.4,-2.3]
  [3.6, -4.0, 1.2, false],
  // kitchen north wall (vs. living rect A), door gap x∈[3.6,4.6]
  [5.6, -2.3, 2.0, true]
];
```

The `roomLayerY`/`bldgLayerY` hierarchy visualization, labels, and
point-cloud scatter logic (`_buildPointCloud`, `_buildHierarchy`,
`updateHierarchy`) need no code changes — they already iterate
`this.rooms`/`this.objects` generically. Only the room-room adjacency `ring`
array changes, from `["living","kitchen","office","bedroom"]` to a
non-crossing loop around the new layout:
`["bedroom","bathtub","laundry","kitchen","living"]`.

## Objects (19 total, same count as today)

Sourced from what's actually visible per room in
`panel2_scene_graph_new/scene_dollhouse_rgb_az205.png`. All positions fall
inside their room's rect above. Belief vectors keep today's format (primary
label + 1-2 plausible confusions); every object except the sofa uses
illustrative-but-plausible numbers in the same style as today's data (no
real per-object ground truth exists for them). The sofa is the one entry
backed by real data end-to-end.

**bedroom** (4): `bed` (pos [-5.3,3.3]), `nightstand` ([-6.0,2.4]),
`loveseat` ([-2.0,3.6], the small settee visible at the foot of the real
bed), `ottoman` ([-1.4,2.6]).

**bathtub** (2): `bathtub` ([-5.2,-1.2]), `vanity-sink` ([-1.2,-1.2]).

**laundry** (3): `washer` ([-5.4,-3.6]), `shower-stall` ([-1.4,-3.9]),
`utility-sink` ([-1.4,-2.6]).

**living** (8): `sofa` ([4.8,3.2], size `[2.3,.85,1.3]`) — **this is object
`0_3_15`** from the paper; `coffee-table` ([4.6,1.6]), `ottoman-1`
([3.6,1.1]), `ottoman-2` ([4.1,1.0]), `dining-table` ([1.8,3.0]),
`dining-chair-1` ([1.2,3.5]), `dining-chair-2` ([2.4,3.5]), `floor-lamp`
([6.0,4.0]).

**kitchen** (2): `counter` ([5.5,-3.0], size `[2.0,.95,.6]`), `cabinet`
([4.0,-3.7], size `[.6,1.8,.5]`) — both nudged in from the room's raw center
so their footprints sit flush against, not through, the outer/kitchen walls.

`sofa`'s belief/obs are pulled directly from
`panel2_object_node/0_3_15_belief.json`:
`belief: [["sofa", .632], ["table", .204], ["chair", .095]], obs: 301,
trust: "trusted"` — `evidence-panel.js` already caps the visible provenance
chips at 5 and shows a "+296 more" overflow chip, so no UI change is needed
to display a 301-observation object.

## Queries

Same 4-query structure as today (3 successful resolutions + 1 refusal), but
rebalanced now that a real washing machine exists in the scene:

1. **`"sofa"`** — trusted match, same shape as today, retargeted at the real
   object: `top: [["sofa",.86],["loveseat",.42],["bed",.33]]`.
2. **`"washing machine"`** — was previously the *refusal* example (no such
   object existed). Now a real washer exists in `laundry`, so this flips to
   a **success** example: `top: [["washer",.79],["utility-sink",.22],
   ["cabinet",.15]]`, note reframed around a real open-vocabulary
   target now resolving correctly.
3. **`"somewhere to sit"`** — free-form intent, unchanged in spirit:
   `top: [["sofa",.71],["loveseat",.66],["dining-chair-1",.61]]`.
4. **`"piano"`** — new refusal example (nothing in the scene matches):
   `top: [["dining-table",.23],["counter",.21],["coffee-table",.19]]`, same
   "argmax still fires, the support test refuses it" note as today's old
   washing-machine example.

## Testing / verification

No automated tests exist for this static site. Verification is the same
headless-Chrome check used for the original module split (per project
memory): load `index.html`, confirm no console errors, no page-level
horizontal overflow at 390-1600px, and manually exercise the hero — orbit,
hover/click each of the 19 objects, all 4 query chips, and the spread
slider — to confirm nothing clips outside its room's walls and the
hierarchy lines still land on their room/building nodes correctly.
