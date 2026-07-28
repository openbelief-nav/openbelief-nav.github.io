# Paper content sync v2 — design spec

Date: 2026-07-28

**Supersedes** `2026-07-28-paper-content-sync-design.md`. That spec (and the plan built from it) was written against a snapshot of the paper that changed underneath this work: every file under `docs/OpenBelief_Nav/sections/` and `root.tex` shares an identical mtime (2026-07-28 12:46:30), meaning the whole paper was rewritten in one batch mid-session. A task reviewer caught the drift when it rejected a fabricated AUC column (traced to the stale snapshot); re-reading the current paper directly surfaced a much larger set of changes. This spec covers the full corrected diff.

## Problem

`index.html` needs to match the paper as it now stands in `/home/namdp15/Workspace/VMO/vm_scene_graph/docs/OpenBelief_Nav`. Two categories of change:

1. **Straightforward sync** — renamed terminology, real real-world results (previously all `\tbd`), a swapped figure asset, a dropped table column, new related-work citations, a corrected version of the semantic-readout-ablation table (mIoU only, no AUC — the AUC metric doesn't exist in the current paper).
2. **Removing the abstention/support-test pillar.** The current paper no longer claims absent-query rejection: `methodology.tex:242` states its `NONE` retrieval sentinel "is not an absent-query prediction and does not imply that the queried object is absent," and `experiment.tex:221` lists absent-query rejection as explicitly out of scope for the evaluation. The site's interactive demo implements this dropped mechanism as real logic (`TAU_S` threshold, `abstained` flag) across 4 JS files, not just prose. Confirmed with the human partner: **remove it**, matching the site to what the paper actually claims.

## Non-goals

- No changes to the interactive 3D scene-graph's room/object layout (`ROOMS`/`OBJECTS` in `data.js`, `scene-builder.js`) — that's the separate, still-pending real-floor-plan hero redesign (`docs/superpowers/specs/2026-07-27-real-floorplan-hero-design.md`). This spec only touches `TAU_S`/`QUERIES` and the abstention-related rendering code, not room/object geometry.
- Not touching `correction-stepper.js`'s step mechanics (map SVG, pips, transitions) — only its narrative text where it references the now-removed threshold/abstain concept.
- Not adding fraction annotations (e.g. "76.9 (60/78)") to tables that don't already use them — the site's existing convention is plain percentages; the new YCB column follows that convention for consistency, even though the paper's own table shows fractions.
- Not evaluating whether `figures/pipeline.jpg` or `figures/openbelief_nav_2.jpg` (other new assets in the paper's figures directory) should be used instead of `openbelief_nav.jpg` — `openbelief_nav.jpg` is confirmed as the one actually referenced by the compiled paper (`introduction.tex`'s `fig:pipeline` figure block).
- Small CSS edits are in scope for this pass where they directly support the abstention removal (`static/css/scene-graph.css`'s `.q-chip.absent` rules) — overriding v1's "no CSS changes" non-goal, which predates the abstention-removal decision.

## Changes

### A. Terminology renames

The paper renamed its segmentation readout from "full posterior" to **"Full-belief projection"**, and its navigation/retrieval readout from "posterior" to **"Belief-weighted"** (these are different readouts for different tasks — segmentation uses `\widehat p_i(c)` fixed-vocabulary projection; navigation uses the `H_i^{bel}` retrieval head — so they get different site labels, matching the paper).

In `index.html`:
- Line 161 (Why section, card 2 body): "posterior projection wins segmentation" → "full-belief projection wins segmentation"
- Line 365 (Results split-callout, segmentation half): `best readout: <b>full posterior</b> projection` → `best readout: <b>full-belief</b> projection`
- Line 372 (Results split-callout, navigation half): "full posterior reaches 74.4%" → "belief-weighted reaches 74.4%"
- Lines 507, 541 (segmentation results table, both dataset bands): `<span class="method-tag">posterior</span>` → `<span class="method-tag">full-belief</span>`
- Line 607 (navigation results table): `<span class="method-tag">posterior</span>` → `<span class="method-tag">belief-weighted</span>`

### B. Component ablation table — rename row, add YCB column

Source: `ablation.tex:58-99`, Table `tab:component_ablation`. The paper added a third metric (YCB SR@1m) and renamed the reference row.

In `index.html`, the "Component ablation" `tbl-card` (currently lines 619-662):
- Header row: add a third numeric column `<th class="num">YCB SR@1m</th>` after the existing "Nav SR@1m" column.
- Row label `full system` → `Default belief construction`.
- Add YCB values to each row (mIoU/Nav values are already correct and unchanged — only add the new column, keep existing plain-percentage style, no fraction annotations per the Non-goals section):

| Variant | ScanNet200 mIoU | Nav SR@1m | YCB SR@1m |
|---|---|---|---|
| w<sub>e</sub> = 1 (no reliability) | 0.2010 | 70.5 | 55.6 |
| w<sub>e</sub> = c<sub>e</sub>n<sub>e</sub> (linear support) | **0.2117** | 74.4 | 50.0 |
| no synonym consolidation | 0.2067 | 75.6 | **61.1** |
| no low-evidence regularization | 0.2095 | 70.5 | 50.0 |
| Default belief construction (`ours` row) | 0.2107 | **76.9** | **61.1** |

Bold matches the paper's best-per-column highlighting (`\best{}` cells in `ablation.tex`).

### C. New "Semantic readout ablation" table (corrected — mIoU only, no AUC)

Source: `ablation.tex:101-124`, Table `tab:semseg_ablation`. This is the corrected version of the table v1's Task 1 tried to add — the AUC column doesn't exist in the current paper; drop it. The readout label is "Full-belief projection", matching change A.

Insert as a new full-width `tbl-card` in the `#results` section, between the navigation-results table (ends around line 616) and the `<div class="card-grid cols-2">` (Component ablation | Positioning):

```html
<div class="tbl-card reveal">
  <div class="tbl-head">
    <h3>Semantic readout ablation</h3>
    <p>Same object geometry and observations, scored by four different readouts. Higher is better; bold = best per dataset.</p>
  </div>
  <div class="tbl-scroll">
    <table class="res">
      <thead>
        <tr>
          <th>Semantic readout</th>
          <th class="num">mIoU ↑</th>
        </tr>
      </thead>
      <tbody>
        <tr class="dataset-band">
          <td colspan="2">ScanNet200</td>
        </tr>
        <tr>
          <td>Visual-only</td>
          <td class="num">0.1286</td>
        </tr>
        <tr>
          <td>Consensus-only</td>
          <td class="num">0.2107</td>
        </tr>
        <tr>
          <td>Early-commit</td>
          <td class="num">0.2393</td>
        </tr>
        <tr class="ours">
          <td>Full-belief projection</td>
          <td class="num best">0.2742</td>
        </tr>
        <tr class="dataset-band">
          <td colspan="2">Replica</td>
        </tr>
        <tr>
          <td>Visual-only</td>
          <td class="num">0.2287</td>
        </tr>
        <tr>
          <td>Consensus-only</td>
          <td class="num">0.2831</td>
        </tr>
        <tr>
          <td>Early-commit</td>
          <td class="num">0.2701</td>
        </tr>
        <tr class="ours">
          <td>Full-belief projection</td>
          <td class="num best">0.2912</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### D. Positioning table — drop the "Rejection" column

Source: `related.tex:53-77`, Table `tab:positioning`. The paper's current positioning table has no absent-query-rejection axis (consistent with dropping that claim — see section F).

In `index.html`'s Positioning `tbl-card` (around lines 663-712): remove the `<th class="ctr">Rejection</th>` header and the corresponding `<td class="ctr pos-dash">—</td>` / `<td class="ctr pos-check">✓</td>` cell from every row (ConceptGraphs, HOV-SG, FSR-VLN, DualMap, OpenBelief-Nav), leaving 2 substantive columns (Evidence @ query, Exec. correction). The FSR-VLN row itself is already present and correct — do not touch its existence, only its column count.

### E. Related-work sentence in the Why section

Source: `related.tex:1-23`. Append one sentence to the existing lede paragraph in `#overview` (`index.html:142-147`), after the "ConceptGraphs, HOV-SG, FSR-VLN, and DualMap..." sentence:

> Related approaches push on adjacent axes without changing this pattern: ConceptFusion and VLMaps embed features densely rather than per object, and OGScene3D and ThinkGraphs refine tracking and confidence while still exposing a single committed state per object.

(Corrected from v1: drop "Clio clusters around a task fixed at mapping time" — Clio is no longer cited anywhere in the current paper.)

### F. Remove the abstention / support-test pillar

The paper no longer supports this mechanism (see Problem section). Remove it from both the JS logic and the prose. Every location, found via exhaustive grep of `index.html` and `static/js/*.js`:

**`static/js/data.js`:**
- Remove the `TAU_S` constant (line 65) and its entry in the `SceneGraphData` export (line 87 becomes `global.OBN.SceneGraphData = { ROOMS, OBJECTS, QUERIES };`).
- The `"washing machine"` query entry (lines 80-83) currently exists specifically to demonstrate refusal. Keep the query (it's still a good example — no real washing machine exists in this apartment), but its note must stop claiming refusal, since retrieval now always returns the argmax. Change:
  ```js
  "washing machine": {
    top: [["fridge", .24], ["counter", .21], ["wardrobe", .19]],
    note: "cosine similarity still has an argmax — the support test refuses it."
  }
  ```
  to:
  ```js
  "washing machine": {
    top: [["fridge", .24], ["counter", .21], ["wardrobe", .19]],
    note: "retrieval always returns its best-scoring candidate — arrival verification, not query-time scoring, is what catches a wrong one."
  }
  ```

**`static/js/retrieval-engine.js`:**
- Remove `this._tau = data.TAU_S;` (line 18).
- Remove the `abstained` computation and field. `resolve()` becomes:
  ```js
  resolve(query) {
    const spec = this._queries[query];
    if (!spec) throw new Error("Unknown query: " + query);

    const ranked = spec.top.map(([id, score]) => ({
      id, score, object: this._objectsById.get(id)
    }));

    return {
      query,
      ranked,
      winnerId: ranked.length ? ranked[0].id : null,
      note: spec.note
    };
  }
  ```
- Update the file's header comment (lines 6-9), which currently describes "the retrieval *rule* (support test → select-or-abstain)" — change to describe plain argmax-over-ranked-candidates resolution.
- Update the `resolve()` JSDoc return-type comment (line 29) to drop `abstained:boolean, threshold:number`.

**`static/js/evidence-panel.js`:**
- In `showQueryResult()` (lines 98-126): remove the `abstained` branch entirely. `const win = !result.abstained && i === 0;` (line 107) becomes `const win = i === 0;`. Replace the `if (result.abstained) {...} else {...}` block (lines 116-124) with a single verdict render (no threshold comparison):
  ```js
  html += '<div class="q-verdict ok"><span class="vt">✓ TARGET SELECTED · goal ring placed</span>' +
    "S = " + result.ranked[0].score.toFixed(2) + " — highest-scoring candidate. " +
    esc(result.note) + "</div>";
  ```

**`static/js/correction-stepper.js`:**
- STEP 2 ("Retrieve", line 25): `"The support test passes (0.41 ≥ τₛ), so retrieval selects the argmax: "` → `"Retrieval selects the argmax over untried candidates: "`.
- STEP 4 ("Re-ground the verbatim query", line 40): `"...selects <b>n09</b> on the kitchen counter (0.38 ≥ τₛ)."` → `"...selects <b>n09</b>, the next-highest remaining candidate, on the kitchen counter."`.
- STEP 6 ("Episode ends", lines 53-56): the sentence `"Had no supported candidate remained (removed-target condition), the loop would have ended in an honest <b>ABSTAIN</b> instead of a confident wrong answer."` → `"Had no untried candidate remained, the loop would have returned <b>NONE</b> — not a claim the object is absent, only that every mapped candidate for this query has been tried."` (matches `methodology.tex:242`'s own wording for the `NONE` sentinel).

**`index.html` prose:**
- Line 130 (hero query chips): `<button class="q-chip absent" data-q="washing machine">"washing machine" (absent)</button>` → `<button class="q-chip" data-q="washing machine">"washing machine"</button>` (drop the `absent` class and the "(absent)" label — the chip behaves like every other chip now).
- Lines 165-172 (Why section, card 3 — full replacement):
  ```html
  <div class="card reveal">
    <h3>A target is a hypothesis, not a fact</h3>
    <p>The top-ranked node can be a distractor, or an instance the arrival observation can't confirm. Retrieval
      alone can't tell the difference — the robot has to <b>verify the selected binding physically</b> before
      treating it as ground truth.</p>
    <div class="tagline">verify at arrival, not just at retrieval</div>
  </div>
  ```
  (Replaces the "Similarity always returns something" / "support testing, not just ranking" card. Matches `introduction.tex`'s current "Third" argument and sets up the `#correction` section below.)
- Lines 233-236 (Method section, Stage 4 body): `"Vocabulary projection, free-form retrieval, and support testing are separate operators..."` → `"Vocabulary projection and free-form retrieval are separate operators over the same frozen evidence — and at deployment, arrival observations physically test the selected hypothesis."`
- Lines 346-358 (Readouts section, third item-row "Support test → abstention"): delete this entire `item-row` block. The Readouts section's `item-list` goes from 3 items to 2 (Vocabulary projection, Free-form retrieval); the split-callout immediately below it already carries the "no single readout wins everything" point.
- Line 11 (og:description meta): `"...so segmentation, retrieval, rejection, and correction become task-time readouts."` → `"...so segmentation, retrieval, and correction become task-time readouts."`
- Line 55 (hero-sub paragraph): `"...so segmentation, retrieval, unsupported-query rejection, and execution-time correction all become task-time readouts..."` → `"...so segmentation, retrieval, and execution-time correction all become task-time readouts..."`

**Do NOT touch** (false positives from the grep — different, still-valid uses of "reject"/"rejection"):
- `index.html:209` ("Observations merge on 3D overlap, with visual similarity only as a rejection cue") — describes geometric-visual association, unrelated to query abstention.
- `index.html:754` ("The verifier must confirm without a false rejection") — describes the arrival-verifier's reject-on-mismatch outcome, a mechanism the paper still has (`methodology.tex:312`, the three-check verifier). This is part of the CORRECT cond-card, which is kept (see section G).

**`static/css/scene-graph.css`:**
- Remove the now-unused `.q-chip.absent { border-style: dashed; }` and `.q-chip.absent.active { background: var(--reject); border-color: var(--reject); }` rules (lines 184-185).

### G. Real World section — rewrite with real results

Source: `experiment.tex:149-265` (`sec:navigation_realworld`), Table `tab:realworld_main`. The paper's real-world study changed shape entirely: 2 conditions (not 4), 20 total runs, and real numbers instead of `\tbd`.

In `index.html`'s `#realworld` section:

1. **Hardware card** (the `hw-grid`, around line 727-732): the paper added a Livox MID-360 LiDAR. Update the "Embodiment" card's description line: `"Online RGB-D for perception, target grounding, and arrival verification."` → `"Online RGB-D + LiDAR for perception, target grounding, and arrival verification."` The card's `<h4>` can stay `Unitree G1 + RealSense D435i` (title stays short; LiDAR is mentioned in the description).

2. **Condition grid** (`cond-grid`, currently 4 cards): drop the REMOVED and STALE DUPLICATE cards entirely — the paper's pilot explicitly does not evaluate them (`experiment.tex:219-222`: "does not evaluate absent-query rejection, removed-target detection, general map repair"). Keep CORRECT and CONFUSABLE, unchanged text.

   `.cond-grid` (`static/css/base.css:364`) is a hardcoded `grid-template-columns: repeat(4, 1fr)` at desktop width (with `repeat(2, 1fr)` at ≤900px and `1fr` at ≤560px). With only 2 cards left, the desktop rule would leave two empty column tracks and squeeze both cards into half the row. Change the base rule to `repeat(2, 1fr)` and drop the now-redundant `@media (max-width: 900px)` override (2 cards at `repeat(2,1fr)` is already the ≤900px layout); keep the `@media (max-width: 560px) { .cond-grid { grid-template-columns: 1fr; } }` single-column rule for narrow screens.

3. **Add a results table** — the site currently has no real-world results table at all (just prose + a "being finalized" line). Add one, mirroring `tab:realworld_main` exactly, as a new `tbl-card` inserted directly after the `cond-grid` and before the `figure-block`:
   ```html
   <div class="tbl-card reveal">
     <div class="tbl-head">
       <h3>Matched real-world target-confirmation results</h3>
       <p>20 Unitree G1 runs, 10 matched cases (same graph, query, and start pose for both conditions).</p>
     </div>
     <div class="tbl-scroll">
       <table class="res">
         <thead>
           <tr>
             <th>Condition</th>
             <th class="num">Runs</th>
             <th class="num">Top-1-only SR</th>
             <th class="num">Full-correction SR</th>
             <th class="num">Full-correction mean visits</th>
           </tr>
         </thead>
         <tbody>
           <tr>
             <td>Correct</td>
             <td class="num">5</td>
             <td class="num">5/5 (100%)</td>
             <td class="num">5/5 (100%)</td>
             <td class="num">1.00</td>
           </tr>
           <tr>
             <td>Confusable</td>
             <td class="num">5</td>
             <td class="num">1/5 (20%)</td>
             <td class="num">3/5 (60%)</td>
             <td class="num">1.80</td>
           </tr>
           <tr class="ours">
             <td>Overall</td>
             <td class="num">10</td>
             <td class="num">6/10 (60%)</td>
             <td class="num best">8/10 (80%)</td>
             <td class="num">1.40</td>
           </tr>
         </tbody>
       </table>
     </div>
   </div>
   ```

4. **Figure swap**: the paper now uses two separate images (`figures/g1.jpg` for the platform, `figures/realworld_deploy.jpg` for a correction episode) instead of one `realworld.png`. Copy both files from `/home/namdp15/Workspace/VMO/vm_scene_graph/docs/OpenBelief_Nav/figures/` into this repo's `figures/` directory. Replace the existing single-image `figure-block` (currently lines 777-784) with a two-up layout:
   ```html
   <div class="figure-block reveal">
     <div style="display:flex;gap:16px;flex-wrap:wrap">
       <img src="figures/g1.jpg" alt="Unitree G1 platform and hardware configuration" class="zoomable" style="flex:1;min-width:260px">
       <img src="figures/realworld_deploy.jpg" alt="Execution-grounded candidate correction on the humanoid" class="zoomable" style="flex:1;min-width:260px">
     </div>
     <div class="figure-cap"><b>Real-world platform and deployment procedure.</b> Left: the Unitree G1 with
       RealSense D435i and Livox MID-360. Right: execution-grounded candidate correction — arrival observations
       confirm, re-observe, or reject the selected candidate, and rejection re-grounds the unchanged query over
       the remaining mapped candidates without modifying the persistent graph.</div>
   </div>
   ```
   Leave the old `figures/realworld.png` file in place (unreferenced, harmless) rather than deleting it — deletion isn't necessary for this content sync.

### H. Pipeline figure asset swap

Source: `introduction.tex:1-18`, figure `fig:pipeline`. The paper's overview figure is now `figures/openbelief_nav.jpg`, not `figures/pipeline.png` (`pipeline.png` no longer exists in the paper's figures directory at all).

1. Copy `/home/namdp15/Workspace/VMO/vm_scene_graph/docs/OpenBelief_Nav/figures/openbelief_nav.jpg` into this repo's `figures/` directory.
2. `index.html:12` (og:image meta): `content="figures/pipeline.png"` → `content="figures/openbelief_nav.jpg"`.
3. `index.html:242` (Method section figure-block `<img>`): `src="figures/pipeline.png" alt="OpenBelief-Nav pipeline overview"` → `src="figures/openbelief_nav.jpg" alt="Overview of OpenBelief-Nav"`.
4. `index.html:243-247` (figure caption): replace with the paper's current caption —
   > **Overview of OpenBelief-Nav.** Mapping retains observation-level phrases, reliability cues, frame–mask provenance, and separate aggregate geometric and visual representations. Task-time readouts perform fixed-vocabulary projection or free-form retrieval, while arrival verification enables query-specific candidate correction without modifying the persistent graph.

   (Drops "unsupported-query rejection" per section F.)

Leave `figures/pipeline.png` in place (unreferenced, harmless).

## Testing / verification

- `grep -rn "posterior\b" index.html` after Task A should return zero matches (all renamed to "full-belief" or "belief-weighted").
- `grep -rn "abstain\|ABSTAIN\|TAU_S\|τₛ" index.html static/js/*.js` after Task F should return zero matches.
- `grep -n "pipeline.png\|realworld.png" index.html` after Tasks G/H should return zero matches (both replaced).
- Open `index.html` (`file://` or local static server): confirm no console errors, the query chips (including "washing machine") still resolve and render a result with no ABSTAIN state ever appearing, the new tables render without horizontal overflow at 390–1600px, and both new figure images load (confirms the asset copies landed in the right place).
- Manually step through the correction walkthrough (`#correction`) end to end — its wording should no longer reference `τₛ` or ABSTAIN.
