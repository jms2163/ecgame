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

        dataPresentation: {
            observationLabel: "Generation",
            startingPopulationLabel:
                "Starting population",
            selectionOutcomeLabel:
                "Captured by predator",
            survivorLabel: "Survivors",
            nextPopulationLabel:
                "Next generation",
            frequencyGraphTitle:
                "Phenotype Frequency Across Generations"
        },

        investigationPlan: {
            schemaVersion:
                "investigation-plan-v1",

            estimatedMinutes: {
                minimum: 3,
                maximum: 5
            },

            classResearchQuestion:
                "How does habitat background affect the frequencies of pigmented and non-pigmented amoebas across generations under visual predation?",

            individualQuestionPrompt:
                "In your selected habitat, what measurable population change will you investigate?",

            individualQuestionStarter:
                "In a ______ habitat, how do the frequencies of ______ change across generations under visual predation?",

            questionChecklist: [
                {
                    id: "environment",
                    label:
                        "My question identifies the environmental condition."
                },
                {
                    id: "measurable_outcome",
                    label:
                        "My question identifies a measurable outcome."
                },
                {
                    id: "generations",
                    label:
                        "My question asks about population change across generations."
                },
                {
                    id: "question_form",
                    label:
                        "My question is written as a question."
                }
            ],

            hypothesis: {
                predictionPrompt:
                    "Before seeing the results, what population-level trend do you predict?",

                rationalePrompt:
                    "Explain how the background might affect which amoebas the predator notices and how that could influence the next generation.",

                options: [
                    {
                        id:
                            "pigmented_increases",
                        title:
                            "Pigmented advantage",
                        label:
                            "Pigmented amoebas will become more common.",
                        description:
                            "Predict an increase in the pigmented phenotype frequency."
                    },
                    {
                        id:
                            "non_pigmented_increases",
                        title:
                            "Non-pigmented advantage",
                        label:
                            "Non-pigmented amoebas will become more common.",
                        description:
                            "Predict an increase in the non-pigmented phenotype frequency."
                    },
                    {
                        id:
                            "no_consistent_advantage",
                        title:
                            "No consistent advantage",
                        label:
                            "Neither phenotype will consistently increase.",
                        description:
                            "Predict mixed or unpredictable visibility without one directional trend."
                    }
                ]
            },

            variableClassificationMode:
                "provided_by_activity",

            variableRoles: [
                {
                    id: "independent",
                    label:
                        "Independent variable"
                },
                {
                    id: "dependent",
                    label:
                        "Dependent variable"
                },
                {
                    id: "controlled",
                    label:
                        "Controlled condition"
                }
            ],

            variableItems: [
                {
                    id:
                        "habitat_background",
                    label:
                        "Habitat Background",
                    correctRoleId:
                        "independent",
                    explanation:
                        "This is what changes across the class. Your investigation tests one background level.",
                    correctiveFeedback:
                        "This is the condition compared across the class. Your trial tests one level of it."
                },
                {
                    id:
                        "phenotype_frequency",
                    label:
                        "Phenotype Frequencies",
                    correctRoleId:
                        "dependent",
                    explanation:
                        "This is what you measure during every generation.",
                    correctiveFeedback:
                        "This is the measured population outcome that can change across generations."
                },
                {
                    id:
                        "starting_population",
                    label:
                        "Starting Population",
                    correctRoleId:
                        "controlled",
                    explanation:
                        "Kept the same in matching trials so comparisons are fair.",
                    correctiveFeedback:
                        "Matching trials keep the starting population and ratio consistent."
                },
                {
                    id:
                        "predation_rules",
                    label:
                        "Predation Rules",
                    correctRoleId:
                        "controlled",
                    explanation:
                        "Every generation uses eight captures and the same movement rules.",
                    correctiveFeedback:
                        "These rules are held consistent so trials remain comparable."
                },
                {
                    id:
                        "inheritance_reproduction",
                    label:
                        "Reproduction Rules",
                    correctRoleId:
                        "controlled",
                    explanation:
                        "The population returns to 32 offspring; mutation stays off so traits do not change during the activity.",
                    correctiveFeedback:
                        "The same inheritance and reproduction rules apply to every trial."
                }
            ],

            controlsExplanationPrompt:
                "Why must the starting population, predation rules, and reproduction rules remain consistent when results are compared?",

            minimumResponseLengths: {
                researchQuestion: 25,
                hypothesisRationale: 25,
                controlsExplanation: 25
            }
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
                            "Uniform bright background"
                    },
                    {
                        id: "brown",
                        label: "Brown",
                        description:
                            "Uniform dark background"
                    },
                    {
                        id: "mixed",
                        label: "Mixed",
                        description:
                            "Equal bright and dark patches"
                    }
                ]
            },
            {
                id: "startingPigmentedFrequency",
                label: "Starting pigmentation",
                role: "controlled",
                type: "enum",
                defaultOptionId: null,
                requiresExplicitSelection: true,
                options: [
                    {
                        id: "20",
                        label:
                            "20% pigmented",
                        pigmentedCount: 6,
                        nonPigmentedCount: 26
                    },
                    {
                        id: "50",
                        label: "50% pigmented",
                        pigmentedCount: 16,
                        nonPigmentedCount: 16,
                        recommended: true
                    },
                    {
                        id: "80",
                        label:
                            "80% pigmented",
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
                defaultOptionId: null,
                requiresExplicitSelection: true,
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
