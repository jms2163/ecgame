// Reconcile Atom Lab discoveries from released saves without changing save versions.
import gameState from "./GameState.js";
import GameStateManager from "./GameStateManager.js";
import { elementLibrary } from "../data/elementLibrary.js";

const isotopeEntries = Object.entries(elementLibrary);
const symbols = new Set(isotopeEntries.map(([, element]) => element.symbol));
const oldSymbols = Object.freeze({ Uue: "Hr", " Uue ": "Hr", " Ubn ": "Ubn" });
const oldIsotopeIds = Object.freeze({
    " Uue 295": "E119", "Uue 295": "E119", "Hr295": "E119",
    " Ubn 298": "E120", "Ubn 298": "E120"
});

function mergeRecord(bucket, oldId, id) {
    if (!bucket[oldId]) return false;
    if (!bucket[id]) bucket[id] = bucket[oldId];
    else if (bucket[id] !== bucket[oldId]) {
        bucket[id].count = Math.max(bucket[id].count || 0, bucket[oldId].count || 0);
        const dates = [bucket[id].discoveredAt, bucket[oldId].discoveredAt]
            .filter(Number.isFinite);
        if (dates.length) bucket[id].discoveredAt = Math.min(...dates);
    }
    delete bucket[oldId];
    return true;
}

const AtomLabProgress = {
    total: symbols.size,

    reconcile() {
        const atoms = gameState.discoveries?.atoms;
        if (!atoms) return { count: 0, total: this.total, changed: false };
        let changed = false;

        // Released builds stored these symbols with spaces. Keep the discovery
        // record (and its timestamp/count) under the current symbol.
        for (const [oldSymbol, symbol] of Object.entries(oldSymbols)) {
            if (mergeRecord(atoms, oldSymbol, symbol)) changed = true;
        }

        // An isotope record is proof of a successful synthesis. Restore an atom
        // discovery if an older save omitted its corresponding atom key.
        const isotopes = gameState.discoveries?.isotopes || {};
        for (const [oldId, id] of Object.entries(oldIsotopeIds)) {
            if (mergeRecord(isotopes, oldId, id)) changed = true;
        }
        for (const [id, element] of isotopeEntries) {
            if (isotopes[id] && !atoms[element.symbol]) {
                atoms[element.symbol] = {
                    discoveredAt: isotopes[id].discoveredAt || Date.now(),
                    count: 1
                };
                changed = true;
            }
        }

        const count = [...symbols].filter(symbol => Boolean(atoms[symbol])).length;
        if (count === this.total && !gameState.zones.atomLab.completed) {
            GameStateManager.setZoneCompleted("atomLab", true);
            changed = true;
        }
        return { count, total: this.total, changed };
    }
};

export default AtomLabProgress;
