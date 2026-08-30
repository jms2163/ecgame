// --------------------------------------------------
// NaturalSelectionPlanPanel.js
// Staged scientific-method tutorial scaffolding
// --------------------------------------------------

import InvestigationDefinitionRegistry
    from "./InvestigationDefinitionRegistry.js";
import InvestigationPlanModel
    from "./InvestigationPlanModel.js";
import NaturalSelectionPrototypeConfig
    from "./NaturalSelectionPrototypeConfig.js";
import NaturalSelectionSetupPanel
    from "./NaturalSelectionSetupPanel.js";

const INVESTIGATION_ID =
    "natural_selection_pigmentation";
const MINIMUM_CHARACTERS = 25;

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

const appendDefinitionRows = (list, rows) => {
    rows.forEach(([label, value]) => {
        list.append(
            createElement("dt", "", label),
            createElement("dd", "", value || "—")
        );
    });
};

const getTrimmedLength = value =>
    typeof value === "string"
        ? value.trim().length
        : 0;

const NaturalSelectionPlanPanel = {

    initialized: false,
    enabled: false,
    locked: false,
    definition: null,
    planDefinition: null,
    draft: null,
    lockedSnapshot: null,
    panelElement: null,
    timeElement: null,
    contentElement: null,
    guidedHeaderElement: null,
    progressElement: null,
    currentStage: 2,
    callbacks: new Set(),

    initialize() {
        if (this.initialized) {
            return true;
        }

        this.definition =
            InvestigationDefinitionRegistry.get(
                INVESTIGATION_ID
            );
        this.planDefinition =
            this.definition?.investigationPlan ?? null;
        this.enabled =
            NaturalSelectionPrototypeConfig
                .features.investigationPlan === true;
        this.panelElement = document.getElementById(
            "natural-selection-plan-panel"
        );
        this.timeElement = document.getElementById(
            "natural-selection-plan-time"
        );
        this.contentElement = document.getElementById(
            "natural-selection-plan-content"
        );
        this.guidedHeaderElement = document.getElementById(
            "natural-selection-guided-header"
        );
        this.progressElement = document.getElementById(
            "natural-selection-guided-progress"
        );

        if (
            !this.definition ||
            !this.planDefinition ||
            !this.panelElement ||
            !this.timeElement ||
            !this.contentElement
        ) {
            console.warn(
                "NaturalSelectionPlanPanel: required definition or DOM elements are unavailable"
            );
            return false;
        }

        this.draft = InvestigationPlanModel.createDraft({
            enabled: this.enabled,
            definition: this.planDefinition
        });

        this.contentElement.addEventListener(
            "input",
            event => this.handleInput(event)
        );
        this.contentElement.addEventListener(
            "change",
            event => this.handleInput(event)
        );
        this.contentElement.addEventListener(
            "click",
            event => this.handleClick(event)
        );

        NaturalSelectionSetupPanel
            .subscribeToSelectionChanges(
                setup => this.handleSetupChange(setup)
            );

        this.initialized = true;
        return true;
    },

    handleSetupChange(setup) {
        if (this.enabled) {
            const confirmedSignature =
                this.draft.confirmedSetupSignature;
            const currentSignature =
                InvestigationPlanModel
                    .createSetupSignature(setup);

            if (
                confirmedSignature &&
                confirmedSignature !== currentSignature
            ) {
                this.draft = InvestigationPlanModel
                    .invalidateConfirmation(
                        this.draft,
                        "scenario_changed"
                    );
                this.currentStage = 2;
            }
        }

        this.render();
        this.notifyChanged();
    },

    handleInput(event) {
        if (this.locked || !this.enabled) {
            return;
        }

        const field = event.target?.dataset?.planField;
        if (!field) {
            return;
        }

        this.draft = InvestigationPlanModel
            .invalidateConfirmation(this.draft);

        if (field === "researchQuestion") {
            this.draft.researchQuestion =
                event.target.value;
        } else if (field === "prediction") {
            this.draft.hypothesis.expectedTrendId =
                event.target.value;
            const option = this.planDefinition
                .hypothesis.options.find(
                    item => item.id === event.target.value
                );
            this.draft.hypothesis.expectedTrendLabel =
                option?.label ?? "";
        } else if (field === "rationale") {
            this.draft.hypothesis.rationale =
                event.target.value;
        } else if (field === "controlsExplanation") {
            this.draft.variables.controlsExplanation =
                event.target.value;
        }

        if (field === "prediction") {
            this.render();
        } else {
            this.updateLiveStageState(field);
        }
        this.notifyChanged();
    },

    updateLiveStageState(field) {
        const fieldId = `natural-selection-${field}`;
        const help = document.getElementById(
            `${fieldId}-help`
        );
        const value = field === "researchQuestion"
            ? this.draft.researchQuestion
            : field === "rationale"
                ? this.draft.hypothesis.rationale
                : this.draft.variables
                    .controlsExplanation;
        if (help) {
            help.textContent =
                `Type at least ${MINIMUM_CHARACTERS} characters. ${getTrimmedLength(value)}/${MINIMUM_CHARACTERS} entered.`;
        }

        if (field === "researchQuestion") {
            const preview = document.getElementById(
                "natural-selection-question-live-response"
            );
            const next = document.getElementById(
                "natural-selection-question-next"
            );
            if (preview) {
                preview.textContent = value.trim() ||
                    "Your question will appear here.";
            }
            if (next) {
                next.disabled = !this.isQuestionComplete();
            }
        } else if (field === "rationale") {
            const next = document.getElementById(
                "natural-selection-hypothesis-next"
            );
            if (next) {
                next.disabled = !this.isHypothesisComplete();
            }
        } else {
            const confirm = document.getElementById(
                "natural-selection-plan-confirm"
            );
            if (confirm) {
                const setup = NaturalSelectionSetupPanel
                    .getSetupSnapshot();
                confirm.disabled = !InvestigationPlanModel
                    .getCompletionState(
                        this.draft,
                        this.planDefinition,
                        setup
                    ).canConfirm;
            }
        }
    },

    handleClick(event) {
        if (this.locked || !this.enabled) {
            return;
        }
        const action = event.target?.dataset?.planAction;
        if (!action) {
            return;
        }

        if (action === "use-suggested-question") {
            this.draft = InvestigationPlanModel
                .invalidateConfirmation(this.draft);
            this.draft.researchQuestion =
                this.getSuggestedQuestion();
            this.render();
            this.notifyChanged();
            return;
        }

        if (action === "back") {
            this.currentStage = Math.max(
                2,
                this.currentStage - 1
            );
            this.render();
            return;
        }

        if (action === "next-question") {
            if (this.isQuestionComplete()) {
                this.currentStage = 3;
                this.render();
            }
            return;
        }

        if (action === "next-hypothesis") {
            if (this.isHypothesisComplete()) {
                this.currentStage = 4;
                this.render();
            }
            return;
        }

        if (action === "confirm-plan") {
            const setup = NaturalSelectionSetupPanel
                .getSetupSnapshot();
            try {
                this.draft = InvestigationPlanModel.confirm(
                    this.draft,
                    this.planDefinition,
                    setup
                );
                this.render();
                this.notifyChanged();
            } catch (error) {
                console.warn(
                    "NaturalSelectionPlanPanel: plan confirmation rejected",
                    error
                );
            }
            return;
        }

        if (action === "edit-plan") {
            this.draft = InvestigationPlanModel
                .invalidateConfirmation(this.draft);
            this.currentStage = 2;
            this.render();
            this.notifyChanged();
        }
    },

    render() {
        if (!this.initialize()) {
            return false;
        }

        const scenarioConfirmed =
            NaturalSelectionSetupPanel
                .isScenarioConfirmed();

        if (!this.enabled) {
            this.panelElement.hidden = true;
            this.panelElement.dataset.planState =
                "bypassed";
            if (this.guidedHeaderElement) {
                this.guidedHeaderElement.hidden = true;
            }
            return true;
        }

        const planComplete =
            this.draft.status === "complete";
        if (this.guidedHeaderElement) {
            this.guidedHeaderElement.hidden =
                this.locked || planComplete;
        }
        this.timeElement.textContent =
            this.locked || planComplete
                ? ""
                : `Takes about ${this.planDefinition.estimatedMinutes.minimum}–${this.planDefinition.estimatedMinutes.maximum} minutes`;
        this.renderProgress(scenarioConfirmed);

        if (!scenarioConfirmed) {
            this.panelElement.hidden = true;
            this.panelElement.dataset.planState =
                "waiting";
            return true;
        }

        this.panelElement.hidden = false;
        if (this.locked) {
            this.panelElement.dataset.planState =
                "locked";
            this.renderLockedPlan();
        } else if (planComplete) {
            this.panelElement.dataset.planState =
                "confirmed";
            this.renderConfirmedPlan();
        } else if (this.currentStage === 2) {
            this.panelElement.dataset.planState =
                "draft";
            this.renderQuestionStage();
        } else if (this.currentStage === 3) {
            this.panelElement.dataset.planState =
                "draft";
            this.renderHypothesisStage();
        } else {
            this.panelElement.dataset.planState =
                "draft";
            this.renderVariablesStage();
        }
        return true;
    },

    renderProgress(scenarioConfirmed) {
        if (!this.progressElement?.children) {
            return;
        }

        Array.from(this.progressElement.children).forEach(
            (item, index) => {
                const stage = index + 1;
                let state = "locked";
                if (stage === 1) {
                    state = scenarioConfirmed
                        ? "complete"
                        : "current";
                } else if (scenarioConfirmed) {
                    if (stage < this.currentStage) {
                        state = "complete";
                    } else if (stage === this.currentStage) {
                        state = "current";
                    }
                }
                item.className = `is-${state}`;
                item.setAttribute(
                    "aria-current",
                    state === "current"
                        ? "step"
                        : "false"
                );
            }
        );
    },

    createStageHeader(stageNumber, title, explanation) {
        const header = createElement(
            "header",
            "natural-selection-tutorial-stage-header"
        );
        header.append(
            createElement(
                "p",
                "natural-selection-step-eyebrow",
                `Guided stage ${stageNumber} of 4`
            ),
            createElement(
                "h3",
                "natural-selection-step-title",
                title
            ),
            createElement(
                "p",
                "natural-selection-step-explanation",
                explanation
            )
        );

        if (this.draft.reviewRequired) {
            header.append(
                createElement(
                    "p",
                    "natural-selection-review-alert",
                    "Needs review: your scenario changed. Check that your answers still match it."
                )
            );
        }
        return header;
    },

    createScenarioSummary() {
        const summary = NaturalSelectionSetupPanel
            .getScenarioSummary();
        const card = createElement(
            "section",
            "natural-selection-scenario-card compact"
        );
        const list = createElement(
            "dl",
            "natural-selection-scenario-list"
        );
        if (summary) {
            appendDefinitionRows(list, [
                ["Habitat", summary.background],
                ["Starting population", summary.startingPopulation],
                ["Study length", `Generations 0–${summary.finalGeneration}`],
                ["Predation", `${summary.capturesPerGeneration} captures per generation`],
                ["Reproduction", `Clonal to ${summary.carryingCapacity} offspring`],
                ["Mutation", summary.mutationEnabled ? "Enabled" : "Disabled"]
            ]);
        }
        card.append(
            createElement(
                "h3",
                "natural-selection-scenario-title",
                "Your Scenario"
            ),
            list
        );
        return card;
    },

    createTextarea({
        field,
        label,
        value,
        placeholder
    }) {
        const wrapper = createElement(
            "div",
            "natural-selection-guided-input"
        );
        const id = `natural-selection-${field}`;
        const labelElement = createElement(
            "label",
            "natural-selection-plan-label",
            label
        );
        labelElement.setAttribute("for", id);

        const textarea = createElement(
            "textarea",
            "natural-selection-plan-textarea"
        );
        textarea.id = id;
        textarea.dataset.planField = field;
        textarea.value = value;
        textarea.placeholder = placeholder;
        textarea.rows = 4;
        textarea.setAttribute(
            "aria-describedby",
            `${id}-help`
        );

        const length = getTrimmedLength(value);
        const help = createElement(
            "p",
            "natural-selection-plan-help",
            `Type at least ${MINIMUM_CHARACTERS} characters. ${length}/${MINIMUM_CHARACTERS} entered.`
        );
        help.id = `${id}-help`;
        wrapper.append(labelElement, textarea, help);
        return wrapper;
    },

    getSuggestedQuestion() {
        const summary = NaturalSelectionSetupPanel
            .getScenarioSummary();
        const habitat = summary?.background
            ?.toLowerCase() ?? "selected";
        return `In a ${habitat} habitat, how do the frequencies of pigmented and non-pigmented amoebas change across generations under visual predation?`;
    },

    isQuestionComplete() {
        return getTrimmedLength(
            this.draft.researchQuestion
        ) >= this.planDefinition.minimumResponseLengths
            .researchQuestion;
    },

    isHypothesisComplete() {
        const validPrediction = this.planDefinition
            .hypothesis.options.some(
                option => option.id ===
                    this.draft.hypothesis.expectedTrendId
            );
        return validPrediction &&
            getTrimmedLength(
                this.draft.hypothesis.rationale
            ) >= this.planDefinition.minimumResponseLengths
                .hypothesisRationale;
    },

    renderQuestionStage() {
        const fragment = document.createDocumentFragment();
        fragment.append(
            this.createStageHeader(
                2,
                "Research Question",
                "Write a measurable question about population frequencies across generations."
            ),
            this.createScenarioSummary()
        );

        const suggestion = createElement(
            "section",
            "natural-selection-question-starter"
        );
        suggestion.append(
            createElement(
                "p",
                "natural-selection-micro-label",
                "Sentence starter"
            ),
            createElement(
                "p",
                "natural-selection-suggested-question",
                this.getSuggestedQuestion()
            )
        );
        const useSuggestion = createElement(
            "button",
            "natural-selection-secondary-action",
            "Use Suggested Question"
        );
        useSuggestion.type = "button";
        useSuggestion.dataset.planAction =
            "use-suggested-question";
        suggestion.append(useSuggestion);

        fragment.append(
            suggestion,
            this.createTextarea({
                field: "researchQuestion",
                label: "Your research question",
                value: this.draft.researchQuestion,
                placeholder:
                    "Type at least 25 characters. Ask how phenotype frequencies change across generations."
            })
        );

        const preview = createElement(
            "section",
            "natural-selection-live-preview"
        );
        const response = createElement(
            "p",
            "natural-selection-live-response",
            this.draft.researchQuestion.trim() ||
                "Your question will appear here."
        );
        response.id =
            "natural-selection-question-live-response";
        preview.append(
            createElement(
                "p",
                "natural-selection-micro-label",
                "Live preview"
            ),
            response
        );
        fragment.append(preview);

        const next = createElement(
            "button",
            "natural-selection-primary-action",
            "Next: Hypothesis"
        );
        next.type = "button";
        next.id = "natural-selection-question-next";
        next.dataset.planAction = "next-question";
        next.disabled = !this.isQuestionComplete();
        const actions = createElement(
            "div",
            "natural-selection-step-actions"
        );
        actions.append(next);
        fragment.append(actions);
        this.contentElement.replaceChildren(fragment);
    },

    renderHypothesisStage() {
        const fragment = document.createDocumentFragment();
        fragment.append(
            this.createStageHeader(
                3,
                "Hypothesis",
                "Choose a predicted population trend, then explain how visibility could produce it."
            ),
            this.createScenarioSummary()
        );

        const group = createElement(
            "fieldset",
            "natural-selection-hypothesis-grid"
        );
        group.append(
            createElement(
                "legend",
                "natural-selection-plan-label",
                "Which trend do you predict?"
            )
        );

        this.planDefinition.hypothesis.options.forEach(
            (option, index) => {
                const selected =
                    this.draft.hypothesis
                        .expectedTrendId === option.id;
                const card = createElement(
                    "label",
                    `natural-selection-hypothesis-card${selected
                        ? " is-selected"
                        : ""}`
                );
                const input = createElement("input");
                input.type = "radio";
                input.name = "hypothesisTrend";
                input.value = option.id;
                input.checked = selected;
                input.dataset.planField = "prediction";

                const visual = createElement(
                    "span",
                    `hypothesis-trend trend-${index + 1}`
                );
                visual.setAttribute("aria-hidden", "true");
                visual.append(
                    createElement("span", "trend-bar start"),
                    createElement("span", "trend-arrow", "→"),
                    createElement("span", "trend-bar end")
                );
                card.append(
                    input,
                    visual,
                    createElement(
                        "span",
                        "natural-selection-card-title",
                        option.title
                    ),
                    createElement(
                        "span",
                        "natural-selection-card-description",
                        option.description
                    ),
                    createElement(
                        "span",
                        "natural-selection-card-state",
                        selected ? "Selected" : "Choose"
                    )
                );
                group.append(card);
            }
        );

        fragment.append(
            group,
            this.createTextarea({
                field: "rationale",
                label: "Why do you predict this trend?",
                value: this.draft.hypothesis.rationale,
                placeholder:
                    "Type at least 25 characters. Connect background, visibility, survival, and inheritance."
            })
        );

        const actions = createElement(
            "div",
            "natural-selection-step-actions"
        );
        const back = createElement(
            "button",
            "natural-selection-secondary-action",
            "Back"
        );
        back.type = "button";
        back.dataset.planAction = "back";
        const next = createElement(
            "button",
            "natural-selection-primary-action",
            "Next: Variables"
        );
        next.type = "button";
        next.id = "natural-selection-hypothesis-next";
        next.dataset.planAction = "next-hypothesis";
        next.disabled = !this.isHypothesisComplete();
        actions.append(back, next);
        fragment.append(actions);
        this.contentElement.replaceChildren(fragment);
    },

    renderVariablesStage() {
        const setup = NaturalSelectionSetupPanel
            .getSetupSnapshot();
        const fragment = document.createDocumentFragment();
        fragment.append(
            this.createStageHeader(
                4,
                "Variables and Controls",
                "The activity assigns each role. Read why each variable has that role before confirming your plan."
            ),
            this.createScenarioSummary()
        );

        const grid = createElement(
            "div",
            "natural-selection-variable-grid"
        );
        this.planDefinition.variableItems.forEach(item => {
            const role = this.planDefinition.variableRoles.find(
                candidate => candidate.id === item.correctRoleId
            );
            const card = createElement(
                "article",
                "natural-selection-variable-card"
            );
            card.append(
                createElement(
                    "p",
                    `natural-selection-role-badge role-${item.correctRoleId}`,
                    role?.label ?? item.correctRoleId
                ),
                createElement(
                    "h4",
                    "natural-selection-variable-title",
                    item.label
                ),
                createElement(
                    "p",
                    "natural-selection-card-description",
                    item.explanation
                )
            );
            grid.append(card);
        });
        fragment.append(
            grid,
            this.createTextarea({
                field: "controlsExplanation",
                label: "Why do controls matter?",
                value:
                    this.draft.variables.controlsExplanation,
                placeholder:
                    "Type at least 25 characters. Explain how consistent rules make comparisons fair."
            })
        );

        const completion = InvestigationPlanModel
            .getCompletionState(
                this.draft,
                this.planDefinition,
                setup
            );
        const actions = createElement(
            "div",
            "natural-selection-step-actions"
        );
        const back = createElement(
            "button",
            "natural-selection-secondary-action",
            "Back"
        );
        back.type = "button";
        back.dataset.planAction = "back";
        const confirm = createElement(
            "button",
            "natural-selection-primary-action",
            "Confirm Investigation Plan"
        );
        confirm.type = "button";
        confirm.id = "natural-selection-plan-confirm";
        confirm.dataset.planAction = "confirm-plan";
        confirm.disabled = !completion.canConfirm;
        actions.append(back, confirm);
        fragment.append(actions);
        this.contentElement.replaceChildren(fragment);
    },

    createPlanDisclosure(
        plan,
        editable = false
    ) {
        const option = this.planDefinition
            .hypothesis.options.find(
                candidate => candidate.id ===
                    plan.hypothesis.expectedTrendId
            );
        const details = createElement(
            "details",
            "natural-selection-plan-disclosure"
        );
        const summary = createElement(
            "summary",
            "natural-selection-plan-disclosure-summary",
            "Investigation Plan Confirmed"
        );
        const wrapper = createElement(
            "div",
            "natural-selection-confirmed-plan"
        );
        const list = createElement(
            "dl",
            "natural-selection-plan-summary-list"
        );
        appendDefinitionRows(list, [
            ["Research question", plan.researchQuestion],
            ["Predicted trend", option?.title ??
                plan.hypothesis.expectedTrendLabel],
            ["Reasoning", plan.hypothesis.rationale],
            ["Controls", plan.variables.controlsExplanation]
        ]);
        wrapper.append(
            this.createScenarioSummary(),
            list
        );

        if (editable) {
            const edit = createElement(
                "button",
                "natural-selection-secondary-action",
                "Edit Plan"
            );
            edit.type = "button";
            edit.dataset.planAction = "edit-plan";
            wrapper.append(edit);
        }

        details.append(summary, wrapper);
        return details;
    },

    renderConfirmedPlan() {
        this.contentElement.replaceChildren(
            this.createPlanDisclosure(
                this.draft,
                true
            )
        );
    },

    renderLockedPlan() {
        const plan = this.lockedSnapshot ?? this.draft;
        this.contentElement.replaceChildren(
            this.createPlanDisclosure(plan)
        );
    },

    isReady(setup) {
        if (!this.initialize()) {
            return false;
        }
        if (
            !NaturalSelectionSetupPanel
                .isScenarioConfirmed()
        ) {
            return false;
        }
        return InvestigationPlanModel
            .getCompletionState(
                this.draft,
                this.planDefinition,
                setup
            ).ready;
    },

    getPlanSnapshot(setup) {
        if (!this.initialize()) {
            return null;
        }
        return InvestigationPlanModel.createSnapshot(
            this.draft,
            this.planDefinition,
            setup
        );
    },

    setLocked(locked, planSnapshot = null) {
        const nextLocked = Boolean(locked);
        const changed = this.locked !== nextLocked;
        this.locked = nextLocked;
        if (planSnapshot) {
            this.lockedSnapshot = structuredClone(planSnapshot);
        } else if (!nextLocked) {
            this.lockedSnapshot = null;
        }
        if (changed && this.initialized) {
            this.render();
        }
    },

    resetPlan() {
        if (!this.initialize()) {
            return false;
        }
        this.locked = false;
        this.lockedSnapshot = null;
        this.currentStage = 2;
        this.draft = InvestigationPlanModel.createDraft({
            enabled: this.enabled,
            definition: this.planDefinition
        });
        this.render();
        this.notifyChanged();
        return true;
    },

    subscribe(callback) {
        if (typeof callback !== "function") {
            throw new TypeError(
                "Investigation-plan subscriber must be a function."
            );
        }
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    },

    notifyChanged() {
        const setup = NaturalSelectionSetupPanel
            .getSetupSnapshot();
        this.callbacks.forEach(callback => {
            callback({
                enabled: this.enabled,
                ready: this.isReady(setup)
            });
        });
    }
};

export default NaturalSelectionPlanPanel;
