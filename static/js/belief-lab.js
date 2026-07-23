/* ============================================================
   belief-lab.js — the observation-streaming widget: plays a
   sequence of noisy phrase observations into a node and shows
   the Dirichlet-smoothed concept belief forming, with synonym
   consolidation and alpha as live toggles.

   Single Responsibility: this module owns one widget's state
   and DOM. It doesn't touch the scene graph or any other
   widget; belief math (compute()) is kept separate from
   rendering (render()) so the update rule stays easy to read.
============================================================ */
(function (global) {
  "use strict";

  // One high-support erroneous "chair" observation is built to beat the
  // split sofa/couch/loveseat votes when synonym consolidation is off.
  const STREAM = [
    { ph: "sofa",     c: .90, n: 4489, syn: "sofa" },
    { ph: "chair",    c: .88, n: 6400, syn: "chair", err: true },
    { ph: "couch",    c: .86, n: 4096, syn: "sofa" },
    { ph: "loveseat", c: .76, n: 2500, syn: "sofa" },
    { ph: "bench",    c: .50, n: 400,  syn: "bench" }
  ].map(o => ({ ...o, w: o.c * Math.sqrt(o.n) }));

  class BeliefLabWidget {
    constructor(els) {
      this.els = els;
      this.revealed = 0;
      this.timer = null;

      els.obsList.innerHTML = STREAM.map(o =>
        '<div class="obs-item">' +
        '<span class="ph">“' + o.ph + '”</span>' +
        '<span class="meta">c=' + o.c.toFixed(2) + " · n=" + o.n + '</span>' +
        '<span class="w">w=' + o.w.toFixed(0) + "</span></div>"
      ).join("");
      this._obsEls = [...els.obsList.children];

      els.playBtn.addEventListener("click", () => this._play());
      els.resetBtn.addEventListener("click", () => this._reset());
      els.consolidateToggle.addEventListener("change", () => this._render());
      els.alphaSlider.addEventListener("input", () => {
        els.alphaLabel.textContent = this._alphaValue().toFixed(1);
        this._render();
      });

      this._render();
    }

    _alphaValue() { return this.els.alphaSlider.value / 10; }

    /** Pure belief computation: active observations → sorted concept rows. */
    _computeConcepts() {
      const consolidate = this.els.consolidateToggle.checked;
      const active = STREAM.slice(0, this.revealed);
      const groups = {};
      active.forEach(o => {
        const key = consolidate ? o.syn : o.ph;
        if (!groups[key]) groups[key] = { v: 0, members: new Set(), err: false };
        groups[key].v += o.w;
        groups[key].members.add(o.ph);
        if (o.err) groups[key].err = true;
      });

      const alpha = this._alphaValue() * 40; // scaled to be visible against these vote magnitudes
      const keys = Object.keys(groups);
      const K = keys.length;
      const total = keys.reduce((s, k) => s + groups[k].v, 0);

      return keys
        .map(k => ({
          name: k,
          members: [...groups[k].members],
          v: groups[k].v,
          p: K ? (groups[k].v + alpha) / (total + alpha * K) : 0,
          err: groups[k].err
        }))
        .sort((a, b) => b.p - a.p);
    }

    _render() {
      const consolidate = this.els.consolidateToggle.checked;
      const rows = this._computeConcepts();
      const errWinning = rows.length > 0 && rows[0].err;

      this._obsEls.forEach((el, i) => {
        el.classList.toggle("on", i < this.revealed);
        el.classList.toggle("err", i < this.revealed && !!STREAM[i].err && !consolidate && errWinning);
      });

      this.els.conceptRows.innerHTML = rows.map((r, i) => {
        const cls = r.err && i === 0 ? "bad" : (i === 0 ? "win" : "lose");
        const members = consolidate && r.members.length > 1 ?
          ' <span class="members">{' + r.members.join(", ") + "}</span>" : "";
        return '<div class="concept-row"><div class="head">' +
          '<span class="cname">' + r.name + members + "</span>" +
          '<span class="cval">V=' + r.v.toFixed(0) + " · p=" + r.p.toFixed(2) + "</span></div>" +
          '<div class="concept-track"><div class="concept-fill ' + cls + '" data-w="' + (r.p * 100) + '"></div></div></div>';
      }).join("") || '<div style="color:var(--muted);font-size:13.5px">No observations yet.</div>';

      requestAnimationFrame(() => {
        this.els.conceptRows.querySelectorAll(".concept-fill").forEach(el => { el.style.width = el.dataset.w + "%"; });
      });

      this._renderVerdict(errWinning);
    }

    _renderVerdict(errWinning) {
      const v = this.els.verdict;
      if (this.revealed === 0) {
        v.className = "lab-verdict";
        v.innerHTML = "Press play to stream observations into the node.";
      } else if (this.revealed < 3) {
        v.className = "lab-verdict";
        v.innerHTML = "<b>ρᵢ = degraded</b> — only " + this.revealed +
          " observation" + (this.revealed > 1 ? "s" : "") +
          ": the node is marked low-evidence, and retrieval leans on the visual channel (λᵢ = 0.7).";
      } else if (errWinning) {
        v.className = "lab-verdict bad";
        v.innerHTML = "<b>vote splitting:</b> “sofa”, “couch”, “loveseat” divide their support, so the " +
          "single high-support “chair” observation wins the argmax. This is what synonym consolidation prevents.";
      } else {
        v.className = "lab-verdict good";
        v.innerHTML = "<b>ρᵢ = trusted</b> — lexical variants pooled into one concept; the erroneous " +
          "“chair” stays a separate, losing hypothesis. Nothing was deleted: every phrase remains recoverable.";
      }
    }

    _play() {
      if (this.timer) return;
      if (this.revealed >= STREAM.length) this.revealed = 0;
      this.timer = setInterval(() => {
        this.revealed++;
        this._render();
        if (this.revealed >= STREAM.length) { clearInterval(this.timer); this.timer = null; }
      }, 650);
    }

    _reset() {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      this.revealed = 0;
      this._render();
    }
  }

  global.OBN = global.OBN || {};
  global.OBN.BeliefLabWidget = BeliefLabWidget;
})(window);
