/* ============================================================
   correction-stepper.js — the execution-grounded correction
   walkthrough: retrieve → navigate → verify → reject →
   re-ground → confirm, stepped over a small top-down SVG map.

   Single Responsibility: this module owns the step sequence and
   the map/side-panel DOM it drives. Step content is pure data
   (STEPS), kept separate from the rendering that applies it.
============================================================ */
(function (global) {
  "use strict";

  const ROBOT_POS = [[226, 164], [226, 164], [344, 232], [344, 232], [286, 80], [286, 80]];

  const STEPS = [
    {
      title: "Two hypotheses in the map",
      body: 'The frozen graph holds two nodes matching “mug”: <b>n17</b> on the office desk (S = 0.41) and ' +
        '<b>n09</b> on the kitchen counter (S = 0.38). Unknown to the map, the mug was moved off the desk ' +
        "after mapping — n17 is stale.",
      outcome: null
    },
    {
      title: "Retrieve",
      body: "The support test passes (0.41 ≥ τₛ), so retrieval selects the argmax: " +
        "<b>i₀ = n17</b>, the stale office-desk candidate. A reachable goal is sampled around its boundary.",
      outcome: ["neutral", "TARGET: n17 · office desk"]
    },
    {
      title: "Navigate + verify on arrival",
      body: "The robot arrives and takes a bounded RGB-D observation. The ordered verifier runs:" +
        '<div class="ep-check pass"><span class="ic">✓</span><span>visibility ν = 0.82 ≥ τ_vis — the candidate can be judged</span></div>' +
        '<div class="ep-check fail"><span class="ic">✗</span><span>semantic s_loc = 0.19 &lt; τ_q — nothing mug-like in view</span></div>' +
        '<div class="ep-check na"><span class="ic">·</span><span>geometric test not reached</span></div>',
      outcome: ["reject", "REJECT n17"]
    },
    {
      title: "Re-ground the verbatim query",
      body: "Exactly one thing changes: <b>𝓡_q = {n17}</b>. The graph is untouched, the query is not rewritten. " +
        "Retrieval reruns over the remaining candidates and selects <b>n09</b> on the kitchen counter (0.38 ≥ τₛ).",
      outcome: ["neutral", "TARGET: n09 · kitchen counter"]
    },
    {
      title: "Navigate + verify again",
      body: "At the kitchen counter:" +
        '<div class="ep-check pass"><span class="ic">✓</span><span>visibility ν = 0.91 ≥ τ_vis</span></div>' +
        '<div class="ep-check pass"><span class="ic">✓</span><span>semantic s_loc = 0.64 ≥ τ_q</span></div>' +
        '<div class="ep-check pass"><span class="ic">✓</span><span>geometric overlap Ω_r = 0.81 ≥ τ_arr — right instance, not just right category</span></div>',
      outcome: ["confirm", "CONFIRM n09"]
    },
    {
      title: "Episode ends — map intact",
      body: "The binding was corrected, not the map: <b>n17 was never deleted</b>, and its rejection is scoped " +
        "to this query only. Had no supported candidate remained (removed-target condition), the loop would " +
        "have ended in an honest <b>ABSTAIN</b> instead of a confident wrong answer.",
      outcome: ["confirm", "TERMINATED: CONFIRM"]
    }
  ];

  class CorrectionStepper {
    constructor(els) {
      this.els = els;
      this.step = 0;

      els.pipsBox.innerHTML = STEPS.map(() => '<span class="ep-pip"></span>').join("");
      this._pips = [...els.pipsBox.children];

      els.prevBtn.addEventListener("click", () => { if (this.step > 0) { this.step--; this._render(); } });
      els.nextBtn.addEventListener("click", () => {
        this.step = this.step === STEPS.length - 1 ? 0 : this.step + 1;
        this._render();
      });

      this._render();
    }

    _render() {
      const s = STEPS[this.step];
      const e = this.els;

      e.label.textContent = "STEP " + this.step + " / " + (STEPS.length - 1);
      e.title.textContent = s.title;
      e.body.innerHTML = s.body +
        (s.outcome ? '<br><span class="ep-outcome ' + s.outcome[0] + '">' + s.outcome[1] + "</span>" : "");
      this._pips.forEach((p, i) => p.classList.toggle("on", i <= this.step));
      e.prevBtn.disabled = this.step === 0;
      e.prevBtn.style.opacity = this.step === 0 ? .4 : 1;
      e.nextBtn.textContent = this.step === STEPS.length - 1 ? "↺ Restart" : "Next →";

      this._renderMap();
    }

    _renderMap() {
      const e = this.els;
      const [rx, ry] = ROBOT_POS[this.step];
      e.robot.style.transform = "translate(" + rx + "px," + ry + "px)";

      e.cand1.setAttribute("class", "m-cand " + (this.step >= 3 ? "rejected" : (this.step >= 1 ? "hot" : "")));
      e.cand2.setAttribute("class", "m-cand " + (this.step >= 5 ? "confirmed" : (this.step >= 3 ? "hot" : "")));
      e.cand1Label.style.fill = this.step >= 3 ? "#D6453D" : (this.step >= 1 ? "#8B7CF7" : "#5F7196");
      e.cand2Label.style.fill = this.step >= 5 ? "#2FCB93" : (this.step >= 3 ? "#8B7CF7" : "#5F7196");
      e.xMarkA.classList.toggle("show", this.step >= 3);
      e.xMarkB.classList.toggle("show", this.step >= 3);
      e.path1.classList.toggle("draw", this.step === 2);
      e.path2.classList.toggle("draw", this.step === 4);
    }
  }

  global.OBN = global.OBN || {};
  global.OBN.CorrectionStepper = CorrectionStepper;
})(window);
