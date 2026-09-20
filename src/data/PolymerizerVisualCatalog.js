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
        filePrefix: "1EI0",
        firstFrameNumber: 1,
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
        firstFrameNumber: 1,
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
        firstFrameNumber: 1,
        lastFrameNumber: 29,
        alt:
            "Phosphoglucose isomerase motif assembly from PDB 2PGI.",
        accent: "gold",
        placeholderLabel:
            "Phosphoglucose isomerase motif assembly preview",
        fallbackFileName: null
    }),
    Phosphofructokinase1: Object.freeze({
    directoryName: "4y8v_motifs",
    filePrefix: "4y8v",
    firstFrameNumber: 1,
    lastFrameNumber: 28,
    alt:
        "Phosphofructokinase-1 motif assembly from PDB 4Y8V.",
    accent: "gold",
    placeholderLabel:
        "Phosphofructokinase-1 motif assembly preview",
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
