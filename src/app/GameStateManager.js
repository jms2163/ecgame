
import gameState from "./GameState.js";
import testGameState from "./TestGameState.js";

const GameStateManager = {

    // --------------------------------------------------
    // Initialize
    // --------------------------------------------------

    initialize() {

        // if new game, load initial values
        // if continuing, load current values

    console.log("GameStateManager initialized");

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

    changeZone(zoneId) {
        // TODO: update player.currentZone
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

    enterZone(zoneId) {
        // TODO: set player.currentZone and update zone state
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
