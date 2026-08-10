// --------------------------------------------------
// PondPerception.js
// Reads nearby Pond tiles for biological perception
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";

const PondPerception = {

    // --------------------------------------------------
    // Get nearby tiles with Euclidean distance
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
    // Calculate signal falloff across sensing radius
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
    // Build a perception field from a tile-value selector
    // --------------------------------------------------
    buildField(radius, valueSelector) {

        const entries =
            this.getTilesWithDistance(radius);

        return entries.map(({ tile, distance }) => {

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
                intensity: rawValue * falloff
            };

        });

    },

    // --------------------------------------------------
    // Build a field for one named chemical signal
    // --------------------------------------------------
    getSignalField(signalKey, radius = 4) {

        return this.buildField(
            radius,
            tile =>
                tile.chemistry?.signals?.[
                    signalKey
                ] ?? 0
        );

    },

    // --------------------------------------------------
    // Find the strongest detected instance of one signal
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

        let strongestEntry =
            null;

        field.forEach(entry => {

            if (
                !strongestEntry ||
                entry.intensity >
                    strongestEntry.intensity
            ) {
                strongestEntry =
                    entry;
            }

        });

        if (
            !strongestEntry ||
            strongestEntry.intensity <= 0
        ) {
            return null;
        }

        return {
            signalKey,
            ...strongestEntry
        };

    }

};

export default PondPerception;