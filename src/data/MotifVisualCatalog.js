// --------------------------------------------------
// MotifVisualCatalog.js
// Pure presentation metadata for Macromolecularizer motifs.
// Scientific recipes and runtime synthesis state live elsewhere.
// --------------------------------------------------

const HELIX_OBSERVATION_IMAGES =
    Object.freeze({
        "100": "H_helix_observe_ribbon_on_hbonds_off_atoms_off.png",
        "110": "H_helix_observe_ribbon_on_hbonds_on_atoms_off.png",
        "101": "H_helix_observe_ribbon_on_hbonds_off_atoms_on.png",
        "111": "H_helix_observe_ribbon_on_hbonds_on_atoms_on.png",
        "001": "H_helix_observe_ribbon_off_hbonds_off_atoms_on.png",
        "011": "H_helix_observe_ribbon_off_hbonds_on_atoms_on.png"
    });

const LOOP_OBSERVATION_IMAGES =
    Object.freeze({
        "100": "loop_observe_ribbon_on_hbonds_off_atoms_off.png",
        "110": "loop_observe_ribbon_on_hbonds_on_atoms_off.png",
        "101": "loop_observe_ribbon_on_hbonds_off_atoms_on.png",
        "111": "loop_observe_ribbon_on_hbonds_on_atoms_on.png",
        "001": "loop_observe_ribbon_off_hbonds_off_atoms_on.png",
        "011": "loop_observe_ribbon_off_hbonds_on_atoms_on.png"
    });

const VISUALS =
    Object.freeze({
        H_helix: Object.freeze({
            icon: "α",
            classification:
                "Protein secondary structure",
            synthesisFrames:
                Object.freeze({
                    count: 16,
                    startIndex: 15,
                    completeIndex: 0,
                    pathPrefix:
                        "./public/assets/molecularizer/H_helix_white"
                }),
            observationImages:
                HELIX_OBSERVATION_IMAGES,
            observationPath:
                "./public/assets/molecularizer/",
            previewImage: null
        }),
        L_loop: Object.freeze({
            icon: "↪",
            classification:
                "Protein loop motif",
            synthesisFrames:
                Object.freeze({
                    count: 10,
                    startIndex: 9,
                    completeIndex: 0,
                    pathPrefix:
                        "./public/assets/molecularizer/loop_white"
                }),
            observationImages:
                LOOP_OBSERVATION_IMAGES,
            observationPath:
                "./public/assets/molecularizer/",
            previewImage:
                "./public/assets/molecularizer/loop.png"
        }),
                B_sheet: Object.freeze({
            icon: "β",
            classification:
                "Protein secondary structure",
            synthesisFrames: Object.freeze({
                count: 5,
                startIndex: 0,
                completeIndex: 4,
                pathPrefix:
                    "./public/assets/molecularizer/beta_sheet_white"
            }),
            observationImages: Object.freeze({
                "100": "beta_sheet_observe_ribbon_on_hbonds_off_atoms_off.png",
                "110": "beta_sheet_observe_ribbon_on_hbonds_on_atoms_off.png",
                "101": "beta_sheet_observe_ribbon_on_hbonds_off_atoms_on.png",
                "111": "beta_sheet_observe_ribbon_on_hbonds_on_atoms_on.png",
                "001": "beta_sheet_observe_ribbon_off_hbonds_off_atoms_on.png",
                "011": "beta_sheet_observe_ribbon_off_hbonds_on_atoms_on.png"
            }),
            observationPath:
                "./public/assets/molecularizer/",
            previewImage:
                "./public/assets/molecularizer/beta_sheet.png"
        })

    });

const MotifVisualCatalog =
    Object.freeze({

        get(motifId) {

            return VISUALS[motifId] ??
                null;

        },

        supportsFrameSynthesis(motifId) {

            return Boolean(
                this.get(motifId)
                    ?.synthesisFrames
            );

        },

        supportsObservation(motifId) {

            return Boolean(
                this.get(motifId)
                    ?.observationImages
            );

        }

    });

export default MotifVisualCatalog;
