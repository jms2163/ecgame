// --------------------------------------------------
// NaturalSelectionSetupPanel.js
// Data-driven setup controls for the pigmentation study
// --------------------------------------------------

import InvestigationDefinitionRegistry
    from "./InvestigationDefinitionRegistry.js";
import NaturalSelectionPrototypeConfig
    from "./NaturalSelectionPrototypeConfig.js";

const INVESTIGATION_ID =
    "natural_selection_pigmentation";

const NaturalSelectionSetupPanel = {

    initialized: false,
    definition: null,
    selection: null,
    fieldsElement: null,
    previewElement: null,
    locked: false,
    selectionChangedCallbacks:
        new Set(),

    initialize() {

        if (this.initialized) {
            return true;
        }

        this.definition =
            InvestigationDefinitionRegistry.get(
                INVESTIGATION_ID
            );

        this.selection =
            InvestigationDefinitionRegistry
                .createDefaultSelection(
                    INVESTIGATION_ID
                );

        this.fieldsElement =
            document.getElementById(
                "natural-selection-parameter-fields"
            );

        this.previewElement =
            document.getElementById(
                "natural-selection-setup-preview"
            );

        if (
            !this.definition ||
            !this.selection ||
            !this.fieldsElement ||
            !this.previewElement
        ) {
            console.warn(
                "NaturalSelectionSetupPanel: required definition or DOM elements are unavailable"
            );

            return false;
        }

        this.fieldsElement.addEventListener(
            "change",
            event => {
                this.handleSelectionChange(
                    event
                );
            }
        );

        this.initialized = true;

        return true;

    },

    handleSelectionChange(event) {

        const input = event.target;

        if (
            !(input instanceof HTMLInputElement) ||
            input.type !== "radio" ||
            !input.checked
        ) {
            return;
        }

        this.selection[
            input.name
        ] = input.value;

        this.renderPreview();
        this.notifySelectionChanged();

    },

    render() {

        if (!this.initialize()) {
            return false;
        }

        this.renderParameterFields();
        this.renderPreview();

        return true;

    },

    renderParameterFields() {

        this.fieldsElement.replaceChildren();

        this.definition.parameters.forEach(
            parameter => {

                const fieldset =
                    document.createElement(
                        "fieldset"
                    );

                fieldset.className =
                    "natural-selection-parameter-group";

                const legend =
                    document.createElement(
                        "legend"
                    );

                legend.textContent =
                    parameter.label;

                fieldset.append(
                    legend
                );

                parameter.options.forEach(
                    option => {
                        fieldset.append(
                            this.createOptionControl(
                                parameter,
                                option
                            )
                        );
                    }
                );

                this.fieldsElement.append(
                    fieldset
                );

            }
        );

    },

    createOptionControl(
        parameter,
        option
    ) {

        const wrapper =
            document.createElement(
                "label"
            );

        wrapper.className =
            "natural-selection-option";

        const input =
            document.createElement(
                "input"
            );

        input.type = "radio";
        input.name = parameter.id;
        input.value = option.id;
        input.checked =
            this.selection[
                parameter.id
            ] === option.id;
        input.disabled = this.locked;

        const copy =
            document.createElement(
                "span"
            );

        copy.className =
            "natural-selection-option-copy";

        const title =
            document.createElement(
                "span"
            );

        title.className =
            "natural-selection-option-title";
        title.textContent = option.label;

        copy.append(
            title
        );

        if (option.recommended) {
            const badge =
                document.createElement(
                    "span"
                );

            badge.className =
                "natural-selection-recommended";
            badge.textContent =
                "Recommended";

            title.append(
                badge
            );
        }

        if (option.description) {
            const description =
                document.createElement(
                    "span"
                );

            description.className =
                "natural-selection-option-description";
            description.textContent =
                option.description;

            copy.append(
                description
            );
        }

        wrapper.append(
            input,
            copy
        );

        return wrapper;

    },

    getSelectedOption(parameterId) {

        const parameter =
            this.definition.parameters.find(
                candidate =>
                    candidate.id === parameterId
            );

        return parameter?.options.find(
            option =>
                option.id ===
                this.selection[parameterId]
        ) ?? null;

    },

    getSetupSnapshot() {

        if (!this.initialize()) {
            return null;
        }

        const background =
            this.getSelectedOption(
                "background"
            );

        const startingFrequency =
            this.getSelectedOption(
                "startingPigmentedFrequency"
            );

        const finalGeneration =
            this.getSelectedOption(
                "finalGeneration"
            );

        if (
            !background ||
            !startingFrequency ||
            !finalGeneration
        ) {
            return null;
        }

        return {
            investigationId:
                this.definition.id,
            activityId:
                this.definition.activityId,
            definitionVersion:
                this.definition.definitionVersion,
            modelVersion:
                this.definition.modelVersion,

            selectivePressure: {
                ...this.definition
                    .selectivePressure
            },

            trait: {
                id:
                    this.definition.trait.id,
                label:
                    this.definition.trait.label,
                phenotypes:
                    structuredClone(
                        this.definition.trait
                            .phenotypes
                    ),
                inheritance:
                    structuredClone(
                        this.definition.trait
                            .inheritance
                    )
            },

            parameters: {
                background:
                    background.id,
                startingPigmentedFrequency:
                    startingFrequency.id,
                finalGeneration:
                    finalGeneration.finalGeneration
            },

            population: {
                carryingCapacity:
                    this.definition.population
                        .carryingCapacity,
                phenotypeOrder:
                    this.definition.trait
                        .phenotypes.map(
                            phenotype =>
                                phenotype.id
                        ),
                phenotypeCounts: {
                    pigmented:
                        startingFrequency
                            .pigmentedCount,
                    non_pigmented:
                        startingFrequency
                            .nonPigmentedCount
                },
                pigmentedCount:
                    startingFrequency
                        .pigmentedCount,
                nonPigmentedCount:
                    startingFrequency
                        .nonPigmentedCount,
                successfulCapturesPerGeneration:
                    this.definition.population
                        .successfulCapturesPerGeneration,
                reproductionStrategy:
                    this.definition.population
                        .reproductionStrategy
            },

            dataPresentation:
                structuredClone(
                    this.definition
                        .dataPresentation ?? {}
                ),

            visualCalibration: {
                ...NaturalSelectionPrototypeConfig
                    .visualCalibration
            },

            interactionMode:
                "direct_visual_predation"
        };

    },

    renderPreview() {

        const snapshot =
            this.getSetupSnapshot();

        if (!snapshot) {
            this.previewElement.textContent =
                "Select a complete investigation setup.";

            return;
        }

        const background =
            this.getSelectedOption(
                "background"
            );

        this.previewElement.replaceChildren();

        const rows = [
            [
                "Background",
                background.label
            ],
            [
                "Starting population",
                `${snapshot.population.pigmentedCount} pigmented / ${snapshot.population.nonPigmentedCount} non-pigmented`
            ],
            [
                "Duration",
                `Generation 0-${snapshot.parameters.finalGeneration}`
            ],
            [
                "Captures per generation",
                String(
                    snapshot.population
                        .successfulCapturesPerGeneration
                )
            ],
            [
                "Visual profile",
                snapshot.visualCalibration
                    .profileId
            ],
            [
                "Prototype levels",
                `Pigmentation ${snapshot.visualCalibration.pigmentationLevel}; brown background ${snapshot.visualCalibration.brownBackgroundLevel}`
            ]
        ];

        const list =
            document.createElement(
                "dl"
            );

        list.className =
            "natural-selection-preview-list";

        rows.forEach(
            ([label, value]) => {
                const term =
                    document.createElement(
                        "dt"
                    );
                const description =
                    document.createElement(
                        "dd"
                    );

                term.textContent = label;
                description.textContent = value;

                list.append(
                    term,
                    description
                );
            }
        );

        this.previewElement.append(
            list
        );

    },

    subscribeToSelectionChanges(
        callback
    ) {

        if (typeof callback !== "function") {
            throw new TypeError(
                "Selection-change subscriber must be a function."
            );
        }

        this.selectionChangedCallbacks.add(
            callback
        );

        return () => {
            this.selectionChangedCallbacks
                .delete(callback);
        };

    },

    notifySelectionChanged() {

        const snapshot =
            this.getSetupSnapshot();

        this.selectionChangedCallbacks
            .forEach(
                callback => {
                    callback(snapshot);
                }
            );

    },

    setLocked(locked) {

        const nextLocked =
            Boolean(locked);

        if (this.locked === nextLocked) {
            return;
        }

        this.locked = nextLocked;

        if (this.initialized) {
            this.renderParameterFields();
        }

    },

    isLocked() {

        return this.locked;

    }

};

export default NaturalSelectionSetupPanel;
