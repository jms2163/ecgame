// --------------------------------------------------
// PondWorld.js
// Creates and retrieves Pond world tiles
// --------------------------------------------------

import PondTileFactory from "./PondTileFactory.js";

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
    // Create / Store One Tile
    // --------------------------------------------------
    createTile(world, x, y) {

        const key = `${x},${y}`;

        if (world.tiles[key]) {
            return world.tiles[key];
        }

        const tile = PondTileFactory.create(x, y);

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