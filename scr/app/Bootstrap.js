// --------------------------------------------------
// Bootstrap.js
// Responsible for initializing the entire game
// --------------------------------------------------

//import DataLoader from "./DataLoader.js";
//import GameStateManager from "./GameStateManager.js";
//import GameStateObserver from "./GameStateObserver.js";
//import FacilityUI from "./FacilityUI.js";
//import ZoneManager from "./ZoneManager.js";
//import SimulationClock from "./SimulationClock.js";
//import BootstrapUI from "./BootstrapUI.js";

const Bootstrap = {

    // --------------------------------------------------
    // Main entry point
    // --------------------------------------------------
    async initialize() {
        BootstrapUI.initialize();

        await this.loadData();
        BootstrapUI.mark("Data");

        await this.initializeGameState();
        BootstrapUI.mark("Game State");

        await this.initializeObservers();
        BootstrapUI.mark("Observers");

        await this.initializeUI();
        BootstrapUI.mark("UI");

        await this.initializeZones();
        BootstrapUI.mark("Zones");

        await this.startSimulation();
        BootstrapUI.mark("Simulation");

        BootstrapUI.ready();
    },


    // --------------------------------------------------
    // Load Data
    // --------------------------------------------------
    async loadData() {
        await DataLoader.loadAll();
    },


    // --------------------------------------------------
    // Initialize Game State
    // --------------------------------------------------
    async initializeGameState() {
        GameStateManager.reset(); // or hydrate from save
    },


    // --------------------------------------------------
    // Initialize Observers
    // --------------------------------------------------
    async initializeObservers() {
        // Example:
        // GameStateObserver.on("tick", () => UIManager.updateTick());
    },


    // --------------------------------------------------
    // Initialize UI
    // --------------------------------------------------
    async initializeUI() {
        UIManager.initialize();
    },


    // --------------------------------------------------
    // Initialize Zones
    // --------------------------------------------------
    async initializeZones() {
        ZoneManager.initialize();
    },


    // --------------------------------------------------
    // Start Simulation Clock
    // --------------------------------------------------
    async startSimulation() {
        SimulationClock.start();
    }
};

export default Bootstrap;
