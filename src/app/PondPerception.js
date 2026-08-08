// --------------------------------------------------
// PondPerception.js
// Reads nearby Pond tiles for biological perception
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import PondWorld from "./PondWorld.js";

const PondPerception = {

    // --------------------------------------------------
    // Get Tiles Within Sensing Radius
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
                    PondWorld.getTile(world, x, y);

                if (tile) {
                    tiles.push(tile);
                }

            }

        }

        return tiles;

    },
    // --------------------------------------------------
// Find Strongest Bacterial Peptide Signal
// --------------------------------------------------
getStrongestPeptideSignal(radius = 4) {

    const tiles = this.getTilesInRange(radius);

    if (tiles.length === 0) {
        return null;
    }

    let strongestTile = null;
    let strongestSignal = 0;

    tiles.forEach(tile => {

        const signal =
            tile.chemistry?.signals?.peptides ?? 0;

        if (signal > strongestSignal) {

            strongestSignal = signal;
            strongestTile = tile;

        }

    });

    if (!strongestTile) {
        return null;
    }

    return {
        x: strongestTile.x,
        y: strongestTile.y,
        strength: strongestSignal
    };

},

// --------------------------------------------------
// Get Nearby Tiles With Euclidean Distance
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

            const dx = x - position.x;
            const dy = y - position.y;

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
// Calculate Perception Falloff
// Returns 1.0 at the source and 0.0 at max range
// --------------------------------------------------
calculateFalloff(distance, maxRange) {

    if (maxRange <= 0) {
        return distance === 0 ? 1 : 0;
    }

    if (distance >= maxRange) {
        return 0;
    }

    return 1 - (distance / maxRange);

},

};

export default PondPerception;