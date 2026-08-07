
import gameState from "./GameState.js";

const GameStateManager = {

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
