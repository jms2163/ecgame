// Run with: node tests/metabolism-catalog.test.mjs
import assert from "node:assert/strict";
import MetabolismPathwayCatalog
    from "../src/data/MetabolismPathwayCatalog.js";

const glycolysis =
    MetabolismPathwayCatalog.get(
        "glycolysis"
    );

assert(glycolysis);
assert.equal(glycolysis.valid, true);
assert.equal(
    glycolysis.unlockRequirement
        .productId,
    "GlucoseTransporter"
);
assert.equal(
    glycolysis.unlockRequirement
        .consumed,
    false
);

assert.deepEqual(
    glycolysis.coreSlots.map(
        ({ slot, enzymeId }) => ({
            slot,
            enzymeId
        })
    ),
    [
        { slot: 1, enzymeId: "Hexokinase" },
        { slot: 2, enzymeId: "PhosphoglucoseIsomerase" },
        { slot: 3, enzymeId: "Phosphofructokinase" },
        { slot: 4, enzymeId: "Aldolase" },
        { slot: 5, enzymeId: "TriosePhosphateIsomerase" },
        { slot: 6, enzymeId: "Glyceraldehyde3PhosphateDehydrogenase" },
        { slot: 7, enzymeId: "PhosphoglycerateKinase" },
        { slot: 8, enzymeId: "PhosphoglycerateMutase" },
        { slot: 9, enzymeId: "Enolase" },
        { slot: 10, enzymeId: "PyruvateKinase" }
    ]
);

assert.equal(
    glycolysis.regenerationBranches
        .length,
    1
);
assert.equal(
    glycolysis.regenerationBranches[0]
        .id,
    "lactate"
);
assert.deepEqual(
    glycolysis.regenerationBranches[0]
        .slots.map(
            ({ slot, enzymeId }) => ({
                slot,
                enzymeId
            })
        ),
    [
        {
            slot: 11,
            enzymeId:
                "LactateDehydrogenase"
        }
    ]
);

const serialized = JSON.stringify(
    glycolysis
);
assert.doesNotMatch(
    serialized,
    /PyruvateDecarboxylase|AlcoholDehydrogenase|Ethanol|TPP/i
);

assert.equal(
    glycolysis.chemistry.atpInvestment,
    2
);
assert.equal(
    glycolysis.chemistry.atpGross,
    4
);
assert.equal(
    glycolysis.chemistry.atpNet,
    2
);
assert.equal(
    glycolysis.reward
        .amountPerCorrectCoreEnzyme,
    1
);
assert.equal(
    glycolysis.reward
        .maximumAmountPerMinute,
    10
);
assert.equal(
    glycolysis.reward.increasesCapacity,
    false
);
assert.equal(
    glycolysis.reward
        .activeFromPlacements,
    true
);
assert.equal(
    glycolysis.coreModule.implemented,
    false
);
assert(
    glycolysis.coreModule
        .requirements.some(
            requirement =>
                requirement.productId ===
                    "NADPlus" &&
                requirement
                    .intendedCategory ===
                    "nucleotides"
        )
);
assert.equal(
    glycolysis.regenerationBranches[0]
        .futureBiomeBenefit.id,
    "anoxic-survival"
);

const slotNumbers = [
    ...glycolysis.coreSlots,
    ...glycolysis.regenerationBranches
        .flatMap(branch => branch.slots)
].map(slot => slot.slot);
assert.equal(
    new Set(slotNumbers).size,
    11
);

console.log(
    "PASS: Metabolism catalog defines ten independently rewarding Glycolysis enzymes, requires future Macromolecularizer NAD+ for the Core, and reserves LDH regeneration for a future anoxic-survival benefit."
);
