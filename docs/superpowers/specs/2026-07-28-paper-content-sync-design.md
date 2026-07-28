# Paper content sync — design spec

Date: 2026-07-28

## Problem

The paper source at `/home/namdp15/Workspace/VMO/vm_scene_graph/docs/OpenBelief_Nav` has been updated since the site (`index.html`) was last built from it. Comparing the site against every section actually compiled by `root.tex` (abstract, introduction, related, methodology, experiment, ablation, conclusion — `result.tex` and `realworld.tex` are commented out / unused and were excluded from this comparison), most numbers already match. Four concrete deltas were found where the site is missing content the paper now has.

## Non-goals

- No change to `static/js/*` or `static/css/*` — this is a content-only sync of `index.html`.
- No attempt to fill in values the paper itself still marks `\tbd{}` (real-world SR/FRR numbers, absent-query rejection AUROC, hyperparameter values). The site's existing "being finalized for the camera-ready" framing stays.
- Not adding every newly-cited related-work paper to the site. Of the paper's new citations (ConceptFusion, VLMaps, Clio, OGScene3D, ThinkGraphs, SysNav, OpenIN, DOVSG, Khronos), only the five that share the site's "Why" section's specific claim — early semantic commitment — are added (ConceptFusion, VLMaps, Clio, OGScene3D, ThinkGraphs). SysNav (low-level control separation), OpenIN, DOVSG, and Khronos (dynamic relocation) argue a different axis and are out of scope for that paragraph.
- Not restructuring the existing Positioning table's columns to match the paper's 5-column version (Open-vocab / Evidence@query / Absent-query rejection / Exec-grounded correction / Training-free) — the site's 3-column version (Evidence@query / Rejection / Exec.correction) already omits the two columns that are ✓ for every system and add no differentiation. Only the missing row is added.

## Changes

### 1. Positioning table — add FSR-VLN row

File: `index.html`, `#results` section, "Positioning" `tbl-card` (around line 691, between the HOV-SG and DualMap rows).

The paper's `related.tex` Table `positioning` now includes FSR-VLN. Insert, matching the paper (all dashes, same as ConceptGraphs/HOV-SG):

```html
<tr>
  <td>FSR-VLN</td>
  <td class="ctr pos-dash">—</td>
  <td class="ctr pos-dash">—</td>
  <td class="ctr pos-dash">—</td>
</tr>
```

Placed after the HOV-SG row and before the DualMap row, matching the paper's system ordering (ConceptGraphs, HOV-SG, FSR-VLN, DualMap, Ours).

### 2. New "Semantic readout ablation" table

File: `index.html`, `#results` section, inserted as a new full-width `tbl-card` after the navigation results table (after line 616) and before the existing 2-column `card-grid cols-2` (Component ablation | Positioning).

Source: `experiment.tex` Table `semseg_ablation`. This table isn't represented on the site at all today — it's the internal readout-vs-readout comparison (as opposed to the existing segmentation table, which compares only the best OpenBelief-Nav readouts against external baselines). It directly backs the site's "no single readout wins everything" claim and introduces the AUC metric, which the site doesn't show anywhere yet.

Structure: same `dataset-band` row style as the existing segmentation table (`ScanNet200` / `Replica` bands), columns "Semantic readout", "mIoU ↑", "AUC ↑". Best value per dataset/column bolded, matching the paper's bolding.

ScanNet200:
| Semantic readout | mIoU | AUC |
|---|---|---|
| Visual-only | 0.1286 | 0.8888 |
| Consensus-only | 0.2107 | 0.9480 |
| Early-commit | 0.2393 | 0.9353 |
| **Full posterior** | **0.2742** | **0.9531** |

Replica:
| Semantic readout | mIoU | AUC |
|---|---|---|
| Visual-only | 0.2287 | 0.9136 |
| Consensus-only | 0.2831 | 0.9080 |
| Early-commit | 0.2701 | 0.9230 |
| **Full posterior** | **0.2912** | **0.9365** |

Header/caption: "Semantic readout ablation" / "Same object geometry and observations, scored by four different readouts. ScanNet200 (5 scenes) and Replica (8 scenes)."

### 3. "Why" section — one added sentence

File: `index.html`, `#overview` section, `sec-lede` paragraph (around line 142-147).

Append one sentence after the existing "ConceptGraphs, HOV-SG, FSR-VLN, and DualMap all resolve that disagreement at construction time..." sentence:

> Related approaches push on adjacent axes without changing this pattern: ConceptFusion and VLMaps embed features densely rather than per object, Clio clusters around a task fixed at mapping time, and OGScene3D and ThinkGraphs refine tracking and confidence while still exposing a single committed state per object.

### 4. Real World section — trial-count detail

File: `index.html`, `#realworld` section, figure caption (around line 782-783).

Source: `experiment.tex` real-world table (`tab:realworld`) — 6 trials without correction + 8 trials with correction, per condition, across 4 conditions = 56 trials total.

Change the existing sentence:
> "Quantitative results across the four conditions are being finalized for the camera-ready."

to:
> "Quantitative results across the four conditions (56 trials total — 6 without correction / 8 with correction per condition) are being finalized for the camera-ready."

## Testing / verification

- Open `index.html` directly (`file://`) and via a local static server; confirm no console errors.
- Visually confirm the new ablation table renders correctly at 390–1600px width (reuse existing `tbl-scroll` wrapper, no CSS changes needed since it reuses existing `res`/`dataset-band`/`cellbar` classes... note: this table does not need the `cellbar`/bar-width visualization the segmentation table uses, since it's a smaller internal comparison — plain numeric cells, bold on best, consistent with the "Component ablation" card table's style).
- Confirm the Positioning table's new FSR-VLN row aligns with existing column widths/styling.
- Proofread the two new prose sentences (Why section, Real World caption) in context for tone/flow.
