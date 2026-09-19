// --------------------------------------------------
// MetabolismSystemsCatalog.js
// Read-only map-of-maps definitions for cross-pathway relationships.
//
// This catalog describes conceptual flow between pathway maps. It does not
// store metabolite quantities, pathway activity, player controls, or ATP
// rewards. Regulation metadata is descriptive until a later milestone
// defines and tests the biological meaning of enable/disable controls.
// --------------------------------------------------

const SYSTEM_NODES = [
    {
        id: "glycogenBreakdown",
        type: "planned-pathway",
        label: "Glycogen Breakdown",
        abbreviation: "Glycogen",
        description:
            "Releases glucose-derived substrate for Glycolysis.",
        themeId: "yellow",
        controlMode: "regulated",
        controlImplemented: false,
        position: { row: 1, column: 1 }
    },
    {
        id: "glucosePool",
        type: "flow-signal",
        label: "Glucose / G6P",
        abbreviation: "Glucose",
        description:
            "Represents carbohydrate substrate availability.",
        controlMode: "none",
        controlImplemented: false,
        position: { row: 1, column: 3 }
    },
    {
        id: "glycolysis",
        type: "pathway",
        pathwayId: "glycolysis",
        label: "Glycolysis",
        abbreviation: "Glycolysis",
        description:
            "Converts glucose to pyruvate and captures some ATP and NADH.",
        themeId: "yellow",
        controlMode: "automatic",
        controlImplemented: false,
        position: { row: 1, column: 5 }
    },
    {
        id: "pyruvateBridge",
        type: "planned-process",
        label: "Pyruvate → Acetyl-CoA",
        abbreviation: "Bridge",
        description:
            "Connects Glycolysis to acetyl-CoA entry into the TCA cycle.",
        themeId: "blue",
        controlMode: "automatic",
        controlImplemented: false,
        position: { row: 1, column: 7 }
    },
    {
        id: "fattyAcidOxidation",
        type: "planned-pathway",
        label: "Fatty-Acid Oxidation",
        abbreviation: "FAO",
        description:
            "Produces acetyl-CoA and high-energy electron carriers from lipids.",
        themeId: "crimson",
        controlMode: "regulated",
        controlImplemented: false,
        position: { row: 3, column: 5 }
    },
    {
        id: "acetylCoAPool",
        type: "flow-signal",
        label: "Acetyl-CoA",
        abbreviation: "Acetyl-CoA",
        description:
            "Shared carbon-entry signal for the TCA cycle.",
        controlMode: "none",
        controlImplemented: false,
        position: { row: 3, column: 7 }
    },
    {
        id: "tcaCycle",
        type: "pathway",
        pathwayId: "tcaCycle",
        label: "Krebs Cycle (TCA)",
        abbreviation: "TCA",
        description:
            "Oxidizes acetyl units and produces NADH and FADH2.",
        themeId: "blue",
        controlMode: "automatic",
        controlImplemented: false,
        position: { row: 3, column: 9 }
    },
    {
        id: "electronCarriers",
        type: "flow-signal",
        label: "NADH + FADH2",
        abbreviation: "e- carriers",
        description:
            "Carries high-energy electrons from upstream pathways.",
        controlMode: "none",
        controlImplemented: false,
        position: { row: 5, column: 7 }
    },
    {
        id: "electronTransportChain",
        type: "pathway",
        pathwayId: "electronTransportChain",
        label: "Electron Transport Chain",
        abbreviation: "ETC",
        description:
            "Uses electron flow and oxygen to establish a proton gradient.",
        themeId: "purple",
        controlMode: "environment",
        controlImplemented: false,
        position: { row: 5, column: 9 }
    }
];

const SYSTEM_CONNECTIONS = [
    {
        from: "glycogenBreakdown",
        to: "glucosePool",
        label: "supplies",
        direction: "right",
        position: { row: 1, column: 2 }
    },
    {
        from: "glucosePool",
        to: "glycolysis",
        label: "feeds",
        direction: "right",
        position: { row: 1, column: 4 }
    },
    {
        from: "glycolysis",
        to: "pyruvateBridge",
        label: "pyruvate",
        direction: "right",
        position: { row: 1, column: 6 }
    },
    {
        from: "pyruvateBridge",
        to: "acetylCoAPool",
        label: "acetyl-CoA",
        direction: "down",
        position: { row: 2, column: 7 }
    },
    {
        from: "fattyAcidOxidation",
        to: "acetylCoAPool",
        label: "acetyl-CoA",
        direction: "right",
        position: { row: 3, column: 6 }
    },
    {
        from: "acetylCoAPool",
        to: "tcaCycle",
        label: "feeds",
        direction: "right",
        position: { row: 3, column: 8 }
    },
    {
        from: "tcaCycle",
        to: "electronCarriers",
        label: "NADH + FADH2",
        direction: "down-left",
        position: { row: 4, column: 8 }
    },
    {
        from: "glycolysis",
        to: "electronCarriers",
        label: "NADH",
        direction: "down-right",
        position: { row: 4, column: 6 }
    },
    {
        from: "fattyAcidOxidation",
        to: "electronCarriers",
        label: "NADH + FADH2",
        direction: "down-right",
        position: { row: 4, column: 5 }
    },
    {
        from: "electronCarriers",
        to: "electronTransportChain",
        label: "electrons",
        direction: "right",
        position: { row: 5, column: 8 }
    }
];

function deepFreeze(value) {
    if (!value || typeof value !== "object") {
        return value;
    }

    Object.values(value).forEach(
        child => deepFreeze(child)
    );
    return Object.freeze(value);
}

const NODE_IDS = new Set(
    SYSTEM_NODES.map(node => node.id)
);

const valid = Boolean(
    NODE_IDS.size === SYSTEM_NODES.length &&
    SYSTEM_NODES.every(node =>
        node.id &&
        node.label &&
        node.type &&
        node.position &&
        node.controlImplemented === false
    ) &&
    SYSTEM_CONNECTIONS.every(connection =>
        NODE_IDS.has(connection.from) &&
        NODE_IDS.has(connection.to) &&
        connection.position
    )
);

const SYSTEM = deepFreeze({
    id: "cellularEnergySystem",
    name: "Cellular Energy Systems Map",
    description:
        "A map of pathway maps showing how carbon substrates and electron carriers connect cellular energy processes.",
    valid,
    nodes: SYSTEM_NODES,
    connections: SYSTEM_CONNECTIONS
});

const MetabolismSystemsCatalog =
    Object.freeze({
        get() {
            return structuredClone(SYSTEM);
        }
    });

export default MetabolismSystemsCatalog;
