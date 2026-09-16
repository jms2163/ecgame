import assert from 'node:assert/strict';
import fs from 'node:fs';
import Catalog from '../src/app/ContractileVacuoleExperimentCatalog.js';
import Manager from '../src/app/GuidedExperimentManager.js';
import SaveManager from '../src/app/SaveManager.js';
import gameState from '../src/app/GameState.js';

assert.deepEqual(
    Catalog.requirements.completedExperiments,
    ['aquaporin_facilitated_diffusion'],
    'the existing aquaporin experiment prerequisite remains unchanged'
);
assert.equal(Catalog.assessment.scoreMaximum, 100);
assert.equal(Catalog.assessment.completionThresholdPercent, 80);

const wrongPredictions = [
    'cytosol_head_lumen',
    'both_into_lumen',
    'chloride_stays_cytosol',
    'water_leaves_lumen'
];
const checkpoints = Object.fromEntries(Catalog.sequence.stages.map((stage, index) => [
    stage.id,
    {
        completedAtMs: index + 1,
        predictionId: wrongPredictions[index],
        transfers: 6,
        atpConsumed: 6,
        waterTransfers: 6,
        exchangeCycles: 6,
        particles: []
    }
]));

const before = structuredClone(gameState);
const originalSave = SaveManager.save;
try {
    gameState.registry ??= {};
    gameState.registry.research = {
        guidedExperiments: {
            [Catalog.id]: { checkpoints: structuredClone(checkpoints) }
        },
        experimentSubmissions: {},
        bestExperimentScores: {},
        stars: {},
        completedExperiments: {}
    };
    gameState.registry.journal = [];
    SaveManager.save = () => true;

    const startingScore = Manager.score(Catalog);
    assert.equal(startingScore.scorePoints, 80);
    assert.equal(startingScore.scorePercent, 80);
    assert.equal(startingScore.isPerfect, false);
    assert.equal(Manager.synchronizeScore(Catalog).changed, true);
    assert.equal(gameState.registry.research.bestExperimentScores[Catalog.id].scorePoints, 80);
    assert.equal(gameState.registry.research.stars[Catalog.id], undefined);

    Catalog.sequence.stages.forEach(stage => {
        const result = Manager.checkpoint(
            Catalog,
            stage,
            {
                simulation: { stageId: stage.id },
                totalMembraneTransfers: 6,
                totalWaterTransfers: 6,
                atpConsumed: 6,
                exchangeCycles: 6,
                particles: []
            },
            { predictionId: stage.guidedUi.correctPredictionId }
        );
        assert.equal(result.ok, true);
        assert.equal(result.revised, true);
        assert.equal(result.completion, null, 'score revisions never repeat completion rewards');
    });

    const perfect = Manager.score(Catalog);
    assert.equal(perfect.scorePoints, 100);
    assert.equal(perfect.isPerfect, true);
    assert.equal(gameState.registry.research.bestExperimentScores[Catalog.id].scorePoints, 100);
    assert.equal(gameState.registry.research.stars[Catalog.id].reason, 'perfect-guided-score');

    const duplicate = Manager.checkpoint(
        Catalog,
        Catalog.sequence.stages[0],
        {
            simulation: { stageId: 'proton_gradient' },
            totalMembraneTransfers: 6,
            atpConsumed: 6,
            particles: []
        },
        { predictionId: 'lumen_head_cytosol' }
    );
    assert.equal(duplicate.duplicate, true);

    const stageSource = fs.readFileSync(
        new URL('../src/app/OrganelleExperimentStage.js', import.meta.url),
        'utf8'
    );
    const panelSource = fs.readFileSync(
        new URL('../src/app/OrganelleExperimentPanel.js', import.meta.url),
        'utf8'
    );
    const reviewSource = fs.readFileSync(
        new URL('../src/app/ContractileVacuoleReviewView.js', import.meta.url),
        'utf8'
    );
    assert.match(stageSource, /ContractileVacuoleReviewView\.mount/);
    assert.match(stageSource, /guidedStageId: nextStageId/);
    assert.match(panelSource, /mode: "improve"/);
    assert.match(reviewSource, /Cumulative Contractile Vacuole Model/);
    assert.match(reviewSource, /CYTOSOL/);
    assert.match(reviewSource, /CV LUMEN/);
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, before);
    SaveManager.save = originalSave;
}

console.log('PASS: Contractile Vacuole checkpoints produce an 80–100 score, prediction revisions preserve one-time rewards, perfect work earns a star, review renders the cumulative four-stage model, and the aquaporin prerequisite is unchanged.');
