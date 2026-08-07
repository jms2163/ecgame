import gameState from "./GameState.js";

const SaveManager = {

    // --------------------------------------------------
    // Save
    // --------------------------------------------------
    save() {
        // TODO: serialize gameState and write to storage
    },


    // --------------------------------------------------
    // Load
    // --------------------------------------------------
    load() {
        // TODO: load serialized data and hydrate gameState
    },


    // --------------------------------------------------
    // Export
    // --------------------------------------------------
    export() {
        // TODO: return a serialized representation of gameState
    },


    // --------------------------------------------------
    // Import
    // --------------------------------------------------
    import(data) {
        // TODO: load external save data into gameState
    },


    // --------------------------------------------------
    // Clear
    // --------------------------------------------------
    clear() {
        // TODO: wipe save data from storage
    }
};

export default SaveManager;
