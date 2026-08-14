// --------------------------------------------------
// QuestDrawerUI.js
// Global, zone-independent quest presentation
// --------------------------------------------------

import GameStateObserver
    from "./GameStateObserver.js";
import QuestManager from "./QuestManager.js";

const QuestDrawerUI = {

    initialized: false,
    expanded: false,
    rootElement: null,
    toggleElement: null,
    countElement: null,
    panelElement: null,
    listElement: null,
    feedbackElement: null,

    initialize() {

        QuestManager.initialize();

        if (this.initialized) {
            this.render();
            return true;
        }

        this.ensureStylesheet();

        const navigationElement =
            document.getElementById(
                "game-nav"
            );

        if (!navigationElement) {
            console.warn(
                "QuestDrawerUI: #game-nav was not found"
            );

            return false;
        }

        this.rootElement =
            document.createElement("div");
        this.rootElement.id =
            "quest-drawer";
        this.rootElement.className =
            "quest-drawer";

        this.toggleElement =
            document.createElement("button");
        this.toggleElement.type = "button";
        this.toggleElement.className =
            "quest-drawer-toggle";
        this.toggleElement.setAttribute(
            "aria-expanded",
            "false"
        );
        this.toggleElement.setAttribute(
            "aria-controls",
            "quest-drawer-panel"
        );

        const toggleLabel =
            document.createElement("span");
        toggleLabel.textContent = "Quests";

        this.countElement =
            document.createElement("span");
        this.countElement.className =
            "quest-drawer-count";

        const toggleMarker =
            document.createElement("span");
        toggleMarker.className =
            "quest-drawer-marker";
        toggleMarker.setAttribute(
            "aria-hidden",
            "true"
        );
        toggleMarker.textContent = "v";

        this.toggleElement.append(
            toggleLabel,
            this.countElement,
            toggleMarker
        );

        this.panelElement =
            document.createElement("section");
        this.panelElement.id =
            "quest-drawer-panel";
        this.panelElement.className =
            "quest-drawer-panel";
        this.panelElement.hidden = true;
        this.panelElement.setAttribute(
            "aria-label",
            "Active quests"
        );

        const heading =
            document.createElement("h2");
        heading.textContent =
            "Active Quests";

        this.listElement =
            document.createElement("div");
        this.listElement.className =
            "quest-drawer-list";

        this.feedbackElement =
            document.createElement("p");
        this.feedbackElement.className =
            "quest-drawer-feedback";
        this.feedbackElement.setAttribute(
            "aria-live",
            "polite"
        );

        this.panelElement.append(
            heading,
            this.listElement,
            this.feedbackElement
        );

        this.rootElement.append(
            this.toggleElement,
            this.panelElement
        );

        navigationElement.appendChild(
            this.rootElement
        );

        this.toggleElement.addEventListener(
            "click",
            () => this.toggle()
        );

        this.subscribeToState();

        this.initialized = true;
        this.render();

        return true;

    },

    ensureStylesheet() {

        if (
            document.getElementById(
                "quest-drawer-styles"
            )
        ) {
            return;
        }

        const stylesheet =
            document.createElement("link");

        stylesheet.id =
            "quest-drawer-styles";
        stylesheet.rel = "stylesheet";
        stylesheet.href =
            "./public/css/quest-drawer.css";

        document.head.appendChild(
            stylesheet
        );

    },

    subscribeToState() {

        [
            "game-state-loaded",
            "quest-state-changed",
            "subatomic-assembly-changed"
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
                    this.setFeedback(
                        `Reward claimed: ${payload.xpAwarded} XP, particle capacity ${payload.updatedCapacity}, and Atom Lab unlocked.`,
                        "success"
                    );
                }

                this.render();
            }
        );

    },

    toggle() {

        this.expanded = !this.expanded;
        this.panelElement.hidden =
            !this.expanded;

        this.toggleElement.setAttribute(
            "aria-expanded",
            String(this.expanded)
        );

        const marker =
            this.toggleElement.children[2];

        if (marker) {
            marker.textContent =
                this.expanded
                    ? "^"
                    : "v";
        }

        return this.expanded;

    },

    setFeedback(message, tone = "") {

        if (!this.feedbackElement) {
            return;
        }

        this.feedbackElement.textContent =
            message ?? "";
        this.feedbackElement.dataset.tone =
            tone;

    },

    createObjectiveElement(objective) {

        const item =
            document.createElement("li");

        item.className =
            objective.complete
                ? "quest-objective quest-objective--complete"
                : "quest-objective";

        const label =
            document.createElement("span");
        label.textContent =
            objective.label;

        const progress =
            document.createElement("strong");
        progress.textContent =
            `${objective.current} / ${objective.target}`;

        item.append(label, progress);

        return item;

    },

    createQuestCard(quest) {

        const card =
            document.createElement("article");
        card.className = [
            "quest-card",
            `quest-card--${quest.category}`,
            quest.claimable
                ? "quest-card--claimable"
                : ""
        ]
            .filter(Boolean)
            .join(" ");

        const header =
            document.createElement("header");

        const category =
            document.createElement("span");
        category.className =
            "quest-card-category";
        category.textContent =
            quest.category;

        const title =
            document.createElement("h3");
        title.textContent = quest.title;

        header.append(category, title);

        const description =
            document.createElement("p");
        description.className =
            "quest-card-description";
        description.textContent =
            quest.description;

        const objectives =
            document.createElement("ul");
        objectives.className =
            "quest-objectives";

        quest.objectives.forEach(
            objective => {
                objectives.appendChild(
                    this.createObjectiveElement(
                        objective
                    )
                );
            }
        );

        const rewards =
            document.createElement("p");
        rewards.className =
            "quest-card-rewards";
        rewards.textContent =
            `Rewards: ${quest.rewards.xp} XP | +${quest.rewards.particleCapacity} capacity per particle | Unlock Atom Lab`;

        const claimButton =
            document.createElement("button");
        claimButton.type = "button";
        claimButton.className =
            "quest-claim-button";
        claimButton.disabled =
            !quest.claimable;
        claimButton.textContent =
            quest.claimable
                ? "Claim Reward"
                : "In Progress";

        claimButton.addEventListener(
            "click",
            () => {
                const result =
                    QuestManager.claimQuest(
                        quest.id
                    );

                this.setFeedback(
                    result.message,
                    result.claimed
                        ? "success"
                        : "error"
                );

                this.render();
            }
        );

        card.append(
            header,
            description,
            objectives,
            rewards,
            claimButton
        );

        return card;

    },

    render() {

        if (
            !this.initialized ||
            !this.listElement
        ) {
            return false;
        }

        const quests =
            QuestManager
                .getVisibleQuestStatuses();
        const hasClaimableQuest =
            quests.some(
                quest => quest.claimable
            );

        this.countElement.textContent =
            String(quests.length);

        this.toggleElement.classList.toggle(
            "quest-drawer-toggle--claimable",
            hasClaimableQuest
        );

        this.toggleElement.title =
            hasClaimableQuest
                ? "A quest reward is ready to claim."
                : `${quests.length} active quest${quests.length === 1 ? "" : "s"}.`;

        if (quests.length === 0) {
            const empty =
                document.createElement("p");
            empty.className =
                "quest-drawer-empty";
            empty.textContent =
                "No currently released quests are active.";

            this.listElement
                .replaceChildren(empty);

            return true;
        }

        this.listElement.replaceChildren(
            ...quests.map(
                quest =>
                    this.createQuestCard(
                        quest
                    )
            )
        );

        return true;

    },

    getStatus() {

        return {
            initialized:
                this.initialized,
            expanded: this.expanded,
            activeQuestCount:
                QuestManager
                    .getVisibleQuestStatuses()
                    .length,
            claimable:
                QuestManager
                    .hasClaimableQuest()
        };

    }

};

export default QuestDrawerUI;
