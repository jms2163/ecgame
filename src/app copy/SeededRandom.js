// --------------------------------------------------
// SeededRandom.js
// Deterministic pseudo-random number generator
// --------------------------------------------------

const SeededRandom = {

    create(seed) {

        let state = seed >>> 0;

        return function () {

            state =
                (state * 1664525 + 1013904223)
                >>> 0;

            return state / 4294967296;

        };

    }

};

export default SeededRandom;