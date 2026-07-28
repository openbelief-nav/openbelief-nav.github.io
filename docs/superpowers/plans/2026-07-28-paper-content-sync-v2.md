# Paper Content Sync v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync `index.html` (and its supporting JS/CSS) with the current paper source, per the corrected v2 spec — terminology renames, a corrected ablation table (no fabricated AUC), real real-world results, a figure asset swap, and removing the abstention/support-test pillar the paper no longer claims.

**Architecture:** Mostly static-HTML content edits, plus targeted JS logic removal in 4 files (`data.js`, `retrieval-engine.js`, `evidence-panel.js`, `correction-stepper.js`) and one CSS rule removal + one CSS grid-column fix. Two image assets get copied in from the paper's `figures/` directory.

**Tech Stack:** Plain HTML/CSS/JS, no build step (`file://`-compatible).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-paper-content-sync-v2-design.md` (supersedes the v1 spec; approved 2026-07-28).
- **Workspace is a git worktree.** Every task in this plan runs inside `/home/namdp15/Workspace/VMO/vm_scene_graph/demo/openbelief-nav/.claude/worktrees/paper-content-sync` (branch `worktree-paper-content-sync`). **All Read/Edit/Write tool calls MUST use absolute paths rooted at that worktree directory — never the bare project path without `.claude/worktrees/paper-content-sync`, and never a relative path.** A prior task in this same plan leaked a duplicate, uncommitted edit into the main repo checkout (`/home/namdp15/Workspace/VMO/vm_scene_graph/demo/openbelief-nav`, no `.claude/worktrees/...` prefix) because an implementer used a path without the worktree prefix; it had to be manually discovered and discarded. Every dispatch prompt for this plan must state the worktree's absolute path explicitly and forbid touching the main repo path.
- Every number or label taken from the paper must match `/home/namdp15/Workspace/VMO/vm_scene_graph/docs/OpenBelief_Nav` exactly, as cited per task below.
- Because multiple tasks edit `index.html` sequentially, line numbers quoted below are approximate (correct as of the plan's writing, before any task in this plan has run). Every task's Step 1 re-locates its edit point with `grep -n` against the actual current file before editing — never trust a quoted line number blindly.
- No changes to `data.js`'s `ROOMS`/`OBJECTS` or `scene-builder.js` — that's the separate, still-pending real-floor-plan hero redesign.

---

### Task 1: Hero and Why-section updates

**Files:**
- Modify: `index.html` (meta description, hero-sub paragraph, hero query chip, Why-section lede and cards — all within the file's first ~175 lines)

**Interfaces:** none (static content).

- [ ] **Step 1: Locate every edit point**

```bash
cd /home/namdp15/Workspace/VMO/vm_scene_graph/demo/openbelief-nav/.claude/worktrees/paper-content-sync
grep -n 'og:description\|unsupported-query rejection\|q-chip absent\|posterior projection wins\|Similarity always returns something\|ConceptGraphs, HOV-SG, FSR-VLN, and DualMap' index.html
```

- [ ] **Step 2: Trim the og:description meta tag**

Find the line matching `<meta property="og:description" ...>`. It currently reads (content attribute only, shown unwrapped):
```
"Object nodes that store evidence, not decisions: multi-view phrases, reliability, and provenance are preserved so segmentation, retrieval, rejection, and correction become task-time readouts."
```
Change `"...retrieval, rejection, and correction become..."` to `"...retrieval, and correction become..."` (drop `rejection, `).

- [ ] **Step 3: Trim the hero-sub paragraph**

Find the `<p class="hero-sub">` block. It contains the sentence:
```
so segmentation, retrieval, unsupported-query rejection, and execution-time
correction all become <b>task-time readouts over one frozen graph</b>.
```
Change to:
```
so segmentation, retrieval, and execution-time
correction all become <b>task-time readouts over one frozen graph</b>.
```

- [ ] **Step 4: Update the "washing machine" hero query chip**

Find:
```html
<button class="q-chip absent" data-q="washing machine">"washing machine" (absent)</button>
```
Replace with:
```html
<button class="q-chip" data-q="washing machine">"washing machine"</button>
```
(Drop the `absent` class and the "(absent)" label — the underlying JS behavior for this query is corrected in Task 7, which makes this chip behave like every other chip.)

- [ ] **Step 5: Rename "posterior" in Why-section card 2**

Find, inside the `#overview` section's `card-grid cols-3`, the card containing `<h3>No single readout fits every task</h3>`. Its `<p>` reads:
```
The readout that maximizes benchmark segmentation is <b>not</b> the one that maximizes navigation
success — our experiments show posterior projection wins segmentation while a consensus readout wins
retrieval. A map that commits to either loses the other.
```
Change `"posterior projection wins segmentation"` to `"full-belief projection wins segmentation"`.

- [ ] **Step 6: Replace Why-section card 3**

Find the third card in that same `card-grid cols-3`, containing `<h3>Similarity always returns something</h3>`. Replace the entire `<div class="card reveal">...</div>` block for that card with:

```html
<div class="card reveal">
  <h3>A target is a hypothesis, not a fact</h3>
  <p>The top-ranked node can be a distractor, or an instance the arrival observation can't confirm. Retrieval
    alone can't tell the difference — the robot has to <b>verify the selected binding physically</b> before
    treating it as ground truth.</p>
  <div class="tagline">verify at arrival, not just at retrieval</div>
</div>
```

(If the card has a commented-out `<!-- <div class="icon" ...> -->` line like its siblings, it's fine to drop it — the other two cards' icon comments can stay as they are, this one doesn't need to match.)

- [ ] **Step 7: Add the related-work sentence**

In the same section's lede paragraph (`<p class="sec-lede reveal">`, the one starting "A sofa seen from four viewpoints..."), find the sentence ending `"...Three things go wrong."` immediately after `"ConceptGraphs, HOV-SG, FSR-VLN, and DualMap all resolve that disagreement <b>at construction time</b>, exposing each object as one fused feature, label, or consensus state."`. Insert a new sentence between them:

```
ConceptGraphs, HOV-SG, FSR-VLN, and DualMap all resolve that disagreement <b>at construction time</b>,
exposing each object as one fused feature, label, or consensus state. Related approaches push on
adjacent axes without changing this pattern: ConceptFusion and VLMaps embed features densely rather
than per object, and OGScene3D and ThinkGraphs refine tracking and confidence while still exposing a
single committed state per object. Three things go wrong.
```

- [ ] **Step 8: Verify**

```bash
grep -n "rejection, and correction\|unsupported-query rejection\|q-chip absent\|posterior projection wins\|Similarity always returns something\|ConceptFusion and VLMaps" index.html
```
Expected: no match for the first four patterns; one match for "ConceptFusion and VLMaps".

- [ ] **Step 9: Visually verify**

Open `index.html` in a browser, check the hero and "The problem" section render correctly, no overflow at 390px width, all 3 Why-section cards still display in a 3-column grid.

- [ ] **Step 10: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Update hero and Why-section copy to match current paper

Drops the unsupported-query-rejection claim (paper no longer
makes it), renames "posterior" to "full-belief", replaces the
third Why-section card with the paper's actual third argument
(a target is a hypothesis, not a fact), and names the paper's
newer related-work citations.
EOF
)"
```

---

### Task 2: Method-section updates and pipeline figure swap

**Files:**
- Modify: `index.html` (`#method` section: Stage 4 body text, og:image meta, figure-block image/caption)
- Create (copy): `figures/openbelief_nav.jpg` (from the paper's figures directory)

**Interfaces:** none.

- [ ] **Step 1: Locate edit points**

```bash
grep -n 'support testing are separate\|figures/pipeline.png' index.html
ls figures/
```

- [ ] **Step 2: Copy the new figure asset**

```bash
cp /home/namdp15/Workspace/VMO/vm_scene_graph/docs/OpenBelief_Nav/figures/openbelief_nav.jpg \
   /home/namdp15/Workspace/VMO/vm_scene_graph/demo/openbelief-nav/.claude/worktrees/paper-content-sync/figures/openbelief_nav.jpg
```
Leave the existing `figures/pipeline.png` in place (unreferenced after this task, harmless).

- [ ] **Step 3: Update the og:image meta tag**

Find `<meta property="og:image" content="figures/pipeline.png">` (near the top of `<head>`) and change to `content="figures/openbelief_nav.jpg"`.

- [ ] **Step 4: Update the Method-section Stage 4 body**

Find, inside the `#method` section's item-list, the row with `<span class="num-badge">STAGE 4</span>`. Its body currently reads:
```
Vocabulary projection, free-form retrieval, and support testing are separate operators over the same
frozen evidence — and at deployment, arrival observations physically test the selected hypothesis.
```
Change to:
```
Vocabulary projection and free-form retrieval are separate operators over the same
frozen evidence — and at deployment, arrival observations physically test the selected hypothesis.
```
(Leave the `<div class="eq">readout(𝓑ᵢ, task) — graph never rewritten</div>` line below it unchanged.)

- [ ] **Step 5: Swap the pipeline figure image and caption**

Find the `figure-block` inside `#method` containing `<img src="figures/pipeline.png" alt="OpenBelief-Nav pipeline overview" class="zoomable">`. Replace the `<img>` tag with:
```html
<img src="figures/openbelief_nav.jpg" alt="Overview of OpenBelief-Nav" class="zoomable">
```
Replace the `<div class="figure-cap">...</div>` immediately after it with:
```html
<div class="figure-cap"><b>Overview of OpenBelief-Nav.</b> Mapping retains observation-level phrases,
  reliability cues, frame–mask provenance, and separate aggregate geometric and visual representations.
  Task-time readouts perform fixed-vocabulary projection or free-form retrieval, while arrival
  verification enables query-specific candidate correction without modifying the persistent graph.</div>
```

- [ ] **Step 6: Verify**

```bash
grep -n "figures/pipeline.png\|figures/openbelief_nav.jpg\|support testing are separate" index.html
ls -la figures/openbelief_nav.jpg
```
Expected: no match for `figures/pipeline.png` or `support testing are separate`; one match for `figures/openbelief_nav.jpg` (in the `<img>` tag) — the og:image meta uses the same string so `grep -c` would show 2 total occurrences of `openbelief_nav.jpg`; the copied file exists.

- [ ] **Step 7: Visually verify**

Open `index.html`, scroll to the Method section, confirm the new image loads (broken image = wrong path) and the caption reads correctly.

- [ ] **Step 8: Commit**

```bash
git add index.html figures/openbelief_nav.jpg
git commit -m "$(cat <<'EOF'
Swap pipeline figure to the paper's current overview image

figures/pipeline.png no longer exists in the paper source;
figures/openbelief_nav.jpg is the actual figure referenced by
introduction.tex. Also drops the Method section's now-inaccurate
"support testing" mention from Stage 4's description.
EOF
)"
```

---

### Task 3: Delete the "Support test → abstention" readout item

**Files:**
- Modify: `index.html` (`#readouts` section)

**Interfaces:** none.

- [ ] **Step 1: Locate the item**

```bash
grep -n "Support test → abstention\|r-geo reveal" index.html
```

- [ ] **Step 2: Delete the item-row**

Find, inside `#readouts`' `item-list`, the third `item-row` (class `item-row r-geo reveal`), containing `<h3>Support test → abstention</h3>`. Delete the entire block, from its opening `<div class="item-row r-geo reveal">` through its matching closing `</div>`. The `item-list` should end up with exactly 2 `item-row` children (Vocabulary projection, Free-form retrieval) instead of 3. Leave the `split-callout` div that follows the `item-list` untouched — it's handled in Task 4.

- [ ] **Step 3: Verify**

```bash
grep -n "Support test → abstention\|r-geo" index.html
grep -c "item-row" index.html
```
Expected: zero matches for the first pattern. (The second command's count will include item-rows from the `#method` section too — just eyeball that it dropped by exactly 1 from whatever it was before this task.)

- [ ] **Step 4: Visually verify**

Open `index.html`, scroll to the "One graph, many answers" section, confirm it now shows exactly 2 readout items (Vocabulary projection, Free-form retrieval) followed by the segmentation/navigation split-callout, with no layout gap or leftover styling artifact.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Remove the support-test/abstention readout from the Readouts section

The paper no longer claims unsupported-query rejection
(methodology.tex's retrieve() has no support threshold; its NONE
sentinel explicitly is not an absent-query prediction). The
Readouts section now covers the two readouts the paper actually
reports: vocabulary projection and free-form retrieval.
EOF
)"
```

---

### Task 4: Results-section terminology renames and new semantic-readout-ablation table

**Files:**
- Modify: `index.html` (`#results` section: split-callout, segmentation table method-tags, navigation table method-tag; insert new table)

**Interfaces:** none.

- [ ] **Step 1: Locate edit points**

```bash
grep -n 'full posterior\|method-tag">posterior' index.html
grep -n 'card-grid cols-2' index.html
```

- [ ] **Step 2: Rename in the split-callout**

Find the `split-callout` div (two `split-half` blocks under the segmentation/navigation results tables). In the segmentation half, change:
```html
<div class="win-readout">best readout: <b>full posterior</b> projection</div>
```
to:
```html
<div class="win-readout">best readout: <b>full-belief</b> projection</div>
```
In the navigation half, change:
```html
<div class="delta">full posterior reaches 74.4% · <em>+6.4 pts over DualMap</em></div>
```
to:
```html
<div class="delta">belief-weighted reaches 74.4% · <em>+6.4 pts over DualMap</em></div>
```

- [ ] **Step 3: Rename method-tags in the segmentation results table**

Find the two occurrences (ScanNet200 band and Replica band) of:
```html
<td>OpenBelief-Nav <span class="method-tag">posterior</span></td>
```
inside the "Open-vocabulary 3D semantic segmentation" table. Change both to:
```html
<td>OpenBelief-Nav <span class="method-tag">full-belief</span></td>
```

- [ ] **Step 4: Rename method-tag in the navigation results table**

Find, in the "Language-guided navigation" table, the row:
```html
<tr class="ours">
  <td>OpenBelief-Nav <span class="method-tag">posterior</span></td>
```
Change `<span class="method-tag">posterior</span>` to `<span class="method-tag">belief-weighted</span>`. (Leave the numeric cells in that row untouched — 76.9 / 73.1 / 73.1 / 74.4 are still correct.)

- [ ] **Step 5: Insert the new "Semantic readout ablation" table**

Immediately before the `<div class="card-grid cols-2">` that holds the "Component ablation" and "Positioning" cards (and immediately after the closing `</div>` of the navigation-results `tbl-card` above it), insert:

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

This reuses only existing classes (`tbl-card`, `tbl-scroll`, `res`, `dataset-band`, `ours`, `num`, `best`) — no new CSS.

- [ ] **Step 6: Verify**

```bash
grep -n "full posterior\|method-tag\">posterior" index.html
grep -n "Semantic readout ablation" index.html
grep -c "Full-belief projection" index.html
```
Expected: zero matches for the first pattern; one match for the heading; `Full-belief projection` appears exactly 2 times (this table's two rows) plus however many times Task 1 already introduced it in Why-card-2 prose — don't worry about the exact total, just confirm it's present and the count didn't drop.

- [ ] **Step 7: Visually verify**

Open `index.html`, scroll through the Results section top to bottom: split-callout labels read "full-belief" / "belief-weighted", both results tables show the renamed method-tags, and the new ablation table sits between the navigation table and the Component-ablation/Positioning grid with no horizontal overflow at 390px.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Rename readout terminology and add semantic-readout ablation table

"Posterior" is now "full-belief" (segmentation) or "belief-weighted"
(navigation), matching the paper's current terminology. Also adds
the paper's semantic-readout ablation table (mIoU only — the
paper's version of this table has no AUC metric, correcting an
earlier attempt that fabricated one from a stale paper snapshot).
EOF
)"
```

---

### Task 5: Component-ablation table update and Positioning table column drop

**Files:**
- Modify: `index.html` (`#results` section: `card-grid cols-2` — Component ablation and Positioning tables)

**Interfaces:** none.

- [ ] **Step 1: Locate edit points**

```bash
grep -n "Component ablation\|full system\|Positioning\|<th class=\"ctr\">Rejection</th>" index.html
```

- [ ] **Step 2: Update the Component ablation table**

In the "Component ablation" `tbl-card`, add a third numeric header column and a YCB SR@1m value to every row, and rename the last row's label. The header row:
```html
<tr>
  <th>Variant</th>
  <th class="num">ScanNet200 mIoU</th>
  <th class="num">Nav SR@1m</th>
</tr>
```
becomes:
```html
<tr>
  <th>Variant</th>
  <th class="num">ScanNet200 mIoU</th>
  <th class="num">Nav SR@1m</th>
  <th class="num">YCB SR@1m</th>
</tr>
```
Each `<tbody>` row gets one more `<td class="num">` appended, and the last row's label changes. The full corrected `<tbody>`:
```html
<tbody>
  <tr>
    <td>w<sub>e</sub> = 1 (no reliability)</td>
    <td class="num">0.2010</td>
    <td class="num">70.5</td>
    <td class="num">55.6</td>
  </tr>
  <tr>
    <td>w<sub>e</sub> = c<sub>e</sub>n<sub>e</sub> (linear support)</td>
    <td class="num best">0.2117</td>
    <td class="num">74.4</td>
    <td class="num">50.0</td>
  </tr>
  <tr>
    <td>no synonym consolidation</td>
    <td class="num">0.2067</td>
    <td class="num">75.6</td>
    <td class="num best">61.1</td>
  </tr>
  <tr>
    <td>no low-evidence regularization</td>
    <td class="num">0.2095</td>
    <td class="num">70.5</td>
    <td class="num">50.0</td>
  </tr>
  <tr class="ours">
    <td>Default belief construction</td>
    <td class="num">0.2107</td>
    <td class="num best">76.9</td>
    <td class="num best">61.1</td>
  </tr>
</tbody>
```
(Note both the "no synonym consolidation" row and the "Default belief construction" row have `best` on their YCB column — the paper marks both as tied-best; this matches `ablation.tex`'s two `\best{61.1}` cells.)

- [ ] **Step 3: Drop the "Rejection" column from the Positioning table**

In the "Positioning" `tbl-card`, remove the `<th class="ctr">Rejection</th>` header, and remove the corresponding (middle) `<td class="ctr pos-dash">—</td>` or `<td class="ctr pos-check">✓</td>` cell from every one of the 5 rows (ConceptGraphs, HOV-SG, FSR-VLN, DualMap, OpenBelief-Nav) — each row goes from 3 data cells to 2. Do not remove or reorder any rows.

- [ ] **Step 4: Verify**

```bash
grep -n "YCB SR@1m\|Default belief construction\|full system" index.html
grep -n '<th class="ctr">Rejection</th>' index.html
```
Expected: one match for "YCB SR@1m" (header) and one for "Default belief construction"; zero matches for "full system" or the Rejection header.

- [ ] **Step 5: Visually verify**

Open `index.html`, scroll to the Component-ablation / Positioning two-column grid. Confirm the ablation table now has 4 columns and doesn't overflow its card at 390px width (it may need horizontal scroll within `tbl-scroll` — that's expected and fine), and the Positioning table now has 2 data columns with all 5 rows aligned correctly.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Add YCB column to component ablation; drop Positioning's Rejection column

Matches ablation.tex's current 4-column ablation table (adds
YCB SR@1m, renames the reference row) and related.tex's current
positioning table, which no longer has an absent-query-rejection
axis.
EOF
)"
```

---

### Task 6: Real World section rewrite

**Files:**
- Modify: `index.html` (`#realworld` section)
- Modify: `static/css/base.css` (`.cond-grid` column count)
- Create (copy): `figures/g1.jpg`, `figures/realworld_deploy.jpg` (from the paper's figures directory)

**Interfaces:** none.

- [ ] **Step 1: Locate edit points**

```bash
grep -n 'id="realworld"\|cond-grid\|Online RGB-D for perception\|being finalized for the camera-ready' index.html
grep -n '\.cond-grid' static/css/base.css
```

- [ ] **Step 2: Copy the new figure assets**

```bash
cp /home/namdp15/Workspace/VMO/vm_scene_graph/docs/OpenBelief_Nav/figures/g1.jpg \
   /home/namdp15/Workspace/VMO/vm_scene_graph/demo/openbelief-nav/.claude/worktrees/paper-content-sync/figures/g1.jpg
cp /home/namdp15/Workspace/VMO/vm_scene_graph/docs/OpenBelief_Nav/figures/realworld_deploy.jpg \
   /home/namdp15/Workspace/VMO/vm_scene_graph/demo/openbelief-nav/.claude/worktrees/paper-content-sync/figures/realworld_deploy.jpg
```
Leave `figures/realworld.png` in place (unreferenced after this task, harmless).

- [ ] **Step 3: Update the hardware card**

In the `hw-grid`, find the "Embodiment" card:
```html
<div class="hw-card reveal">
  <div class="role">Embodiment</div>
  <h4>Unitree G1 + RealSense D435i</h4>
  <p>Online RGB-D for perception, target grounding, and arrival verification.</p>
</div>
```
Change the `<p>` to:
```html
<p>Online RGB-D + LiDAR for perception, target grounding, and arrival verification.</p>
```
(Leave the `<h4>` title unchanged — it stays short; the added Livox MID-360 LiDAR is covered by "+ LiDAR" in the description.)

- [ ] **Step 4: Trim the condition grid to 2 cards**

In the `cond-grid`, delete the two `cond-card` blocks for `REMOVED` and `STALE DUPLICATE` entirely (each is a `<div class="cond-card reveal">...</div>` block — delete each one completely, tag through closing div). Keep the `CORRECT` and `CONFUSABLE` cards exactly as they are, unchanged.

- [ ] **Step 5: Fix the `.cond-grid` CSS column count**

In `static/css/base.css`, find:
```css
.cond-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 26px; }
@media (max-width: 900px) { .cond-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .cond-grid { grid-template-columns: 1fr; } }
```
Change to:
```css
.cond-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 26px; }
@media (max-width: 560px) { .cond-grid { grid-template-columns: 1fr; } }
```
(The `900px` breakpoint is dropped — `repeat(2, 1fr)` is now the base rule, so there's nothing left for that breakpoint to change.)

- [ ] **Step 6: Insert the real-world results table**

Immediately after the `cond-grid`'s closing `</div>` and before the `figure-block` that follows it, insert:

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

- [ ] **Step 7: Replace the figure with a two-image layout and real caption**

Find the `figure-block` containing `<img src="figures/realworld.png" alt="Real-world execution-grounded correction episodes" class="zoomable">` and its `figure-cap` (which currently ends "...are being finalized for the camera-ready."). Replace the entire `figure-block` div with:

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

- [ ] **Step 8: Verify**

```bash
grep -n "REMOVED\|STALE DUPLICATE\|being finalized for the camera-ready\|figures/realworld.png\"" index.html
grep -n "figures/g1.jpg\|figures/realworld_deploy.jpg" index.html
grep -n "repeat(4, 1fr)" static/css/base.css
ls -la figures/g1.jpg figures/realworld_deploy.jpg
```
Expected: zero matches for the first group (all four patterns); matches for the new figure paths; zero matches for `repeat(4, 1fr)` (only `.cond-grid` used that pattern in this file — if this grep returns a match, check it's not from an unrelated rule before treating it as a failure); both files exist.

- [ ] **Step 9: Visually verify**

Open `index.html`, scroll to the Real World section: hardware card mentions LiDAR, only 2 condition cards shown side-by-side (not stretched or empty-columned), the new results table renders above the figure, both figure images load side-by-side (stacking on narrow widths is fine — that's what `flex-wrap:wrap` does), caption reads correctly, no horizontal overflow at 390px.

- [ ] **Step 10: Commit**

```bash
git add index.html static/css/base.css figures/g1.jpg figures/realworld_deploy.jpg
git commit -m "$(cat -- <<'EOF'
Rewrite Real World section with the paper's actual results

The paper's real-world pilot changed shape entirely: 2 conditions
(not 4 — REMOVED and STALE DUPLICATE are explicitly out of scope
now), 20 total runs, and real numbers instead of "being finalized"
placeholders (6/10 -> 8/10 overall, 1/5 -> 3/5 confusable). Swaps
in the paper's current two-image figure (G1 platform + correction
episode) and fixes .cond-grid's column count for 2 cards instead
of 4.
EOF
)"
```

---

### Task 7: Remove abstention/support-test logic from JS and CSS

**Files:**
- Modify: `static/js/data.js`
- Modify: `static/js/retrieval-engine.js`
- Modify: `static/js/evidence-panel.js`
- Modify: `static/js/correction-stepper.js`
- Modify: `static/css/scene-graph.css`

**Interfaces:**
- Consumes: nothing from earlier tasks in this plan.
- Produces: `RetrievalEngine.resolve(query)` now returns `{query, ranked, winnerId, note}` (no `abstained` or `threshold` fields) — a breaking change to that method's return shape. The one call site is `scene-graph-viewer.js:107` (`const result = this.retrieval.resolve(query);`), which only reads `result.winnerId` (line 108) and passes the whole `result` object to `this.panel.showQueryResult(result, this.data.ROOMS)` (line 118) — it does not read `abstained` or `threshold` anywhere, so `scene-graph-viewer.js` needs no changes. `showQueryResult()` lives in `evidence-panel.js`, which this same task updates in Step 4. This has already been confirmed by grepping every `.js` file for `abstained`/`winnerId`/`.resolve(` — do not re-derive it, just proceed.

- [ ] **Step 1: Locate every edit point**

```bash
cd /home/namdp15/Workspace/VMO/vm_scene_graph/demo/openbelief-nav/.claude/worktrees/paper-content-sync
grep -n "TAU_S\|abstained\|abstain\|τₛ" static/js/data.js static/js/retrieval-engine.js static/js/evidence-panel.js static/js/correction-stepper.js
grep -n "q-chip.absent" static/css/scene-graph.css
```

- [ ] **Step 2: Edit `data.js`**

Remove the `TAU_S` constant:
```js
const TAU_S = 0.30;
```
and update the export line:
```js
global.OBN.SceneGraphData = { ROOMS, OBJECTS, TAU_S, QUERIES };
```
to:
```js
global.OBN.SceneGraphData = { ROOMS, OBJECTS, QUERIES };
```
Update the `"washing machine"` entry in `QUERIES`:
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

- [ ] **Step 3: Edit `retrieval-engine.js`**

Update the file's header comment. Change:
```
   No DOM access and no three.js here: this module only turns
   (query string, data) into a result. That keeps the retrieval
   *rule* (support test → select-or-abstain) testable and reusable
   independently of how it happens to be drawn on screen —
   the Dependency Inversion seam the viewer is built against.
```
to:
```
   No DOM access and no three.js here: this module only turns
   (query string, data) into a ranked result. That keeps the
   retrieval rule (rank candidates, return the argmax) testable
   and reusable independently of how it happens to be drawn on
   screen — the Dependency Inversion seam the viewer is built against.
```
Remove `this._tau = data.TAU_S;` from the constructor.
Update the `resolve()` JSDoc:
```js
    /**
     * Resolve a canned query against the support threshold.
     * @returns {{query:string, ranked:Array<{id:string,object:object,score:number}>,
     *            winnerId:string|null, abstained:boolean, threshold:number, note:string}}
     */
```
to:
```js
    /**
     * Resolve a canned query to its ranked candidates.
     * @returns {{query:string, ranked:Array<{id:string,object:object,score:number}>,
     *            winnerId:string|null, note:string}}
     */
```
Replace the `resolve()` method body:
```js
    resolve(query) {
      const spec = this._queries[query];
      if (!spec) throw new Error("Unknown query: " + query);

      const ranked = spec.top.map(([id, score]) => ({
        id, score, object: this._objectsById.get(id)
      }));
      const topScore = ranked.length ? ranked[0].score : -Infinity;
      const abstained = topScore < this._tau;

      return {
        query,
        ranked,
        winnerId: abstained ? null : ranked[0].id,
        abstained,
        threshold: this._tau,
        note: spec.note
      };
    }
```
with:
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

- [ ] **Step 4: Edit `evidence-panel.js`**

In `showQueryResult()`, change:
```js
      result.ranked.forEach((cand, i) => {
        const win = !result.abstained && i === 0;
```
to:
```js
      result.ranked.forEach((cand, i) => {
        const win = i === 0;
```
Replace:
```js
      if (result.abstained) {
        html += '<div class="q-verdict abstain"><span class="vt">⛔ ABSTAIN</span>' +
          "max Sᵢ = " + result.ranked[0].score.toFixed(2) + " &lt; τₛ = " + result.threshold.toFixed(2) + ". " +
          esc(result.note) + "</div>";
      } else {
        html += '<div class="q-verdict ok"><span class="vt">✓ TARGET SELECTED · goal ring placed</span>' +
          "S = " + result.ranked[0].score.toFixed(2) + " ≥ τₛ = " + result.threshold.toFixed(2) + ". " +
          esc(result.note) + "</div>";
      }
```
with:
```js
      html += '<div class="q-verdict ok"><span class="vt">✓ TARGET SELECTED · goal ring placed</span>' +
        "S = " + result.ranked[0].score.toFixed(2) + " — highest-scoring candidate. " +
        esc(result.note) + "</div>";
```

- [ ] **Step 5: Edit `correction-stepper.js`**

In the `STEPS` array, STEP 2 ("Retrieve"), change:
```js
      body: "The support test passes (0.41 ≥ τₛ), so retrieval selects the argmax: " +
        "<b>i₀ = n17</b>, the stale office-desk candidate. A reachable goal is sampled around its boundary.",
```
to:
```js
      body: "Retrieval selects the argmax over untried candidates: " +
        "<b>i₀ = n17</b>, the stale office-desk candidate. A reachable goal is sampled around its boundary.",
```
STEP 4 ("Re-ground the verbatim query"), change:
```js
      body: "Exactly one thing changes: <b>𝓡_q = {n17}</b>. The graph is untouched, the query is not rewritten. " +
        "Retrieval reruns over the remaining candidates and selects <b>n09</b> on the kitchen counter (0.38 ≥ τₛ).",
```
to:
```js
      body: "Exactly one thing changes: <b>𝓡_q = {n17}</b>. The graph is untouched, the query is not rewritten. " +
        "Retrieval reruns over the remaining candidates and selects <b>n09</b>, the next-highest remaining candidate, on the kitchen counter.",
```
STEP 6 ("Episode ends — map intact"), change:
```js
      body: "The binding was corrected, not the map: <b>n17 was never deleted</b>, and its rejection is scoped " +
        "to this query only. Had no supported candidate remained (removed-target condition), the loop would " +
        "have ended in an honest <b>ABSTAIN</b> instead of a confident wrong answer.",
```
to:
```js
      body: "The binding was corrected, not the map: <b>n17 was never deleted</b>, and its rejection is scoped " +
        "to this query only. Had no untried candidate remained, the loop would have returned <b>NONE</b> — " +
        "not a claim the object is absent, only that every mapped candidate for this query has been tried.",
```

- [ ] **Step 6: Edit `scene-graph.css`**

Remove these two rules entirely:
```css
.q-chip.absent { border-style: dashed; }
.q-chip.absent.active { background: var(--reject); border-color: var(--reject); }
```

- [ ] **Step 7: Verify**

```bash
grep -n "TAU_S\|abstained\|abstain\|τₛ\|ABSTAIN" static/js/*.js
grep -n "q-chip.absent" static/css/scene-graph.css
```
Expected: zero matches for both commands.

- [ ] **Step 8: Visually/functionally verify**

Open `index.html` in a browser. Click every hero query chip (sofa, fire extinguisher, somewhere to sit, washing machine) — each should render a "✓ TARGET SELECTED" verdict in the side panel (never an ABSTAIN state, since that code path no longer exists). Open the browser console and confirm no JS errors on load or on any query-chip click. Step through the `#correction` walkthrough end to end and confirm its text no longer mentions `τₛ` or a threshold comparison.

- [ ] **Step 9: Commit**

```bash
git add static/js/data.js static/js/retrieval-engine.js static/js/evidence-panel.js static/js/correction-stepper.js static/css/scene-graph.css
git commit -m "$(cat <<'EOF'
Remove abstention/support-test mechanism from the interactive demo

The paper no longer claims absent-query rejection (confirmed with
the human partner): methodology.tex's retrieve() has no support
threshold, and its NONE sentinel explicitly is not an absent-query
prediction. Drops TAU_S and the abstained/threshold fields from
RetrievalEngine.resolve(), the ABSTAIN rendering branch in
EvidencePanel, the correction-stepper's ABSTAIN narrative beat, and
the now-unused .q-chip.absent CSS rules. Every query now always
resolves to its argmax candidate, matching the paper's current
retrieval rule.
EOF
)"
```
