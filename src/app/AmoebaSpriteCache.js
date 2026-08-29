// --------------------------------------------------
// AmoebaSpriteCache.js
// Cached phenotype variants from one transparent PNG
// --------------------------------------------------

const clampPercentage = value =>
    Math.min(
        100,
        Math.max(0, value)
    );

const loadImage = source =>
    new Promise(
        (
            resolve,
            reject
        ) => {

            const image = new Image();

            image.addEventListener(
                "load",
                () => resolve(image),
                { once: true }
            );

            image.addEventListener(
                "error",
                () => reject(
                    new Error(
                        `Unable to load amoeba sprite: ${source}`
                    )
                ),
                { once: true }
            );

            image.src = source;

        }
    );

const createCanvas = (
    width,
    height
) => {

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width = width;
    canvas.height = height;

    return canvas;

};

const drawOriginal = image => {

    const canvas =
        createCanvas(
            image.naturalWidth,
            image.naturalHeight
        );

    const context =
        canvas.getContext("2d");

    context.drawImage(
        image,
        0,
        0
    );

    return canvas;

};

const drawPigmented = (
    image,
    pigmentationLevel,
    pigmentColor
) => {

    const canvas =
        drawOriginal(image);

    const context =
        canvas.getContext("2d");

    context.save();
    context.globalCompositeOperation =
        "source-atop";
    context.globalAlpha =
        clampPercentage(
            pigmentationLevel
        ) / 100 * 0.98;
    context.fillStyle = pigmentColor;
    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
    context.restore();

    return canvas;

};

const cachedVariants = new Map();

const AmoebaSpriteCache = {

    async getVariants({
        source,
        pigmentationLevel,
        pigmentColor
    }) {

        const cacheKey = [
            source,
            clampPercentage(
                pigmentationLevel
            ),
            pigmentColor
        ].join("|");

        if (!cachedVariants.has(cacheKey)) {
            cachedVariants.set(
                cacheKey,
                loadImage(source)
                    .then(
                        image => ({
                            non_pigmented:
                                drawOriginal(
                                    image
                                ),
                            pigmented:
                                drawPigmented(
                                    image,
                                    pigmentationLevel,
                                    pigmentColor
                                )
                        })
                    )
            );
        }

        return cachedVariants.get(
            cacheKey
        );

    },

    clear() {

        cachedVariants.clear();

    }

};

export default AmoebaSpriteCache;
