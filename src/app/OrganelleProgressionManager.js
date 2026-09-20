// --------------------------------------------------
// OrganelleProgressionManager.js
// Derives organelle availability from existing saved
// progress. This manager never writes to game state.
// --------------------------------------------------

import GameStateManager
    from "./GameStateManager.js";
import ResearchManager
    from "./ResearchManager.js";
import organelleLibrary
    from "../data/organelleLibrary.js";

const OrganelleProgressionManager = {

    evaluateRequirement(requirement) {

        if (
            !requirement ||
            typeof requirement.type !== "string"
        ) {
            return {
                met: false,
                supported: false,
                requirement,
                reason: "invalid-requirement"
            };
        }

        let met = false;
        let supported = true;

        switch (requirement.type) {

            case "discovery":

                met =
                    ResearchManager.hasDiscovery(
                        requirement.id
                    );
                break;

            case "experiment_completed":

                met =
                    ResearchManager
                        .isExperimentCompleted(
                            requirement.id
                        );
                break;

            case "molecule_synthesized":

                met =
                    GameStateManager
                        .hasDiscoveryInCategory(
                            "molecules",
                            requirement.id
                        );
                break;

            case "motif_synthesized":

                met =
                    GameStateManager
                        .hasDiscoveryInCategory(
                            "motifs",
                            requirement.id
                        );
                break;

            case "macromolecular_product_synthesized": {

                const inventory =
                    GameStateManager
                        .getZoneSnapshot(
                            "macromolecularizer"
                        )
                        ?.state
                        ?.motifInventory ?? {};

                const productIds =
                    Array.isArray(
                        requirement.ids
                    )
                        ? requirement.ids
                        : [requirement.id]
                            .filter(Boolean);

                const completedIds =
                    productIds.filter(
                        productId =>
                            Number.isFinite(
                                inventory[productId]
                            ) &&
                            inventory[productId] >= 1
                    );

                met =
                    productIds.length > 0 &&
                    (
                        requirement.mode === "all"
                            ? completedIds.length ===
                                productIds.length
                            : completedIds.length > 0
                    );
                break;
            }

            case "polymerizer_product_synthesized": {

                const inventory =
                    GameStateManager
                        .getZoneSnapshot(
                            "polymerizer"
                        )
                        ?.state
                        ?.productInventory ?? {};

                const count =
                    inventory[
                        requirement.id
                    ]?.count;

                met =
                    Number.isFinite(count) &&
                    count >= 1;
                break;
            }

            case "any_discovery":

                met =
                    Array.isArray(
                        requirement.ids
                    ) &&
                    requirement.ids.some(
                        discoveryId =>
                            ResearchManager
                                .hasDiscovery(
                                    discoveryId
                                )
                    );
                break;

            case "environment_discovered":

                // A location/encounter system grants a permanent
                // discovery record when the event first occurs.
                met =
                    ResearchManager.hasDiscovery(
                        requirement.id
                    );
                break;

            case "metric_threshold": {

                const system =
                    GameStateManager.getCellSystem(
                        requirement.systemId
                    );

                const currentValue =
                    Number(
                        system?.[
                            requirement.metricId
                        ]
                    );

                met =
                    Number.isFinite(currentValue) &&
                    Number.isFinite(
                        requirement.minimum
                    ) &&
                    currentValue >=
                        requirement.minimum;
                break;
            }

            default:

                supported = false;
                met = false;
                break;

        }

        return {
            ...requirement,
            met,
            supported,

            reason:
                supported
                    ? met
                        ? "requirement-met"
                        : "requirement-missing"
                    : "unsupported-requirement-type"
        };

    },

    evaluateRequirements(unlock) {

        const requirements =
            Array.isArray(
                unlock?.requirements
            )
                ? unlock.requirements
                : [];

        const evaluations =
            requirements.map(
                requirement =>
                    this.evaluateRequirement(
                        requirement
                    )
            );

        const hasRequirements =
            evaluations.length > 0;

        const requirementsMet =
            hasRequirements &&
            (
                unlock?.mode === "any"
                    ? evaluations.some(
                        result =>
                            result.met
                    )
                    : evaluations.every(
                        result =>
                            result.met
                    )
            );

        return {
            mode:
                unlock?.mode === "any"
                    ? "any"
                    : "all",

            requirementsMet,
            evaluations,

            missingRequirements:
                evaluations.filter(
                    result =>
                        !result.met
                ),

            unsupportedRequirements:
                evaluations.filter(
                    result =>
                        !result.supported
                )
        };

    },

    getStatus(organelleId) {

        const profile =
            organelleLibrary[
                organelleId
            ];

        if (!profile) {
            return {
                exists: false,
                organelleId,
                available: false,
                source: "unknown-organelle",
                requirementsMet: false,
                evaluations: [],
                missingRequirements: [],
                unsupportedRequirements: []
            };
        }

        // Preserve access already represented in either the
        // categorized or legacy discovery structure.
        const existingDiscovery =
            ResearchManager.hasDiscovery(
                organelleId
            );

        const ruleIsActive =
            profile.unlock?.status ===
            "active";

        const ruleIsPreview =
            profile.unlock?.status ===
            "preview";

        const ruleIsEvaluated =
            ruleIsActive ||
            ruleIsPreview;

        const requirementStatus =
            ruleIsEvaluated
                ? this.evaluateRequirements(
                    profile.unlock
                )
                : {
                    mode: "all",
                    requirementsMet: false,
                    evaluations: [],
                    missingRequirements: [],
                    unsupportedRequirements: []
                };

        const available =
            existingDiscovery ||
            (
                ruleIsActive &&
                requirementStatus
                    .requirementsMet
            );

        const previewAvailable =
            !existingDiscovery &&
            ruleIsPreview &&
            requirementStatus
                .requirementsMet;

        const progressionState =
            available
                ? "available"
                : previewAvailable
                    ? "coming-soon"
                    : "locked";

        return {
            exists: true,
            organelleId,
            available,
            source:
                existingDiscovery
                    ? "existing-discovery"
                    : available
                        ? "requirements"
                        : previewAvailable
                            ? "preview-requirements"
                            : ruleIsActive
                                ? "requirements-missing"
                                : ruleIsPreview
                                    ? "preview-requirements-missing"
                                    : "existing-access-rule",

            ruleIsActive,
            ruleIsPreview,
            existingDiscovery,
            previewAvailable,
            progressionState,
            ...requirementStatus
        };

    },

    getUnlockMessage(
        profile,
        status =
            this.getStatus(
                profile?.id
            )
    ) {

        if (!profile) {
            return "This organelle profile is unavailable.";
        }

        if (status.previewAvailable) {
            return profile.unlock
                ?.comingSoonMessage ??
                `${profile.name} prerequisites are complete. Activities are coming soon.`;
        }

        if (status.available) {
            return "Select an available experiment from the organelle panel to begin.";
        }

        const missingLabels =
            status.missingRequirements
                .map(requirement =>
                    requirement.label
                )
                .filter(Boolean);

        if (missingLabels.length > 0) {
            return `To unlock ${profile.name}, ${missingLabels.join(
                status.mode === "any"
                    ? " or "
                    : " and "
            )}.`;
        }

        const displayRequirement =
            profile.unlock
                ?.displayRequirement;

        if (displayRequirement) {
            return `To unlock ${profile.name}, ${displayRequirement}`;
        }

        return `To unlock ${profile.name}, continue biological investigations.`;

    }

};

export default OrganelleProgressionManager;
