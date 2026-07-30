/* ============================================================
   evidence-panel.js — renders the dark side panel next to the
   3D viewport: the default "what is this?" blurb, a selected
   object's evidence-preserving belief, or a resolved query.

   Single Responsibility: this class only turns plain state
   (an object record, a RetrievalEngine result, a summary) into
   panel markup. It never reaches into three.js or the scene
   data itself — everything it needs is passed in, so it can be
   swapped, tested, or reused without touching scene code.
============================================================ */
(function (global) {
  "use strict";

  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  class EvidencePanel {
    /**
     * @param {HTMLElement} titleEl
     * @param {HTMLElement} bodyEl
     * @param {HTMLElement} clearBtnEl
     */
    constructor(titleEl, bodyEl, clearBtnEl) {
      this.titleEl = titleEl;
      this.bodyEl = bodyEl;
      this.clearBtnEl = clearBtnEl;
    }

    _setClearVisible(visible) {
      this.clearBtnEl.classList.toggle("show", visible);
    }

    /** @param {{rooms:number, objectNodes:number, observationsKept:number}} summary */
    showDefault(summary) {
      this.titleEl.textContent = "Evidence-preserving node";
      this._setClearVisible(false);
      this.bodyEl.innerHTML =
        '<div class="ev-empty">' +
        '<div class="big">Every box is a belief.</div>' +
        "This is the hierarchy OpenBelief-Nav builds: metric geometry, object nodes, rooms, building. " +
        "Click any object to open its preserved evidence — phrases, weights, provenance — exactly what a " +
        "committed label would have thrown away." +
        '<div class="ev-stats">' +
        '<div class="ev-stat"><div class="n">' + summary.rooms + '</div><div class="l">ROOMS</div></div>' +
        '<div class="ev-stat"><div class="n">' + summary.objectNodes + '</div><div class="l">OBJECT NODES</div></div>' +
        '<div class="ev-stat"><div class="n">' + summary.observationsKept + '</div><div class="l">OBSERVATIONS KEPT</div></div>' +
        '<div class="ev-stat"><div class="n">0</div><div class="l">LABELS COMMITTED</div></div>' +
        "</div></div>";
    }

    /**
     * @param {object} obj a SceneGraphData object record
     * @param {{name:string, css:string}} roomMeta
     */
    showObject(obj, roomMeta) {
      this.titleEl.textContent = "Object evidence";
      this._setClearVisible(true);
      const lam = obj.trust === "trusted" ? "0.2" : "0.7";

      let html =
        '<div class="ev-obj-name">' + esc(obj.belief[0][0]) + "</div>" +
        '<div class="ev-obj-room" style="color:' + roomMeta.css + '">● ' + esc(roomMeta.name) + "</div>" +
        '<span class="trust-badge ' + obj.trust + '">' + (obj.trust === "trusted" ? "✓ TRUSTED" : "◐ DEGRADED") +
        " · \\(\\rho_i\\)</span>" +
        '<div class="ev-sec-label">Semantic belief \\(\\mathbf{p}_i\\) (Dirichlet-smoothed)</div>';

      obj.belief.forEach(([c, p]) => {
        html += '<div class="belief-row"><div class="top"><span class="c">' + esc(c) +
          '</span><span class="p">' + p.toFixed(2) + "</span></div>" +
          '<div class="belief-track"><div class="belief-fill" data-w="' + (p * 100) + '"></div></div></div>';
      });

      html += '<div class="ev-sec-label">Provenance \\(\\pi_i\\) (frame · mask)</div><div class="prov-chips">';
      const nProv = Math.min(obj.obs, 5);
      for (let k = 0; k < nProv; k++) {
        const t = 12 + (obj.id.length * 7 + k * 41) % 880;
        const j = (obj.id.length + k * 3) % 8;
        html += '<span class="prov-chip">t=' + t + " · m" + j + "</span>";
      }
      if (obj.obs > nProv) html += '<span class="prov-chip">+' + (obj.obs - nProv) + " more</span>";
      html += "</div>" +
        '<div class="ev-note">' + obj.obs + " observations preserved — none fused away. Retrieval fusion weight " +
        "<code>\\(\\lambda_i\\) = " + lam + "</code>" +
        (obj.trust === "trusted" ? " — a confident node trusts its text head." :
          " — an ambiguous belief leans on the visual channel instead.") +
        "</div>";

      this.bodyEl.innerHTML = html;
      if (window.renderMathInElement) {
        window.renderMathInElement(this.bodyEl, {
          delimiters: [{left: '\\(', right: '\\)', display: false}],
          throwOnError: false
        });
      }
      requestAnimationFrame(() => {
        this.bodyEl.querySelectorAll(".belief-fill").forEach(el => { el.style.width = el.dataset.w + "%"; });
      });
    }

    /**
     * @param {import('./retrieval-engine.js').ResolvedQuery} result
     * @param {Object<string,{name:string}>} roomsByRoomId
     */
    showQueryResult(result, roomsByRoomId) {
      this.titleEl.textContent = "Free-form retrieval";
      this._setClearVisible(true);

      let html = '<div class="q-result-head">q = <b>“' + esc(result.query) + '”</b><br>' +
        '<span style="font-family:var(--mono);font-size:11px">Sᵢ(q) = λᵢ⟨fᵢᵛ,f_q⟩ + (1−λᵢ)⟨fᵢᵗ,f_q⟩</span></div>' +
        '<div class="q-rank">';

      result.ranked.forEach((cand, i) => {
        const win = i === 0;
        html += '<div class="q-cand' + (win ? " winner" : "") + '">' +
          '<span class="rk">#' + (i + 1) + "</span>" +
          '<span class="nm">' + esc(cand.object.belief[0][0]) + ' <span style="color:#7C90B8;font-size:11px">(' +
          esc(roomsByRoomId[cand.object.room].name) + ")</span></span>" +
          '<span class="sc">' + cand.score.toFixed(2) + "</span></div>";
      });
      html += "</div>";

      html += '<div class="q-verdict ok"><span class="vt">✓ TARGET SELECTED · goal ring placed</span>' +
        "S = " + result.ranked[0].score.toFixed(2) + " — highest-scoring candidate. " +
        esc(result.note) + "</div>";
      this.bodyEl.innerHTML = html;
    }
  }

  global.OBN = global.OBN || {};
  global.OBN.EvidencePanel = EvidencePanel;
})(window);
