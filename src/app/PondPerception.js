// --------------------------------------------------
// PondPerception.js
// Reads nearby Pond tiles for biological perception
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";

const CHEMICAL_SIGNAL_THRESHOLDS = {

    abioticOxygenMaximum: 0.05,
    abioticPhMinimum: 6.4,

    bacterialFolateMinimum: 0.05,
    bacterialPeptideMinimum: 0.05,

    fermentationScfaMinimum: 0.07,

    bloomLightMinimum: 0.75,
    bloomOxygenMinimum: 1.20,

    mixedRiskCyanotoxinMinimum: 0.01,
    hazardCyanotoxinMinimum: 0.02

};

const PondPerception = {

    // --------------------------------------------------
    // Get tiles in a square sensing range
    // --------------------------------------------------
    getTilesInRange(radius) {

        const world =
            GameStateManager.getPondWorld();

        const position =
            GameStateManager.getPondPosition();

        if (!world || !position) {
            console.warn(
                "PondPerception: Pond world or player position unavailable"
            );

            return [];
        }

        const tiles = [];

        for (
            let x = position.x - radius;
            x <= position.x + radius;
            x++
        ) {

            for (
                let y = position.y - radius;
                y <= position.y + radius;
                y++
            ) {

                const tile =
                    PondWorld.getTile(
                        world,
                        x,
                        y
                    );

                if (tile) {
                    tiles.push(tile);
                }

            }

        }

        return tiles;

    },

    // --------------------------------------------------
    // Get nearby tiles inside a circular sensing range
    // --------------------------------------------------
    getTilesWithDistance(radius) {

        const world =
            GameStateManager.getPondWorld();

        const position =
            GameStateManager.getPondPosition();

        if (!world || !position) {
            console.warn(
                "PondPerception: Pond world or player position unavailable"
            );

            return [];
        }

        const results = [];

        for (
            let x = position.x - radius;
            x <= position.x + radius;
            x++
        ) {

            for (
                let y = position.y - radius;
                y <= position.y + radius;
                y++
            ) {

                const dx =
                    x - position.x;

                const dy =
                    y - position.y;

                const distance =
                    Math.sqrt(
                        (dx * dx) +
                        (dy * dy)
                    );

                if (distance > radius) {
                    continue;
                }

                const tile =
                    PondWorld.getTile(
                        world,
                        x,
                        y
                    );

                if (!tile) {
                    continue;
                }

                results.push({
                    tile,
                    distance
                });

            }

        }

        return results;

    },

    // --------------------------------------------------
    // Calculate signal strength lost with distance
    // --------------------------------------------------
    calculateFalloff(distance, maxRange) {

        if (maxRange <= 0) {
            return distance === 0 ? 1 : 0;
        }

        if (distance > maxRange) {
            return 0;
        }

        return 1 - (
            distance / (maxRange + 1)
        );

    },

    // --------------------------------------------------
    // Build a perception field for any tile value
    // --------------------------------------------------
    buildField(radius, valueSelector) {

        const entries =
            this.getTilesWithDistance(
                radius
            );

        return entries.map(
            ({ tile, distance }) => {

                const selectedValue =
                    valueSelector(tile);

                const rawValue =
                    Number.isFinite(selectedValue)
                        ? selectedValue
                        : 0;

                const falloff =
                    this.calculateFalloff(
                        distance,
                        radius
                    );

                return {
                    x: tile.x,
                    y: tile.y,
                    distance,
                    rawValue,
                    intensity:
                        rawValue * falloff
                };

            }
        );

    },

    // --------------------------------------------------
    // Get a field for one named chemical signal
    // --------------------------------------------------
    getSignalField(signalKey, radius = 4) {

        return this.buildField(
            radius,
            tile =>
                tile.chemistry
                    ?.signals?.[signalKey] ?? 0
        );

    },

    // --------------------------------------------------
    // Find the strongest detected named signal
    // --------------------------------------------------
    getStrongestDetectedSignal(
        signalKey,
        radius = 4
    ) {

        const field =
            this.getSignalField(
                signalKey,
                radius
            );

        let strongestEntry = null;

        field.forEach(entry => {

            if (
                entry.intensity <= 0 ||
                (
                    strongestEntry &&
                    entry.intensity <=
                        strongestEntry.intensity
                )
            ) {
                return;
            }

            strongestEntry = entry;

        });

        if (!strongestEntry) {
            return null;
        }

        return {
            signalKey,
            ...strongestEntry
        };

    },

    // --------------------------------------------------
// Describe a position relative to the amoeba
// --------------------------------------------------
getRelativeLocationLabel(dx, dy) {

    if (dx === 0 && dy === 0) {
        return "Here";
    }

    const parts = [];

    if (dx < 0) {
        parts.push(
            `${Math.abs(dx)} left`
        );
    }

    if (dx > 0) {
        parts.push(
            `${dx} right`
        );
    }

    if (dy < 0) {
        parts.push(
            `${Math.abs(dy)} up`
        );
    }

    if (dy > 0) {
        parts.push(
            `${dy} down`
        );
    }

    return parts.join(", ");

},

// --------------------------------------------------
// Read one tile inside the Chemical Signals range
// --------------------------------------------------
getProbeReadingAt(x, y, radius = 4) {

    const world =
        GameStateManager.getPondWorld();

    const position =
        GameStateManager.getPondPosition();

    if (!world || !position) {
        console.warn(
            "PondPerception: Pond world or player position unavailable"
        );

        return null;
    }

    const dx =
        x - position.x;

    const dy =
        y - position.y;

    const distance =
        Math.sqrt(
            (dx * dx) +
            (dy * dy)
        );

    if (distance > radius) {
        return null;
    }

    const tile =
        PondWorld.getTile(
            world,
            x,
            y
        );

    if (!tile) {
        return null;
    }

    return {
        x,
        y,
        dx,
        dy,
        distance,

        relativeLocation:
            this.getRelativeLocationLabel(
                dx,
                dy
            ),

        microbiome:
            tile.biome,

        classification:
            this.classifyTile(
                tile
            ),

        signals: {
            folate:
                tile.chemistry
                    ?.signals?.folate ?? 0,

            nFormylPeptides:
                tile.chemistry
                    ?.signals
                    ?.n_formyl_peptides ?? 0,

            scfa:
                tile.chemistry
                    ?.signals?.scfa ?? 0,

            camp:
                tile.chemistry
                    ?.signals?.camp ?? 0,

            cyanotoxins:
                tile.chemistry
                    ?.signals?.cyanotoxins ?? 0,

            ammonia:
                tile.chemistry
                    ?.signals?.ammonia ?? 0
        }
    };

},

    // --------------------------------------------------
    // Classify one tile's local chemical environment
    // --------------------------------------------------
    classifyTile(tile) {

        const physics =
            tile?.physics ?? {};

        const signals =
            tile?.chemistry?.signals ?? {};

        const oxygen =
            Number(physics.oxygen) || 0;

        const ph =
            Number(physics.ph) || 0;

        const light =
            Number(physics.light) || 0;

        const folate =
            Number(signals.folate) || 0;

        const peptides =
            Number(signals.n_formyl_peptides) || 0;

        const scfa =
            Number(signals.scfa) || 0;

        const cyanotoxins =
            Number(signals.cyanotoxins) || 0;

        const bacterialActivity =
            folate >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .bacterialFolateMinimum ||
            peptides >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .bacterialPeptideMinimum;

        const severeHazard =
            cyanotoxins >=
            CHEMICAL_SIGNAL_THRESHOLDS
                .hazardCyanotoxinMinimum;

        const mixedRisk =
            bacterialActivity &&
            cyanotoxins >=
            CHEMICAL_SIGNAL_THRESHOLDS
                .mixedRiskCyanotoxinMinimum;

        if (
            oxygen <=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .abioticOxygenMaximum ||
            ph <=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .abioticPhMinimum
        ) {
            return {
                code: "ABIOTIC_HAZARD",
                label: "Abiotic Hazard"
            };
        }

        if (severeHazard) {
            return {
                code: "HAZARD_SIGNAL",
                label: "Hazard Signal"
            };
        }

        if (mixedRisk) {
            return {
                code: "MIXED_RISK",
                label: "Mixed Risk"
            };
        }

        if (
            light >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .bloomLightMinimum &&
            oxygen >=
                CHEMICAL_SIGNAL_THRESHOLDS
                    .bloomOxygenMinimum
        ) {
            return {
                code: "PHOTOSYNTHETIC_BLOOM",
                label: "Photosynthetic Bloom"
            };
        }

        if (
            scfa >=
            CHEMICAL_SIGNAL_THRESHOLDS
                .fermentationScfaMinimum
        ) {
            return {
                code: "FERMENTATION_SIGNALS",
                label: "Fermentation Signals"
            };
        }

        if (bacterialActivity) {
            return {
                code: "BACTERIAL_ACTIVITY",
                label: "Bacterial Activity"
            };
        }

        return {
            code: "QUIET",
            label: "Quiet"
        };

    }

};

export default PondPerception;