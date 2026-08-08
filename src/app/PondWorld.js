// --------------------------------------------------
// PondWorld.js
// Creates and retrieves Pond world tiles
// --------------------------------------------------

import PondTileFactory from "./PondTileFactory.js";
import PondWorldGenerator from "./PondWorldGenerator.js";

const PondWorld = {

    // --------------------------------------------------
    // Create World Container
    // --------------------------------------------------
    createWorld() {

    return {
        tiles: {}
    };

},

    // --------------------------------------------------
// Ensure Local Region Exists
// --------------------------------------------------
ensureRegion(world, centerX, centerY, radius) {

    for (
        let x = centerX - radius;
        x <= centerX + radius;
        x++
    ) {

        for (
            let y = centerY - radius;
            y <= centerY + radius;
            y++
        ) {

            this.getOrCreateTile(
                world,
                x,
                y
            );

        }

    }

},


    // --------------------------------------------------
    // Create / Store One Tile
    // --------------------------------------------------
    createTile(world, x, y) {

    const key = `${x},${y}`;

    if (world.tiles[key]) {
        return world.tiles[key];
    }

    const tile =
        PondTileFactory.create(x, y);

    const generated =
        PondWorldGenerator.generate(x, y);

    tile.biome =
        generated.dominantMicrobiome;

    tile.physics.light =
        generated.environment.physics.light;

    tile.physics.oxygen =
        generated.environment.physics.oxygen;

    tile.physics.ph =
        generated.environment.physics.ph;

    tile.chemistry.nutrients.glucose =
        generated.environment.nutrients.glucose;

    tile.chemistry.nutrients.nitrates =
        generated.environment.nutrients.nitrates;

    tile.chemistry.nutrients.phosphates =
        generated.environment.nutrients.phosphates;

    world.tiles[key] = tile;

    return tile;

},

    // --------------------------------------------------
// Retrieve Tile or Create It If Needed
// --------------------------------------------------
getOrCreateTile(world, x, y) {

    const existingTile = this.getTile(world, x, y);

    if (existingTile) {
        return existingTile;
    }

    return this.createTile(world, x, y);

},


    // --------------------------------------------------
    // Retrieve One Tile
    // --------------------------------------------------
    getTile(world, x, y) {

        const key = `${x},${y}`;

        return world.tiles[key] ?? null;

    }

};

export default PondWorld;