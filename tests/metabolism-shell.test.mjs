// Run with: node tests/metabolism-shell.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import gameState from "../src/app/GameState.js";
import ZoneCatalog from "../src/app/ZoneCatalog.js";
import ZoneStatusResolver
    from "../src/app/ZoneStatusResolver.js";
import MetabolismManager
    from "../src/app/MetabolismManager.js";

let saveWrites = 0;
globalThis.localStorage = {
    getItem() { return null; },
    setItem() { saveWrites += 1; },
    removeItem() {}
};

assert.equal(
    ZoneCatalog.get("metabolism")
        .releaseState,
    ZoneCatalog.RELEASE_STATE.COMING_SOON
);
assert.equal(
    ZoneStatusResolver.getStatus(
        "metabolism"
    ).interactive,
    false
);
assert.equal(
    Object.hasOwn(
        gameState.zones,
        "signaling"
    ),
    false
);

// A legacy save can omit the future zone. Initialization restores only the
// existing zone envelope and adds no speculative pathway or placement state.
delete gameState.zones.metabolism;
MetabolismManager.initialize();
assert.deepEqual(
    gameState.zones.metabolism,
    {
        unlocked: false,
        completed: false,
        state: {}
    }
);
assert.equal(saveWrites, 0);

gameState.zones.polymerizer ??= {
    unlocked: false,
    completed: false,
    state: {}
};
gameState.zones.polymerizer.state = {
    productInventory: {}
};

const locked =
    MetabolismManager.getPathwayStatus(
        "glycolysis"
    );
assert.equal(locked.available, false);
assert.equal(
    locked.unlockStatus.currentCount,
    0
);
assert.equal(locked.unlockStatus.missing, 1);

gameState.zones.polymerizer
    .state.productInventory
    .GlucoseTransporter = {
        count: 1,
        firstCompletedAtMs: 100,
        lastCompletedAtMs: 100
    };

const inventoryBefore = structuredClone(
    gameState.zones.polymerizer
        .state.productInventory
);
const atpBefore = structuredClone(
    gameState.registry.resources.atp
);
const discoveriesBefore =
    structuredClone(
        gameState.registry.discoveries
    );

const available =
    MetabolismManager.getPathwayStatus(
        "glycolysis"
    );
assert.equal(available.available, true);
assert.equal(
    available.unlockStatus.currentCount,
    1
);
assert.equal(available.unlockStatus.missing, 0);
assert.equal(
    available.unlockStatus.consumed,
    false
);
assert.deepEqual(
    gameState.zones.polymerizer
        .state.productInventory,
    inventoryBefore
);
assert.deepEqual(
    gameState.registry.resources.atp,
    atpBefore
);
assert.deepEqual(
    gameState.registry.discoveries,
    discoveriesBefore
);
assert.deepEqual(
    gameState.zones.metabolism.state,
    {}
);
assert.equal(saveWrites, 0);

const zoneManagerSource = fs.readFileSync(
    new URL(
        "../src/app/ZoneManager.js",
        import.meta.url
    ),
    "utf8"
);
assert.match(
    zoneManagerSource,
    /["']metabolism["']\s*,\s*\{/
);

const devConsoleSource = fs.readFileSync(
    new URL(
        "../src/app/DevConsole.js",
        import.meta.url
    ),
    "utf8"
);
assert.match(
    devConsoleSource,
    /MetabolismPathwayCatalog/
);

const indexSource = fs.readFileSync(
    new URL("../index.html", import.meta.url),
    "utf8"
);
assert.match(
    indexSource,
    /public\/css\/metabolism\.css/
);

console.log(
    "PASS: Metabolism Milestone 1 remains student-locked, accepts legacy saves without migration, reads the authoritative Polymerizer inventory, and performs a read-only Glucose Transporter unlock check."
);
