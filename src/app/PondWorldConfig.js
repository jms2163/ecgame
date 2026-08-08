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
        // Distance Helper
        // --------------------------------------------------
        const distanceBetween = (
            x1,
            y1,
            x2,
            y2
        ) => {

            const dx = x2 - x1;
            const dy = y2 - y1;

            return Math.sqrt(
                dx * dx +
                dy * dy
            );

        };


        // --------------------------------------------------
        // Spawn Safety Helper
        // --------------------------------------------------
        const isRegionSafeFromSpawn = (
            region,
            safeMargin = 2
        ) => {

            const distanceFromSpawn =
                distanceBetween(
                    0,
                    0,
                    region.x,
                    region.y
                );

            const edgeDistance =
                distanceFromSpawn - region.radius;

            return edgeDistance >= safeMargin;

        };


        // --------------------------------------------------
        // Create Region With Optional Spawn Safety
        // --------------------------------------------------
        const createRegion = ({
            microbiome,
            minRadius,
            maxRadius,
            minX = -5,
            maxX = 5,
            minY = -5,
            maxY = 5,
            requireSpawnSafe = false,
            safeMargin = 2,
            maxAttempts = 50
        }) => {

            for (
                let attempt = 0;
                attempt < maxAttempts;
                attempt++
            ) {

                const region = {
                    microbiome,

                    x: randomInt(minX, maxX),
                    y: randomInt(minY, maxY),

                    radius:
                        randomFloat(
                            minRadius,
                            maxRadius
                        )
                };

                if (
                    !requireSpawnSafe ||
                    isRegionSafeFromSpawn(
                        region,
                        safeMargin
                    )
                ) {

                    return region;

                }

            }

            console.warn(
                `PondWorldConfig: unable to safely place "${microbiome}"`
            );

            return null;

        };


        // --------------------------------------------------
        // Layer 2: Substrate Regions
        // --------------------------------------------------
        const substrateRegions = [

            createRegion({
                microbiome: "algae_patch",
                minRadius: 2.0,
                maxRadius: 3.0
            })

        ].filter(Boolean);


        // --------------------------------------------------
        // Layer 3: Overlay Regions
        // --------------------------------------------------
        const overlayRegions = [

            createRegion({
                microbiome: "bacterial_bloom",
                minRadius: 1.5,
                maxRadius: 2.5
            })

        ].filter(Boolean);


        // --------------------------------------------------
        // Temporary Region Debugging
        // --------------------------------------------------
        const algae =
            substrateRegions[0];

        const bloom =
            overlayRegions[0];


        const regionDistance =
            distanceBetween(
                algae.x,
                algae.y,
                bloom.x,
                bloom.y
            );

        console.log(
            `PondWorldConfig: algae/bloom distance = ${regionDistance}`
        );


        console.log({

            algaeSafe:
                isRegionSafeFromSpawn(
                    algae
                ),

            bloomSafe:
                isRegionSafeFromSpawn(
                    bloom
                )

        });


        // --------------------------------------------------
        // Return Pond Configuration
        // --------------------------------------------------
        return {
            substrateRegions,
            overlayRegions
        };

    }

};

export default PondWorldConfig;