import assert from "node:assert/strict";
import gameState from "../src/app/GameState.js";
import ATPManager from "../src/app/ATPManager.js";
import SubmissionManager from "../src/app/OrganelleExperimentSubmissionManager.js";
import Catalog from "../src/app/PhotosyntheticATPSynthaseCatalog.js";
import Overview from "../src/app/OrganelleOverviewView.js";
import organelleLibrary from "../src/data/organelleLibrary.js";
import { LIGHT_REACTION_EXPERIMENT_IDS, hasPerfectLightReactions, ensureLightReactionsAchievement } from "../src/app/LightReactionsReward.js";

const backup = structuredClone(gameState);
const originalDocument = globalThis.document;
function element() {
    return {
        children: [], dataset: {}, textContent: "",
        append(...children) { this.children.push(...children); },
        appendChild(child) { this.children.push(child); },
        replaceChildren(...children) { this.children = children; }
    };
}

try {
    gameState.registry.research.bestExperimentScores = {};
    gameState.registry.research.experimentSubmissions = {};
    gameState.registry.research.stars = {};
    gameState.registry.achievements = {};
    gameState.registry.journal = [];
    gameState.zones.polymerizer.state.productInventory = {};
    gameState.zones.metabolism.state = { pathwayPlacements: {}, completedModules: {} };
    gameState.zones.pond.state.world = { tiles: { "0,0": { biome: "algae_patch", physics: { light: .85 } } } };

    const title = element(), controls = element(), content = element();
    globalThis.document = {
        getElementById(id) {
            return ({
                "organelle-experiment-stage-title": title,
                "organelle-experiment-stage-controls": controls,
                "organelle-experiment-stage-content": content
            })[id];
        },
        createElement: element
    };
    const renderOverview = () => {
        Overview.render({
            profile: organelleLibrary.symbiosomes,
            available: true,
            message: "Select an available experiment from the organelle panel to begin."
        });
        return content.children[0].children[0].textContent;
    };

    assert.equal(hasPerfectLightReactions(), false);
    assert.match(renderOverview(), /Select an available experiment/);
    for (const id of LIGHT_REACTION_EXPERIMENT_IDS.slice(0, -1)) {
        gameState.registry.research.bestExperimentScores[id] =
            { scorePoints: 5, scoreMaximum: 5, scorePercent: 100 };
    }
    const report = {
        scorePoints: 5, scoreMaximum: 5, scorePercent: 100, isPerfect: true
    };
    const submission = SubmissionManager.recordSubmission({ experiment: Catalog, report });
    assert.equal(submission.earnedLightReactionsAchievement, true);
    assert.equal(gameState.registry.achievements.light_reactions.title, "Light Reactions");
    assert.equal(hasPerfectLightReactions(), true);
    assert.equal(ensureLightReactionsAchievement(), false, "reward is awarded once");
    assert.equal(renderOverview(),
        "All experiments are Mastered. Go to metabolics to build sugars with your ATP and NADPH.");
    assert.equal(organelleLibrary.symbiosomes.benefits[0].description,
        "Potential benefit: photosynthetic products if the alga remains active and is retained.");

    let production = ATPManager.getProductionStatus();
    assert.equal(production.totalATPPerMinute, 1);
    assert.equal(production.sources.some(source => source.id === "lightReactions"), false);
    gameState.zones.polymerizer.state.productInventory.EnergyKinase = { count: 1 };
    assert.equal(ATPManager.getProductionStatus().totalATPPerMinute, 3);
    for (const [biome, light] of [
        ["algae_patch", 1], ["open_water", .45],
        ["bacterial_bloom", .389], ["leaf_surface", 0]
    ]) {
        gameState.zones.pond.state.world.tiles["0,0"] = { biome, physics: { light } };
        production = ATPManager.getProductionStatus();
        assert.equal(production.totalATPPerMinute, 3,
            `${biome} sunlight must not affect amoeba ATP`);
    }
    gameState.registry.research.bestExperimentScores.photosystem_i_excitation =
        { scorePoints: 4, scoreMaximum: 5, scorePercent: 80 };
    assert.match(renderOverview(), /Select an available experiment/);
    delete gameState.registry.achievements.light_reactions;
    gameState.registry.research.bestExperimentScores.photosystem_i_excitation =
        { scorePoints: 5, scoreMaximum: 5, scorePercent: 100 };
    assert.equal(ensureLightReactionsAchievement(), true,
        "older perfect saves can be reconciled");
} finally {
    globalThis.document = originalDocument;
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}
console.log("PASS: Light Reactions achievement and overview persist without an amoeba ATP bonus.");
