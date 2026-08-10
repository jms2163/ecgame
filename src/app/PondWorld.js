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

    tile.microbiomes =
    generated.microbiomes;

    tile.physics.light =
        generated.environment.physics.light;

    tile.physics.oxygen =
        generated.environment.physics.oxygen;

    tile.physics.ph =
        generated.environment.physics.ph;

    tile.physics.temperature =
        generated.environment.physics.temperature;

    tile.chemistry.nutrients.glucose =
        generated.environment.nutrients.glucose;

    tile.chemistry.nutrients.nitrates =
        generated.environment.nutrients.nitrates;

    tile.chemistry.nutrients.phosphates =
        generated.environment.nutrients.phosphates;
    tile.chemistry.signals.folate =
    generated.environment.signals.folate;

tile.chemistry.signals.n_formyl_peptides =
    generated.environment.signals.n_formyl_peptides;

tile.chemistry.signals.scfa =
    generated.environment.signals.scfa;

tile.chemistry.signals.camp =
    generated.environment.signals.camp;

tile.chemistry.signals.cyanotoxins =
    generated.environment.signals.cyanotoxins;

tile.chemistry.signals.ammonia =
    generated.environment.signals.ammonia;

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