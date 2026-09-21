// --------------------------------------------------
// ATPDemandCatalog.js
// Continuous ATP costs derived from active cell behavior.
// Values are gameplay rates, not biochemical stoichiometry.
// --------------------------------------------------

const DEMANDS = Object.freeze({
    pondAnchoring: Object.freeze({
        id: "pondAnchoring",
        name: "Pond Anchoring",
        activationType: "pond-anchored",
        atpPerMinute: 2,
        reserveFraction: 0.10
    })
});

const ATPDemandCatalog = Object.freeze({
    get(demandId) {
        return DEMANDS[demandId] ?? null;
    },

    getAll() {
        return Object.values(DEMANDS);
    }
});

export default ATPDemandCatalog;
