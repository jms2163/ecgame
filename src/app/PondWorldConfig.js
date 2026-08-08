// --------------------------------------------------
// PondWorldConfig.js
// Creates deterministic microbiome region placement
// --------------------------------------------------

import SeededRandom from "./SeededRandom.js";

const PondWorldConfig = {

    create(seed) {

        const random =
            SeededRandom.create(seed);


        // --------------------------------------------------
        // Random Integer Helper
        // --------------------------------------------------
        const randomInt = (min, max) => {

            return Math.floor(
                random() * (max - min + 1)
            ) + min;

        };


        // --------------------------------------------------
        // Random Decimal Helper
        // --------------------------------------------------
        const randomFloat = (min, max) => {

            return (
                min +
                random() * (max - min)
            );

        };


        // --------------------------------------------------
        // Layer 2: Substrate Regions
        // --------------------------------------------------
        const substrateRegions = [

            {
                microbiome: "algae_patch",

                x: randomInt(-5, 5),
                y: randomInt(-5, 5),

                radius:
                    randomFloat(2.0, 3.0)
            }

        ];


        // --------------------------------------------------
        // Layer 3: Overlay Regions
        // --------------------------------------------------
        const overlayRegions = [

            {
                microbiome: "bacterial_bloom",

                x: randomInt(-5, 5),
                y: randomInt(-5, 5),

                radius:
                    randomFloat(1.5, 2.5)
            }

        ];


        return {
            substrateRegions,
            overlayRegions
        };

    }

};

export default PondWorldConfig;