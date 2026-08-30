// --------------------------------------------------
// NaturalSelectionSetupPanel.js
// Guided scenario builder for the pigmentation study
// --------------------------------------------------

import InvestigationDefinitionRegistry
    from "./InvestigationDefinitionRegistry.js";
import NaturalSelectionPrototypeConfig
    from "./NaturalSelectionPrototypeConfig.js";

const INVESTIGATION_ID =
    "natural_selection_pigmentation";

const STEPS = [
    {
        parameterId: "background",
        title: "Choose a habitat",
        explanation:
            "The habitat is the environmental condition tested by your investigation."
    },
    {
        parameterId: "startingPigmentedFrequency",
        title: "Choose a starting population",
        explanation:
            "Both phenotypes are inherited. Choose how common pigmentation is before predation begins."
    },
    {
        parameterId: "finalGeneration",
        title: "Choose the investigation length",
        explanation:
            "More generations provide more opportunities to observe a population-level trend."
    },
    {
        parameterId: null,
        title: "Review your scenario",
        explanation:
            "Confirm the conditions your amoebas will experience."
    }
];

const createElement = (
    tagName,
    className = "",
    textContent = ""
) => {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = textContent;
    return element;
};

const NaturalSelectionSetupPanel = {

    initialized: false,
    definition: null,
    selection: null,
    fieldsElement: null,
    previewElement: null,
    locked: false,
    currentStep: 1,
    scenarioConfirmed: false,
    selectionChangedCallbacks: new Set(),

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
        this.fieldsElement = document.getElementById(
            "natural-selection-parameter-fields"
        );
        this.previewElement = document.getElementById(
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
            event => this.handleSelectionChange(event)
        );
        this.fieldsElement.addEventListener(
            "click",
            event => this.handleAction(event)
        );
        this.initialized = true;
        return true;
    },

    getParameter(parameterId) {
        return this.definition.parameters.find(
            parameter => parameter.id === parameterId
        ) ?? null;
    },

    getSelectedOption(parameterId) {
        const parameter = this.getParameter(parameterId);
        return parameter?.options.find(
            option =>
                option.id === this.selection[parameterId]
        ) ?? null;
    },

    handleSelectionChange(event) {
        const input = event.target;
        if (
            !(input instanceof HTMLInputElement) ||
            input.type !== "radio" ||
            !input.checked ||
            this.locked
        ) {
            return;
        }

        this.selection[input.name] = input.value;
        this.scenarioConfirmed = false;
        this.render();
        this.notifySelectionChanged();
    },

    handleAction(event) {
        const action = event.target?.dataset?.setupAction;
        if (!action || this.locked) {
            return;
        }

        if (action === "next") {
            const step = STEPS[this.currentStep - 1];
            if (
                step?.parameterId &&
                this.getSelectedOption(step.parameterId)
            ) {
                this.currentStep += 1;
                this.render();
            }
            return;
        }

        if (action === "back") {
            this.currentStep = Math.max(
                1,
                this.currentStep - 1
            );
            this.render();
            return;
        }

        if (action === "edit") {
            this.scenarioConfirmed = false;
            this.currentStep = 1;
            this.render();
            this.notifySelectionChanged();
            return;
        }

        if (
            action === "confirm" &&
            this.getSetupSnapshot()
        ) {
            this.scenarioConfirmed = true;
            this.render();
            this.notifySelectionChanged();
        }
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

        if (this.locked || this.scenarioConfirmed) {
            this.fieldsElement.append(
                this.createConfirmedScenario()
            );
            return;
        }

        const step = STEPS[this.currentStep - 1];
        const section = createElement(
            "section",
            "natural-selection-setup-step"
        );
        section.dataset.setupStep =
            String(this.currentStep);
        section.append(
            createElement(
                "p",
                "natural-selection-step-eyebrow",
                `Scenario step ${this.currentStep} of 4`
            ),
            createElement(
                "h3",
                "natural-selection-step-title",
                step.title
            ),
            createElement(
                "p",
                "natural-selection-step-explanation",
                step.explanation
            )
        );

        if (step.parameterId) {
            section.append(
                this.createCardGroup(
                    this.getParameter(step.parameterId)
                )
            );
        } else {
            section.append(this.createScenarioSummary());
        }

        section.append(this.createNavigation(step));
        this.fieldsElement.append(section);
    },

    createCardGroup(parameter) {
        const group = createElement(
            "fieldset",
            "natural-selection-card-grid"
        );
        group.append(
            createElement(
                "legend",
                "natural-selection-visually-hidden",
                parameter.label
            )
        );
        parameter.options.forEach(
            option => group.append(
                this.createOptionCard(parameter, option)
            )
        );
        return group;
    },

    createOptionCard(parameter, option) {
        const selected =
            this.selection[parameter.id] === option.id;
        const card = createElement(
            "label",
            `natural-selection-choice-card${selected
                ? " is-selected"
                : ""}`
        );
        const input = createElement("input");
        input.type = "radio";
        input.name = parameter.id;
        input.value = option.id;
        input.checked = selected;
        input.disabled = this.locked;

        const visual = createElement(
            "span",
            "natural-selection-card-visual"
        );
        visual.setAttribute("aria-hidden", "true");

        if (parameter.id === "background") {
            visual.className += ` habitat-${option.id}`;
        } else if (
            parameter.id === "startingPigmentedFrequency"
        ) {
            visual.className += ` population-${option.id}`;
            this.appendPopulationVisual(visual, option);
        } else {
            visual.className += " generation-timeline";
            this.appendTimelineVisual(
                visual,
                option.finalGeneration
            );
        }

        const copy = createElement(
            "span",
            "natural-selection-card-copy"
        );
        const title = createElement(
            "span",
            "natural-selection-card-title",
            option.label
        );
        copy.append(title);

        if (option.recommended) {
            title.append(
                createElement(
                    "span",
                    "natural-selection-recommended",
                    "Recommended"
                )
            );
        }
        if (option.description) {
            copy.append(
                createElement(
                    "span",
                    "natural-selection-card-description",
                    option.description
                )
            );
        }
        if (
            parameter.id === "startingPigmentedFrequency"
        ) {
            copy.append(
                createElement(
                    "span",
                    "natural-selection-visually-hidden",
                    `${option.pigmentedCount} pigmented and ${option.nonPigmentedCount} non-pigmented amoebas`
                )
            );
        }

        card.append(
            input,
            visual,
            copy,
            createElement(
                "span",
                "natural-selection-card-state",
                selected ? "Selected" : "Choose"
            )
        );
        return card;
    },

    appendPopulationVisual(container, option) {
        const habitat = this.selection.background ?? "white";
        container.className += ` habitat-${habitat}`;
        [
            ["pigmented", option.pigmentedCount],
            ["non-pigmented", option.nonPigmentedCount]
        ].forEach(([phenotype, count]) => {
            const cluster = createElement(
                "span",
                `amoeba-cluster ${phenotype}`
            );
            const visibleCount = Math.max(
                2,
                Math.round(count / 3)
            );
            for (
                let index = 0;
                index < visibleCount;
                index += 1
            ) {
                const token = createElement(
                    "span",
                    "amoeba-token"
                );
                token.setAttribute(
                    "style",
                    `background-image: url('${NaturalSelectionPrototypeConfig.visualPredation.amoebaSpritePath}')`
                );
                cluster.append(token);
            }
            container.append(cluster);
        });
    },

    appendTimelineVisual(container, finalGeneration) {
        for (
            let generation = 0;
            generation <= finalGeneration;
            generation += 1
        ) {
            container.append(
                createElement(
                    "span",
                    "generation-marker",
                    String(generation)
                )
            );
        }
    },

    createNavigation(step) {
        const actions = createElement(
            "div",
            "natural-selection-step-actions"
        );
        if (this.currentStep > 1) {
            const back = createElement(
                "button",
                "natural-selection-secondary-action",
                "Back"
            );
            back.type = "button";
            back.dataset.setupAction = "back";
            actions.append(back);
        }

        const primary = createElement(
            "button",
            "natural-selection-primary-action",
            this.currentStep === 4
                ? "Confirm Scenario"
                : "Next"
        );
        primary.type = "button";
        primary.dataset.setupAction =
            this.currentStep === 4
                ? "confirm"
                : "next";
        primary.disabled = step.parameterId
            ? !this.getSelectedOption(step.parameterId)
            : !this.getSetupSnapshot();
        actions.append(primary);
        return actions;
    },

    createScenarioSummary() {
        const setup = this.getSetupSnapshot();
        const background = this.getSelectedOption("background");
        const frequency = this.getSelectedOption(
            "startingPigmentedFrequency"
        );
        const card = createElement(
            "section",
            "natural-selection-scenario-card"
        );
        const list = createElement(
            "dl",
            "natural-selection-scenario-list"
        );

        if (setup) {
            [
                ["Habitat", background.label],
                ["Starting population", frequency.label],
                ["Study length", `Generations 0–${setup.parameters.finalGeneration}`],
                ["Predation", `${setup.population.successfulCapturesPerGeneration} captures per generation`],
                ["Reproduction", `Clonal to ${setup.population.carryingCapacity} offspring`],
                ["Mutation", "Disabled"]
            ].forEach(([label, value]) => {
                list.append(
                    createElement("dt", "", label),
                    createElement("dd", "", value)
                );
            });
            list.append(
                createElement(
                    "dt",
                    "natural-selection-visually-hidden",
                    "Exact starting counts"
                ),
                createElement(
                    "dd",
                    "natural-selection-visually-hidden",
                    `${setup.population.pigmentedCount} pigmented and ${setup.population.nonPigmentedCount} non-pigmented amoebas.`
                )
            );
        }

        card.append(
            createElement(
                "h3",
                "natural-selection-scenario-title",
                "Your Scenario"
            ),
            list,
            createElement(
                "p",
                "natural-selection-scenario-note",
                "This is what your amoebas will experience."
            )
        );
        return card;
    },

    createConfirmedScenario() {
        const wrapper = createElement(
            "div",
            "natural-selection-confirmed-scenario"
        );
        wrapper.append(this.createScenarioSummary());
        if (!this.locked) {
            const edit = createElement(
                "button",
                "natural-selection-secondary-action",
                "Edit Scenario"
            );
            edit.type = "button";
            edit.dataset.setupAction = "edit";
            wrapper.append(edit);
        }
        return wrapper;
    },

    getSetupSnapshot() {
        if (!this.initialize()) {
            return null;
        }
        const background = this.getSelectedOption("background");
        const startingFrequency = this.getSelectedOption(
            "startingPigmentedFrequency"
        );
        const finalGeneration = this.getSelectedOption(
            "finalGeneration"
        );
        if (!background || !startingFrequency || !finalGeneration) {
            return null;
        }

        return {
            investigationId: this.definition.id,
            activityId: this.definition.activityId,
            definitionVersion: this.definition.definitionVersion,
            modelVersion: this.definition.modelVersion,
            selectivePressure: structuredClone(
                this.definition.selectivePressure
            ),
            trait: {
                id: this.definition.trait.id,
                label: this.definition.trait.label,
                phenotypes: structuredClone(
                    this.definition.trait.phenotypes
                ),
                inheritance: structuredClone(
                    this.definition.trait.inheritance
                )
            },
            parameters: {
                background: background.id,
                startingPigmentedFrequency:
                    startingFrequency.id,
                finalGeneration: finalGeneration.finalGeneration
            },
            population: {
                carryingCapacity:
                    this.definition.population.carryingCapacity,
                phenotypeOrder:
                    this.definition.trait.phenotypes.map(
                        phenotype => phenotype.id
                    ),
                phenotypeCounts: {
                    pigmented: startingFrequency.pigmentedCount,
                    non_pigmented:
                        startingFrequency.nonPigmentedCount
                },
                pigmentedCount: startingFrequency.pigmentedCount,
                nonPigmentedCount:
                    startingFrequency.nonPigmentedCount,
                successfulCapturesPerGeneration:
                    this.definition.population
                        .successfulCapturesPerGeneration,
                reproductionStrategy:
                    this.definition.population
                        .reproductionStrategy
            },
            dataPresentation: structuredClone(
                this.definition.dataPresentation ?? {}
            ),
            visualCalibration: {
                ...NaturalSelectionPrototypeConfig.visualCalibration
            },
            interactionMode: "direct_visual_predation"
        };
    },

    getScenarioSummary() {
        const setup = this.getSetupSnapshot();
        if (!setup) {
            return null;
        }
        return {
            background:
                this.getSelectedOption("background").label,
            startingPopulation:
                this.getSelectedOption(
                    "startingPigmentedFrequency"
                ).label,
            finalGeneration: setup.parameters.finalGeneration,
            capturesPerGeneration:
                setup.population.successfulCapturesPerGeneration,
            carryingCapacity:
                setup.population.carryingCapacity,
            mutationEnabled:
                setup.trait.inheritance.mutationEnabled
        };
    },

    isScenarioConfirmed() {
        return this.scenarioConfirmed;
    },

    renderPreview() {
        this.previewElement.textContent = this.scenarioConfirmed
            ? "Your confirmed scenario is ready for the next stage."
            : "Complete and confirm all four scenario steps before beginning.";
    },

    subscribeToSelectionChanges(callback) {
        if (typeof callback !== "function") {
            throw new TypeError(
                "Selection-change subscriber must be a function."
            );
        }
        this.selectionChangedCallbacks.add(callback);
        return () => this.selectionChangedCallbacks.delete(callback);
    },

    notifySelectionChanged() {
        const snapshot = this.getSetupSnapshot();
        this.selectionChangedCallbacks.forEach(
            callback => callback(snapshot)
        );
    },

    resetTutorial() {
        this.currentStep = 1;
        this.scenarioConfirmed = false;
        this.render();
        this.notifySelectionChanged();
    },

    setLocked(locked) {
        const nextLocked = Boolean(locked);
        if (this.locked === nextLocked) {
            return;
        }
        this.locked = nextLocked;
        if (this.initialized) {
            this.render();
        }
    },

    isLocked() {
        return this.locked;
    }
};

export default NaturalSelectionSetupPanel;
