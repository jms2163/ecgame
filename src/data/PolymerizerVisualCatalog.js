// --------------------------------------------------
// PolymerizerVisualCatalog.js
// Pure presentation metadata for Polymerizer products.
//
// Protein identity and PDB source codes live in proteinLibrary. This file
// owns only how those source images are presented in Polymerizer, including
// the number of assembly frames available for each product.
// --------------------------------------------------

import { proteinLibrary } from "./proteinLibrary.js";
import KrebsProteins from "./KrebsProteinCatalog.js";

const PROTEIN_IMAGE_DIRECTORY =
    "../../public/assets/polymerizer/proteins/";

const VISUAL_CONFIGS = Object.freeze({
    ...Object.fromEntries(Object.entries(KrebsProteins).map(([id, protein]) => [id, Object.freeze({
        displayZoomPercent: protein.displayZoomPercent,
        fileExtension: id === "CitrateSynthase" ? "webp" : "png",
        directoryName: `${protein.source.toLowerCase()}_motifs`, filePrefix: protein.source.toLowerCase(),
        firstFrameNumber: 0, lastFrameNumber: protein.lastFrame,
        alt: `${protein.name} cumulative motif assembly (${protein.source}).`,
        accent: "gold", placeholderLabel: `${protein.name} assembly`, fallbackFileName: null
    })])),
    RuBisCO: Object.freeze({
        fileExtension: "webp",
        displayZoomPercent: 190,
        directoryName: "9hvm_motifs", filePrefix: "9hvm",
        firstFrameNumber: 0, lastFrameNumber: 344,
        alt: "Cumulative motif reveal of the 16-subunit Chlamydomonas pyrenoid RuBisCO assembly (9HVM).",
        accent: "green", placeholderLabel: "RuBisCO full assembly",
        fallbackFileName: null
    }),
    FructoseBisphosphatase: Object.freeze({
        displayZoomPercent: 260,
        directoryName: "1spi_motifs", filePrefix: "1spi",
        firstFrameNumber: 0, lastFrameNumber: 20,
        alt: "Representative partial motif sequence for spinach chloroplast fructose-1,6-bisphosphatase dimer (1SPI).",
        accent: "green", placeholderLabel: "FBPase motif sequence", fallbackFileName: null
    }),
    Transketolase: Object.freeze({
        displayZoomPercent: 270,
        directoryName: "5nd5_motifs", filePrefix: "5nd5",
        firstFrameNumber: 0, lastFrameNumber: 87,
        alt: "Full cumulative motif sequence for the two-chain chloroplast transketolase dimer (5ND5).",
        accent: "green", placeholderLabel: "Transketolase motif sequence", fallbackFileName: null
    }),
    SedoheptuloseBisphosphatase: Object.freeze({
        displayZoomPercent: 250,
        directoryName: "7zuv_motifs", filePrefix: "7zuv",
        firstFrameNumber: 0, lastFrameNumber: 22,
        alt: "Representative motif sequence for chloroplast sedoheptulose bisphosphatase dimer (7ZUV).",
        accent: "green", placeholderLabel: "SBPase motif sequence", fallbackFileName: null
    }),
    Ribose5PhosphateIsomerase: Object.freeze({
        displayZoomPercent: 250,
        directoryName: "6zxt_motifs", filePrefix: "6zxt",
        firstFrameNumber: 0, lastFrameNumber: 18,
        alt: "Representative motif sequence for chloroplast ribose-5-phosphate isomerase dimer (6ZXT).",
        accent: "green", placeholderLabel: "RPI motif sequence", fallbackFileName: null
    }),
    Ribulose5PhosphateEpimerase: Object.freeze({
        displayZoomPercent: 250,
        directoryName: "7b1w_motifs", filePrefix: "7b1w",
        firstFrameNumber: 0, lastFrameNumber: 17,
        alt: "Motif sequence for plastidial ribulose-5-phosphate epimerase monomer (7B1W).",
        accent: "green", placeholderLabel: "RPE motif sequence", fallbackFileName: null
    }),
    Phosphoribulokinase: Object.freeze({
        displayZoomPercent: 250,
        directoryName: "6kew_motifs", filePrefix: "6kew",
        firstFrameNumber: 0, lastFrameNumber: 27,
        alt: "Representative motif sequence for Arabidopsis phosphoribulokinase monomer (6KEW).",
        accent: "green", placeholderLabel: "PRK motif sequence", fallbackFileName: null
    }),
    Aquaporin: Object.freeze({
        displayZoomPercent: 210,
        directoryName: "1rc2_motifs",
        filePrefix: "1RC2",
        firstFrameNumber: 0,
        lastFrameNumber: 8,
        alt:
            "Aquaporin water-channel protein structural assembly.",
        accent: "cyan",
        placeholderLabel:
            "Aquaporin structural assembly preview",
        fallbackFileName: "aquaporin.png"
    }),
    GlucoseTransporter: Object.freeze({
        displayZoomPercent: 160,
        directoryName: "4lds_motifs",
        filePrefix: "4LDS",
        firstFrameNumber: 0,
        lastFrameNumber: 15,
        alt:
            "Glucose transporter protein structural assembly.",
        accent: "violet",
        placeholderLabel:
            "Glucose transporter structural assembly preview",
        fallbackFileName: null
    }),
    EnergyKinase: Object.freeze({
        displayZoomPercent: 160,
        directoryName: "1ei0_motifs",
        filePrefix: "1ei0",
        firstFrameNumber: 0,
        lastFrameNumber: 2,
        finalFrameOnlyOnCompletion: true,
        alt:
            "Energy Kinase teaching module based on the 1EI0 alpha-helical scaffold.",
        accent: "gold",
        placeholderLabel:
            "Energy Kinase assembly preview",
        fallbackFileName: null
    }),
    Glycogenin: Object.freeze({
        displayZoomPercent: 250,
        directoryName: "3u2u_motifs",
        filePrefix: "3u2u",
        firstFrameNumber: 0,
        lastFrameNumber: 15,
        alt: "Glycogenin motif assembly from PDB 3U2U.",
        accent: "gold",
        placeholderLabel: "Glycogenin motif assembly preview",
        fallbackFileName: null
    }),
    Glycerol3PhosphateAcyltransferase: Object.freeze({
        displayZoomPercent: 210,
        directoryName: "5xj6_motifs",
        filePrefix: "5xj6",
        firstFrameNumber: 0,
        lastFrameNumber: 10,
        alt: "Glycerol-3-phosphate acyltransferase motif assembly from PDB 5XJ6.",
        accent: "gold",
        placeholderLabel: "Glycerol-3-phosphate acyltransferase motif assembly preview",
        fallbackFileName: null
    }),
    AcetylCoASynthetase: Object.freeze({
        displayZoomPercent: 230,
        directoryName: "1pg4_motifs", filePrefix: "1pg4",
        firstFrameNumber: 0, lastFrameNumber: 47,
        alt: "Acetyl-CoA synthetase single-chain motif assembly from PDB 1PG4.",
        accent: "gold", placeholderLabel: "Acetyl-CoA synthetase assembly", fallbackFileName: null
    }),
    FattyAcidSynthase: Object.freeze({
        displayZoomPercent: 230,
        directoryName: "2vz9_motifs", filePrefix: "2vz9",
        firstFrameNumber: 0, lastFrameNumber: 322,
        alt: "Two-chain mammalian fatty acid synthase assembly from PDB 2VZ9.",
        accent: "gold", placeholderLabel: "Fatty acid synthase dimer", fallbackFileName: null
    }),
    Hexokinase: Object.freeze({
        displayZoomPercent: 230,
        directoryName: "1bg3_motifs",
        filePrefix: "1bg3",
        firstFrameNumber: 0,
        lastFrameNumber: 131,
        alt:
            "Hexokinase protein motif assembly from PDB 1BG3.",
        accent: "amber",
        placeholderLabel:
            "Hexokinase motif assembly preview",
        fallbackFileName: null
    }),
    PhosphoglucoseIsomerase: Object.freeze({
        displayZoomPercent: 190,
        directoryName: "2pgi_motifs",
        filePrefix: "2pgi",
        firstFrameNumber: 0,
        lastFrameNumber: 29,
        alt:
            "Phosphoglucose isomerase motif assembly from PDB 2PGI.",
        accent: "gold",
        placeholderLabel:
            "Phosphoglucose isomerase motif assembly preview",
        fallbackFileName: null
    }),
    Phosphofructokinase: Object.freeze({
        displayZoomPercent: 220,
    directoryName: "4y8v_motifs",
    filePrefix: "4y8v",
    firstFrameNumber: 0,
    lastFrameNumber: 28,
    alt:
        "Phosphofructokinase-1 motif assembly from PDB 4Y8V.",
    accent: "gold",
    placeholderLabel:
        "Phosphofructokinase-1 motif assembly preview",
    fallbackFileName: null
}),
Aldolase: Object.freeze({
    displayZoomPercent: 260,
    directoryName: "1ald_motifs",
    filePrefix: "1ald",
    firstFrameNumber: 0,
    lastFrameNumber: 24,
    alt:
        "Fructose-bisphosphate aldolase motif assembly from PDB 1ALD.",
    accent: "gold",
    placeholderLabel:
        "Fructose-bisphosphate aldolase motif assembly preview",
    fallbackFileName: null
}),
TriosePhosphateIsomerase: Object.freeze({
    displayZoomPercent: 210,
    directoryName: "1tim_motifs",
    filePrefix: "1tim",
    firstFrameNumber: 0,
    lastFrameNumber: 15,
    alt:
        "Triose phosphate isomerase motif assembly from PDB 1TIM.",
    accent: "gold",
    placeholderLabel:
        "Triose phosphate isomerase motif assembly preview",
    fallbackFileName: null
}),
Glyceraldehyde3PhosphateDehydrogenase: Object.freeze({
    displayZoomPercent: 210,
    directoryName: "1dc4_motifs",
    filePrefix: "1dc4",
    firstFrameNumber: 0,
    lastFrameNumber: 20,
    alt:
        "Glyceraldehyde-3-phosphate dehydrogenase motif assembly from PDB 1DC4.",
    accent: "gold",
    placeholderLabel:
        "Glyceraldehyde-3-phosphate dehydrogenase motif assembly preview",
    fallbackFileName: null
}),
PhosphoglycerateKinase: Object.freeze({
    displayZoomPercent: 210,
    directoryName: "3pgk_motifs",
    filePrefix: "3pgk",
    firstFrameNumber: 0,
    lastFrameNumber: 26,
    alt:
        "Phosphoglycerate kinase motif assembly from PDB 3PGK.",
    accent: "gold",
    placeholderLabel:
        "Phosphoglycerate kinase motif assembly preview",
    fallbackFileName: null
}),
// PolymerizerVisualCatalog.js — Formate Acetyltransferase 1 (1H16)

FormateAcetyltransferase1: Object.freeze({
    displayZoomPercent: 260,
    directoryName: "1h16_motifs",
    filePrefix: "1h16",
    firstFrameNumber: 0,
    lastFrameNumber: 48,
    alt:
        "Formate acetyltransferase 1 motif assembly from PDB 1H16.",
    accent: "gold",
    placeholderLabel:
        "Formate acetyltransferase 1 motif assembly preview",
    fallbackFileName: null
}),
// PolymerizerVisualCatalog.js — Pyruvate Kinase (1PKL)

PyruvateKinase: Object.freeze({
    displayZoomPercent: 180,
    directoryName: "1pkl_motifs",
    filePrefix: "1pkl",
    firstFrameNumber: 0,
    lastFrameNumber: 29,
    alt:
        "Pyruvate kinase motif assembly from PDB 1PKL.",
    accent: "gold",
    placeholderLabel:
        "Pyruvate kinase motif assembly preview",
    fallbackFileName: null
}),
// PolymerizerVisualCatalog.js — Phosphoglycerate Mutase (1E58)

PhosphoglycerateMutase: Object.freeze({
    displayZoomPercent: 190,
    directoryName: "1e58_motifs",
    filePrefix: "1e58",
    firstFrameNumber: 0,
    lastFrameNumber: 16,
    alt:
        "Phosphoglycerate mutase motif assembly from PDB 1E58.",
    accent: "gold",
    placeholderLabel:
        "Phosphoglycerate mutase motif assembly preview",
    fallbackFileName: null
}),
Enolase: Object.freeze({
    displayZoomPercent: 180,
    directoryName: "4a3r_motifs",
    filePrefix: "4a3r",
    firstFrameNumber: 0,
    lastFrameNumber: 22,
    alt:
        "Enolase motif assembly from PDB 4A3R.",
    accent: "gold",
    placeholderLabel:
        "Enolase motif assembly preview",
    fallbackFileName: null
}),
// PolymerizerVisualCatalog.js — Lactate Dehydrogenase (4LDA)

    LactateDehydrogenase: Object.freeze({
        displayZoomPercent: 180,
    directoryName: "4lda_motifs",
    filePrefix: "4lda",
    firstFrameNumber: 0,
    lastFrameNumber: 7,
    alt:
        "Lactate dehydrogenase motif assembly from PDB 4LDA.",
    accent: "gold",
    placeholderLabel:
        "Lactate dehydrogenase motif assembly preview",
        fallbackFileName: null
    }),
    TriosePhosphateTranslocator: Object.freeze({
        displayZoomPercent: 230,
        directoryName: "5y78_motifs", filePrefix: "5y78",
        firstFrameNumber: 0, lastFrameNumber: 12,
        alt: "TPT motif assembly from PDB 5Y78.",
        accent: "green", placeholderLabel: "TPT assembly preview",
        fallbackFileName: null
    }),
    SucroseSynthase1: Object.freeze({
        displayZoomPercent: 250,
        directoryName: "3s27_motifs", filePrefix: "3s27",
        firstFrameNumber: 0, lastFrameNumber: 51,
        alt: "Sucrose synthase 1 motif assembly from PDB 3S27.",
        accent: "gold", placeholderLabel: "Sucrose synthase assembly preview",
        fallbackFileName: null
    }),
    GranuleBoundStarchSynthase1: Object.freeze({
        displayZoomPercent: 260,
        directoryName: "3vuf_motifs", filePrefix: "3vuf",
        firstFrameNumber: 0, lastFrameNumber: 32,
        alt: "Rice granule-bound starch synthase I motif assembly from PDB 3VUF.",
        accent: "gold", placeholderLabel: "Starch synthase assembly preview",
        fallbackFileName: null
    }),
    Isoamylase: Object.freeze({
        displayZoomPercent: 250,
        directoryName: "1bf2_motifs", filePrefix: "1bf2",
        firstFrameNumber: 0, lastFrameNumber: 44,
        alt: "Pseudomonas isoamylase motif assembly from PDB 1BF2.",
        accent: "gold", placeholderLabel: "Isoamylase assembly preview",
        fallbackFileName: null
    }),
    Ferredoxin: Object.freeze({
        displayZoomPercent: 200,
        directoryName: "1a70_motifs", filePrefix: "1a70",
        firstFrameNumber: 0, lastFrameNumber: 8,
        alt: "Ferredoxin motif assembly from PDB 1A70.",
        accent: "green", placeholderLabel: "Fd assembly preview",
        fallbackFileName: null
    }),
    FerredoxinNADPReductase: Object.freeze({
        displayZoomPercent: 280,
        directoryName: "1fnd_motifs", filePrefix: "1fnd",
        firstFrameNumber: 0, lastFrameNumber: 23,
        alt: "Ferredoxin-NADP+ reductase motif assembly from PDB 1FND.",
        accent: "green", placeholderLabel: "FNR assembly preview",
        fallbackFileName: null
    }),
    Plastocyanin: Object.freeze({
        displayZoomPercent: 230,
        directoryName: "1plc_motifs", filePrefix: "1plc",
        firstFrameNumber: 0, lastFrameNumber: 10,
        alt: "Plastocyanin motif assembly from PDB 1PLC.",
        accent: "blue", placeholderLabel: "PC assembly preview",
        fallbackFileName: null
    })







    

});

function assetUrl(fileName) {

    return new URL(
        `${PROTEIN_IMAGE_DIRECTORY}${fileName}`,
        import.meta.url
    ).href;

}

function createVisual(productId, config) {

    const source =
        proteinLibrary[productId]?.Source;

    if (
        typeof source !== "string" ||
        source.trim() === ""
    ) {
        throw new Error(
            `PolymerizerVisualCatalog: ${productId} requires a proteinLibrary Source code.`
        );
    }

    const firstFrameNumber =
        config.firstFrameNumber;
    const lastFrameNumber =
        config.lastFrameNumber;

    if (
        !Number.isInteger(firstFrameNumber) ||
        !Number.isInteger(lastFrameNumber) ||
        lastFrameNumber < firstFrameNumber
    ) {
        throw new Error(
            `PolymerizerVisualCatalog: ${productId} requires a valid inclusive frame range.`
        );
    }

    const filePrefix =
        config.filePrefix ?? source;
    const directoryPrefix =
        config.directoryName
            ? `${config.directoryName}/`
            : "";
    const frameNumbers = Object.freeze(
        Array.from(
            {
                length:
                    lastFrameNumber -
                    firstFrameNumber + 1
            },
            (_, index) =>
                firstFrameNumber + index
        )
    );
    const frameUrls = Object.freeze(
        frameNumbers.map(frameNumber =>
            assetUrl(
                `${directoryPrefix}${filePrefix}-${frameNumber}.${config.fileExtension ?? "png"}`
            )
        )
    );

    return Object.freeze({
        source,
        firstFrameNumber,
        lastFrameNumber,
        frameCount: frameUrls.length,
        assemblyFrameCount:
            Math.max(
                0,
                frameUrls.length - 1
            ),
        frameUrls,
        // The first available image is the idle preview. Every later image is
        // distributed evenly across the active assembly timer. This supports
        // both legacy 0-based folders and PDB motif folders that begin at 1.
        idleImageUrl: frameUrls[0],
        assemblyImageUrls:
            Object.freeze(
                frameUrls.slice(1)
            ),
        finalImageUrl:
            frameUrls[
                frameUrls.length - 1
            ],
        finalFrameOnlyOnCompletion:
            Boolean(
                config
                    .finalFrameOnlyOnCompletion
            ),
        // imageUrl remains as a compatibility alias for older callers.
        imageUrl: frameUrls[0],
        fallbackImageUrl:
            config.fallbackFileName
                ? assetUrl(
                    config.fallbackFileName
                )
                : null,
        // Per-protein chamber scale is independent of source PNG resolution.
        displayZoomPercent: config.displayZoomPercent ?? 100,
        alt: config.alt,
        accent: config.accent,
        placeholderLabel:
            config.placeholderLabel
    });

}

const VISUALS = Object.freeze(
    Object.fromEntries(
        Object.entries(VISUAL_CONFIGS)
            .map(([productId, config]) => [
                productId,
                createVisual(
                    productId,
                    config
                )
            ])
    )
);

const PolymerizerVisualCatalog =
    Object.freeze({

        get(productId) {
            return VISUALS[productId] ?? null;
        },

        getAll() {
            return Object.entries(VISUALS)
                .map(([id, visual]) => ({
                    id,
                    ...visual
                }));
        },

        resolveImageUrl(
            productId,
            {
                progress = null,
                completed = false
            } = {}
        ) {

            const visual = this.get(productId);

            if (!visual) return null;

            if (completed) {
                return visual.finalImageUrl;
            }

            // Two-frame products can reserve their second image for the
            // completed structure. The chamber supplies its existing active
            // animation while the idle frame remains visible during assembly.
            if (
                visual
                    .finalFrameOnlyOnCompletion
            ) {
                return visual.idleImageUrl;
            }

            if (!Number.isFinite(progress)) {
                return visual.idleImageUrl;
            }

            const boundedProgress = Math.max(
                0,
                Math.min(1, progress)
            );
            const frameIndex = Math.min(
                visual.assemblyImageUrls.length - 1,
                Math.floor(
                    boundedProgress *
                    visual.assemblyImageUrls.length
                )
            );

            return visual
                .assemblyImageUrls[
                    frameIndex
                ];
        }

    });

export default PolymerizerVisualCatalog;
