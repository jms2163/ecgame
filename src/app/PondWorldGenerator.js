// --------------------------------------------------
// PondWorldGenerator.js
// Generates Pond environments from microbiome regions
// --------------------------------------------------

import MicrobiomeLibrary from "./MicrobiomeLibrary.js";
import PondWorldConfig from "./PondWorldConfig.js";

const POPULATION_KEYS = [

    "green_algae",
    "heterotrophic_bacteria",
    "toxic_bacteria",
    "capsular_bacteria",
    "filamentous_bacteria",
    "amoeba_cysts",
    "giant_viruses",
    "predatory_bacteria",
    "rotifers",
    "daphnia"

];



const PondWorldGenerator = {

    // --------------------------------------------------
    // Initial Microbiome Regions
    // --------------------------------------------------
    
// --------------------------------------------------
// Configure Generator From Persistent Seed
// --------------------------------------------------

currentSeed: null,
chunkCache: new Map(),
configure(seed) {

    if (seed === null || seed === undefined) {

        console.warn(
            "PondWorldGenerator: no world seed provided"
        );

        return;
    }

    if (this.currentSeed === seed) {
        return;
    }

    this.currentSeed = seed;
    this.chunkCache.clear();

    console.log(
        `PondWorldGenerator configured with seed ${seed}`
    );

},

getChunk(chunkX, chunkY) {
    const key = `${chunkX},${chunkY}`;

    if (!this.chunkCache.has(key)) {
        this.chunkCache.set(
            key,
            PondWorldConfig.createChunk(
                this.currentSeed,
                chunkX,
                chunkY
            )
        );
    }

    return this.chunkCache.get(key);
},

getRegionsNear(x, y) {
    const { chunkX, chunkY } =
        PondWorldConfig
            .getChunkCoordinates(x, y);
    const substrateRegions = [];
    const overlayRegions = [];

    // The largest current region radius is three tiles,
    // much smaller than a chunk. Including all eight
    // neighboring chunks removes seams at chunk edges.
    for (
        let nearbyChunkY = chunkY - 1;
        nearbyChunkY <= chunkY + 1;
        nearbyChunkY++
    ) {
        for (
            let nearbyChunkX = chunkX - 1;
            nearbyChunkX <= chunkX + 1;
            nearbyChunkX++
        ) {
            const chunk = this.getChunk(
                nearbyChunkX,
                nearbyChunkY
            );

            substrateRegions.push(
                ...chunk.substrateRegions
            );
            overlayRegions.push(
                ...chunk.overlayRegions
            );
        }
    }

    return {
        substrateRegions,
        overlayRegions
    };
},


getStrongestInfluence(regions, x, y) {

    let strongest = null;

    regions.forEach(region => {

        const weight =
            this.calculateInfluence(
                region,
                x,
                y
            );

        if (weight <= 0) {
            return;
        }

        if (
            !strongest ||
            weight > strongest.weight
        ) {

            strongest = {
                region,
                weight,
                profile:
                    MicrobiomeLibrary[
                        region.microbiome
                    ]
            };

        }

    });

    return strongest;

},


    // --------------------------------------------------
    // Calculate Region Influence
    // --------------------------------------------------
    calculateInfluence(region, x, y) {

        const dx = x - region.x;
        const dy = y - region.y;

        const distance =
            Math.sqrt(
                (dx * dx) +
                (dy * dy)
            );

        if (distance >= region.radius) {
            return 0;
        }

        return 1 - (distance / region.radius);

    },


    // --------------------------------------------------
    // Generate Environment
    // --------------------------------------------------
    generate(x, y) {

    const {
        substrateRegions,
        overlayRegions
    } = this.getRegionsNear(x, y);

    // --------------------------------------------------
    // Layer 1: Background Matrix
    // --------------------------------------------------
    const background =
        MicrobiomeLibrary.open_water;


    // --------------------------------------------------
    // Layer 2: Strongest Substrate
    // --------------------------------------------------
    const substrate =
        this.getStrongestInfluence(
            substrateRegions,
            x,
            y
        );


    // --------------------------------------------------
    // Layer 3: Strongest Overlay
    // --------------------------------------------------
    const overlay =
        this.getStrongestInfluence(
            overlayRegions,
            x,
            y
        );


    // --------------------------------------------------
    // Build Local Influence Values
    // --------------------------------------------------
    const substrateWeight =
        substrate?.weight ?? 0;

    const overlayWeight =
        overlay?.weight ?? 0;


    // --------------------------------------------------
    // Calculate Remaining Open-Water Influence
    // --------------------------------------------------
    const localInfluence =
        Math.min(
            1,
            substrateWeight + overlayWeight
        );

    const backgroundWeight =
        1 - localInfluence;


    // --------------------------------------------------
    // Build Active Influence List
    // --------------------------------------------------
    const influences = [];

    if (backgroundWeight > 0) {

        influences.push({
            profile: background,
            weight: backgroundWeight
        });

    }

    if (substrateWeight > 0) {

        influences.push({
            profile: substrate.profile,
            weight: substrateWeight
        });

    }

    if (overlayWeight > 0) {

        influences.push({
            profile: overlay.profile,
            weight: overlayWeight
        });

    }


        // --------------------------------------------------
        // Calculate Total Influence
        // --------------------------------------------------
        const totalWeight =
            influences.reduce(
                (sum, item) =>
                    sum + item.weight,
                0
            );


        let dominantProfile =
    background;

let dominantWeight =
    backgroundWeight;

if (
    substrate &&
    substrateWeight >= dominantWeight
) {

    dominantProfile =
        substrate.profile;

    dominantWeight =
        substrateWeight;

}

if (
    overlay &&
    overlayWeight > dominantWeight
) {

    dominantProfile =
        overlay.profile;

}


       // --------------------------------------------------
// Blend active microbiome influences
// --------------------------------------------------
const blend = selector =>

    influences.reduce(
        (sum, item) =>
            sum +
            selector(item.profile) *
            item.weight,
        0
    ) / totalWeight;

// --------------------------------------------------
// Blend a population count
// Missing population types mean zero for that biome.
// --------------------------------------------------
const blendPopulation =
    populationKey =>

        blend(
            profile =>
                profile.environment.populations?.[
                    populationKey
                ] ?? 0
        );


        // --------------------------------------------------
        // Return Generated Environment
        // --------------------------------------------------
        return {

            dominantMicrobiome:
                dominantProfile.id,
                microbiomes: {
    background:
        background.id,

    substrate:
        substrate?.profile.id ?? null,

    overlay:
        overlay?.profile.id ?? null
},

            environment: {

    physics: {

        light:
            blend(
                profile =>
                    profile.environment.physics.light
            ),

        oxygen:
            blend(
                profile =>
                    profile.environment.physics.oxygen
            ),

        ph:
            blend(
                profile =>
                    profile.environment.physics.ph
            ),

        temperature:
            blend(
                profile =>
                    profile.environment.physics.temperature
            ),

        flow_rate:
            blend(
                profile =>
                    profile.environment.physics.flow_rate
            ),

        salinity:
            blend(
                profile =>
                    profile.environment.physics.salinity
            )

    },

    nutrients: {

        glucose:
            blend(
                profile =>
                    profile.environment.nutrients.glucose
            ),

        nitrates:
            blend(
                profile =>
                    profile.environment.nutrients.nitrates
            ),

        phosphates:
            blend(
                profile =>
                    profile.environment.nutrients.phosphates
            ),

        doc:
            blend(
                profile =>
                    profile.environment.nutrients.doc
            )

    },

    signals: {

        folate:
            blend(
                profile =>
                    profile.environment.signals.folate
            ),

        n_formyl_peptides:
            blend(
                profile =>
                    profile.environment.signals
                        .n_formyl_peptides
            ),

        scfa:
            blend(
                profile =>
                    profile.environment.signals.scfa
            ),

        camp:
            blend(
                profile =>
                    profile.environment.signals.camp
            ),

        cyanotoxins:
            blend(
                profile =>
                    profile.environment.signals.cyanotoxins
            ),

        ammonia:
            blend(
                profile =>
                    profile.environment.signals.ammonia
            )

    },

    populations:
        Object.fromEntries(
            POPULATION_KEYS.map(
                populationKey => [
                    populationKey,
                    blendPopulation(
                        populationKey
                    )
                ]
            )
        )

}

        };

    }

};

export default PondWorldGenerator;
