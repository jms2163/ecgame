// --------------------------------------------------
// NaturalSelectionPlanPanel.js
// Pre-investigation scientific-method scaffolding
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

const createElement = (
    tagName,
    className = "",
    textContent = ""
) => {

    const element =
        document.createElement(tagName);

    element.className = className;
    element.textContent = textContent;

    return element;

};

const createDefinitionList = rows => {

    const list =
        createElement(
            "dl",
            "natural-selection-plan-summary-list"
        );

    rows.forEach(
        ([label, value]) => {
            const term =
                createElement(
                    "dt",
                    "",
                    label
                );
            const description =
                createElement(
                    "dd",
                    "",
                    value || "—"
                );

            list.append(
                term,
                description
            );
        }
    );

    return list;

};

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
            this.definition
                ?.investigationPlan ?? null;
        this.enabled =
            NaturalSelectionPrototypeConfig
                .features
                .investigationPlan === true;
        this.panelElement =
            document.getElementById(
                "natural-selection-plan-panel"
            );
        this.timeElement =
            document.getElementById(
                "natural-selection-plan-time"
            );
        this.contentElement =
            document.getElementById(
                "natural-selection-plan-content"
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

        this.draft =
            InvestigationPlanModel
                .createDraft({
                    enabled:
                        this.enabled,
                    definition:
                        this.planDefinition
                });

        this.contentElement.addEventListener(
            "input",
            event => {
                this.handleInput(event);
            }
        );
        this.contentElement.addEventListener(
            "change",
            event => {
                this.handleInput(event);
            }
        );
        this.contentElement.addEventListener(
            "click",
            event => {
                this.handleClick(event);
            }
        );

        NaturalSelectionSetupPanel
            .subscribeToSelectionChanges(
                setup => {
                    this.handleSetupChange(
                        setup
                    );
                }
            );

        this.initialized = true;

        return true;

    },

    handleSetupChange(setup) {

        if (!this.enabled) {
            this.notifyChanged();

            return;
        }

        const signature =
            InvestigationPlanModel
                .createSetupSignature(
                    setup
                );

        if (
            this.draft.status ===
                "complete" &&
            this.draft
                .confirmedSetupSignature !==
                signature
        ) {
            this.draft =
                InvestigationPlanModel
                    .invalidateConfirmation(
                        this.draft,
                        "setup_changed"
                    );
        }

        this.render();
        this.notifyChanged();

    },

    handleInput(event) {

        if (
            !this.enabled ||
            this.locked
        ) {
            return;
        }

        const input = event.target;
        const field =
            input?.dataset
                ?.planField;
        const checklistId =
            input?.dataset
                ?.planChecklistId;
        const variableId =
            input?.dataset
                ?.planVariableId;

        if (
            !field &&
            !checklistId &&
            !variableId
        ) {
            return;
        }

        if (field === "researchQuestion") {
            this.draft.researchQuestion =
                input.value;
            this.draft =
                InvestigationPlanModel
                    .invalidateConfirmation(
                        this.draft
                    );
        } else if (
            field === "expectedTrendId" &&
            input.checked
        ) {
            this.draft.hypothesis
                .expectedTrendId =
                    input.value;
            this.draft =
                InvestigationPlanModel
                    .invalidateConfirmation(
                        this.draft
                    );
        } else if (
            field === "hypothesisRationale"
        ) {
            this.draft.hypothesis
                .rationale = input.value;
            this.draft =
                InvestigationPlanModel
                    .invalidateConfirmation(
                        this.draft
                    );
        } else if (
            field === "controlsExplanation"
        ) {
            this.draft.variables
                .controlsExplanation =
                    input.value;
            this.draft =
                InvestigationPlanModel
                    .invalidateConfirmation(
                        this.draft
                    );
        } else if (checklistId) {
            this.draft
                .researchQuestionChecklist[
                    checklistId
                ] = Boolean(
                    input.checked
                );
            this.draft =
                InvestigationPlanModel
                    .invalidateConfirmation(
                        this.draft
                    );
        } else if (variableId) {
            this.draft.variables
                .classifications[
                    variableId
                ] = input.value;
            this.draft =
                InvestigationPlanModel
                    .invalidateVariableCheck(
                        this.draft
                    );
            this.clearVariableFeedback();
        }

        this.refreshCompletionControls();
        this.notifyChanged();

    },

    handleClick(event) {

        if (
            !this.enabled ||
            this.locked
        ) {
            return;
        }

        if (
            event.target?.id ===
            "btn-check-investigation-variables"
        ) {
            this.draft =
                InvestigationPlanModel
                    .checkVariables(
                        this.draft,
                        this.planDefinition
                    );
            this.render();
            this.notifyChanged();

            return;
        }

        if (
            event.target?.id ===
            "btn-confirm-investigation-plan"
        ) {
            const setup =
                NaturalSelectionSetupPanel
                    .getSetupSnapshot();

            try {
                this.draft =
                    InvestigationPlanModel
                        .confirm(
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
        }

    },

    render() {

        if (!this.initialize()) {
            return false;
        }

        if (!this.enabled) {
            this.panelElement.hidden = true;
            this.contentElement
                .replaceChildren();

            return true;
        }

        this.panelElement.hidden = false;

        const estimate =
            this.planDefinition
                .estimatedMinutes;

        this.timeElement.textContent =
            `Takes about ${estimate.minimum}–${estimate.maximum} minutes`;
        this.timeElement.hidden =
            this.locked;

        if (this.locked) {
            this.renderLockedSummary();
        } else {
            this.renderEditablePlan();
        }

        return true;

    },

    renderEditablePlan() {

        const setup =
            NaturalSelectionSetupPanel
                .getSetupSnapshot();
        const disabled =
            setup === null;
        const fragment =
            document.createDocumentFragment();

        fragment.append(
            this.createClassQuestion(
                setup
            ),
            this.createResearchQuestionSection(
                disabled
            ),
            this.createHypothesisSection(
                disabled
            ),
            this.createVariablesSection(
                disabled
            ),
            this.createPlanActions()
        );

        this.contentElement.replaceChildren(
            fragment
        );
        this.refreshCompletionControls();

    },

    createClassQuestion(setup) {

        const section =
            createElement(
                "section",
                "natural-selection-plan-callout"
            );
        const heading =
            createElement(
                "h3",
                "",
                "Class investigation question"
            );
        const question =
            createElement(
                "p",
                "natural-selection-class-question",
                this.planDefinition
                    .classResearchQuestion
            );
        const note =
            createElement(
                "p",
                "natural-selection-plan-note",
                "Your investigation tests one background condition. The class comparison supplies the other levels, so your trial alone does not prove that changing the background caused a difference."
            );
        const backgroundOption =
            this.definition.parameters
                .find(
                    parameter =>
                        parameter.id ===
                        "background"
                )
                ?.options.find(
                    option =>
                        option.id ===
                        setup?.parameters
                            ?.background
                );
        const scenario =
            createElement(
                "p",
                "natural-selection-plan-scenario",
                setup
                    ? `Your scenario: ${backgroundOption?.label ?? setup.parameters.background} background; ${setup.population.pigmentedCount} pigmented / ${setup.population.nonPigmentedCount} non-pigmented; Generation 0-${setup.parameters.finalGeneration}.`
                    : "Choose a complete setup above to define your individual scenario."
            );

        section.append(
            heading,
            question,
            scenario,
            note
        );

        return section;

    },

    createResearchQuestionSection(
        disabled
    ) {

        const section =
            createElement(
                "section",
                "natural-selection-plan-section"
            );
        const heading =
            createElement(
                "h3",
                "",
                "1. My research question"
            );
        const prompt =
            createElement(
                "p",
                "natural-selection-plan-prompt",
                this.planDefinition
                    .individualQuestionPrompt
            );
        const label =
            createElement(
                "label",
                "natural-selection-plan-label",
                "Research question"
            );
        const textarea =
            createElement(
                "textarea",
                "natural-selection-plan-textarea"
            );
        const starter =
            createElement(
                "p",
                "natural-selection-plan-help",
                `Optional sentence starter: ${this.planDefinition.individualQuestionStarter}`
            );
        const checklist =
            createElement(
                "fieldset",
                "natural-selection-plan-checklist"
            );
        const legend =
            createElement(
                "legend",
                "",
                "Question self-check"
            );

        label.htmlFor =
            "natural-selection-research-question";
        textarea.id =
            "natural-selection-research-question";
        textarea.rows = 3;
        textarea.maxLength = 600;
        textarea.value =
            this.draft.researchQuestion;
        textarea.disabled = disabled;
        textarea.dataset.planField =
            "researchQuestion";

        checklist.append(legend);

        this.planDefinition
            .questionChecklist.forEach(
                item => {
                    const wrapper =
                        createElement(
                            "label",
                            "natural-selection-plan-check"
                        );
                    const input =
                        createElement("input");
                    const copy =
                        createElement(
                            "span",
                            "",
                            item.label
                        );

                    input.type = "checkbox";
                    input.checked =
                        this.draft
                            .researchQuestionChecklist[
                                item.id
                            ];
                    input.disabled = disabled;
                    input.dataset
                        .planChecklistId =
                            item.id;
                    wrapper.append(input, copy);
                    checklist.append(wrapper);
                }
            );

        section.append(
            heading,
            prompt,
            label,
            textarea,
            starter,
            checklist
        );

        return section;

    },

    createHypothesisSection(disabled) {

        const section =
            createElement(
                "section",
                "natural-selection-plan-section"
            );
        const heading =
            createElement(
                "h3",
                "",
                "2. My hypothesis"
            );
        const fieldset =
            createElement(
                "fieldset",
                "natural-selection-plan-options"
            );
        const legend =
            createElement(
                "legend",
                "",
                this.planDefinition
                    .hypothesis
                    .predictionPrompt
            );

        fieldset.append(legend);

        this.planDefinition
            .hypothesis
            .options.forEach(
                option => {
                    const wrapper =
                        createElement(
                            "label",
                            "natural-selection-plan-option"
                        );
                    const input =
                        createElement("input");
                    const copy =
                        createElement(
                            "span",
                            "",
                            option.label
                        );

                    input.type = "radio";
                    input.name =
                        "natural-selection-hypothesis-trend";
                    input.value = option.id;
                    input.checked =
                        this.draft.hypothesis
                            .expectedTrendId ===
                        option.id;
                    input.disabled = disabled;
                    input.dataset.planField =
                        "expectedTrendId";
                    wrapper.append(input, copy);
                    fieldset.append(wrapper);
                }
            );

        const rationaleLabel =
            createElement(
                "label",
                "natural-selection-plan-label",
                "Why do you predict this?"
            );
        const rationale =
            createElement(
                "textarea",
                "natural-selection-plan-textarea"
            );
        const rationalePrompt =
            createElement(
                "p",
                "natural-selection-plan-help",
                this.planDefinition
                    .hypothesis
                    .rationalePrompt
            );

        rationaleLabel.htmlFor =
            "natural-selection-hypothesis-rationale";
        rationale.id =
            "natural-selection-hypothesis-rationale";
        rationale.rows = 3;
        rationale.maxLength = 800;
        rationale.value =
            this.draft.hypothesis
                .rationale;
        rationale.disabled = disabled;
        rationale.dataset.planField =
            "hypothesisRationale";

        section.append(
            heading,
            fieldset,
            rationaleLabel,
            rationale,
            rationalePrompt
        );

        return section;

    },

    createVariablesSection(disabled) {

        const section =
            createElement(
                "section",
                "natural-selection-plan-section"
            );
        const heading =
            createElement(
                "h3",
                "",
                "3. Variables and controls"
            );
        const note =
            createElement(
                "p",
                "natural-selection-plan-note",
                "Classify each component. Habitat background is compared across the class; your trial tests one selected level."
            );
        const grid =
            createElement(
                "div",
                "natural-selection-variable-grid"
            );

        this.planDefinition
            .variableItems.forEach(
                item => {
                    const card =
                        createElement(
                            "div",
                            "natural-selection-variable-card"
                        );
                    const label =
                        createElement(
                            "label",
                            "natural-selection-plan-label",
                            item.label
                        );
                    const select =
                        createElement(
                            "select",
                            "natural-selection-variable-select"
                        );
                    const emptyOption =
                        createElement(
                            "option",
                            "",
                            "Choose a role"
                        );
                    const feedback =
                        createElement(
                            "p",
                            "natural-selection-variable-feedback"
                        );
                    const result =
                        this.draft.variables
                            .feedback[item.id];

                    label.htmlFor =
                        `natural-selection-variable-${item.id}`;
                    select.id =
                        `natural-selection-variable-${item.id}`;
                    select.disabled = disabled;
                    select.dataset
                        .planVariableId =
                            item.id;
                    emptyOption.value = "";
                    select.append(emptyOption);

                    this.planDefinition
                        .variableRoles.forEach(
                            role => {
                                const option =
                                    createElement(
                                        "option",
                                        "",
                                        role.label
                                    );

                                option.value = role.id;
                                option.selected =
                                    this.draft
                                        .variables
                                        .classifications[
                                            item.id
                                        ] === role.id;
                                select.append(option);
                            }
                        );

                    feedback.dataset
                        .planVariableFeedback =
                            item.id;

                    if (
                        result?.correct !== null
                    ) {
                        feedback.textContent =
                            result.message;
                        feedback.className +=
                            result.correct
                                ? " is-correct"
                                : " is-incorrect";
                    }

                    card.append(
                        label,
                        select,
                        feedback
                    );
                    grid.append(card);
                }
            );

        const checkButton =
            createElement(
                "button",
                "natural-selection-secondary-action",
                "Check Variables"
            );
        const controlsLabel =
            createElement(
                "label",
                "natural-selection-plan-label",
                this.planDefinition
                    .controlsExplanationPrompt
            );
        const controls =
            createElement(
                "textarea",
                "natural-selection-plan-textarea"
            );

        checkButton.id =
            "btn-check-investigation-variables";
        checkButton.type = "button";
        checkButton.disabled = disabled;
        controlsLabel.htmlFor =
            "natural-selection-controls-explanation";
        controls.id =
            "natural-selection-controls-explanation";
        controls.rows = 3;
        controls.maxLength = 800;
        controls.value =
            this.draft.variables
                .controlsExplanation;
        controls.disabled = disabled;
        controls.dataset.planField =
            "controlsExplanation";

        section.append(
            heading,
            note,
            grid,
            checkButton,
            controlsLabel,
            controls
        );

        return section;

    },

    createPlanActions() {

        const actions =
            createElement(
                "div",
                "natural-selection-plan-actions"
            );
        const status =
            createElement(
                "p",
                "natural-selection-plan-status"
            );
        const confirmButton =
            createElement(
                "button",
                "natural-selection-primary-action",
                "Confirm Investigation Plan"
            );

        status.id =
            "natural-selection-plan-status";
        status.setAttribute(
            "role",
            "status"
        );
        status.setAttribute(
            "aria-live",
            "polite"
        );
        confirmButton.id =
            "btn-confirm-investigation-plan";
        confirmButton.type = "button";

        actions.append(
            status,
            confirmButton
        );

        return actions;

    },

    refreshCompletionControls() {

        if (
            !this.enabled ||
            this.locked
        ) {
            return;
        }

        const setup =
            NaturalSelectionSetupPanel
                .getSetupSnapshot();
        const completion =
            InvestigationPlanModel
                .getCompletionState(
                    this.draft,
                    this.planDefinition,
                    setup
                );
        const status =
            document.getElementById(
                "natural-selection-plan-status"
            );
        const confirmButton =
            document.getElementById(
                "btn-confirm-investigation-plan"
            );

        if (!status || !confirmButton) {
            return;
        }

        confirmButton.disabled =
            !completion.canConfirm;

        if (!completion.setupComplete) {
            status.textContent =
                "Choose a complete investigation setup before writing and confirming the plan.";
        } else if (
            this.draft.reviewRequired
        ) {
            status.textContent =
                this.draft.reviewReason ===
                "setup_changed"
                    ? "Needs review: the setup changed. Update the question or hypothesis if needed, then reconfirm the plan."
                    : "Needs review: the plan changed. Reconfirm it before beginning the investigation.";
        } else if (completion.ready) {
            status.textContent =
                "Plan confirmed for the current setup. You may begin the investigation.";
        } else if (completion.canConfirm) {
            status.textContent =
                "Every requirement is complete. Confirm the plan to enable Begin Investigation.";
        } else {
            status.textContent =
                "Complete the question, hypothesis, variable check, and controls explanation.";
        }

    },

    clearVariableFeedback() {

        this.planDefinition
            .variableItems.forEach(
                item => {
                    const feedback =
                        this.contentElement
                            .querySelector(
                                `[data-plan-variable-feedback="${item.id}"]`
                            );

                    if (feedback) {
                        feedback.textContent = "";
                        feedback.className =
                            "natural-selection-variable-feedback";
                    }
                }
            );

    },

    renderLockedSummary() {

        const plan =
            this.lockedSnapshot ??
            this.draft;
        const details =
            createElement(
                "details",
                "natural-selection-plan-locked"
            );
        const summary =
            createElement(
                "summary",
                "",
                "View locked investigation plan"
            );
        const note =
            createElement(
                "p",
                "natural-selection-plan-note",
                "This plan was locked before the hunt began. Restarting the attempt allows revision and records the restart."
            );
        const classifications =
            this.planDefinition
                .variableItems.map(
                    item => {
                        const roleId =
                            plan.variables
                                .classifications[
                                    item.id
                                ];
                        const role =
                            this.planDefinition
                                .variableRoles.find(
                                    candidate =>
                                        candidate.id ===
                                        roleId
                                );

                        return [
                            item.label,
                            role?.label ?? ""
                        ];
                    }
                );
        const list =
            createDefinitionList([
                [
                    "Class question",
                    plan.classResearchQuestion
                ],
                [
                    "My research question",
                    plan.researchQuestion
                ],
                [
                    "Prediction",
                    plan.hypothesis
                        .expectedTrendLabel
                ],
                [
                    "Rationale",
                    plan.hypothesis.rationale
                ],
                ...classifications,
                [
                    "Why controls matter",
                    plan.variables
                        .controlsExplanation
                ]
            ]);

        details.append(
            summary,
            note,
            list
        );
        this.contentElement.replaceChildren(
            details
        );

    },

    isReady(setup) {

        if (!this.initialize()) {
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

        return InvestigationPlanModel
            .createSnapshot(
                this.draft,
                this.planDefinition,
                setup
            );

    },

    setLocked(
        locked,
        planSnapshot = null
    ) {

        const nextLocked =
            Boolean(locked);
        const changed =
            this.locked !== nextLocked;

        this.locked = nextLocked;

        if (planSnapshot) {
            this.lockedSnapshot =
                structuredClone(
                    planSnapshot
                );
        } else if (!nextLocked) {
            this.lockedSnapshot = null;
        }

        if (
            changed &&
            this.initialized
        ) {
            this.render();
        }

    },

    subscribe(callback) {

        if (typeof callback !== "function") {
            throw new TypeError(
                "Investigation-plan subscriber must be a function."
            );
        }

        this.callbacks.add(callback);

        return () => {
            this.callbacks.delete(callback);
        };

    },

    notifyChanged() {

        const setup =
            NaturalSelectionSetupPanel
                .getSetupSnapshot();

        this.callbacks.forEach(
            callback => {
                callback({
                    enabled:
                        this.enabled,
                    ready:
                        this.isReady(setup)
                });
            }
        );

    }

};

export default NaturalSelectionPlanPanel;
