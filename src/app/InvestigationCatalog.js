// --------------------------------------------------
// InvestigationCatalog.js
// Pure data definitions for reusable investigations
// --------------------------------------------------

import NaturalSelectionPrototypeConfig
    from "./NaturalSelectionPrototypeConfig.js";

const InvestigationCatalog = {

    natural_selection_pigmentation: {

        id:
            "natural_selection_pigmentation",

        activityId:
            NaturalSelectionPrototypeConfig.activityId,

        definitionVersion:
            NaturalSelectionPrototypeConfig
                .definitionVersion,

        modelVersion:
            NaturalSelectionPrototypeConfig
                .modelVersion,

        title:
            "Natural Selection: Pigmentation and Camouflage",

        summary:
            "Test how habitat background affects survival of inherited pigmentation phenotypes under visual predation.",

        learningObjective:
            "Use evidence from a multi-generation predator-prey model to explain how an inherited phenotype can become more or less common when environmental conditions affect survival.",

        selectivePressure: {
            id: "visual_predation",
            strategyId:
                "student_visual_predation",
            label:
                "Visual predation"
        },

        trait: {
            id: "pigmentation",
            label: "Pigmentation",
            discoverableId: "pigmentation",

            phenotypes: [
                {
                    id: "pigmented",
                    label: "Pigmented"
                },
                {
                    id: "non_pigmented",
                    label: "Non-pigmented"
                }
            ],

            inheritance: {
                mode: "clonal",
                acquiredDuringLifetime: false,
                mutationEnabled: false
            }
        },

        population: {
            carryingCapacity: 32,
            successfulCapturesPerGeneration: 8,
            reproductionStrategy:
                "proportional_clonal_largest_remainder"
        },

        parameters: [
            {
                id: "background",
                label: "Habitat background",
                role: "independent",
                type: "enum",
                defaultOptionId: null,
                requiresExplicitSelection: true,
                options: [
                    {
                        id: "white",
                        label: "White",
                        description:
                            "Uniform light habitat"
                    },
                    {
                        id: "brown",
                        label: "Brown",
                        description:
                            "Uniform brown habitat"
                    },
                    {
                        id: "mixed",
                        label: "Mixed",
                        description:
                            "Equal white and brown mosaic"
                    }
                ]
            },
            {
                id: "startingPigmentedFrequency",
                label: "Starting pigmentation",
                role: "controlled",
                type: "enum",
                defaultOptionId: "50",
                options: [
                    {
                        id: "20",
                        label:
                            "Approximately 20% pigmented",
                        description:
                            "6 pigmented / 26 non-pigmented",
                        pigmentedCount: 6,
                        nonPigmentedCount: 26
                    },
                    {
                        id: "50",
                        label: "50% pigmented",
                        description:
                            "16 pigmented / 16 non-pigmented",
                        pigmentedCount: 16,
                        nonPigmentedCount: 16,
                        recommended: true
                    },
                    {
                        id: "80",
                        label:
                            "Approximately 80% pigmented",
                        description:
                            "26 pigmented / 6 non-pigmented",
                        pigmentedCount: 26,
                        nonPigmentedCount: 6
                    }
                ]
            },
            {
                id: "finalGeneration",
                label: "Investigation length",
                role: "controlled",
                type: "enum",
                defaultOptionId: "5",
                options: [
                    {
                        id: "3",
                        label: "Generation 0-3",
                        finalGeneration: 3
                    },
                    {
                        id: "4",
                        label: "Generation 0-4",
                        finalGeneration: 4
                    },
                    {
                        id: "5",
                        label: "Generation 0-5",
                        finalGeneration: 5,
                        recommended: true
                    }
                ]
            }
        ],

        classComparison: {
            minimumMatchingTrials:
                NaturalSelectionPrototypeConfig
                    .classComparison
                    .minimumMatchingTrials,

            matchingFields: [
                "activityId",
                "modelVersion",
                "background",
                "startingPigmentedFrequency",
                "finalGeneration",
                "visualCalibrationProfileId",
                "pigmentationLevel",
                "brownBackgroundLevel",
                "interactionMode"
            ]
        },

        assessment: {
            requiredSections: [
                "research_question",
                "hypothesis",
                "variables",
                "generation_data",
                "graph",
                "claim_evidence_reasoning",
                "hypothesis_evaluation",
                "limitations",
                "improvement"
            ]
        },

        completion: {
            discoveryRewardId: "pigmentation",
            requiresCompleteReport: true
        }

    }

};

export default InvestigationCatalog;
