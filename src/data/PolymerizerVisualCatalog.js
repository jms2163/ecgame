// --------------------------------------------------
// PolymerizerVisualCatalog.js
// Pure presentation metadata for Polymerizer products.
//
// Protein identity and PDB source codes live in proteinLibrary. This file
// owns only how those source images are presented in Polymerizer, including
// the number of assembly frames available for each product.
// --------------------------------------------------

import { proteinLibrary } from "./proteinLibrary.js";

const PROTEIN_IMAGE_DIRECTORY =
    "../../public/assets/polymerizer/proteins/";

const VISUAL_CONFIGS = Object.freeze({
    Aquaporin: Object.freeze({
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
    Hexokinase: Object.freeze({
        directoryName: "1bg3_motifs",
        filePrefix: "1bg3",
        firstFrameNumber: 0,
        lastFrameNumber: 65,
        alt:
            "Hexokinase protein motif assembly from PDB 1BG3.",
        accent: "amber",
        placeholderLabel:
            "Hexokinase motif assembly preview",
        fallbackFileName: null
    }),
    PhosphoglucoseIsomerase: Object.freeze({
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
                `${directoryPrefix}${filePrefix}-${frameNumber}.png`
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
