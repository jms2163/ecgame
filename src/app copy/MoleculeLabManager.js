// --------------------------------------------------
// MoleculeLabManager.js
// Central coordinator for the Molecule Lab UI, Tech Tree,
// and synthesis workflows.
// --------------------------------------------------

import gameState from "./GameState.js";
import DiscoveryManager from "./DiscoveryManager.js";
import GameStateManager from "./GameStateManager.js";

// Static Data Imports
import { techTreeData } from "../data/techTree.js";
import { moleculeLibrary } from "../data/moleculeLibrary.js";
import { aminoAcids } from "../data/aminoAcids.js";
import { monosaccharideLibrary } from "../data/monosaccharideLibrary.js";
import { lipidLibrary } from "../data/lipidLibrary.js";

// Merged master lookup dictionary built on initialization
let masterLibraryCache = null;

const MoleculeLabManager = {
    /**
     * Module initialization entry point
     */
    initialize() {
        this.buildMasterLibrary();
        console.log("[MoleculeLabManager] Data libraries bound and master cache built successfully.");
    },

    activate() {
    this.active = true;

    // 1. Ensure UI skeleton & panels are initialized
    if (typeof MoleculeLabUI !== "undefined") {
        MoleculeLabUI.initialize();
    }

    // 2. Reveal the zone container
    const zoneEl = document.getElementById("molecule-lab-zone");
    if (zoneEl) {
        zoneEl.classList.remove("hidden");
    }

    // 3. Render live data using manager's status getter
    if (typeof MoleculeLabUI !== "undefined" && MoleculeLabUI.render) {
        const state = typeof this.getStatus === "function" ? this.getStatus() : this.state;
        MoleculeLabUI.render(state);
    }
},

    deactivate() {
        this.active = false;

        // Hide the zone container when switching to another zone
        const zoneEl = document.getElementById("molecule-lab-zone");
        if (zoneEl) {
            zoneEl.classList.add("hidden");
        }
    },

    /**
     * Combines all individual sub-libraries into a single master dictionary
     */
    buildMasterLibrary() {
        masterLibraryCache = {
            ...(moleculeLibrary || {}),
            ...(aminoAcids || {}),
            ...(monosaccharideLibrary || {}),
            ...(lipidLibrary || {})
        };
    },

    /**
     * Getter for complete merged library
     * @returns {Object} Master molecule dictionary indexed by ID
     */
    getAllMolecules() {
        if (!masterLibraryCache) this.buildMasterLibrary();
        return masterLibraryCache;
    },

    /**
     * Retrieves static definition details for a specific molecule ID
     * @param {string} moleculeId - e.g., "H2O", "GLUCOSE"
     * @returns {Object|null} Molecule definition object or null if not found
     */
    getMoleculeDetails(moleculeId) {
        const library = this.getAllMolecules();
        return library[moleculeId] || null;
    },

    /**
     * Finds a molecule ID matching an exact target atom formula composition
     * @param {Object} formula - e.g., { H: 2, O: 1 }
     * @returns {string|null} Matching molecule ID or null
     */
    findMoleculeByFormula(formula) {
        if (!formula || typeof formula !== "object") return null;

        const library = this.getAllMolecules();
        const targetKeys = Object.keys(formula).sort();

        for (const [id, def] of Object.entries(library)) {
            const recipeFormula = def.formula || {};
            const recipeKeys = Object.keys(recipeFormula).sort();

            if (targetKeys.length !== recipeKeys.length) continue;

            const matchesKeys = targetKeys.every((key, idx) => key === recipeKeys[idx]);
            if (!matchesKeys) continue;

            const matchesCounts = targetKeys.every(key => formula[key] === recipeFormula[key]);
            if (matchesCounts) return id;
        }

        return null;
    },

    /**
     * Getter for tech tree data structure
     * @returns {Object} Tech tree layout configuration
     */
    getTechTree() {
        return techTreeData;
    },

    /**
     * Safely inspects current count for a specific atom symbol from Atomizer state.
     * @param {string} symbol - e.g., "H", "C", "O", "N", "P", "S"
     * @returns {number} Current atom count
     */
    getAtomCount(symbol) {
        return gameState.zones?.atomizer?.state?.atoms?.[symbol]?.count ?? 0;
    },

    /**
     * Gets a list of all discovered molecule IDs from DiscoveryManager state.
     * @returns {string[]} Array of discovered molecule IDs
     */
    getDiscoveredMolecules() {
        return Object.keys(gameState.discoveries?.molecules || {});
    },

    /**
     * Checks if a specific molecule ID has been discovered.
     * @param {string} moleculeId - e.g., "H2O"
     * @returns {boolean}
     */
    isMoleculeDiscovered(moleculeId) {
        return !!gameState.discoveries?.molecules?.[moleculeId];
    },

    /**
 * Records a newly discovered molecule using DiscoveryManager authority.
 * Also syncs the discovery into ResearchManager's registry so organelle
 * experiments can detect it.
 *
 * @param {string} moleculeId - e.g., "H2O"
 * @returns {boolean} Success status of the recording
 */
recordMoleculeDiscovery(moleculeId) {
    if (!moleculeId) {
        return false;
    }

    // 1. Record the molecule in the main discovery system
    const success = DiscoveryManager.record("molecules", moleculeId);

    if (!success) {
        return false;
    }

    // 2. Ensure registry structures exist
    gameState.registry ??= {};
    gameState.registry.discoveries ??= [];

    // 3. Sync molecule discovery into ResearchManager's discovery list
    if (!gameState.registry.discoveries.includes(moleculeId)) {
        gameState.registry.discoveries.push(moleculeId);
    }

    return true;
},


    /**
     * Aggregates current status summary for UI rendering
     * @returns {Object} State payload
     */
    getStatus() {
        const discovered = this.getDiscoveredMolecules();
        const allMolecules = this.getAllMolecules();

        return {
            discoveredCount: discovered.length,
            totalMoleculesCount: Object.keys(allMolecules).length,
            discoveredMolecules: discovered
        };
    },

    /**
     * Consumes one atom of the specified symbol from the Atomizer inventory.
     * @param {string} symbol - e.g., "H", "O"
     * @returns {boolean} True if successfully consumed, false if insufficient resources
     */
    consumeAtom(symbol) {
        const atom = gameState.zones?.atomizer?.state?.atoms?.[symbol];
        if (!atom || atom.count <= 0) {
            console.warn(`[MoleculeLabManager] Insufficient atom count for symbol: ${symbol}`);
            return false;
        }

        atom.count -= 1;

        if (GameStateManager && typeof GameStateManager.save === "function") {
            GameStateManager.save();
        }

        return true;
    }
};



export default MoleculeLabManager;