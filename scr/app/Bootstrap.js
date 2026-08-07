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
import BootstrapUI from "./BootstrapUI.js";

export async function initialize() {
    BootstrapUI.initialize();

    await loadData();
    BootstrapUI.mark("Data");

    await initializeGameState();
    BootstrapUI.mark("Game State");

    await initializeObservers();
    BootstrapUI.mark("Observers");

    await initializeUI();
    BootstrapUI.mark("UI");

    await initializeZones();
    BootstrapUI.mark("Zones");

    await startSimulation();
    BootstrapUI.mark("Simulation");

    BootstrapUI.ready();
}


// --------------------------------------------------
// Load Data
// --------------------------------------------------
async function loadData() {
    await DataLoader.loadAll();
}


// --------------------------------------------------
// Initialize Game State
// --------------------------------------------------
async function initializeGameState() {
    GameStateManager.reset(); // or hydrate from save
}


// --------------------------------------------------
// Initialize Observers
// --------------------------------------------------
async function initializeObservers() {
    // Example:
    // GameStateObserver.on("tick", () => UIManager.updateTick());
}


// --------------------------------------------------
// Initialize UI
// --------------------------------------------------
async function initializeUI() {
    UIManager.initialize();
}


// --------------------------------------------------
// Initialize Zones
// --------------------------------------------------
async function initializeZones() {
    ZoneManager.initialize();
}


// --------------------------------------------------
// Start Simulation Clock
// --------------------------------------------------
async function startSimulation() {
    SimulationClock.start();
}
