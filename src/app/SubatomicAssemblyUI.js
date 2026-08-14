// --------------------------------------------------
// SubatomicAssemblyUI.js
// Renders guided Q1 and repeatable Quantum harvesting
// --------------------------------------------------

import SubatomicAssemblyManager
    from "./SubatomicAssemblyManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import GameStars from "./GameStars.js";

const SubatomicAssemblyUI = {

    initialized: false,
    active: false,
    rootElement: null,
    starElement: null,
    descriptionElement: null,
    statusBadgeElement: null,
    progressElement: null,
    progressTextElement: null,
    promptLabelElement: null,
    promptElement: null,
    feedbackElement: null,
    fieldHintElement: null,
    canvasElement: null,
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

    createParticleSymbol(
        definition,
        className = ""
    ) {

        const symbol =
            this.createElement(
                "span",
                { className }
            );

        symbol.appendChild(
            document.createTextNode
                ? document.createTextNode(
                    definition.symbol.base
                )
                : this.createElement(
                    "span",
                    {
                        text:
                            definition.symbol
                                .base
                    }
                )
        );

        const charge =
            this.createElement(
                "sup",
                {
                    text:
                        definition.symbol
                            .charge
                }
            );

        symbol.appendChild(charge);

        symbol.setAttribute(
            "aria-label",
            `${definition.name}, charge ${definition.charge}`
        );

        return symbol;

    },

    buildInterface() {

        this.rootElement.replaceChildren();
        this.choiceElements.clear();
        this.counterElements.clear();

        const header = this.createHeader();
        const progressPanel =
            this.createProgressPanel();
        const activityPanel =
            this.createActivityPanel();
        const referencePanel =
            this.createReferencePanel();

        this.rootElement.append(
            header,
            progressPanel,
            activityPanel,
            referencePanel
        );

    },

    createHeader() {

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

        const titleRow =
            this.createElement("div", {
                className:
                    "quantum-title-row"
            });

        const title =
            this.createElement("h1", {
                id: "quantum-zone-title",
                text: "Subatomic Assembly"
            });

        this.starElement =
            GameStars.createStarElement(
                "q1_particles",
                {
                    className:
                        "quantum-assignment-star",
                    tooltip:
                        "Exceptional Work!"
                }
            );

        this.starElement.id =
            "subatomic-perfect-star";

        titleRow.append(
            title,
            this.starElement
        );

        this.descriptionElement =
            this.createElement("p", {
                className:
                    "quantum-description",
                text:
                    "Learn to identify subatomic particles, then return whenever you need raw materials for Atom Lab."
            });

        titleGroup.append(
            this.createElement("p", {
                className: "quantum-eyebrow",
                text:
                    "Quantum Field - Particle Resource Zone"
            }),
            titleRow,
            this.descriptionElement
        );

        this.statusBadgeElement =
            this.createElement("span", {
                className:
                    "quantum-status-badge"
            });

        header.append(
            titleGroup,
            this.statusBadgeElement
        );

        return header;

    },

    createProgressPanel() {

        const panel = this.createElement(
            "section",
            {
                className:
                    "quantum-progress-panel"
            }
        );

        panel.appendChild(
            this.createElement("h2", {
                text:
                    "Particle Inventory"
            })
        );

        this.progressElement =
            this.createElement("progress", {
                id: "subatomic-progress"
            });

        this.progressElement.max = 15;

        this.progressTextElement =
            this.createElement("p", {
                className:
                    "quantum-progress-text"
            });

        const counterGrid =
            this.createElement("div", {
                className:
                    "quantum-counter-grid"
            });

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
                                "quantum-counter-name"
                        }
                    );

                counterName.append(
                    this.createParticleSymbol(
                        definition,
                        "quantum-inline-symbol"
                    ),
                    this.createElement("span", {
                        text:
                            ` ${definition.name}`
                    })
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

        panel.append(
            this.progressElement,
            this.progressTextElement,
            counterGrid
        );

        return panel;

    },

    createActivityPanel() {

        const panel = this.createElement(
            "section",
            {
                className:
                    "quantum-identification-panel",
                id:
                    "subatomic-identification-panel"
            }
        );

        this.promptLabelElement =
            this.createElement("p", {
                className:
                    "quantum-prompt-label"
            });

        this.promptElement =
            this.createElement("h2", {
                id: "subatomic-prompt"
            });
        this.promptElement.setAttribute(
            "tabindex",
            "-1"
        );

        const fieldPanel =
            this.createFieldPanel();

        const keyboardLabel =
            this.createElement("p", {
                className:
                    "quantum-keyboard-label",
                text:
                    "Keyboard alternative: choose a labeled particle control."
            });

        const choices =
            this.createElement("div", {
                className:
                    "quantum-choice-grid"
            });

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

                button.append(
                    this.createParticleSymbol(
                        definition,
                        "quantum-particle-symbol"
                    ),
                    this.createElement("span", {
                        className:
                            "quantum-particle-name",
                        text: definition.name
                    })
                );

                button.addEventListener(
                    "click",
                    () =>
                        this.handleParticleSelection(
                            definition.id
                        )
                );

                choices.appendChild(button);
                this.choiceElements.set(
                    definition.id,
                    button
                );

            });

        this.feedbackElement =
            this.createElement("p", {
                className:
                    "quantum-feedback",
                id:
                    "subatomic-feedback"
            });
        this.feedbackElement.setAttribute(
            "aria-live",
            "polite"
        );

        panel.append(
            this.promptLabelElement,
            this.promptElement,
            fieldPanel,
            keyboardLabel,
            choices,
            this.feedbackElement
        );

        return panel;

    },

    createFieldPanel() {

        const panel = this.createElement(
            "div",
            {
                className:
                    "quantum-field-panel"
            }
        );

        const canvasShell =
            this.createElement("div", {
                className:
                    "quantum-canvas-shell"
            });

        this.canvasElement =
            this.createElement("canvas", {
                id: "particleCanvas",
                className:
                    "quantum-particle-canvas"
            });

        this.canvasElement.width = 800;
        this.canvasElement.height = 420;
        this.canvasElement.setAttribute(
            "role",
            "application"
        );

        canvasShell.appendChild(
            this.canvasElement
        );

        const legend =
            this.createElement("div", {
                className:
                    "quantum-field-legend"
            });

        SubatomicAssemblyManager
            .getParticleDefinitions()
            .forEach(definition => {

                const item =
                    this.createElement(
                        "span",
                        {
                            className:
                                `quantum-legend-item quantum-legend-item--${definition.id}`
                        }
                    );

                item.append(
                    this.createParticleSymbol(
                        definition,
                        "quantum-inline-symbol"
                    ),
                    this.createElement("span", {
                        text:
                            ` ${definition.name}`
                    })
                );

                legend.appendChild(item);

            });

        this.fieldHintElement =
            this.createElement("p", {
                className:
                    "quantum-field-hint"
            });

        panel.append(
            canvasShell,
            legend,
            this.fieldHintElement
        );

        return panel;

    },

    createReferencePanel() {

        const panel = this.createElement(
            "aside",
            {
                className:
                    "quantum-reference-panel"
            }
        );

        panel.appendChild(
            this.createElement("h2", {
                text:
                    "Subatomic Reference"
            })
        );

        const table = this.createElement(
            "table",
            {
                className:
                    "quantum-reference-table"
            }
        );

        const head = this.createElement("thead");
        const headRow = this.createElement("tr");

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

        const body = this.createElement("tbody");

        SubatomicAssemblyManager
            .getParticleDefinitions()
            .forEach(definition => {

                const row =
                    this.createElement("tr");
                const particleCell =
                    this.createElement("td");

                particleCell.append(
                    this.createParticleSymbol(
                        definition,
                        "quantum-inline-symbol"
                    ),
                    this.createElement("span", {
                        text:
                            ` ${definition.name}`
                    })
                );

                row.append(
                    particleCell,
                    this.createElement("td", {
                        text: definition.charge
                    }),
                    this.createElement("td", {
                        text:
                            definition.location
                    }),
                    this.createElement("td", {
                        text:
                            definition.relativeMass
                    })
                );

                body.appendChild(row);

            });

        table.append(head, body);
        panel.appendChild(table);

        return panel;

    },

    getCanvasElement() {
        return this.canvasElement;
    },

    handleParticleSelection(particleId) {

        const result =
            SubatomicAssemblyManager
                .collectParticle(
                    particleId
                );

        this.showFeedback(
            result.message,
            result.correct,
            result.reason
        );

        this.render();

        return result;

    },

    handleFieldMiss() {

        this.showFeedback(
            "No particle was selected. Click or tap closer to the center of a visible particle.",
            false,
            "field-miss"
        );

        return false;

    },

    subscribeToState() {

        [
            "game-state-loaded",
            "subatomic-assembly-changed",
            "particle-inventory-changed",
            "quest-state-changed",
            "game-star-awarded",
            "game-star-removed"
        ].forEach(eventName => {
            GameStateObserver.on(
                eventName,
                () => this.render()
            );
        });

        GameStateObserver.on(
            "quest-claimed",
            payload => {
                if (
                    payload?.questId ===
                    "q1_particles"
                ) {
                    this.showFeedback(
                        `Reward claimed. Capacity is now ${payload.updatedCapacity} for each particle type, and Atom Lab is unlocked.`,
                        true,
                        "reward-claimed"
                    );
                    this.render();
                }
            }
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
            reason === "quest-ready" ||
            reason === "reward-claimed"
                ? "ready"
                : reason === "field-miss" ||
                    reason ===
                        "capacity-reached" ||
                    reason === "guidance"
                    ? "guidance"
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
        const questStatus =
            status.quest?.status ??
            "in-progress";

        GameStars.refreshElement(
            this.starElement
        );

        const guidanceComplete =
            status.guidanceComplete;

        this.descriptionElement.hidden =
            guidanceComplete;
        this.progressElement.hidden =
            guidanceComplete;
        this.progressTextElement.hidden =
            guidanceComplete;

        if (status.mode === "guided") {
            this.statusBadgeElement
                .textContent =
                "Guided Activity";
            this.statusBadgeElement
                .dataset.status =
                "guided";
        } else if (
            questStatus === "claimable"
        ) {
            this.statusBadgeElement
                .textContent =
                "Ready to Claim";
            this.statusBadgeElement
                .dataset.status =
                "claimable";
        } else if (
            questStatus === "claimed"
        ) {
            this.statusBadgeElement
                .textContent =
                "Free Gathering";
            this.statusBadgeElement
                .dataset.status =
                "harvesting";
        }

        this.progressElement.max =
            status.targetTotal;
        this.progressElement.value =
            status.totalProgress;

        this.progressTextElement
            .textContent =
            `Guided identification: ${status.totalProgress} / ${status.targetTotal}`;

        this.counterElements.forEach(
            (element, particleId) => {
                element.textContent =
                    `${status.inventory[particleId]} / ${status.inventory.capacity}`;
            }
        );

        this.choiceElements.forEach(
            button => {
                button.disabled = false;
            }
        );

        this.canvasElement?.setAttribute(
            "aria-disabled",
            "false"
        );

        if (status.mode === "guided") {
            this.promptLabelElement
                .textContent =
                "Identify the particle";
            this.promptElement.textContent =
                status.nextPrompt?.text ??
                "Choose the matching particle.";
            this.fieldHintElement
                .textContent =
                "Click or tap the moving particle that matches the scientific-property prompt.";
            this.canvasElement?.setAttribute(
                "aria-label",
                "Animated quantum particle field. Select the particle that matches the current question."
            );

            if (
                !this.feedbackElement
                    .textContent
            ) {
                this.showFeedback(
                    "Use the scientific properties in the prompt and reference table.",
                    true,
                    "guidance"
                );
            }

            return true;
        }

        this.promptLabelElement.textContent =
            "Free particle gathering";

        this.promptElement.textContent =
            questStatus === "claimable"
                ? "Questions complete. Open the Quests drawer and claim your reward."
                : "Collect whichever particles you need for Atom Lab.";

        this.fieldHintElement.textContent =
            "Click or tap any moving particle to harvest it. A replacement particle will enter the field.";

        this.canvasElement?.setAttribute(
            "aria-label",
            "Animated quantum particle field. Select any particle to add it to inventory."
        );

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
