// --------------------------------------------------
// NaturalSelectionAnalysisPanel.js
// Guided post-investigation interpretation and CER
// --------------------------------------------------

import InvestigationAnalysisModel
    from "./InvestigationAnalysisModel.js";
import InvestigationDataModel
    from "./InvestigationDataModel.js";
import InvestigationDefinitionRegistry
    from "./InvestigationDefinitionRegistry.js";
import InvestigationSessionManager
    from "./InvestigationSessionManager.js";

const INVESTIGATION_ID =
    "natural_selection_pigmentation";

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

const getTrimmedLength = value =>
    typeof value === "string"
        ? value.trim().length
        : 0;

const formatPercentage = value =>
    `${(value * 100).toFixed(1)}%`;

const formatChange = value =>
    `${value > 0 ? "+" : ""}${value.toFixed(1)} percentage points`;

const NaturalSelectionAnalysisPanel = {

    initialized: false,
    definition: null,
    analysisDefinition: null,
    panelElement: null,
    timeElement: null,
    progressElement: null,
    contentElement: null,
    draft: null,
    sessionId: null,
    currentStage: 1,
    callbacks: new Set(),

    initialize() {
        if (this.initialized) {
            return true;
        }

        this.definition =
            InvestigationDefinitionRegistry.get(
                INVESTIGATION_ID
            );
        this.analysisDefinition =
            this.definition
                ?.postInvestigationAnalysis ?? null;
        this.panelElement = document.getElementById(
            "natural-selection-analysis-panel"
        );
        this.timeElement = document.getElementById(
            "natural-selection-analysis-time"
        );
        this.progressElement = document.getElementById(
            "natural-selection-analysis-progress"
        );
        this.contentElement = document.getElementById(
            "natural-selection-analysis-content"
        );

        if (
            !this.definition ||
            !this.analysisDefinition ||
            !this.panelElement ||
            !this.timeElement ||
            !this.progressElement ||
            !this.contentElement
        ) {
            console.warn(
                "NaturalSelectionAnalysisPanel: required definition or DOM elements are unavailable"
            );
            return false;
        }

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

        InvestigationSessionManager.subscribe(
            session => this.handleSessionChange(session)
        );

        this.initialized = true;
        return true;
    },

    handleSessionChange(session) {
        if (!session) {
            this.draft = null;
            this.sessionId = null;
            this.currentStage = 1;
        } else if (
            session.phase === "population_complete" &&
            this.sessionId !== session.sessionId
        ) {
            this.sessionId = session.sessionId;
            this.currentStage = 1;
            this.draft = InvestigationAnalysisModel
                .createDraft({
                    definition:
                        this.analysisDefinition,
                    sessionId: session.sessionId
                });
        }

        this.render();
        this.notifyChanged();
    },

    getFieldValue(field) {
        const fields = {
            hypothesisExplanation:
                this.draft
                    .hypothesisEvaluation
                    .explanation,
            claim: this.draft.cer.claim,
            evidence: this.draft.cer.evidence,
            reasoning: this.draft.cer.reasoning,
            limitation:
                this.draft.reflection.limitation,
            variation:
                this.draft.reflection.variation,
            improvement:
                this.draft.reflection.improvement
        };
        return fields[field] ?? "";
    },

    setFieldValue(field, value) {
        if (field === "hypothesisExplanation") {
            this.draft.hypothesisEvaluation
                .explanation = value;
        } else if ([
            "claim",
            "evidence",
            "reasoning"
        ].includes(field)) {
            this.draft.cer[field] = value;
        } else if ([
            "limitation",
            "variation",
            "improvement"
        ].includes(field)) {
            this.draft.reflection[field] = value;
        }
    },

    getMinimumLength(field) {
        const minimum =
            this.analysisDefinition
                .minimumResponseLengths;
        return field === "hypothesisExplanation"
            ? minimum.hypothesisExplanation
            : minimum[field];
    },

    handleInput(event) {
        if (!this.draft || this.draft.status === "complete") {
            return;
        }

        const field =
            event.target?.dataset?.analysisField;
        if (!field) {
            return;
        }

        this.draft = InvestigationAnalysisModel
            .invalidateCompletion(this.draft);

        if (field === "hypothesisOutcome") {
            this.draft.hypothesisEvaluation
                .outcomeId = event.target.value;
            this.render();
        } else {
            this.setFieldValue(
                field,
                event.target.value
            );
            this.updateLiveState(field);
        }
        this.notifyChanged();
    },

    handleClick(event) {
        const action =
            event.target?.dataset?.analysisAction;
        if (!action || !this.draft) {
            return;
        }

        if (action === "back") {
            this.currentStage = Math.max(
                1,
                this.currentStage - 1
            );
            this.render();
            return;
        }

        const session = InvestigationSessionManager
            .getSnapshot();
        const completion = InvestigationAnalysisModel
            .getCompletionState(
                this.draft,
                this.analysisDefinition,
                session?.sessionId
            );

        if (
            action === "next-hypothesis" &&
            completion.hypothesisComplete
        ) {
            this.currentStage = 2;
            this.render();
            return;
        }

        if (
            action === "next-cer" &&
            completion.cerComplete
        ) {
            this.currentStage = 3;
            this.render();
            return;
        }

        if (
            action === "complete" &&
            completion.canComplete
        ) {
            this.draft = InvestigationAnalysisModel
                .complete(
                    this.draft,
                    this.analysisDefinition,
                    session.sessionId
                );
            this.render();
            this.notifyChanged();
            return;
        }

        if (action === "edit") {
            this.draft = InvestigationAnalysisModel
                .invalidateCompletion(this.draft);
            this.currentStage = 1;
            this.render();
            this.notifyChanged();
        }
    },

    updateLiveState(field) {
        const value = this.getFieldValue(field);
        const minimum = this.getMinimumLength(field);
        const help = document.getElementById(
            `natural-selection-analysis-${field}-help`
        );
        if (help) {
            help.textContent =
                `Type at least ${minimum} characters. ${getTrimmedLength(value)}/${minimum} entered.`;
        }

        const session = InvestigationSessionManager
            .getSnapshot();
        const completion = InvestigationAnalysisModel
            .getCompletionState(
                this.draft,
                this.analysisDefinition,
                session?.sessionId
            );
        const nextHypothesis = document.getElementById(
            "natural-selection-analysis-next-hypothesis"
        );
        const nextCer = document.getElementById(
            "natural-selection-analysis-next-cer"
        );
        const complete = document.getElementById(
            "natural-selection-analysis-complete"
        );

        if (nextHypothesis) {
            nextHypothesis.disabled =
                !completion.hypothesisComplete;
        }
        if (nextCer) {
            nextCer.disabled =
                !completion.cerComplete;
        }
        if (complete) {
            complete.disabled =
                !completion.canComplete;
        }
    },

    render() {
        if (!this.initialize()) {
            return false;
        }

        const session = InvestigationSessionManager
            .getSnapshot();
        if (
            !session ||
            session.phase !== "population_complete"
        ) {
            this.panelElement.hidden = true;
            return true;
        }

        if (!this.draft) {
            this.handleSessionChange(session);
            return true;
        }

        this.panelElement.hidden = false;
        const complete =
            this.draft.status === "complete";
        this.timeElement.textContent = complete
            ? ""
            : `Takes about ${this.analysisDefinition.estimatedMinutes.minimum}–${this.analysisDefinition.estimatedMinutes.maximum} minutes`;
        this.progressElement.hidden = complete;

        if (complete) {
            this.renderCompleteSummary(session);
        } else {
            this.renderProgress();
            if (this.currentStage === 1) {
                this.renderHypothesisStage(session);
            } else if (this.currentStage === 2) {
                this.renderCerStage(session);
            } else {
                this.renderReflectionStage(session);
            }
        }
        return true;
    },

    renderProgress() {
        Array.from(this.progressElement.children)
            .forEach((item, index) => {
                const stage = index + 1;
                const state = stage < this.currentStage
                    ? "complete"
                    : stage === this.currentStage
                        ? "current"
                        : "locked";
                item.className = `is-${state}`;
                item.setAttribute(
                    "aria-current",
                    state === "current"
                        ? "step"
                        : "false"
                );
            });
    },

    createStageHeader(number, title, explanation) {
        const header = createElement(
            "header",
            "natural-selection-analysis-stage-header"
        );
        header.append(
            createElement(
                "p",
                "natural-selection-step-eyebrow",
                `Analysis stage ${number} of 3`
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
        return header;
    },

    createEvidenceSnapshot(session) {
        const data = InvestigationDataModel
            .createSnapshot(session);
        const card = createElement(
            "section",
            "natural-selection-analysis-evidence"
        );
        const list = createElement(
            "dl",
            "natural-selection-analysis-evidence-list"
        );

        data.phenotypes.forEach(phenotype => {
            const initial = data.comparison
                .initialPopulation;
            const final = data.comparison
                .latestPopulation;
            const id = phenotype.id;
            const term = createElement(
                "dt",
                "",
                phenotype.label
            );
            const description = createElement(
                "dd",
                "",
                `Generation 0: ${initial.phenotypeCounts[id]} (${formatPercentage(initial.phenotypeFrequencies[id])}); Generation ${data.finalGeneration}: ${final.phenotypeCounts[id]} (${formatPercentage(final.phenotypeFrequencies[id])}); change ${formatChange(data.comparison.frequencyChanges[id])}.`
            );
            list.append(term, description);
        });

        card.append(
            createElement(
                "h4",
                "natural-selection-analysis-card-title",
                "Evidence Snapshot"
            ),
            createElement(
                "p",
                "natural-selection-analysis-note",
                "These values are generated from your trial. They describe the result but do not supply your conclusion."
            ),
            list
        );
        return card;
    },

    createOriginalHypothesis(session) {
        const plan = session.setup
            .investigationPlan;
        const card = createElement(
            "section",
            "natural-selection-analysis-original-hypothesis"
        );
        const list = createElement(
            "dl",
            "natural-selection-analysis-evidence-list"
        );
        const prediction = plan?.enabled
            ? plan.hypothesis.expectedTrendLabel
            : "No pre-investigation hypothesis was recorded.";
        const rationale = plan?.enabled
            ? plan.hypothesis.rationale
            : "Planning was bypassed for this attempt.";

        list.append(
            createElement("dt", "", "Prediction"),
            createElement("dd", "", prediction),
            createElement("dt", "", "Original reasoning"),
            createElement("dd", "", rationale)
        );
        card.append(
            createElement(
                "h4",
                "natural-selection-analysis-card-title",
                "Your Original Hypothesis"
            ),
            list
        );
        return card;
    },

    createTextarea({ field, label, prompt }) {
        const wrapper = createElement(
            "div",
            "natural-selection-analysis-input"
        );
        const id =
            `natural-selection-analysis-${field}`;
        const labelElement = createElement(
            "label",
            "natural-selection-analysis-label",
            label
        );
        labelElement.setAttribute("for", id);
        const textarea = createElement(
            "textarea",
            "natural-selection-analysis-textarea"
        );
        textarea.id = id;
        textarea.dataset.analysisField = field;
        textarea.value = this.getFieldValue(field);
        textarea.placeholder = prompt;
        textarea.rows = 5;
        textarea.setAttribute(
            "aria-describedby",
            `${id}-help`
        );
        const minimum = this.getMinimumLength(field);
        const help = createElement(
            "p",
            "natural-selection-analysis-help",
            `Type at least ${minimum} characters. ${getTrimmedLength(textarea.value)}/${minimum} entered.`
        );
        help.id = `${id}-help`;
        wrapper.append(
            labelElement,
            createElement(
                "p",
                "natural-selection-analysis-prompt",
                prompt
            ),
            textarea,
            help
        );
        return wrapper;
    },

    createActions({
        back = false,
        primaryLabel,
        primaryAction,
        primaryId,
        disabled
    }) {
        const actions = createElement(
            "div",
            "natural-selection-step-actions"
        );
        if (back) {
            const backButton = createElement(
                "button",
                "natural-selection-secondary-action",
                "Back"
            );
            backButton.type = "button";
            backButton.dataset.analysisAction = "back";
            actions.append(backButton);
        }
        const primary = createElement(
            "button",
            "natural-selection-primary-action",
            primaryLabel
        );
        primary.type = "button";
        primary.id = primaryId;
        primary.dataset.analysisAction = primaryAction;
        primary.disabled = disabled;
        actions.append(primary);
        return actions;
    },

    renderHypothesisStage(session) {
        const fragment = document.createDocumentFragment();
        fragment.append(
            this.createStageHeader(
                1,
                "Evaluate Your Hypothesis",
                "Compare your prediction with the observed pattern. A hypothesis can be supported by one trial, but it is not proven."
            ),
            this.createOriginalHypothesis(session),
            this.createEvidenceSnapshot(session)
        );

        const group = createElement(
            "fieldset",
            "natural-selection-analysis-option-grid"
        );
        group.append(
            createElement(
                "legend",
                "natural-selection-analysis-label",
                this.analysisDefinition
                    .hypothesisEvaluation.prompt
            )
        );
        this.analysisDefinition
            .hypothesisEvaluation.options
            .forEach(option => {
                const selected =
                    this.draft
                        .hypothesisEvaluation
                        .outcomeId === option.id;
                const card = createElement(
                    "label",
                    `natural-selection-analysis-option${selected
                        ? " is-selected"
                        : ""}`
                );
                const input = createElement("input");
                input.type = "radio";
                input.name =
                    "naturalSelectionHypothesisEvaluation";
                input.value = option.id;
                input.checked = selected;
                input.dataset.analysisField =
                    "hypothesisOutcome";
                card.append(
                    input,
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
            });
        fragment.append(
            group,
            this.createTextarea({
                field: "hypothesisExplanation",
                label: "Explain your evaluation",
                prompt:
                    this.analysisDefinition
                        .hypothesisEvaluation
                        .explanationPrompt
            })
        );

        const completion = InvestigationAnalysisModel
            .getCompletionState(
                this.draft,
                this.analysisDefinition,
                session.sessionId
            );
        fragment.append(
            this.createActions({
                primaryLabel: "Next: Claim–Evidence–Reasoning",
                primaryAction: "next-hypothesis",
                primaryId:
                    "natural-selection-analysis-next-hypothesis",
                disabled:
                    !completion.hypothesisComplete
            })
        );
        this.contentElement.replaceChildren(fragment);
    },

    renderCerStage(session) {
        const fragment = document.createDocumentFragment();
        fragment.append(
            this.createStageHeader(
                2,
                "Claim–Evidence–Reasoning",
                "Build an explanation from your own trial. The game provides measurements, not the scientific conclusion."
            ),
            this.createEvidenceSnapshot(session),
            this.createTextarea({
                field: "claim",
                label: "Claim",
                prompt: this.analysisDefinition
                    .cer.claimPrompt
            }),
            this.createTextarea({
                field: "evidence",
                label: "Evidence",
                prompt: this.analysisDefinition
                    .cer.evidencePrompt
            }),
            this.createTextarea({
                field: "reasoning",
                label: "Reasoning",
                prompt: this.analysisDefinition
                    .cer.reasoningPrompt
            })
        );
        const completion = InvestigationAnalysisModel
            .getCompletionState(
                this.draft,
                this.analysisDefinition,
                session.sessionId
            );
        fragment.append(
            this.createActions({
                back: true,
                primaryLabel: "Next: Limitations and Improvement",
                primaryAction: "next-cer",
                primaryId:
                    "natural-selection-analysis-next-cer",
                disabled: !completion.cerComplete
            })
        );
        this.contentElement.replaceChildren(fragment);
    },

    renderReflectionStage(session) {
        const fragment = document.createDocumentFragment();
        fragment.append(
            this.createStageHeader(
                3,
                "Limitations and Improvement",
                "Distinguish limitations of the model from authentic variation among student-controlled trials."
            ),
            this.createTextarea({
                field: "limitation",
                label: "Limitation",
                prompt: this.analysisDefinition
                    .reflection.limitationPrompt
            }),
            this.createTextarea({
                field: "variation",
                label: "Source of variation",
                prompt: this.analysisDefinition
                    .reflection.variationPrompt
            }),
            this.createTextarea({
                field: "improvement",
                label: "Possible improvement",
                prompt: this.analysisDefinition
                    .reflection.improvementPrompt
            })
        );
        const completion = InvestigationAnalysisModel
            .getCompletionState(
                this.draft,
                this.analysisDefinition,
                session.sessionId
            );
        fragment.append(
            this.createActions({
                back: true,
                primaryLabel: "Complete Analysis",
                primaryAction: "complete",
                primaryId:
                    "natural-selection-analysis-complete",
                disabled: !completion.canComplete
            })
        );
        this.contentElement.replaceChildren(fragment);
    },

    renderCompleteSummary(session) {
        const details = createElement(
            "details",
            "natural-selection-analysis-disclosure"
        );
        const summary = createElement(
            "summary",
            "natural-selection-analysis-disclosure-summary",
            "Analysis Complete"
        );
        const body = createElement(
            "div",
            "natural-selection-analysis-complete-body"
        );
        const list = createElement(
            "dl",
            "natural-selection-analysis-summary-list"
        );
        [
            ["Hypothesis evaluation", this.draft.hypothesisEvaluation.outcomeLabel],
            ["Evaluation explanation", this.draft.hypothesisEvaluation.explanation],
            ["Claim", this.draft.cer.claim],
            ["Evidence", this.draft.cer.evidence],
            ["Reasoning", this.draft.cer.reasoning],
            ["Limitation", this.draft.reflection.limitation],
            ["Source of variation", this.draft.reflection.variation],
            ["Possible improvement", this.draft.reflection.improvement]
        ].forEach(([label, value]) => {
            list.append(
                createElement("dt", "", label),
                createElement("dd", "", value)
            );
        });
        const edit = createElement(
            "button",
            "natural-selection-secondary-action",
            "Edit Analysis"
        );
        edit.type = "button";
        edit.dataset.analysisAction = "edit";
        body.append(
            this.createEvidenceSnapshot(session),
            list,
            edit
        );
        details.append(summary, body);
        this.contentElement.replaceChildren(details);
    },

    isComplete() {
        const session = InvestigationSessionManager
            .getSnapshot();
        if (!this.draft || !session) {
            return false;
        }
        return InvestigationAnalysisModel
            .getCompletionState(
                this.draft,
                this.analysisDefinition,
                session.sessionId
            ).complete;
    },

    getAnalysisSnapshot() {
        const session = InvestigationSessionManager
            .getSnapshot();
        if (!this.draft || !session) {
            return null;
        }
        return InvestigationAnalysisModel
            .createSnapshot(
                this.draft,
                this.analysisDefinition,
                session.sessionId
            );
    },

    subscribe(callback) {
        if (typeof callback !== "function") {
            throw new TypeError(
                "Analysis subscriber must be a function."
            );
        }
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    },

    notifyChanged() {
        this.callbacks.forEach(callback => {
            callback({
                sessionId: this.sessionId,
                complete: this.isComplete()
            });
        });
    }
};

export default NaturalSelectionAnalysisPanel;
