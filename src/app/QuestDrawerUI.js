// --------------------------------------------------
// QuestDrawerUI.js
// Global Quest navigation card and overlay drawer
// --------------------------------------------------

import GameStateObserver
    from "./GameStateObserver.js";
import NavigationUI
    from "./NavigationUI.js";
import QuestManager from "./QuestManager.js";
import QuestStatusResolver
    from "./QuestStatusResolver.js";
import ZoneCatalog from "./ZoneCatalog.js";

const UTILITY_CONTROL_ID = "quests";

const QuestDrawerUI = {

    initialized: false,
    expanded: false,
    completedExpanded: false,
    rootElement: null,
    toggleElement: null,
    statusElement: null,
    panelElement: null,
    listElement: null,
    feedbackElement: null,
    completedToggleElement: null,
    completedCountElement: null,
    completedMarkerElement: null,
    completedListElement: null,
    closeButtonElement: null,
    keydownHandler: null,

    initialize() {

        QuestManager.initialize();

        if (this.initialized) {
            NavigationUI.registerUtilityControl(
                UTILITY_CONTROL_ID,
                this.rootElement
            );
            this.render();
            return true;
        }

        this.ensureStylesheet();
        this.createInterface();

        if (
            !NavigationUI.registerUtilityControl(
                UTILITY_CONTROL_ID,
                this.rootElement
            )
        ) {
            console.warn(
                "QuestDrawerUI: unable to register the Quest navigation card"
            );

            return false;
        }

        this.toggleElement.addEventListener(
            "click",
            () => this.toggle()
        );

        this.closeButtonElement
            .addEventListener(
                "click",
                () => this.close({
                    returnFocus: true
                })
            );

        this.completedToggleElement
            .addEventListener(
                "click",
                () => this.setCompletedExpanded(
                    !this.completedExpanded
                )
            );

        this.keydownHandler = event => {
            if (
                event.key === "Escape" &&
                this.expanded
            ) {
                event.preventDefault();
                this.close({
                    returnFocus: true
                });
            }
        };

        document.addEventListener(
            "keydown",
            this.keydownHandler
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

    createInterface() {

        this.rootElement =
            document.createElement("div");
        this.rootElement.id =
            "quest-drawer";
        this.rootElement.className =
            "quest-drawer";
        this.rootElement.dataset.navigationKind =
            "utility";

        this.toggleElement =
            document.createElement("button");
        this.toggleElement.type = "button";
        this.toggleElement.className =
            "game-nav-button game-nav-quest-button";
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
        toggleLabel.className =
            "game-nav-button-name";
        toggleLabel.textContent = "Quests";

        this.statusElement =
            document.createElement("span");
        this.statusElement.className =
            "game-nav-button-status quest-nav-button-status";

        this.toggleElement.append(
            toggleLabel,
            this.statusElement
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
            "Quest drawer"
        );

        const panelHeader =
            document.createElement("header");
        panelHeader.className =
            "quest-drawer-panel-header";

        const heading =
            document.createElement("h2");
        heading.textContent =
            "Active Quests";

        this.closeButtonElement =
            document.createElement("button");
        this.closeButtonElement.type =
            "button";
        this.closeButtonElement.className =
            "quest-drawer-close";
        this.closeButtonElement.textContent =
            "Close";
        this.closeButtonElement.setAttribute(
            "aria-label",
            "Close Quest drawer"
        );

        panelHeader.append(
            heading,
            this.closeButtonElement
        );

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

        const completedSection =
            document.createElement("section");
        completedSection.className =
            "quest-history";
        completedSection.setAttribute(
            "aria-label",
            "Completed quests"
        );

        this.completedToggleElement =
            document.createElement("button");
        this.completedToggleElement.type =
            "button";
        this.completedToggleElement.className =
            "quest-history-toggle";
        this.completedToggleElement.setAttribute(
            "aria-expanded",
            "false"
        );
        this.completedToggleElement.setAttribute(
            "aria-controls",
            "quest-history-list"
        );

        const completedLabel =
            document.createElement("span");
        completedLabel.textContent =
            "Completed Quests";

        this.completedCountElement =
            document.createElement("span");
        this.completedCountElement.className =
            "quest-history-count";

        this.completedMarkerElement =
            document.createElement("span");
        this.completedMarkerElement.className =
            "quest-history-marker";
        this.completedMarkerElement.setAttribute(
            "aria-hidden",
            "true"
        );
        this.completedMarkerElement.textContent =
    "\u25BE";

        this.completedToggleElement.append(
            completedLabel,
            this.completedCountElement,
            this.completedMarkerElement
        );

        this.completedListElement =
            document.createElement("div");
        this.completedListElement.id =
            "quest-history-list";
        this.completedListElement.className =
            "quest-history-list";
        this.completedListElement.hidden = true;

        completedSection.append(
            this.completedToggleElement,
            this.completedListElement
        );

        this.panelElement.append(
            panelHeader,
            this.listElement,
            this.feedbackElement,
            completedSection
        );

        this.rootElement.append(
            this.toggleElement,
            this.panelElement
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
                    const xpAwarded =
                        payload.rewardResults
                            ?.xp?.awarded ?? 0;
                    const updatedCapacity =
                        payload.rewardResults
                            ?.particleCapacity
                            ?.updatedCapacity ??
                        "unchanged";

                    this.setFeedback(
                        `Reward claimed: ${xpAwarded} XP, particle capacity ${updatedCapacity}, and Atom Lab unlocked.`,
                        "success"
                    );
                }

                this.render();
            }
        );

    },

    toggle() {

        const viewedResult =
            QuestManager
                .markVisibleQuestsViewed();

        if (!viewedResult.saved) {
            this.setFeedback(
                "The quest viewed state could not be saved.",
                "error"
            );
        }

        if (this.expanded) {
            return this.close();
        }

        return this.open();

    },

    open() {

        this.expanded = true;
        this.panelElement.hidden = false;
        this.toggleElement.setAttribute(
            "aria-expanded",
            "true"
        );

        this.render();

        return true;

    },

    close({ returnFocus = false } = {}) {

        this.expanded = false;
        this.panelElement.hidden = true;
        this.toggleElement.setAttribute(
            "aria-expanded",
            "false"
        );

        // Completed history is intentionally session-only
        // UI state and resets whenever the drawer closes.
        this.setCompletedExpanded(false);

        if (returnFocus) {
            this.toggleElement.focus();
        }

        return false;

    },

    setCompletedExpanded(expanded) {

        this.completedExpanded =
            Boolean(expanded);

        if (
            !this.completedToggleElement ||
            !this.completedListElement
        ) {
            return this.completedExpanded;
        }

        this.completedToggleElement
            .setAttribute(
                "aria-expanded",
                String(
                    this.completedExpanded
                )
            );

        this.completedListElement.hidden =
            !this.completedExpanded;

        this.completedMarkerElement.textContent =
    this.completedExpanded
        ? "\u25B4"
        : "\u25BE";

        return this.completedExpanded;

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

    createRewardText(quest) {

        const rewardParts = [];

        if (quest.rewards.xp) {
            rewardParts.push(
                `${quest.rewards.xp} XP`
            );
        }

        if (quest.rewards.sp) {
            rewardParts.push(
                `${quest.rewards.sp} SP`
            );
        }



        if (
            quest.rewards
                .particleCapacity
        ) {
            rewardParts.push(
                `+${quest.rewards.particleCapacity} capacity per particle`
            );
        }

        if (
            quest.rewards.zoneUnlocks
                .length > 0
        ) {
            const zoneLabels =
                quest.rewards.zoneUnlocks
                    .map(
                        zoneId =>
                            ZoneCatalog
                                .get(zoneId)
                                ?.label ??
                            zoneId
                    );

            rewardParts.push(
                `Unlock ${zoneLabels.join(", ")}`
            );
        }

        if (
            quest.rewards
                .collectorUnlocks.length > 0
        ) {
            const collectorLabels =
                quest.rewards
                    .collectorUnlocks
                    .map(
                        particleId =>
                            `${particleId[0].toUpperCase()}${particleId.slice(1)} Autocollector`
                    );

            rewardParts.push(
                `Unlock ${collectorLabels.join(", ")}`
            );
        }

        return rewardParts.join(" | ");

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
            `Rewards: ${this.createRewardText(quest)}`;

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

    createCompletedQuestCard(quest) {

        const card =
            document.createElement("article");
        card.className =
            "quest-history-card";

        const title =
            document.createElement("h3");
        title.textContent = quest.title;

        const description =
            document.createElement("p");
        description.textContent =
            quest.description;

        const completedAt =
            document.createElement("p");
        completedAt.className =
            "quest-history-completed-at";
        completedAt.textContent =
            Number.isFinite(
                quest.claimedAtMs
            )
                ? `Completed ${new Date(quest.claimedAtMs).toLocaleString()}`
                : "Completed";

        const rewards =
            document.createElement("p");
        rewards.className =
            "quest-history-rewards";
        rewards.textContent =
            `Reward claimed: ${this.createRewardText(quest)}`;

        card.append(
            title,
            description,
            completedAt,
            rewards
        );

        return card;

    },

    renderNavigationStatus() {

        const status =
            QuestStatusResolver
                .getStatus();

        [
            "claim",
            "new-quest",
            "in-progress",
            "all-caught-up"
        ].forEach(statusId => {
            this.toggleElement.classList.remove(
                `game-nav-quest-button--${statusId}`
            );
        });

        this.toggleElement.classList.add(
            `game-nav-quest-button--${status.status}`
        );

        this.toggleElement.dataset.questStatus =
            status.status;
        this.toggleElement.title =
            status.message;
        this.toggleElement.setAttribute(
            "aria-label",
            `Quests. ${status.label}. ${status.message}`
        );

        this.statusElement.textContent =
            status.label;

        return status;

    },

    renderActiveQuests(quests) {

        if (quests.length === 0) {
            const empty =
                document.createElement("p");
            empty.className =
                "quest-drawer-empty";
            empty.textContent =
                "No active quests. Review your completed quest history below.";

            this.listElement
                .replaceChildren(empty);

            return;
        }

        this.listElement.replaceChildren(
            ...quests.map(
                quest =>
                    this.createQuestCard(
                        quest
                    )
            )
        );

    },

    renderCompletedQuests(quests) {

        this.completedCountElement.textContent =
            String(quests.length);

        if (quests.length === 0) {
            const empty =
                document.createElement("p");
            empty.className =
                "quest-history-empty";
            empty.textContent =
                "Completed quests will be recorded here.";

            this.completedListElement
                .replaceChildren(empty);
        } else {
            this.completedListElement
                .replaceChildren(
                    ...quests.map(
                        quest =>
                            this.createCompletedQuestCard(
                                quest
                            )
                    )
                );
        }

        this.setCompletedExpanded(
            this.completedExpanded
        );

    },

    render() {

        if (
            !this.initialized ||
            !this.listElement
        ) {
            return false;
        }

        const activeQuests =
            QuestManager
                .getVisibleQuestStatuses();
        const completedQuests =
            QuestManager
                .getCompletedQuestStatuses();

        this.renderNavigationStatus();
        this.renderActiveQuests(
            activeQuests
        );
        this.renderCompletedQuests(
            completedQuests
        );

        this.panelElement.hidden =
            !this.expanded;
        this.toggleElement.setAttribute(
            "aria-expanded",
            String(this.expanded)
        );

        return true;

    },

    getStatus() {

        return {
            initialized:
                this.initialized,
            expanded:
                this.expanded,
            completedExpanded:
                this.completedExpanded,
            navigation:
                QuestStatusResolver
                    .getStatus(),
            activeQuestCount:
                QuestManager
                    .getVisibleQuestStatuses()
                    .length,
            completedQuestCount:
                QuestManager
                    .getCompletedQuestStatuses()
                    .length
        };

    }

};

export default QuestDrawerUI;
