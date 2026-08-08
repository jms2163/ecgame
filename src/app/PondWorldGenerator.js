// --------------------------------------------------
// PondWorldGenerator.js
// Generates Pond environments from microbiome regions
// --------------------------------------------------

import MicrobiomeLibrary from "./MicrobiomeLibrary.js";

const PondWorldGenerator = {

    // --------------------------------------------------
    // Initial Microbiome Regions
    // --------------------------------------------------
    regions: [

        {
            microbiome: "open_water",
            x: 5,
            y: 5,
            radius: 10
        },

        {
            microbiome: "algae_patch",
            x: 8,
            y: 8,
            radius: 6
        }

    ],


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

        const influences = [];

        this.regions.forEach(region => {

            const weight =
                this.calculateInfluence(
                    region,
                    x,
                    y
                );

            if (weight <= 0) {
                return;
            }

            const profile =
                MicrobiomeLibrary[
                    region.microbiome
                ];

            if (!profile) {
                console.warn(
                    `PondWorldGenerator: unknown microbiome "${region.microbiome}"`
                );
                return;
            }

            influences.push({
                profile,
                weight
            });

        });


        // --------------------------------------------------
        // Fallback Environment
        // --------------------------------------------------
        if (influences.length === 0) {

            const profile =
                MicrobiomeLibrary.open_water;

            return {
                dominantMicrobiome:
                    profile.id,

                environment:
                    structuredClone(
                        profile.environment
                    )
            };

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


        // --------------------------------------------------
        // Determine Dominant Microbiome
        // --------------------------------------------------
        const dominant =
            influences.reduce(
                (strongest, item) =>
                    item.weight > strongest.weight
                        ? item
                        : strongest
            );


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
                dominant.profile.id,

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