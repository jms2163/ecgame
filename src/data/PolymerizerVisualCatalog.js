// --------------------------------------------------
// PolymerizerVisualCatalog.js
// Pure presentation metadata for Polymerizer products.
// --------------------------------------------------

const VISUALS = Object.freeze({
    Aquaporin: Object.freeze({
        imageUrl: new URL(
            "../../public/assets/experiments/proteins/aquaporin.png",
            import.meta.url
        ).href,
        alt:
            "Simplified aquaporin water-channel protein.",
        accent: "cyan",
        placeholderLabel:
            "Aquaporin structural assembly preview"
    })
});

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
        }

    });

export default PolymerizerVisualCatalog;
