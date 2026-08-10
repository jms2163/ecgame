// --------------------------------------------------
// PondWorldGenerator.js
// Generates Pond environments from microbiome regions
// --------------------------------------------------

import MicrobiomeLibrary from "./MicrobiomeLibrary.js";
import PondWorldConfig from "./PondWorldConfig.js";





const PondWorldGenerator = {

    // --------------------------------------------------
    // Initial Microbiome Regions
    // --------------------------------------------------
    
// --------------------------------------------------
// Configure Generator From Persistent Seed
// --------------------------------------------------

currentSeed: null,
substrateRegions: [],
overlayRegions: [],
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

    const config =
        PondWorldConfig.create(seed);

    this.currentSeed = seed;

    this.substrateRegions =
        config.substrateRegions;

    this.overlayRegions =
        config.overlayRegions;

    console.log(
        `PondWorldGenerator configured with seed ${seed}`
    );

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
            this.substrateRegions,
            x,
            y
        );


    // --------------------------------------------------
    // Layer 3: Strongest Overlay
    // --------------------------------------------------
    const overlay =
        this.getStrongestInfluence(
            this.overlayRegions,
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
        // Blend Helper
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
                        )

                }

            }

        };

    }

};

export default PondWorldGenerator;