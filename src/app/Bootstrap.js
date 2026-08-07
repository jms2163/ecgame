// --------------------------------------------------
// Bootstrap.js
// Responsible for initializing the entire game
// --------------------------------------------------

import BootstrapUI from "./BootstrapUI.js";
import GameStateManager from "./GameStateManager.js";
import DataLoader from "./DataLoader.js";
import SaveManager from "./SaveManager.js";
import VersionManager from "./VersionManager.js";
// import SimulationClock from "./SimulationClock.js";
// import ZoneManager from "./ZoneManager.js";


const Bootstrap = {


    // --------------------------------------------------
    // Main entry point
    // --------------------------------------------------
    async initialize(){

        BootstrapUI.initialize();


        await DataLoader.loadAll();
        BootstrapUI.mark("Scientific Data");


        GameStateManager.initialize();
        BootstrapUI.mark("Game State");
        BootstrapUI.ready();

        SaveManager.initialize();
        BootstrapUI.mark("Save System");


        // Initialize observers/events
        // await this.initializeObservers();
        // BootstrapUI.mark("Observers");


        // Initialize user interface
        // await this.initializeUI();
        // BootstrapUI.mark("UI");


        // Initialize world zones
        // await this.initializeZones();
        // BootstrapUI.mark("Zones");


        // Start simulation loop
        // await this.startSimulation();
        // BootstrapUI.mark("Simulation");


        BootstrapUI.mark("Bootstrap loaded");

        BootstrapUI.ready();

    },


    // --------------------------------------------------
    // Future initialization steps
    // --------------------------------------------------

    async loadData(){

        // DataLoader.loadAll();

    },


    async initializeGameState(){

        // GameStateManager.initialize();

    },


    async initializeObservers(){

        // GameStateObserver.initialize();

    },


    async initializeUI(){

        // UIManager.initialize();

    },


    async initializeZones(){

        // ZoneManager.initialize();

    },


    async startSimulation(){

        // SimulationClock.start();

    }


};


export default Bootstrap;