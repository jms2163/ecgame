// --------------------------------------------------
// MetabolismCoreModuleView.js
// Preflight and one-time activation control for the simplified Glycolysis
// Core. Domain validation and persistence remain in MetabolismManager.
// --------------------------------------------------

const MetabolismCoreModuleView = {

    render(
        container,
        status,
        onActivate = null
    ) {

        if (!container || !status) {
            return false;
        }

        const heading =
            document.createElement("div");
        heading.className =
            "metabolism-core-heading";

        const name =
            document.createElement("strong");
        name.textContent = status.name;

        const reward =
            document.createElement("span");
        reward.textContent =
            `+${status.reward.amountPerMinute} ATP/min`;
        heading.append(name, reward);

        const requirements =
            document.createElement("ul");
        requirements.className =
            "metabolism-core-requirements";

        status.requirements.forEach(
            requirement => {
                const item =
                    document.createElement("li");
                item.className = requirement.complete
                    ? "metabolism-core-requirement--complete"
                    : "";

                const label =
                    document.createElement("span");
                label.textContent =
                    requirement.label;

                const count =
                    document.createElement("strong");
                count.textContent =
                    `${requirement.currentCount} / ${requirement.minimumCount}`;

                item.append(label, count);
                requirements.append(item);
            }
        );

        const note =
            document.createElement("p");
        note.className =
            "metabolism-core-note";
        note.textContent =
            status.completed
                ? "Core active."
                : !status.implemented
                    ? status.blockedReason
                    : status.requirementsMet
                        ? "All prerequisites are available. Activate the Core to begin ATP production."
                        : "Complete all three non-consuming prerequisites to activate the Core.";

        const activateButton =
            document.createElement(
                "button"
            );
        activateButton.type = "button";
        activateButton.className =
            "metabolism-core-activate";
        activateButton.disabled =
            !status.canComplete;
        activateButton.textContent =
            status.completed
                ? "Core Active"
                : status.canComplete
                    ? "Activate Glycolysis Core"
                    : "Requirements Incomplete";

        if (
            status.canComplete &&
            typeof onActivate ===
                "function"
        ) {
            activateButton.addEventListener(
                "click",
                onActivate
            );
        }

        container.replaceChildren(
            heading,
            requirements,
            note,
            activateButton
        );
        return true;

    }

};

export default MetabolismCoreModuleView;
