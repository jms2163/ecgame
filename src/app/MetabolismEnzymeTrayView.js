// --------------------------------------------------
// MetabolismEnzymeTrayView.js
// Renders synthesized Polymerizer enzymes as non-consuming placement cards.
// The tray owns no state; MetabolismManager validates and saves placement.
// --------------------------------------------------

const MetabolismEnzymeTrayView = {

    render(
        container,
        pathway,
        onPlace = null
    ) {

        if (!container || !pathway) {
            return false;
        }

        const enzymes =
            pathway.availableEnzymes ?? [];

        if (enzymes.length === 0) {
            const empty =
                document.createElement("p");
            empty.className =
                "metabolism-enzyme-tray-empty";
            empty.textContent =
                "Synthesize Glycolysis enzymes in Polymerizer to add cards here.";
            container.replaceChildren(empty);
            return true;
        }

        const cards = enzymes.map(enzyme => {
            const card =
                document.createElement("button");
            card.type = "button";
            card.className = [
                "metabolism-enzyme-card",
                enzyme.placed
                    ? "metabolism-enzyme-card--placed"
                    : ""
            ].filter(Boolean).join(" ");
            card.dataset.enzymeId =
                enzyme.enzymeId;
            card.dataset.slot =
                String(enzyme.slot);
            card.draggable =
                pathway.available &&
                !enzyme.placed;
            card.disabled = enzyme.placed;

            const name =
                document.createElement("strong");
            name.textContent = enzyme.label;

            const target =
                document.createElement("span");
            target.textContent =
                enzyme.placed
                    ? `Locked in slot ${enzyme.slot}`
                    : `Drag to slot ${enzyme.slot}`;

            const reward =
                document.createElement("small");
            reward.textContent = enzyme.isCore
                ? "+1 ATP/min when placed"
                : "Regenerates NAD+ · future anoxic survival";

            card.append(name, target, reward);

            card.addEventListener(
                "dragstart",
                event => {
                    event.dataTransfer
                        ?.setData(
                            "text/plain",
                            enzyme.enzymeId
                        );
                    if (event.dataTransfer) {
                        event.dataTransfer
                            .effectAllowed = "move";
                    }
                }
            );

            // Clicking is an accessibility and trackpad-friendly equivalent
            // of dragging to the enzyme's one biologically correct slot.
            card.addEventListener(
                "click",
                () => onPlace?.(
                    enzyme.slot,
                    enzyme.enzymeId
                )
            );

            return card;
        });

        container.replaceChildren(...cards);
        return true;

    }

};

export default MetabolismEnzymeTrayView;
