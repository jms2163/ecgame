import assert from 'node:assert/strict';
import fs from 'node:fs';
import gameState from '../src/app/GameState.js';
import ResearchManager from '../src/app/ResearchManager.js';

const backup = structuredClone(gameState);

try {
    gameState.registry ??= {};
    gameState.registry.research ??= {};
    gameState.registry.research.completedExperiments = {};
    gameState.registry.research.bestExperimentScores = {};
    gameState.registry.discoveries ??= [];
    gameState.discoveries ??= {};
    gameState.discoveries.molecules ??= {};
    gameState.discoveries.molecules.H2O = {
        discoveredAt: 1,
        count: 1
    };

    assert.equal(
        ResearchManager.getCompletionThresholdPercent('dynamic_movement'),
        80
    );
    assert.equal(
        ResearchManager.getCompletionThresholdPercent('water_passive_diffusion'),
        80
    );
    assert.equal(
        ResearchManager.getCompletionThresholdPercent('aquaporin_facilitated_diffusion'),
        80
    );
    assert.equal(
        ResearchManager.getCompletionThresholdPercent('passive_diffusion'),
        100,
        'Passive Diffusion should reach completion after all 11 scored observations'
    );

    gameState.registry.research.bestExperimentScores.dynamic_movement = {
        scorePoints: 20,
        scoreMaximum: 25,
        scorePercent: 80
    };
    assert.equal(
        ResearchManager.hasMetExperimentRequirement('dynamic_movement'),
        true
    );
    assert.equal(
        ResearchManager.getExperimentStatus('passive_diffusion').available,
        true,
        'an existing 80% Dynamic Movement score should unlock Passive Diffusion'
    );

    gameState.registry.research.bestExperimentScores.water_passive_diffusion = {
        scorePoints: 60,
        scoreMaximum: 75,
        scorePercent: 80
    };
    gameState.registry.discoveries.push('aquaporin');
    assert.equal(
        ResearchManager.getExperimentStatus('aquaporin_facilitated_diffusion').available,
        true,
        'an existing 80% water lab score should unlock Aquaporin'
    );

    gameState.registry.research.bestExperimentScores.water_passive_diffusion.scorePercent = 79.99;
    assert.equal(
        ResearchManager.hasMetExperimentRequirement('water_passive_diffusion'),
        false,
        'scores below 80% must remain below the gate'
    );

    const panelSource = fs.readFileSync(
        new URL('../src/app/OrganelleExperimentPanel.js', import.meta.url),
        'utf8'
    );
    const stageSource = fs.readFileSync(
        new URL('../src/app/OrganelleExperimentStage.js', import.meta.url),
        'utf8'
    );
    assert.doesNotMatch(panelSource, /Requires: 100%/);
    assert.match(panelSource, /getCompletionThresholdPercent/);
    assert.match(stageSource, /meetsCompletionThreshold/);
    assert.doesNotMatch(
        stageSource,
        /const perfect = results\.find/
    );

    console.log('PASS: scored Organelle Lab gates use their configured thresholds; saved 80% scores unlock downstream labs; Passive Diffusion completes at 11/11.');
} finally {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, backup);
}
