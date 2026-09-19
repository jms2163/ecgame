// --------------------------------------------------
// ATPProductionCatalog.js
// Pure definitions for connected-browser ATP production.
//
// These values are gameplay rates, not claims about biochemical turnover.
// Runtime activation is derived from authoritative Polymerizer and
// Metabolism state; no second saved ATP-rate value is maintained.
// --------------------------------------------------

const SOURCES = Object.freeze({
    baseMetabolism: Object.freeze({
        id: "baseMetabolism",
        name: "Base Metabolism",
        activationType: "always",
        atpPerMinute: 1,
        increasesCapacity: false
    }),

    energyKinase: Object.freeze({
        id: "energyKinase",
        name: "Energy Kinase",
        activationType:
            "polymerizer-product",
        productId: "EnergyKinase",
        minimumCount: 1,
        atpPerMinute: 2,
        increasesCapacity: false
    }),

    glycolysisCore: Object.freeze({
        id: "glycolysisCore",
        name: "Glycolysis Core",
        activationType:
            "metabolism-module",
        moduleId: "glycolysisCore",
        atpPerMinute: 4,
        increasesCapacity: false
    }),

    glycolysisReconstruction:
        Object.freeze({
            id:
                "glycolysisReconstruction",
            name:
                "Glycolysis Reconstruction",
            activationType:
                "correct-pathway-placements",
            pathwayId: "glycolysis",
            // This is a fixed additive reward, not a compounding percentage.
            // Ten correct placements therefore contribute +3 ATP/min total.
            atpPerCorrectPlacement: 0.3,
            maximumPlacements: 10,
            maximumATPPerMinute: 3,
            increasesCapacity: false
        })
});

const ATPProductionCatalog =
    Object.freeze({

        get(sourceId) {
            return SOURCES[sourceId] ?? null;
        },

        getAll() {
            return Object.values(SOURCES);
        }

    });

export default ATPProductionCatalog;
