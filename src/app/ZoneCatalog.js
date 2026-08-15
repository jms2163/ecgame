// --------------------------------------------------
// ZoneCatalog.js
// Declarative metadata for student-facing global zones
// --------------------------------------------------

const RELEASE_STATE = Object.freeze({
    PLAYABLE: "playable",
    COMING_SOON: "coming-soon"
});

const ZONE_DEFINITIONS = Object.freeze([
    Object.freeze({
        id: "pond",
        label: "Pond",
        releaseState: RELEASE_STATE.PLAYABLE,
        lockedMessage:
            "The Pond is currently locked.",
        comingSoonMessage: ""
    }),

    Object.freeze({
        id: "quantum",
        label: "Quantum Field",
        releaseState: RELEASE_STATE.PLAYABLE,
        lockedMessage:
            "The Quantum Field is locked in this save. Complete or restore the required entry prerequisite.",
        comingSoonMessage: ""
    }),

    Object.freeze({
        id: "atomLab",
        label: "Atom Lab",
        releaseState: RELEASE_STATE.PLAYABLE,
        lockedMessage:
            "Complete Subatomic Assembly and claim its reward in the Quests drawer first.",
        comingSoonMessage:
            "Hydrogen synthesis is the next activity planned after the Subatomic Assembly reward is claimed."
    }),

    Object.freeze({
        id: "atomizer",
        label: "Atomizer",
        releaseState: RELEASE_STATE.COMING_SOON,
        lockedMessage:
            "Discover Hydrogen in the Atom Lab first.",
        comingSoonMessage:
            "Automated atom production is not yet available."
    }),

    Object.freeze({
        id: "molecularizer",
        label: "Molecularizer",
        releaseState: RELEASE_STATE.COMING_SOON,
        lockedMessage:
            "Complete the required Atomic activities first.",
        comingSoonMessage:
            "Molecule construction is not yet available."
    }),

    Object.freeze({
        id: "macromolecularizer",
        label: "Macromolecularizer",
        releaseState: RELEASE_STATE.COMING_SOON,
        lockedMessage:
            "Complete the required Molecular activities first.",
        comingSoonMessage:
            "Macromolecule construction is planned for a later release."
    }),

    Object.freeze({
        id: "polymerizer",
        label: "Polymerizer",
        releaseState: RELEASE_STATE.COMING_SOON,
        lockedMessage:
            "Complete the required macromolecule activities first.",
        comingSoonMessage:
            "Polymer construction is planned for a later release."
    }),

    Object.freeze({
        id: "metabolism",
        label: "Metabolism",
        releaseState: RELEASE_STATE.COMING_SOON,
        lockedMessage:
            "Complete the required earlier activities first.",
        comingSoonMessage:
            "Metabolism activities are planned for a later release."
    }),

    Object.freeze({
        id: "genetics",
        label: "Genetics",
        releaseState: RELEASE_STATE.COMING_SOON,
        lockedMessage:
            "Complete the required earlier activities first.",
        comingSoonMessage:
            "Genetics activities are planned for a later release."
    })
]);

const DEFINITIONS_BY_ID =
    new Map(
        ZONE_DEFINITIONS.map(
            definition => [
                definition.id,
                definition
            ]
        )
    );

const ZoneCatalog = Object.freeze({

    RELEASE_STATE,

    getDefaultZoneId() {
        return "pond";
    },

    has(zoneId) {
        return DEFINITIONS_BY_ID.has(zoneId);
    },

    get(zoneId) {

        const definition =
            DEFINITIONS_BY_ID.get(zoneId);

        return definition
            ? { ...definition }
            : null;

    },

    getAll() {

        return ZONE_DEFINITIONS.map(
            definition => ({
                ...definition
            })
        );

    }

});

export default ZoneCatalog;
