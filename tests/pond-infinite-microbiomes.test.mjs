// Run with: node tests/pond-infinite-microbiomes.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import PondWorld, {
    GENERATION_VERSION
} from "../src/app/PondWorld.js";
import PondWorldConfig, {
    ANAEROBIC_SPAWN_MARGIN
} from "../src/app/PondWorldConfig.js";
import PondWorldGenerator
    from "../src/app/PondWorldGenerator.js";

const seed = 123456789;

const firstChunk =
    PondWorldConfig.createChunk(
        seed,
        10,
        -7
    );
const repeatedChunk =
    PondWorldConfig.createChunk(
        seed,
        10,
        -7
    );

assert.deepEqual(
    repeatedChunk,
    firstChunk,
    "the same seed and chunk coordinates must reproduce the same regions"
);

assert.deepEqual(
    PondWorldConfig.getChunkCoordinates(
        -1,
        -17
    ),
    {
        chunkX: -1,
        chunkY: -2
    },
    "negative coordinates must map to stable floor-based chunks"
);

[
    [0, 0],
    [1, 0],
    [-1, 0],
    [10, -7],
    [-12, 9],
    [125, 125]
].forEach(([chunkX, chunkY]) => {
    const chunk =
        PondWorldConfig.createChunk(
            seed,
            chunkX,
            chunkY
        );

    assert.deepEqual(
        chunk.substrateRegions.map(
            region => region.microbiome
        ),
        [
            "algae_patch",
            "algae_patch"
        ]
    );
    assert.equal(
        chunk.overlayRegions.filter(
            region =>
                region.microbiome ===
                    "bacterial_bloom"
        ).length,
        2,
        `chunk ${chunkX},${chunkY} must contain two Bacterial Blooms`
    );
});

// Every generated Anaerobic Pocket near the starting position must retain
// the original three-tile safety margin. Distant chunks are checked too so
// that all pockets keep the same deterministic metadata contract.
let checkedAnaerobicPockets = 0;

for (let testSeed = 0; testSeed < 100; testSeed++) {
    for (let chunkX = -1; chunkX <= 0; chunkX++) {
        for (let chunkY = -1; chunkY <= 0; chunkY++) {
            const chunk =
                PondWorldConfig.createChunk(
                    testSeed,
                    chunkX,
                    chunkY
                );
            const pockets =
                chunk.overlayRegions.filter(
                    region =>
                        region.microbiome ===
                            "anaerobic_pocket"
                );

            pockets.forEach(region => {
                checkedAnaerobicPockets += 1;
                assert.equal(
                    PondWorldConfig
                        .isRegionSafeFromSpawn(
                            region,
                            ANAEROBIC_SPAWN_MARGIN
                        ),
                    true
                );
            });
        }
    }
}

assert.ok(
    checkedAnaerobicPockets > 0,
    "the safety sample must include generated Anaerobic Pockets"
);

PondWorldGenerator.currentSeed = null;
PondWorldGenerator.chunkCache.clear();
PondWorldGenerator.configure(seed);

const farChunk =
    PondWorldConfig.createChunk(
        seed,
        125,
        -90
    );
const farBloom =
    farChunk.overlayRegions.find(
        region =>
            region.microbiome ===
                "bacterial_bloom"
    );
const farAlgae =
    farChunk.substrateRegions[0];

assert.equal(
    PondWorldGenerator.generate(
        farBloom.x,
        farBloom.y
    ).dominantMicrobiome,
    "bacterial_bloom",
    "a far-away chunk must generate a visible Bacterial Bloom"
);
assert.equal(
    PondWorldGenerator.generate(
        farAlgae.x,
        farAlgae.y
    ).microbiomes.substrate,
    "algae_patch",
    "a far-away chunk must retain its Algae Patch influence"
);

const generatedOnce =
    PondWorldGenerator.generate(
        farBloom.x,
        farBloom.y
    );
const generatedAgain =
    PondWorldGenerator.generate(
        farBloom.x,
        farBloom.y
    );

assert.deepEqual(
    generatedAgain,
    generatedOnce,
    "regenerating a coordinate must reproduce its environment exactly"
);

const legacyWorld = {
    tiles: {
        "0,0": {
            biome: "legacy-finite-tile"
        }
    },
    unrelatedFutureState: {
        retained: true
    }
};

assert.equal(
    PondWorld.ensureGenerationVersion(
        legacyWorld
    ),
    true
);
assert.equal(
    legacyWorld.generationVersion,
    GENERATION_VERSION
);
assert.deepEqual(legacyWorld.tiles, {});
assert.deepEqual(
    legacyWorld.unrelatedFutureState,
    { retained: true },
    "upgrading the environment cache must not replace other world state"
);
assert.equal(
    PondWorld.ensureGenerationVersion(
        legacyWorld
    ),
    false,
    "the current generation cache must not be repeatedly cleared"
);

assert.equal(
    PondWorld.createWorld()
        .generationVersion,
    GENERATION_VERSION
);
assert.equal(
    gameState.zones.pond.state.world
        .generationVersion,
    GENERATION_VERSION
);

console.log(
    "PASS: deterministic 16x16 Pond chunks provide repeatable distant microbiomes, safe Anaerobic Pocket placement, and a progression-neutral legacy tile-cache refresh."
);
