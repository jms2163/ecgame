import gameState from "./GameState.js";
import testGameState from "./TestGameState.js";

const GameStateManager = {

    // --------------------------------------------------
    // Initialize
    // --------------------------------------------------

    initialize() {

        //console.log("GameStateManager initialized");

        console.log("Current Game State:", gameState);

    },


    loadTestState(testState) {

        Object.assign(gameState, testState);

        console.log("Test Game State loaded:", gameState);

    },

    


    // --------------------------------------------------
    // Player
    // --------------------------------------------------

    addXP(amount) {
        // TODO: increment player XP and handle level-ups
    },

    setPlayerName(name) {
        // TODO: set player name
    },

    setCurrentZoom(level) {

    if (![0, 1, 2].includes(level)) {
        console.warn(`GameStateManager: invalid zoom level "${level}"`);
        return;
    }

    gameState.player.currentZoom = level;

    //console.log(`GameStateManager: current zoom = ${level}`);
},

// --------------------------------------------------
// Global discoveries and cell systems
// --------------------------------------------------

hasDiscovery(discoveryId) {

    return gameState.registry.discoveries.includes(
        discoveryId
    );

},

// --------------------------------------------------
// Add one global discovery
// --------------------------------------------------
addDiscovery(discoveryId) {

    if (
        typeof discoveryId !== "string" ||
        discoveryId.trim() === ""
    ) {
        console.warn(
            "GameStateManager: discovery ID must be a non-empty string"
        );

        return false;
    }

    const discoveries =
        gameState.registry?.discoveries;

    if (!Array.isArray(discoveries)) {
        console.warn(
            "GameStateManager: discovery registry is unavailable"
        );

        return false;
    }

    const normalizedId =
        discoveryId.trim();

    if (
        discoveries.includes(
            normalizedId
        )
    ) {
        console.log(
            `GameStateManager: discovery "${normalizedId}" already exists`
        );

        return false;
    }

    discoveries.push(
        normalizedId
    );

    console.log(
        `GameStateManager: discovery added "${normalizedId}"`
    );

    return true;

},

getCellSystem(systemId) {

    const cellSystem =
        gameState.registry.cellSystems?.[systemId];

    if (!cellSystem) {
        return null;
    }

    return {
        ...cellSystem
    };

},

// --------------------------------------------------
// Pond
// --------------------------------------------------

clearPondWorldTiles() {

    const world =
        gameState.zones.pond.state.world;

    if (!world) {
        console.warn(
            "GameStateManager: Pond world does not exist"
        );
        return;
    }

    world.tiles = {};

    console.log(
        "GameStateManager: Pond world tiles cleared"
    );

},

// --------------------------------------------------
// Pond Anchoring
// --------------------------------------------------

isPondPlayerAnchored() {

    return (
        gameState.zones.pond.state.player.anchored
        ?? false
    );

},

setPondPlayerAnchored(anchored) {

    gameState.zones.pond.state.player.anchored =
        Boolean(anchored);

},

// --------------------------------------------------
// Pond movement configuration
// --------------------------------------------------

getPondMovementATPCost() {

    const movement =
        gameState.zones.pond?.state?.movement;

    if (!movement) {

        console.warn(
            "GameStateManager: Pond movement configuration does not exist"
        );

        return null;

    }

    return movement.atpCost;

},

getPondWorld() {

    const pondState = gameState.zones.pond?.state;

    if (!pondState?.world) {
        console.warn(
            "GameStateManager: Pond world state does not exist"
        );

        return null;
    }

    return pondState.world;

},

setPondPosition(x, y) {

    const pondState = gameState.zones.pond?.state;

    if (!pondState?.player) {

        console.warn(
            "GameStateManager: Pond player state does not exist"
        );

        return;

    }

    pondState.player.x = x;
    pondState.player.y = y;

    console.log(
        `GameStateManager: Pond position = (${x}, ${y})`
    );

},

getPondPosition() {

    const pondState = gameState.zones.pond?.state;

    if (!pondState?.player) {

        console.warn(
            "GameStateManager: Pond player state does not exist"
        );

        return null;

    }

    return {
        x: pondState.player.x,
        y: pondState.player.y
    };

},

movePondPlayer(dx, dy) {

    const pondState = gameState.zones.pond?.state;

    if (!pondState?.player) {

        console.warn(
            "GameStateManager: Pond player state does not exist"
        );

        return;

    }

    const newX = pondState.player.x + dx;
    const newY = pondState.player.y + dy;

    this.setPondPosition(newX, newY);

    console.log(
        `GameStateManager: Pond player moved to (${newX}, ${newY})`
    );

},

// --------------------------------------------------
// Pond World Seed
// --------------------------------------------------

getPondWorldSeed() {

    return gameState.zones.pond.state.worldSeed;

},

setPondWorldSeed(seed) {

    const pondState =
        gameState.zones.pond.state;

    const previousSeed =
        pondState.worldSeed;

    if (previousSeed === seed) {
        return;
    }

    pondState.worldSeed = seed;

    if (
        previousSeed !== null &&
        previousSeed !== undefined
    ) {
        this.clearPondWorldTiles();
    }

    console.log(
        `GameStateManager: Pond world seed = ${seed}`
    );

},


    // --------------------------------------------------
    // Inventory
    // --------------------------------------------------

    addItem(itemId) {
        // TODO: push item into registry.inventory
    },

    removeItem(itemId) {
        // TODO: remove item from registry.inventory
    },

    hasItem(itemId) {
        // TODO: return boolean
    },


    // --------------------------------------------------
    // Discoveries
    // --------------------------------------------------

    unlockDiscovery(discoveryId) {
        // TODO: add discovery to registry.discoveries
    },

    hasDiscovery(discoveryId) {

    return gameState.registry.discoveries.includes(
        discoveryId
    );

},


    // --------------------------------------------------
    // Quests
    // --------------------------------------------------

    startQuest(questId) {
        // TODO: add quest to registry.quests
    },

    completeQuest(questId) {
        // TODO: mark quest as completed
    },


    // --------------------------------------------------
    // Journal
    // --------------------------------------------------

    addJournalEntry(entry) {
        // TODO: push entry into registry.journal
    },


    // --------------------------------------------------
    // Settings
    // --------------------------------------------------

    updateSetting(key, value) {
        // TODO: mutate gameState.settings[key]
    },


    // --------------------------------------------------
    // Zones
    // --------------------------------------------------
    setCurrentZone(zoneId) {

    if (!gameState.zones[zoneId]) {
        console.warn(`GameStateManager: unknown zone "${zoneId}"`);
        return;
    }

    if (!gameState.zones[zoneId].unlocked) {
        console.warn(`GameStateManager: zone "${zoneId}" is locked`);
        return;
    }

    gameState.player.currentZone = zoneId;

    console.log(`GameStateManager: current zone = ${zoneId}`);
},

    leaveZone(zoneId) {
        // TODO: handle zone exit logic
    },


    // --------------------------------------------------
    // Utility
    // --------------------------------------------------

    reset() {
        // TODO: full gameState reset
    }

};

export default GameStateManager;