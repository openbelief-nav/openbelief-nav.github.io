/* ============================================================
   retrieval-engine.js — pure query-resolution logic for the
   scene-graph demo.

   No DOM access and no three.js here: this module only turns
   (query string, data) into a ranked result. That keeps the
   retrieval rule (rank candidates, return the argmax) testable
   and reusable independently of how it happens to be drawn on
   screen — the Dependency Inversion seam the viewer is built against.
============================================================ */
(function (global) {
  "use strict";

  class RetrievalEngine {
    constructor(data) {
      this._objectsById = new Map(data.OBJECTS.map(o => [o.id, o]));
      this._queries = data.QUERIES;
    }

    /** @returns {string[]} the canned query strings available to try. */
    availableQueries() {
      return Object.keys(this._queries);
    }

    /**
     * Resolve a canned query to its ranked candidates.
     * @returns {{query:string, ranked:Array<{id:string,object:object,score:number}>,
     *            winnerId:string|null, note:string}}
     */
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
  }

  global.OBN = global.OBN || {};
  global.OBN.RetrievalEngine = RetrievalEngine;
})(window);
