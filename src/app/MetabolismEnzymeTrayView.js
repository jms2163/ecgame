// Compact inventory for every enzyme required by the selected pathway.
// An inspection dialog handles activation without a long cross-page drag.
import PracticeProgress from "./MetabolismPracticeProgress.js";

const MetabolismEnzymeTrayView = {
    render(container, pathway, onInspect = null) {
        if (!container || !pathway) return false;
        const available = new Map(
            (pathway.availableEnzymes ?? []).map(enzyme => [enzyme.enzymeId, enzyme])
        );
        const slots = [
            ...(pathway.coreSlots ?? []),
            ...(pathway.regenerationBranches ?? []).flatMap(branch => branch.slots)
        ];
        const cards = slots.map(slot => {
            const enzyme = available.get(slot.enzymeId);
            const active = Boolean(enzyme?.placed);
            const synthesized = Boolean(enzyme);
            const card = document.createElement("button");
            card.type = "button";
            card.className = [
                "metabolism-enzyme-card",
                active ? "metabolism-enzyme-card--placed" :
                    synthesized ? "metabolism-enzyme-card--ready" :
                        "metabolism-enzyme-card--required"
            ].join(" ");
            card.dataset.enzymeId = slot.enzymeId;
            card.dataset.slot = String(slot.slot);
            card.draggable = pathway.available && synthesized && !active;
            const name = document.createElement("strong");
            name.textContent = slot.label;
            const status = document.createElement("span");
            status.textContent = active ? "Enzyme activated" :
                synthesized ? "Enzyme unactivated" : "Enzyme required";
            const location = document.createElement("small");
            location.textContent = `Slot ${slot.slot} · Select for protein view`;
            card.append(name, status, location);
            if (PracticeProgress.hasPerfectPractice(slot.enzymeId)) {
                const marker = document.createElement("span");
                marker.className = "metabolism-practice-marker";
                marker.textContent = "P";
                marker.title = "Practiced · completed with 100% correct answers";
                marker.setAttribute("aria-label", "Practiced with 100% correct answers");
                card.append(marker);
            }
            card.addEventListener("click", () => onInspect?.(slot, { active, synthesized }));
            if (card.draggable) {
                card.addEventListener("dragstart", event => {
                    event.dataTransfer?.setData("text/plain", slot.enzymeId);
                    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
                });
            }
            return card;
        });
        container.replaceChildren(...cards);
        return true;
    }
};

export default MetabolismEnzymeTrayView;
