// --------------------------------------------------
// Bootstrap.js
// Responsible for initializing the entire game
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import DataLoader from "./DataLoader.js";
import SaveManager from "./SaveManager.js";
import VersionManager from "./VersionManager.js";
import ZoneManager from "./ZoneManager.js";
import DevConsole from "./DevConsole.js";
import PondWorld from "./PondTileFactory.js";
import SeededRandom from "./SeededRandom.js";
// Zones
import Pond from "./Pond.js";
// import SimulationClock from "./SimulationClock.js";
// import ZoneManager from "./ZoneManager.js";


const Bootstrap = {
    


    // --------------------------------------------------
    // Main entry point
    // --------------------------------------------------
    async initialize(){

        //BootstrapUI.initialize();
        DevConsole.initialize();


        await DataLoader.loadAll();


        GameStateManager.initialize();

        SaveManager.initialize();

        SaveManager.load();

        ZoneManager.initialize();

        ZoneManager.enterZone("pond");



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