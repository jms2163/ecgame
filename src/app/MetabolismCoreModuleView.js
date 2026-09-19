// --------------------------------------------------
// MetabolismCoreModuleView.js
// Read-only preflight for the simplified Glycolysis Core. Activation remains
// blocked until the real Macromolecularizer NAD+ recipe is implemented.
// --------------------------------------------------

const MetabolismCoreModuleView = {

    render(container, status) {

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
        note.textContent = status.completed
            ? "Core active."
            : status.blockedReason;

        container.replaceChildren(
            heading,
            requirements,
            note
        );
        return true;

    }

};

export default MetabolismCoreModuleView;
