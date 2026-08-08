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
// Pond
// --------------------------------------------------

setPondPosition(x, y) {

    if (!gameState.zones.pond) {

        console.warn(
            "GameStateManager: Pond zone does not exist"
        );

        return;

    }

    gameState.zones.pond.state.playerX = x;
    gameState.zones.pond.state.playerY = y;

    console.log(
        `GameStateManager: Pond position = (${x}, ${y})`
    );

},

movePondPlayer(dx, dy) {

    const pondState = gameState.zones.pond.state;

    const newX = pondState.playerX + dx;
    const newY = pondState.playerY + dy;

    this.setPondPosition(newX, newY);

    console.log(
        `GameStateManager: Pond player moved to (${newX}, ${newY})`
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
        // TODO: return boolean
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