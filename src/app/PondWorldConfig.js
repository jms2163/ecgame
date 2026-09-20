// --------------------------------------------------
// PondWorldConfig.js
// Deterministic, repeatable microbiome regions for an
// effectively unlimited Pond world.
// --------------------------------------------------

import SeededRandom from "./SeededRandom.js";

const CHUNK_SIZE = 16;
const ANAEROBIC_CHANCE = 0.35;
const ANAEROBIC_SPAWN_MARGIN = 3;

function mixSeed(seed, chunkX, chunkY) {
    let mixed = seed >>> 0;

    mixed ^= Math.imul(chunkX | 0, 0x9e3779b1);
    mixed ^= Math.imul(chunkY | 0, 0x85ebca77);
    mixed ^= mixed >>> 16;
    mixed = Math.imul(mixed, 0x7feb352d);
    mixed ^= mixed >>> 15;
    mixed = Math.imul(mixed, 0x846ca68b);
    mixed ^= mixed >>> 16;

    return mixed >>> 0;
}

function distanceBetween(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt((dx * dx) + (dy * dy));
}

function isRegionSafeFromSpawn(
    region,
    safeMargin = ANAEROBIC_SPAWN_MARGIN
) {
    return (
        distanceBetween(
            0,
            0,
            region.x,
            region.y
        ) - region.radius
    ) >= safeMargin;
}

const PondWorldConfig = {

    CHUNK_SIZE,
    ANAEROBIC_CHANCE,
    ANAEROBIC_SPAWN_MARGIN,

    getChunkCoordinates(x, y) {
        return {
            chunkX: Math.floor(x / CHUNK_SIZE),
            chunkY: Math.floor(y / CHUNK_SIZE)
        };
    },

    createChunk(seed, chunkX, chunkY) {
        const random = SeededRandom.create(
            mixSeed(seed, chunkX, chunkY)
        );
        const minX = chunkX * CHUNK_SIZE;
        const minY = chunkY * CHUNK_SIZE;
        const randomFloat = (min, max) =>
            min + (random() * (max - min));
        const randomInt = (min, max) =>
            Math.floor(
                random() * (max - min + 1)
            ) + min;
        const chooseWeighted = entries => {
            const roll = random();
            let accumulatedWeight = 0;

            for (const entry of entries) {
                accumulatedWeight +=
                    entry.weight;

                if (roll < accumulatedWeight) {
                    return entry.value;
                }
            }

            return entries.at(-1).value;
        };

        const createRegion = ({
            microbiome,
            minRadius,
            maxRadius,
            requireSpawnSafe = false,
            safeMargin = ANAEROBIC_SPAWN_MARGIN,
            maxAttempts = 50
        }) => {
            for (
                let attempt = 0;
                attempt < maxAttempts;
                attempt++
            ) {
                const region = {
                    microbiome,
                    x: randomInt(
                        minX,
                        minX + CHUNK_SIZE - 1
                    ),
                    y: randomInt(
                        minY,
                        minY + CHUNK_SIZE - 1
                    ),
                    radius: randomFloat(
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

            return null;
        };

        const variedSubstrate =
            chooseWeighted([
                {
                    value: "algae_patch",
                    weight: 0.4
                },
                {
                    value: "leaf_surface",
                    weight: 0.35
                },
                {
                    value: "biofilm_mat",
                    weight: 0.25
                }
            ]);
        const variedOverlay =
            chooseWeighted([
                {
                    value: "bacterial_bloom",
                    weight: 0.5
                },
                {
                    value: "detritus_cloud",
                    weight: 0.5
                }
            ]);
        const substrateRegions = [
            createRegion({
                microbiome: "algae_patch",
                minRadius: 2,
                maxRadius: 3
            }),
            createRegion({
                microbiome: variedSubstrate,
                minRadius: 2,
                maxRadius: 3
            })
        ].filter(Boolean);
        const overlayRegions = [
            createRegion({
                microbiome: "bacterial_bloom",
                minRadius: 1.5,
                maxRadius: 2.5
            }),
            createRegion({
                microbiome: variedOverlay,
                minRadius:
                    variedOverlay ===
                        "detritus_cloud"
                        ? 1.75
                        : 1.5,
                maxRadius:
                    variedOverlay ===
                        "detritus_cloud"
                        ? 2.75
                        : 2.5
            })
        ];

        if (random() < ANAEROBIC_CHANCE) {
            overlayRegions.push(
                createRegion({
                    microbiome: "anaerobic_pocket",
                    minRadius: 0.5,
                    maxRadius: 1,
                    requireSpawnSafe: true
                })
            );
        }

        return {
            chunkX,
            chunkY,
            substrateRegions,
            overlayRegions:
                overlayRegions.filter(Boolean)
        };
    },

    // Retained for development-console compatibility.
    create(seed) {
        return this.createChunk(seed, 0, 0);
    },

    isRegionSafeFromSpawn

};

export {
    CHUNK_SIZE,
    ANAEROBIC_CHANCE,
    ANAEROBIC_SPAWN_MARGIN,
    mixSeed,
    isRegionSafeFromSpawn
};

export default PondWorldConfig;
