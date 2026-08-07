import gameState from "./GameState.js";

const SAVE_KEY = "ECGame_Save";

const SaveManager = {

    // --------------------------------------------------
    // Initialize
    // --------------------------------------------------
    Initialize() {},

    // --------------------------------------------------
    // Save
    // --------------------------------------------------
    save() {
        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(gameState)
        );
    },


    // --------------------------------------------------
    // Load
    // --------------------------------------------------
    load() {
        const data = localStorage.getItem(SAVE_KEY);
        if (!data) return; // Guard clause: stop early if no save exists

        try {
            Object.assign(gameState, JSON.parse(data));
        } catch (error) {
            console.error("Failed to parse game save:", error);
        }
    },


    // --------------------------------------------------
    // Export
    // --------------------------------------------------
    export() {
        return JSON.stringify(gameState, null, 2); // Added return (otherwise it produces JSON without returning it)
    },


    // --------------------------------------------------
    // Import
    // --------------------------------------------------
    import(data) {
        // TODO: load external save data into gameState
        // Do I need to know what gamestate format looks like first?
    },


    // --------------------------------------------------
    // Clear
    // --------------------------------------------------
    clear() {
        localStorage.removeItem(SAVE_KEY);
    }

};


export default SaveManager;