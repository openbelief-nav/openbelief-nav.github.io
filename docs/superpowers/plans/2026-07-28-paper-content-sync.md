# Paper Content Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync `index.html` with the current paper source (`/home/namdp15/Workspace/VMO/vm_scene_graph/docs/OpenBelief_Nav`) by adding the three pieces of paper content the site is missing: a new semantic-readout ablation table, one sentence of related-work framing, and a real-world trial-count detail.

**Architecture:** Pure static-HTML content edits to `index.html`. No JS, CSS, or data-model changes — every new element reuses existing CSS classes (`tbl-card`, `res`, `dataset-band`, `num`, `best`, `ours`) already defined in `static/css/base.css`.

**Tech Stack:** Plain HTML, no build step (`file://`-compatible).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-paper-content-sync-design.md` (approved 2026-07-28).
- Only `index.html` is modified. Do not touch `static/js/*` or `static/css/*`.
- Do not fill in any value the paper itself still marks `\tbd{}`.
- The Positioning table's FSR-VLN row already exists (`index.html:691-696`) — confirmed present, no task touches it.
- Every new/changed number must match its cited paper source exactly (see each task's Source).

---

### Task 1: Add "Semantic readout ablation" table

**Files:**
- Modify: `index.html:616-618` (insert a new `tbl-card` between the closing `</div>` of the navigation-results `tbl-card` and the opening `<div class="card-grid cols-2">`)

**Source:** `docs/OpenBelief_Nav/sections/experiment.tex`, Table `semseg_ablation` (lines 46-68 of that file).

**Interfaces:**
- Consumes: nothing (static content, no JS hooks).
- Produces: nothing consumed by later tasks — Tasks 2 and 3 touch unrelated parts of the file.

- [ ] **Step 1: Confirm the insertion point and that no such table exists yet**

Run:
```bash
grep -n "Semantic readout ablation\|card-grid cols-2" index.html
```
Expected: no match for "Semantic readout ablation"; one match for `card-grid cols-2` at line 618. If the line number differs from 618, use that line number as the insertion point instead (insert immediately before it).

- [ ] **Step 2: Insert the new table**

In `index.html`, immediately before the line containing `<div class="card-grid cols-2">` (currently line 618) and immediately after the closing `</div>` of the previous `tbl-card` (currently line 616-617, i.e. right after the navigation-results table's closing `</div>\n</div>` and before the blank line + `card-grid` div), insert:

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
                <th class="num">AUC ↑</th>
              </tr>
            </thead>
            <tbody>
              <tr class="dataset-band">
                <td colspan="3">ScanNet200</td>
              </tr>
              <tr>
                <td>Visual-only</td>
                <td class="num">0.1286</td>
                <td class="num">0.8888</td>
              </tr>
              <tr>
                <td>Consensus-only</td>
                <td class="num">0.2107</td>
                <td class="num">0.9480</td>
              </tr>
              <tr>
                <td>Early-commit</td>
                <td class="num">0.2393</td>
                <td class="num">0.9353</td>
              </tr>
              <tr class="ours">
                <td>Full posterior</td>
                <td class="num best">0.2742</td>
                <td class="num best">0.9531</td>
              </tr>
              <tr class="dataset-band">
                <td colspan="3">Replica</td>
              </tr>
              <tr>
                <td>Visual-only</td>
                <td class="num">0.2287</td>
                <td class="num">0.9136</td>
              </tr>
              <tr>
                <td>Consensus-only</td>
                <td class="num">0.2831</td>
                <td class="num">0.9080</td>
              </tr>
              <tr>
                <td>Early-commit</td>
                <td class="num">0.2701</td>
                <td class="num">0.9230</td>
              </tr>
              <tr class="ours">
                <td>Full posterior</td>
                <td class="num best">0.2912</td>
                <td class="num best">0.9365</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
```

This reuses the exact same `tbl-card` / `tbl-scroll` / `table.res` / `dataset-band` / `ours` / `num best` classes as the existing segmentation table above it (`index.html:463-550`) — no new CSS needed.

- [ ] **Step 3: Verify the table was inserted correctly**

Run:
```bash
grep -n "Semantic readout ablation" index.html
grep -c "Full posterior" index.html
```
Expected: one match for the heading; `Full posterior` appears exactly 2 times (ScanNet200 + Replica rows).

- [ ] **Step 4: Open the page and visually verify**

Open `index.html` directly in a browser (`file://` path) or via a local static server, scroll to the Results section. Confirm:
- The new table renders between the navigation-results table and the "Component ablation / Positioning" two-column grid.
- No horizontal page overflow at narrow widths (resize to ~390px).
- No console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Add semantic readout ablation table to results section

Reports the paper's internal readout comparison (visual-only /
consensus / early-commit / posterior, mIoU + AUC) that wasn't
previously shown on the site.
EOF
)"
```

---

### Task 2: Add related-work sentence to the "Why" section

**Files:**
- Modify: `index.html:145-146`

**Source:** `docs/OpenBelief_Nav/sections/related.tex` (ConceptFusion, VLMaps, Clio, OGScene3D, ThinkGraphs citations).

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Confirm current wording**

Run:
```bash
grep -n "ConceptGraphs, HOV-SG, FSR-VLN, and DualMap" index.html
```
Expected: one match, currently reading:
```
        ConceptGraphs, HOV-SG, FSR-VLN, and DualMap all resolve that disagreement <b>at construction time</b>,
        exposing each object as one fused feature, label, or consensus state. Three things go wrong.
```

- [ ] **Step 2: Append the new sentence**

Replace:
```html
        ConceptGraphs, HOV-SG, FSR-VLN, and DualMap all resolve that disagreement <b>at construction time</b>,
        exposing each object as one fused feature, label, or consensus state. Three things go wrong.
      </p>
```
with:
```html
        ConceptGraphs, HOV-SG, FSR-VLN, and DualMap all resolve that disagreement <b>at construction time</b>,
        exposing each object as one fused feature, label, or consensus state. Related approaches push on
        adjacent axes without changing this pattern: ConceptFusion and VLMaps embed features densely rather
        than per object, Clio clusters around a task fixed at mapping time, and OGScene3D and ThinkGraphs
        refine tracking and confidence while still exposing a single committed state per object. Three things
        go wrong.
      </p>
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -n "ConceptFusion and VLMaps" index.html
```
Expected: one match.

- [ ] **Step 4: Visually verify**

Open `index.html`, scroll to the "The problem" / "Why" section, confirm the paragraph reads naturally and doesn't overflow its container at narrow widths.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Name adjacent related work in the Why section

Adds one sentence covering ConceptFusion, VLMaps, Clio, OGScene3D,
and ThinkGraphs, the paper's newer citations that share the same
early-commitment framing as the section's existing argument.
EOF
)"
```

---

### Task 3: Add trial-count detail to Real World section

**Files:**
- Modify: `index.html:782-783`

**Source:** `docs/OpenBelief_Nav/sections/experiment.tex`, Table `tab:realworld` (lines 171-194 of that file): 6 trials without correction + 8 trials with correction, per condition, across 4 conditions = 56 trials total.

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Confirm current wording**

Run:
```bash
grep -n "being finalized for the camera-ready" index.html
```
Expected: one match, currently reading:
```
          remains. In both cases the persistent graph and the instruction are unchanged. Quantitative results across
          the four conditions are being finalized for the camera-ready.</div>
```

- [ ] **Step 2: Add the trial count**

Replace:
```html
          remains. In both cases the persistent graph and the instruction are unchanged. Quantitative results across
          the four conditions are being finalized for the camera-ready.</div>
```
with:
```html
          remains. In both cases the persistent graph and the instruction are unchanged. Quantitative results across
          the four conditions (56 trials total — 6 without correction / 8 with correction per condition) are
          being finalized for the camera-ready.</div>
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -n "56 trials total" index.html
```
Expected: one match.

- [ ] **Step 4: Visually verify**

Open `index.html`, scroll to the "Real world" section figure caption, confirm it reads naturally and doesn't overflow its container at narrow widths.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Add trial-count detail to real-world figure caption

States the paper's per-condition trial counts (6 without / 8 with
correction, 4 conditions, 56 total) alongside the existing
"being finalized" note.
EOF
)"
```
