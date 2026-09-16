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
        assemblyFrameCount: 8,
        alt:
            "Aquaporin water-channel protein structural assembly.",
        accent: "cyan",
        placeholderLabel:
            "Aquaporin structural assembly preview",
        fallbackFileName: "aquaporin.png"
    }),
    GlucoseTransporter: Object.freeze({
        assemblyFrameCount: 15,
        alt:
            "Glucose transporter protein structural assembly.",
        accent: "violet",
        placeholderLabel:
            "Glucose transporter structural assembly preview",
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

    const frameUrls = Object.freeze(
        Array.from(
            {
                length:
                    config.assemblyFrameCount + 1
            },
            (_, frameNumber) =>
                assetUrl(
                    `${source}-${frameNumber}.png`
                )
        )
    );

    return Object.freeze({
        source,
        assemblyFrameCount:
            config.assemblyFrameCount,
        frameUrls,
        // Frame zero is the unsynthesized/locked preview. Frames one through
        // N are distributed evenly across an active assembly timer.
        idleImageUrl: frameUrls[0],
        assemblyImageUrls:
            Object.freeze(
                frameUrls.slice(1)
            ),
        finalImageUrl:
            frameUrls[
                frameUrls.length - 1
            ],
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
