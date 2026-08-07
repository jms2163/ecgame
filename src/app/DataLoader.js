// --------------------------------------------------
// DataLoader.js
// Loads and validates all game data libraries
// --------------------------------------------------

import { proteinLibrary } from "../data/proteinLibrary.js";
import { motifLibrary } from "../data/motifLibrary.js";
import { moleculeLibrary } from "../data/moleculeLibrary.js";

const DataLoader = {

    libraries: {},

    // --------------------------------------------------
    // Load every data library
    // --------------------------------------------------
    async loadAll() {

        console.log("Loading data libraries...");

        this.register("proteins", proteinLibrary);
        this.register("motifs", motifLibrary);
        this.register("molecules", moleculeLibrary);

        console.log("All data libraries loaded.");

    },


    // --------------------------------------------------
    // Register a library
    // --------------------------------------------------
    register(name, library) {

        this.libraries[name] = library;

        this.validate(name, library);

        console.log(
            `✔ ${name}: ${Object.keys(library).length} entries`
        );

    },


    // --------------------------------------------------
    // Basic validation
    // --------------------------------------------------
    validate(name, library) {

        if (!library) {
            throw new Error(`${name} library is undefined.`);
        }

        if (typeof library !== "object") {
            throw new Error(`${name} library is not an object.`);
        }

        const entryCount = Object.keys(library).length;

        if (entryCount === 0) {
            console.warn(`${name} library is empty.`);
        }

    },


    // --------------------------------------------------
    // Retrieve a library
    // --------------------------------------------------
    get(name) {

        return this.libraries[name];

    }

};

export default DataLoader;