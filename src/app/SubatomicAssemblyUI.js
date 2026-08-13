// --------------------------------------------------
// SubatomicAssemblyUI.js
// Renders the Quantum Field learning activity
// --------------------------------------------------

import SubatomicAssemblyManager
    from "./SubatomicAssemblyManager.js";
import GameStateObserver
    from "./GameStateObserver.js";

const SubatomicAssemblyUI = {

    initialized: false,
    active: false,
    rootElement: null,
    statusBadgeElement: null,
    progressElement: null,
    progressTextElement: null,
    promptElement: null,
    feedbackElement: null,
    choiceElements: new Map(),
    counterElements: new Map(),

    initialize() {

        if (this.initialized) {
            this.render();
            return true;
        }

        this.ensureStylesheet();
        this.rootElement =
            this.ensureRootElement();

        if (!this.rootElement) {
            console.warn(
                "SubatomicAssemblyUI: unable to mount #quantum-zone"
            );

            return false;
        }

        this.buildInterface();
        this.subscribeToState();

        this.initialized = true;
        this.render();

        return true;

    },

    ensureStylesheet() {

        if (
            document.getElementById(
                "quantum-zone-styles"
            )
        ) {
            return;
        }

        const stylesheet =
            document.createElement("link");

        stylesheet.id =
            "quantum-zone-styles";
        stylesheet.rel = "stylesheet";
        stylesheet.href =
            "./public/css/quantum.css";

        document.head.appendChild(
            stylesheet
        );

    },

    ensureRootElement() {

        const existingRoot =
            document.getElementById(
                "quantum-zone"
            );

        if (existingRoot) {
            return existingRoot;
        }

        const appElement =
            document.getElementById("app");

        if (!appElement) {
            return null;
        }

        const rootElement =
            document.createElement("section");

        rootElement.id = "quantum-zone";
        rootElement.className = "hidden";
        rootElement.setAttribute(
            "aria-labelledby",
            "quantum-zone-title"
        );

        const testZone =
            document.getElementById(
                "test-zone"
            );

        if (
            testZone &&
            testZone.parentElement ===
                appElement
        ) {
            appElement.insertBefore(
                rootElement,
                testZone
            );
        } else {
            appElement.appendChild(
                rootElement
            );
        }

        return rootElement;

    },

    createElement(
        tagName,
        {
            id = "",
            className = "",
            text = ""
        } = {}
    ) {

        const element =
            document.createElement(tagName);

        if (id) {
            element.id = id;
        }

        if (className) {
            element.className = className;
        }

        if (text) {
            element.textContent = text;
        }

        return element;

    },

    buildInterface() {

        this.rootElement.replaceChildren();

        const header = this.createElement(
            "header",
            {
                className:
                    "quantum-activity-header"
            }
        );

        const titleGroup = this.createElement(
            "div",
            {
                className:
                    "quantum-title-group"
            }
        );

        const eyebrow = this.createElement(
            "p",
            {
                className:
                    "quantum-eyebrow",
                text:
                    "Quantum Field Â· Required Activity"
            }
        );

        const title = this.createElement(
            "h1",
            {
                id: "quantum-zone-title",
                text: "Subatomic Assembly"
            }
        );

        const description =
            this.createElement(
                "p",
                {
                    className:
                        "quantum-description",
                    text:
                        "Identify and collect five protons, five neutrons, and five electrons. Completion unlocks the Atom Lab prerequisite path."
                }
            );

        titleGroup.append(
            eyebrow,
            title,
            description
        );

        this.statusBadgeElement =
            this.createElement(
                "span",
                {
                    className:
                        "quantum-status-badge"
                }
            );

        header.append(
            titleGroup,
            this.statusBadgeElement
        );

        const progressPanel =
            this.createElement(
                "section",
                {
                    className:
                        "quantum-progress-panel"
                }
            );

        const progressHeading =
            this.createElement(
                "h2",
                {
                    text:
                        "Collection Progress"
                }
            );

        this.progressElement =
            this.createElement("progress", {
                id: "subatomic-progress"
            });

        this.progressElement.max = 15;

        this.progressTextElement =
            this.createElement(
                "p",
                {
                    className:
                        "quantum-progress-text"
                }
            );

        const counterGrid =
            this.createElement(
                "div",
                {
                    className:
                        "quantum-counter-grid"
                }
            );

        SubatomicAssemblyManager
            .getParticleDefinitions()
            .forEach(definition => {

                const counter =
                    this.createElement(
                        "article",
                        {
                            className:
                                `quantum-counter quantum-counter--${definition.id}`
                        }
                    );

                const counterName =
                    this.createElement(
                        "span",
                        {
                            className:
                                "quantum-counter-name",
                            text:
                                `${definition.symbol} ${definition.name}`
                        }
                    );

                const counterValue =
                    this.createElement(
                        "strong",
                        {
                            className:
                                "quantum-counter-value"
                        }
                    );

                counter.append(
                    counterName,
                    counterValue
                );

                counterGrid.appendChild(
                    counter
                );

                this.counterElements.set(
                    definition.id,
                    counterValue
                );

            });

        progressPanel.append(
            progressHeading,
            this.progressElement,
            this.progressTextElement,
            counterGrid
        );

        const activityPanel =
            this.createElement(
                "section",
                {
                    className:
                        "quantum-identification-panel",
                    id:
                        "subatomic-identification-panel"
                }
            );

        const promptLabel =
            this.createElement(
                "p",
                {
                    className:
                        "quantum-prompt-label",
                    text:
                        "Identify the particle"
                }
            );

        this.promptElement =
            this.createElement(
                "h2",
                {
                    id:
                        "subatomic-prompt"
                }
            );

        this.promptElement.setAttribute(
            "tabindex",
            "-1"
        );

        const choices =
            this.createElement(
                "div",
                {
                    className:
                        "quantum-choice-grid"
                }
            );

        SubatomicAssemblyManager
            .getParticleDefinitions()
            .forEach(definition => {

                const button =
                    this.createElement(
                        "button",
                        {
                            className:
                                `quantum-particle-choice quantum-particle-choice--${definition.id}`
                        }
                    );

                button.type = "button";
                button.dataset.particleId =
                    definition.id;
                button.setAttribute(
                    "aria-describedby",
                    "subatomic-prompt"
                );

                const symbol =
                    this.createElement(
                        "span",
                        {
                            className:
                                "quantum-particle-symbol",
                            text:
                                definition.symbol
                        }
                    );

                const name =
                    this.createElement(
                        "span",
                        {
                            className:
                                "quantum-particle-name",
                            text:
                                definition.name
                        }
                    );

                button.append(
                    symbol,
                    name
                );

                button.addEventListener(
                    "click",
                    () => {

                        const result =
                            SubatomicAssemblyManager
                                .submitAnswer(
                                    definition.id
                                );

                        this.showFeedback(
                            result.message,
                            result.correct,
                            result.reason
                        );

                        this.render();

                    }
                );

                choices.appendChild(
                    button
                );

                this.choiceElements.set(
                    definition.id,
                    button
                );

            });

        this.feedbackElement =
            this.createElement(
                "p",
                {
                    className:
                        "quantum-feedback",
                    id:
                        "subatomic-feedback"
                }
            );

        this.feedbackElement.setAttribute(
            "aria-live",
            "polite"
        );

        activityPanel.append(
            promptLabel,
            this.promptElement,
            choices,
            this.feedbackElement
        );

        const referencePanel =
            this.createReferencePanel();

        this.rootElement.append(
            header,
            progressPanel,
            activityPanel,
            referencePanel
        );

    },

    createReferencePanel() {

        const panel = this.createElement(
            "aside",
            {
                className:
                    "quantum-reference-panel"
            }
        );

        const heading = this.createElement(
            "h2",
            {
                text:
                    "Subatomic Reference"
            }
        );

        const table = this.createElement(
            "table",
            {
                className:
                    "quantum-reference-table"
            }
        );

        const head =
            this.createElement("thead");
        const headRow =
            this.createElement("tr");

        [
            "Particle",
            "Charge",
            "Location",
            "Relative mass"
        ].forEach(label => {
            headRow.appendChild(
                this.createElement(
                    "th",
                    { text: label }
                )
            );
        });

        head.appendChild(headRow);

        const body =
            this.createElement("tbody");

        SubatomicAssemblyManager
            .getParticleDefinitions()
            .forEach(definition => {

                const row =
                    this.createElement("tr");

                [
                    `${definition.symbol} ${definition.name}`,
                    definition.charge,
                    definition.location,
                    definition.relativeMass
                ].forEach(value => {
                    row.appendChild(
                        this.createElement(
                            "td",
                            { text: value }
                        )
                    );
                });

                body.appendChild(row);

            });

        table.append(head, body);
        panel.append(heading, table);

        return panel;

    },

    subscribeToState() {

        GameStateObserver.on(
            "game-state-loaded",
            () => this.render()
        );

        GameStateObserver.on(
            "subatomic-assembly-changed",
            () => this.render()
        );

        GameStateObserver.on(
            "subatomic-assembly-completed",
            () => this.render()
        );

    },

    showFeedback(
        message,
        correct,
        reason
    ) {

        if (!this.feedbackElement) {
            return;
        }

        this.feedbackElement.textContent =
            message ?? "";

        this.feedbackElement.dataset.tone =
            reason === "activity-completed"
                ? "completed"
                : correct
                    ? "correct"
                    : "incorrect";

    },

    render() {

        if (
            !this.initialized ||
            !this.rootElement
        ) {
            return false;
        }

        const status =
            SubatomicAssemblyManager
                .getStatus();

        this.statusBadgeElement.textContent =
            status.completed
                ? "Completed"
                : "Available";

        this.statusBadgeElement.dataset.status =
            status.completed
                ? "completed"
                : "available";

        this.progressElement.max =
            status.targetTotal;
        this.progressElement.value =
            status.totalProgress;

        this.progressTextElement.textContent =
            `${status.totalProgress} of ${status.targetTotal} required particles identified`;

        this.counterElements.forEach(
            (element, particleId) => {
                element.textContent =
                    `${status.totalCollected[particleId]} / ${status.targetPerParticle}`;
            }
        );

        if (status.completed) {
            this.promptElement.textContent =
                "Assembly complete. Atom Lab is unlocked; Hydrogen synthesis will be the next released activity.";

            this.choiceElements.forEach(
                button => {
                    button.disabled = true;
                }
            );

            this.showFeedback(
                `Reward recorded: ${status.xpReward} XP and particle capacity ${status.inventory.capacity}.`,
                true,
                "activity-completed"
            );

            return true;
        }

        this.promptElement.textContent =
            status.nextPrompt?.text ??
            "Choose the matching particle.";

        this.choiceElements.forEach(
            button => {
                button.disabled = false;
            }
        );

        if (
            !this.feedbackElement.textContent
        ) {
            this.showFeedback(
                "Use the scientific properties in the prompt and reference table.",
                true,
                "guidance"
            );
        }

        return true;

    },

    activate() {

        this.active = true;
        this.render();

        this.promptElement?.focus?.();

        return true;

    },

    deactivate() {

        this.active = false;

        return true;

    }

};

export default SubatomicAssemblyUI;
