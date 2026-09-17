// Run with: node tests/periodic-group-quests.test.mjs

import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import ObjectiveRegistry from "../src/app/ObjectiveRegistry.js";
import QuestCatalog from "../src/app/QuestCatalog.js";
import QuestManager from "../src/app/QuestManager.js";
import SPManager from "../src/app/SPManager.js";
import {
    FAMILY_DEFINITIONS,
    PeriodicGroupQuestCatalog
} from "../src/app/PeriodicGroupQuestCatalog.js";
import { elementLibrary }
    from "../src/data/elementLibrary.js";

const backup = structuredClone(gameState);
const storage = new Map();

globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) =>
        storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

try {
    const expectedFamilies = {
        alkali_metals:
            ["Li", "Na", "K", "Rb", "Cs", "Fr"],
        alkaline_earth_metals:
            ["Be", "Mg", "Ca", "Sr", "Ba", "Ra"],
        boron_group:
            ["B", "Al", "Ga", "In", "Tl", "Nh"],
        carbon_group:
            ["C", "Si", "Ge", "Sn", "Pb", "Fl"],
        nitrogen_group:
            ["N", "P", "As", "Sb", "Bi", "Mc"],
        oxygen_group:
            ["O", "S", "Se", "Te", "Po", "Lv"],
        halogens:
            ["F", "Cl", "Br", "I", "At", "Ts"],
        noble_gases:
            ["He", "Ne", "Ar", "Kr", "Xe", "Rn", "Og"]
    };

    assert.equal(FAMILY_DEFINITIONS.length, 8);
    assert.equal(
        Object.keys(PeriodicGroupQuestCatalog).length,
        8
    );

    const supportedSymbols = new Set(
        Object.values(elementLibrary)
            .map(element =>
                element.symbol?.trim()
            )
            .filter(Boolean)
    );

    for (const family of FAMILY_DEFINITIONS) {
        assert.deepEqual(
            [...family.elementIds],
            expectedFamilies[family.id]
        );
        assert(
            family.elementIds.every(atomId =>
                supportedSymbols.has(atomId)
            ),
            `${family.title} contains an unsupported element`
        );

        const questId =
            `periodic_group_${family.id}`;
        const quest =
            PeriodicGroupQuestCatalog[questId];

        assert.equal(QuestCatalog[questId], quest);
        assert.equal(quest.rewards.sp, 1);
        assert.deepEqual(
            quest.prerequisites,
            ["q1_particles"]
        );
        assert.equal(
            quest.objectives[0].target,
            family.elementIds.length
        );
    }

    assert.equal(
        expectedFamilies.alkali_metals
            .includes("H"),
        false,
        "Hydrogen is not an alkali metal"
    );
    assert.equal(
        Object.values(expectedFamilies)
            .flat()
            .some(id =>
                id === "Uue" || id === "Ubn"
            ),
        false,
        "hypothetical elements 119–120 are not standard family requirements"
    );

    gameState.discoveries.atoms = {};
    const alkaliObjective =
        PeriodicGroupQuestCatalog
            .periodic_group_alkali_metals
            .objectives[0];

    for (const atomId of [
        "Li", "Na", "K", "Rb", "Cs"
    ]) {
        gameState.discoveries.atoms[atomId] = {
            discoveredAt: 1,
            count: 1
        };
    }

    let progress = ObjectiveRegistry.evaluate({
        objective: alkaliObjective
    });
    assert.equal(progress.current, 5);
    assert.equal(progress.complete, false);
    assert.deepEqual(progress.missingIds, ["Fr"]);

    gameState.discoveries.atoms.Fr = {
        discoveredAt: 2,
        count: 1
    };
    progress = ObjectiveRegistry.evaluate({
        objective: alkaliObjective
    });
    assert.equal(progress.current, 6);
    assert.equal(progress.complete, true);

    gameState.discoveries.atoms.Li.count = 50;
    progress = ObjectiveRegistry.evaluate({
        objective: alkaliObjective
    });
    assert.equal(
        progress.current,
        6,
        "repeated copies must not add family progress"
    );

    gameState.registry.quests ??= {};
    gameState.registry.quests.q1_particles = {
        status: "claimed",
        readyAtMs: 1,
        claimedAtMs: 2,
        viewedAtMs: 2,
        activatedAtMs: 1,
        objectiveBaselines: {}
    };
    gameState.zones.atomizer.state.availableSp = 4;
    QuestManager.initialize();

    const alkaliQuestId =
        "periodic_group_alkali_metals";
    assert.equal(
        QuestManager.getQuestStatus(
            alkaliQuestId
        ).claimable,
        true
    );
    assert.equal(
        QuestManager.claimQuest(
            alkaliQuestId
        ).claimed,
        true
    );
    assert.equal(SPManager.getSP(), 5);
    assert.equal(
        QuestManager.claimQuest(
            alkaliQuestId
        ).reason,
        "already-claimed"
    );
    assert.equal(SPManager.getSP(), 5);
} finally {
    for (const key of Object.keys(gameState)) {
        delete gameState[key];
    }
    Object.assign(gameState, backup);
}

console.log(
    "PASS: eight independent main-group quests use fixed standard element families, count distinct prior atom syntheses, exclude H and hypothetical 119–120 from alkali-family requirements, and award one SP each."
);
