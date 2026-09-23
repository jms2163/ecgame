// --------------------------------------------------
// PolymerizerProductView.js
// Focused renderer for product cards and read-only preflight details.
// --------------------------------------------------

import PolymerizerVisualCatalog
    from "../data/PolymerizerVisualCatalog.js";

const MOTIF_NAMES = Object.freeze({
    H_helix: "Alpha Helix Motif",
    B_sheet: "Beta Sheet Motif",
    L_loop: "Loop Motif"
});

// Avoid requesting a missing development asset on every 100 ms progress
// render. A page reload clears this cache after new image files are added.
const failedImageUrls = new Set();

// Keep catalog order within each group, even as ATP and quest state change.
export function groupPolymerizerProducts(
    products = [],
    activeAssembly = null
) {

    const groups = [
        { id: "ready", label: "Ready", products: [] },
        { id: "incomplete", label: "Incomplete", products: [] },
        { id: "quest", label: "Quest Completed", products: [] },
        { id: "synthesized", label: "Synthesis Completed", products: [] }
    ];

    products.forEach(product => {
        const groupIndex =
            product.completion?.source === "synthesized"
                ? 3
                : product.completion?.source === "quest"
                    ? 2
                    : activeAssembly?.productId === product.id ||
                        (!product.locked && product.canStart)
                        ? 0
                        : 1;
        groups[groupIndex].products.push(product);
    });

    return groups.filter(group => group.products.length);

}

function renderProductImage(
    elements,
    product,
    activeAssembly
) {

    const visual =
        PolymerizerVisualCatalog.get(
            product.id
        );

    if (!visual) {
        elements.productImage.hidden = true;
        elements.productImage.removeAttribute(
            "src"
        );
        return;
    }

    const productAssembly =
        activeAssembly?.productId ===
            product.id
            ? activeAssembly
            : null;
    const requestedImageUrl =
        PolymerizerVisualCatalog
            .resolveImageUrl(
                product.id,
                {
                    progress:
                        productAssembly
                            ?.progress ??
                        null,
                    completed:
                        !productAssembly &&
                        product.completion?.completed
                }
            );

    if (
        failedImageUrls.has(
            requestedImageUrl
        ) &&
        !visual.fallbackImageUrl
    ) {
        elements.productImage.hidden = true;
        elements.productImage.removeAttribute(
            "src"
        );
        return;
    }

    const imageUrl =
        failedImageUrls.has(
            requestedImageUrl
        )
            ? visual.fallbackImageUrl
            : requestedImageUrl;

    elements.productImage.hidden = false;
    elements.productImage.alt = visual.alt;
    elements.productImage.onerror = () => {
        failedImageUrls.add(
            requestedImageUrl
        );

        if (
            visual.fallbackImageUrl &&
            elements.productImage.src !==
                visual.fallbackImageUrl
        ) {
            elements.productImage.src =
                visual.fallbackImageUrl;
            return;
        }

        elements.productImage.hidden = true;
    };
    elements.productImage.src = imageUrl;

}

const PolymerizerProductView = {

    renderCatalog(
        container,
        products = [],
        activeAssembly = null,
        selectedProductId = null,
        onSelect = null
    ) {

        if (!container) return;

        const groups = groupPolymerizerProducts(
            products,
            activeAssembly
        );
        const nodes = [];

        groups.forEach(group => {
            const heading = document.createElement("h3");
            heading.className = "poly-product-group-heading";
            heading.textContent =
                `${group.label} (${group.products.length})`;
            nodes.push(heading);

            group.products.forEach(product => {
            const button =
                document.createElement("button");

            button.type = "button";
            button.className = [
                "poly-product-card",
                product.id ===
                    selectedProductId
                    ? "poly-product-card--selected"
                    : "",
                product.locked
                    ? "poly-product-card--locked"
                    : product.completion
                        ?.source === "quest"
                        ? "poly-product-card--quest-complete"
                    : product.completion
                        ?.source === "synthesized"
                        ? "poly-product-card--synthesized"
                    : ""
            ].filter(Boolean).join(" ");
            button.disabled =
                Boolean(activeAssembly);

            if (
                product.id ===
                selectedProductId
            ) {
                button.setAttribute(
                    "aria-current",
                    "true"
                );
            }

            const name =
                document.createElement("strong");
            name.textContent =
                product.definition.name;

            const content =
                document.createElement("span");
            content.className =
                "poly-product-card-content";

            const status =
                document.createElement("span");
            status.className =
                "poly-product-card-status";
            status.textContent =
                activeAssembly
                    ?.productId === product.id
                    ? activeAssembly.complete
                        ? "Finalizing"
                        : "Assembling"
                    : product.locked
                        ? product.implementationStatus ===
                            "research-locked"
                            ? "Research Locked"
                            : "Coming Soon"
                    : product.completion
                        ?.source === "quest"
                        ? "Quest completed"
                    : product.completion
                        ?.source === "synthesized"
                        ? "Synthesized"
                    : product.eligible
                        ? "Requirements met · Ready"
                        : "Requirements incomplete";

            // A protein's level is its total structural-motif count. It is
            // derived from the authoritative recipe catalog, so this label
            // never creates or duplicates persistent product state.
            const level =
                document.createElement("span");
            level.className =
                "poly-product-card-level";
            level.textContent =
                `Lvl: ${product.definition.motifCount}`;

            content.append(
                name,
                status,
                level
            );

            button.append(content);

            const functionDisplay =
                product.definition
                    .functionDisplay;

            if (functionDisplay?.badgeText) {
                const badge =
                    document.createElement("span");
                badge.className = [
                    "poly-product-function-badge",
                    functionDisplay.badgeTone
                        ? `poly-product-function-badge--${functionDisplay.badgeTone}`
                        : ""
                ].filter(Boolean).join(" ");
                badge.title = [
                    functionDisplay.label,
                    functionDisplay.description
                ].filter(Boolean).join(": ");
                badge.textContent =
                    functionDisplay.badgeText;
                button.append(badge);
                button.classList.add(
                    "poly-product-card--has-function"
                );
            }

            if (typeof onSelect === "function") {
                button.addEventListener(
                    "click",
                    () => onSelect(product.id)
                );
            }

            nodes.push(button);
            });
        });

        container.replaceChildren(...nodes);

    },

    renderChamber(
        elements,
        product,
        activeAssembly = null
    ) {

        if (!product) return;

        elements.productName.textContent =
            product.definition.name;
        elements.productClass.textContent =
            `${product.definition.className} protein · ${product.definition.location}`;
        elements.productDescription.textContent =
            product.definition.description;

        renderProductImage(
            elements,
            product,
            activeAssembly
        );

        if (product.locked) {
            const researchLocked =
                product.implementationStatus ===
                "research-locked";
            elements.progressPanel.hidden = true;
            elements.progress.value = 0;
            elements.countdown.textContent =
                researchLocked
                    ? "Complete required investigation"
                    : "Assembly timing not configured";
            elements.chamberMode.textContent =
                researchLocked
                    ? "Research Locked"
                    : "Coming Soon";
            elements.chamberStatus.textContent =
                product.lockedMessage;
            elements.assembleButton.disabled = true;
            elements.assembleButton.textContent =
                `${product.definition.name} · ${researchLocked ? "Locked" : "Coming Soon"}`;
            return;
        }

        if (activeAssembly) {
            elements.progressPanel.hidden = false;
            elements.progress.value =
                activeAssembly.progress;
            elements.countdown.textContent =
                activeAssembly.complete
                    ? "Assembly complete · finalizing"
                    : `${Math.ceil(activeAssembly.remainingMs / 1000)} seconds remaining`;
            elements.chamberMode.textContent =
                activeAssembly.complete
                    ? "Finalizing"
                    : "Assembly Active";
            elements.chamberStatus.textContent =
                activeAssembly.complete
                    ? product.definition.discoveryId
                        ? `Recording the completed ${product.definition.name} and its discovery.`
                        : `Recording the completed ${product.definition.name} in Polymerizer inventory.`
                    : `${product.definition.name} is assembling. Motif levels remain available in Macromolecularizer.`;
            elements.assembleButton.disabled = true;
            elements.assembleButton.textContent =
                activeAssembly.complete
                    ? `Finalizing ${product.definition.name}…`
                    : `Assembling ${product.definition.name}…`;
            return;
        }

        if (
            product.completion?.source === "quest"
        ) {
            elements.progressPanel.hidden = true;
            elements.progress.value = 0;
            elements.countdown.textContent =
                "Completed by Protein Building Blocks quest";
            elements.chamberMode.textContent = "Quest Completed";
            elements.chamberStatus.textContent =
                `${product.definition.name} is complete through the Protein Building Blocks quest.`;
            elements.assembleButton.disabled = true;
            elements.assembleButton.textContent =
                `${product.definition.name} · Complete`;
            return;
        }

        if (
            product.output.quantity > 0
        ) {
            elements.progressPanel.hidden = true;
            elements.progress.value = 0;
            elements.countdown.textContent =
                "One-time assembly complete";
            elements.chamberMode.textContent =
                "Synthesized";
            elements.chamberStatus.textContent =
                `${product.definition.name} is complete and its functional benefit is active.`;
            elements.assembleButton.disabled = true;
            elements.assembleButton.textContent =
                `${product.definition.name} · Synthesized`;
            return;
        }

        elements.progressPanel.hidden = true;
        elements.progress.value = 0;
        const assemblySeconds = Math.ceil(
            product.definition
                .assemblyDurationMs / 1000
        );
        elements.countdown.textContent =
            `${assemblySeconds} seconds remaining`;
        elements.chamberMode.textContent =
            product.eligible
                ? "Ready"
                : "Blocked";
        elements.chamberStatus.textContent =
            product.eligible
                ? `Structural levels and ATP are ready for a ${assemblySeconds}-second assembly.`
                : "Increase the missing motif levels or ATP before assembly.";

        elements.assembleButton.disabled =
            !product.canStart;
        elements.assembleButton.textContent =
            product.canStart
                ? `Assemble ${product.definition.name} · ${product.atp.cost} ATP`
                : "Assembly Requirements Incomplete";

    },

    renderPreflight(container, product, panel, guidance) {

        if (!container || !product) return;

        const synthesized =
            product.completion?.completed === true;
        const heading = panel?.querySelector("h2");
        if (heading) {
            heading.textContent = synthesized
                ? "Synthesis COMPLETE"
                : "Structural Requirements";
            heading.classList.toggle(
                "poly-synthesis-complete",
                synthesized
            );
        }
        if (guidance) guidance.hidden = synthesized;

        if (synthesized) {
            const item =
                document.createElement("li");
            item.className =
                "poly-requirement poly-requirement--complete";
            const label =
                document.createElement("span");
            label.textContent = product.definition.name;
            const count =
                document.createElement("strong");
            count.textContent = "COMPLETE";
            item.append(label, count);
            container.replaceChildren(item);
            return;
        }

        if (product.locked) {
            const item =
                document.createElement("li");
            item.className =
                "poly-requirement poly-requirement--locked";

            const label =
                document.createElement("span");
            label.textContent =
                product.implementationStatus ===
                    "research-locked"
                    ? "Research requirement"
                    : "Development status";

            const count =
                document.createElement("strong");
            count.textContent = "Locked";

            const note =
                document.createElement("small");
            note.textContent =
                product.lockedMessage;

            item.append(label, count, note);
            container.replaceChildren(item);
            return;
        }

        const rows = product.motifs.map(
            motif => {
                const item =
                    document.createElement("li");
                item.className = motif.complete
                    ? "poly-requirement poly-requirement--complete"
                    : "poly-requirement poly-requirement--missing";

                const label =
                    document.createElement("span");
                label.textContent =
                    MOTIF_NAMES[motif.productId] ??
                    motif.productId;

                const count =
                    document.createElement("strong");
                count.textContent =
                    `${motif.owned} / ${motif.quantity}`;

                const note =
                    document.createElement("small");
                note.textContent = motif.complete
                    ? "Level requirement met · not consumed"
                    : `Synthesize ${motif.missing} more in Macromolecularizer`;

                item.append(label, count, note);
                return item;
            }
        );

        const atpItem =
            document.createElement("li");
        atpItem.className = product.atp.canAfford
            ? "poly-requirement poly-requirement--complete"
            : "poly-requirement poly-requirement--missing";

        const atpLabel =
            document.createElement("span");
        atpLabel.textContent =
            "Assembly ATP";

        const atpCount =
            document.createElement("strong");
        atpCount.textContent =
            `${product.atp.current} / ${product.atp.cost}`;

        const atpNote =
            document.createElement("small");
        atpNote.textContent =
            "One ATP per required motif unit";

        atpItem.append(
            atpLabel,
            atpCount,
            atpNote
        );

        container.replaceChildren(
            ...rows,
            atpItem
        );

    },

    renderProfile(elements, product) {

        if (!product) return;
        elements.profileHeading.textContent =
            product.definition.name;
        const profile = product.definition.profile ?? {};
        const details = elements.profileDetails;
        const list = document.createElement("dl");
        list.className = "poly-profile-details";
        const addField = (label, value) => {
            if (!value) return;
            const term = document.createElement("dt");
            term.textContent = label;
            const description = document.createElement("dd");
            description.textContent = value;
            list.append(term, description);
        };
        addField("Type", profile.type ??
            `${product.definition.className} protein`);
        addField("Function", profile.function ??
            product.definition.function);
        addField("Optimal pH", profile.optimalPH);
        addField("Speed", profile.speed);
        addField("Selectivity", profile.selectivity);
        addField("Reaction", profile.reaction);
        addField("Organelle location in Amoeba proteus",
            profile.locations?.join("; "));
        if (!profile.locations?.length) {
            addField("Location (game model)",
                product.definition.location);
        }
        addField("Status",
            product.output.quantity > 0
                ? "Synthesis complete"
                : product.completion?.source === "quest"
                    ? "Completed by Protein Building Blocks quest"
                    : product.locked
                        ? "Research locked"
                        : "Not yet synthesized");
        details.replaceChildren(list);
        if (profile.sourceUrl) {
            const source = document.createElement("a");
            source.href = profile.sourceUrl;
            source.textContent = "Aquaporin research source";
            source.target = "_blank";
            source.rel = "noopener noreferrer";
            details.append(source);
        }

    }

};

export default PolymerizerProductView;
