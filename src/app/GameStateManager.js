// --------------------------------------------------
// GameStateManager.js
// Controlled read/write access to persistent GameState
// --------------------------------------------------

import gameState from "./GameState.js";
import testGameState from "./TestGameState.js";
import GameStateObserver
    from "./GameStateObserver.js";
import XPManager from "./XPManager.js";
import { elementLibrary } from "../data/elementLibrary.js";
import DiscoveryManager from "./DiscoveryManager.js";


const GameStateManager = {

    initialize() {

        console.log(
            "Current Game State:",
            gameState
        );

    },

    loadTestState(
        testState = testGameState
    ) {

        Object.assign(
            gameState,
            structuredClone(testState)
        );

        GameStateObserver.notify(
            "game-state-loaded",
            {
                source: "test-state"
            }
        );

        console.log(
            "Test Game State loaded:",
            gameState
        );

    },

    // --------------------------------------------------
    // Player
    // --------------------------------------------------
    addXP(amount) {

        return XPManager.addXP(amount);

    },

    setPlayerName(name) {

        if (typeof name !== "string") {
            return false;
        }

        const normalizedName =
            name.trim();

        gameState.player.name =
            normalizedName;

        gameState.player.displayName =
            normalizedName;

        return true;

    },

    setCurrentZoom(level) {

        if (![0, 1, 2].includes(level)) {
            console.warn(
                `GameStateManager: invalid zoom level "${level}"`
            );

            return false;
        }

        gameState.player.currentZoom =
            level;

        return true;

    },

    getCurrentZoom() {

        return gameState.player.currentZoom ??
            0;

    },

    // --------------------------------------------------
    // Discoveries and cell systems
    // --------------------------------------------------
    hasDiscovery(id) {
    const discoveries = gameState.discoveries;
    if (!discoveries) return false;

    // Check across all discovery buckets (atoms, isotopes, molecules)
    return Boolean(
        discoveries.atoms?.[id] ||
        discoveries.isotopes?.[id] ||
        discoveries.molecules?.[id] ||
        discoveries[id] // Fallback for legacy flat records
    );
},

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

        gameState.registry ??= {};
        gameState.registry.discoveries ??= [];

        const normalizedId =
            discoveryId.trim();

        if (
            gameState.registry.discoveries
                .includes(normalizedId)
        ) {
            return false;
        }

        gameState.registry.discoveries.push(
            normalizedId
        );

        return true;

    },

    unlockDiscovery(discoveryId) {

        return this.addDiscovery(
            discoveryId
        );

    },

    getCellSystem(systemId) {

        const cellSystem =
            gameState.cellSystems?.[systemId] ??
            gameState.registry?.cellSystems?.[
                systemId
            ];

        return cellSystem
            ? structuredClone(cellSystem)
            : null;

    },

    // --------------------------------------------------
    // Pond world
    // --------------------------------------------------
    clearPondWorldTiles() {

        const world =
            gameState.zones.pond.state.world;

        if (!world) {
            console.warn(
                "GameStateManager: Pond world does not exist"
            );

            return false;
        }

        world.tiles = {};

        console.log(
            "GameStateManager: Pond world tiles cleared"
        );

        return true;

    },

    isPondPlayerAnchored() {

        return gameState.zones.pond
            .state.player.anchored ??
            false;

    },

    setPondPlayerAnchored(anchored) {

        gameState.zones.pond
            .state.player.anchored =
            Boolean(anchored);

    },

    getPondMovementATPCost() {

        const movement =
            gameState.zones.pond
                ?.state?.movement;

        if (!movement) {
            console.warn(
                "GameStateManager: Pond movement configuration does not exist"
            );

            return null;
        }

        return movement.atpCost;

    },

    getPondWorld() {

        const world =
            gameState.zones.pond
                ?.state?.world;

        if (!world) {
            console.warn(
                "GameStateManager: Pond world state does not exist"
            );

            return null;
        }

        return world;

    },

    setPondPosition(x, y) {

        const player =
            gameState.zones.pond
                ?.state?.player;

        if (!player) {
            console.warn(
                "GameStateManager: Pond player state does not exist"
            );

            return false;
        }

        player.x = x;
        player.y = y;

        console.log(
            `GameStateManager: Pond position = (${x}, ${y})`
        );

        return true;

    },

    getPondPosition() {

        const player =
            gameState.zones.pond
                ?.state?.player;

        if (!player) {
            console.warn(
                "GameStateManager: Pond player state does not exist"
            );

            return null;
        }

        return {
            x: player.x,
            y: player.y
        };

    },

    movePondPlayer(dx, dy) {

        const position =
            this.getPondPosition();

        if (!position) {
            return false;
        }

        return this.setPondPosition(
            position.x + dx,
            position.y + dy
        );

    },

    getPondWorldSeed() {

        return gameState.zones.pond
            .state.worldSeed;

    },

    setPondWorldSeed(seed) {

        const pondState =
            gameState.zones.pond.state;

        const previousSeed =
            pondState.worldSeed;

        if (previousSeed === seed) {
            return false;
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

        return true;

    },

    // --------------------------------------------------
    // Inventory
    // --------------------------------------------------
    addItem(itemId) {

        if (
            typeof itemId !== "string" ||
            itemId.trim() === ""
        ) {
            return false;
        }

        gameState.registry.inventory ??= [];
        gameState.registry.inventory.push(
            itemId.trim()
        );

        return true;

    },

    removeItem(itemId) {

        const index =
            gameState.registry.inventory
                ?.indexOf(itemId) ?? -1;

        if (index < 0) {
            return false;
        }

        gameState.registry.inventory.splice(
            index,
            1
        );

        return true;

    },

    hasItem(itemId) {

        return Boolean(
            gameState.registry.inventory
                ?.includes(itemId)
        );

    },

    // --------------------------------------------------
    // Global-zone state
    // --------------------------------------------------
    hasZone(zoneId) {

        return Boolean(
            gameState.zones?.[zoneId]
        );

    },

    getZoneSnapshot(zoneId) {

        const zone =
            gameState.zones?.[zoneId];

        return zone
            ? structuredClone(zone)
            : null;

    },

    isZoneUnlocked(zoneId) {

        return Boolean(
            gameState.zones?.[zoneId]
                ?.unlocked
        );

    },

    isZoneCompleted(zoneId) {

        return Boolean(
            gameState.zones?.[zoneId]
                ?.completed
        );

    },

    isZoneAccessible(zoneId) {

        return this.isZoneUnlocked(zoneId) ||
            this.isZoneCompleted(zoneId);

    },

    setZoneUnlocked(zoneId, unlocked) {

        const zone =
            gameState.zones?.[zoneId];

        if (!zone) {
            console.warn(
                `GameStateManager: unknown zone "${zoneId}"`
            );

            return false;
        }

        if (typeof unlocked !== "boolean") {
            console.warn(
                "GameStateManager: unlocked state must be boolean"
            );

            return false;
        }

        zone.unlocked = unlocked;

        GameStateObserver.notify(
            "zone-state-changed",
            {
                zoneId,
                unlocked:
                    zone.unlocked,
                completed:
                    Boolean(zone.completed)
            }
        );

        return true;

    },

    setZoneCompleted(zoneId, completed) {

        const zone =
            gameState.zones?.[zoneId];

        if (!zone) {
            console.warn(
                `GameStateManager: unknown zone "${zoneId}"`
            );

            return false;
        }

        if (typeof completed !== "boolean") {
            console.warn(
                "GameStateManager: completed state must be boolean"
            );

            return false;
        }

        zone.completed = completed;

        if (completed) {
            zone.unlocked = true;
        }

        GameStateObserver.notify(
            "zone-state-changed",
            {
                zoneId,
                unlocked:
                    Boolean(zone.unlocked),
                completed:
                    zone.completed
            }
        );

        return true;

    },

    getCurrentZoneId() {

        return gameState.player
            ?.currentZone ?? "pond";

    },

    setCurrentZone(zoneId) {

        if (!this.hasZone(zoneId)) {
            console.warn(
                `GameStateManager: unknown zone "${zoneId}"`
            );

            return false;
        }

        if (!this.isZoneAccessible(zoneId)) {
            console.warn(
                `GameStateManager: zone "${zoneId}" is locked`
            );

            return false;
        }

        gameState.player.currentZone =
            zoneId;

        GameStateObserver.notify(
            "current-zone-changed",
            {
                zoneId
            }
        );

        console.log(
            `GameStateManager: current zone = ${zoneId}`
        );

        return true;

    },

    // --------------------------------------------------
    // Quests, journal, and settings
    // --------------------------------------------------
    startQuest(questId) {

        console.warn(
            `GameStateManager: quest start is not implemented for "${questId}"`
        );

        return false;

    },

    completeQuest(questId) {

        console.warn(
            `GameStateManager: quest completion is not implemented for "${questId}"`
        );

        return false;

    },

    // GameStateManager.js

unlockFeature(featureId) {
    if (!gameState.features) {
        gameState.features = {};
    }

    gameState.features[featureId] = true;
    console.log(`[GameStateManager] Feature unlocked: ${featureId}`);

    // Trigger save via namespace fallback
    const saver = window.ECGame?.SaveManager || (typeof SaveManager !== "undefined" ? SaveManager : null);
    if (saver && typeof saver.save === "function") {
        saver.save();
    }

    return true;
},

hasFeature(featureId) {
    return Boolean(gameState.features?.[featureId]);
},

    addJournalEntry(entry) {

        gameState.registry.journal ??= [];
        gameState.registry.journal.push(
            structuredClone(entry)
        );

        return true;

    },

    updateSetting(key, value) {

        if (
            typeof key !== "string" ||
            key.trim() === ""
        ) {
            return false;
        }

        gameState.settings[key] = value;

        return true;

    },

    leaveZone() {
        // ZoneManager owns lifecycle transitions.
    },

    reset() {
        // A deliberate reset flow will be added with profile management.
    },

    /**
 * Dynamic particle lookup using ElementLibrary and discovered isotopes.
 * 
 * @param {string} symbol - Element symbol (e.g. "Li", "H", "He")
 * @returns {{protons: number, neutrons: number, electrons: number}}
 */
getParticleCountsForElement(symbol) {
    // 1. Resolve elementLibrary reference
    const lib = typeof elementLibrary !== "undefined" 
        ? elementLibrary 
        : (window.elementLibrary || window.ECGame?.elementLibrary);

    if (!lib) {
        console.error("[GameStateManager] elementLibrary is not defined.");
        return { protons: 1, neutrons: 0, electrons: 1 };
    }

    // 2. Safely retrieve discoveries across various state object schemas
    const discoveries = 
        (typeof this.getGameState === "function" ? this.getGameState()?.discoveries?.isotopes : null) ||
        this.state?.discoveries?.isotopes ||
        this.gameState?.discoveries?.isotopes ||
        this.discoveries?.isotopes ||
        {};

    // 3. Check for matching discovered isotope key (e.g., "H1", "He4")
    const discoveredKey = Object.keys(discoveries).find(key => {
        return lib[key] ? lib[key].symbol === symbol : key.replace(/[0-9]/g, '') === symbol;
    });

    let isotope = null;

    if (discoveredKey && lib[discoveredKey]) {
        isotope = lib[discoveredKey];
    } else {
        // Fallback to first matching element entry if not discovered yet
        isotope = Object.values(lib).find(entry => entry.symbol === symbol);
    }

    if (!isotope) {
        console.warn(`[GameStateManager] No isotope entry found for symbol: ${symbol}`);
        return { protons: 1, neutrons: 0, electrons: 1 };
    }

    return {
        protons: isotope.p,
        neutrons: isotope.n,
        electrons: isotope.e
    };
}

};

export default GameStateManager;

