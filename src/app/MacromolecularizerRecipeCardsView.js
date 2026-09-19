// --------------------------------------------------
// MacromolecularizerRecipeCardsView.js
// Recipe-card rendering for the Macromolecularizer.
// This module owns presentation only; catalogs and managers
// remain authoritative for recipe and progression data.
// --------------------------------------------------

import MotifVisualCatalog
    from "../data/MotifVisualCatalog.js";
import LipidRecipeCatalog, { LIPID_GROUPS }
    from "../data/LipidRecipeCatalog.js";
import LipidVisualCatalog
    from "../data/LipidVisualCatalog.js";

function getRecipeCardClassLabel(definition) {
    return definition.category === "nucleotides"
        ? definition.nucleicAcidType ?? definition.id
        : definition.id;
}

function getRecipeCardIconLabel(definition) {
    if (definition.category === "nucleotides") {
        return definition.abbreviation ?? definition.id;
    }

    if (LipidRecipeCatalog.get(definition.id)) {
        return LipidVisualCatalog.get(
            LipidRecipeCatalog.get(definition.id)
        ).icon;
    }

    return MotifVisualCatalog
        .get(definition.id)
        ?.icon ??
        "◆";
}

function renderPlannedLipidCards({
    container,
    implementedLipids = [],
    selectedMotifId = null,
    activeSynthesis = null,
    formatLifecycleStatus
}) {
    const content = LIPID_GROUPS.map(group => {
        const section = document.createElement("section");
        section.className = "macro-lipid-group";
        section.setAttribute("aria-label", group.label);

        const heading = document.createElement("h3");
        heading.className = "macro-lipid-group-heading";
        heading.textContent = group.label;
        section.append(heading);

        LipidRecipeCatalog.getByGroup(group.id)
            .forEach(recipe => {
                const playable = implementedLipids
                    .find(item => item.id === recipe.id);
                const card = document.createElement("button");
                card.type = "button";
                card.className = `macro-recipe-card macro-lipid-card${playable ? " macro-recipe-card--selectable" : ""}`;
                card.disabled = !playable || Boolean(
                    activeSynthesis &&
                    activeSynthesis.motifId !== recipe.id
                );
                card.dataset.status =
                    playable?.lifecycleStatus ?? "coming-soon";

                if (playable) {
                    card.dataset.motifId = recipe.id;
                    card.setAttribute(
                        "aria-pressed",
                        String(selectedMotifId === recipe.id)
                    );
                }

                const visual = LipidVisualCatalog.get(recipe);
                const available = recipe.precursors
                    .filter(precursor =>
                        precursor.availableInMoleculeLab
                    )
                    .map(precursor =>
                        precursor.id === "OleicAcid"
                            ? "Oleic Acid"
                            : precursor.name
                    );
                const pending = recipe.precursors
                    .filter(precursor =>
                        !precursor.availableInMoleculeLab
                    )
                    .map(precursor => precursor.name);

                const title = document.createElement("span");
                title.className = "macro-lipid-card-title";

                const icon = document.createElement("span");
                icon.className = "macro-recipe-icon";
                icon.textContent = visual.icon;
                icon.setAttribute("aria-hidden", "true");

                const name = document.createElement("span");
                name.textContent = recipe.id === "ErgosterolOleate"
                    ? "Sterol esters — Ergosterol oleate"
                    : `${recipe.name} (${recipe.id})`;
                title.append(icon, name);

                const description = document.createElement("span");
                description.className = "macro-recipe-specs";
                description.textContent = recipe.description;

                const ingredients = document.createElement("span");
                ingredients.className = "macro-lipid-ingredients";
                ingredients.textContent = playable
                    ? `Molecule Lab components: ${available.join(", ")}.`
                    : `Molecule Lab components: ${available.join(", ") || "none yet"}. Still to add: ${pending.join(", ") || "pathway and activity"}.`;

                const badge = document.createElement("span");
                badge.className = "macro-lipid-coming-soon";
                badge.textContent = playable
                    ? `${playable.inventory.quantity} stored · ${recipe.atpCost} ATP · ${formatLifecycleStatus(playable.lifecycleStatus, playable.inventory.quantity)}`
                    : "Coming Soon · Synthesis unavailable";

                card.append(
                    title,
                    description,
                    ingredients,
                    badge
                );
                section.append(card);
            });

        return section;
    });

    container.replaceChildren(...content);
    return content.length;
}

function renderRecipeCards({
    container,
    motifs,
    selectedMotifId,
    activeSynthesis,
    formatDuration,
    formatLifecycleStatus
}) {
    container.replaceChildren(
        ...motifs.map(motif => {
            const definition = motif.definition;
            const card = document.createElement("button");

            card.type = "button";
            card.className =
                "macro-recipe-card macro-recipe-card--selectable";
            card.dataset.motifId = definition.id;
            card.dataset.status = motif.lifecycleStatus;
            card.setAttribute(
                "aria-pressed",
                String(definition.id === selectedMotifId)
            );
            card.disabled = Boolean(
                activeSynthesis &&
                activeSynthesis.motifId !== definition.id
            );
            card.setAttribute(
                "aria-label",
                `${definition.name}, ${motif.inventory.quantity} stored, ${formatLifecycleStatus(motif.lifecycleStatus, motif.inventory.quantity)}`
            );

            const topline = document.createElement("span");
            topline.className = "macro-recipe-card-topline";

            const icon = document.createElement("span");
            icon.className = "macro-recipe-icon";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = getRecipeCardIconLabel(definition);

            const code = document.createElement("span");
            code.className = "macro-recipe-code";
            code.textContent = getRecipeCardClassLabel(definition);
            topline.append(icon, code);

            const name = document.createElement("span");
            name.className = "macro-recipe-title";
            name.textContent = definition.name;

            const summary = document.createElement("span");
            summary.className = "macro-recipe-specs";
            summary.textContent =
                `${definition.monomerCount} ${definition.category === "carbs"
                    ? "sugar units"
                    : definition.category === "nucleotides"
                        ? "components"
                        : "amino acids"} · ${definition.atpCost} ATP · ${formatDuration(motif.timing.durationMs)}`;

            const footer = document.createElement("span");
            footer.className = "macro-recipe-card-footer";

            const quantity = document.createElement("span");
            quantity.textContent =
                `${motif.inventory.quantity} stored`;

            const lifecycle = document.createElement("span");
            lifecycle.textContent = formatLifecycleStatus(
                motif.lifecycleStatus,
                motif.inventory.quantity
            );

            footer.append(quantity, lifecycle);
            card.append(topline, name, summary, footer);
            return card;
        })
    );

    return motifs.length;
}

export {
    getRecipeCardClassLabel,
    getRecipeCardIconLabel,
    renderPlannedLipidCards,
    renderRecipeCards
};

export default Object.freeze({
    renderPlannedLipidCards,
    renderRecipeCards
});
