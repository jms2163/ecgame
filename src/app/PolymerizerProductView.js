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
                        Boolean(
                            product.completion
                                ?.completed
                        )
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

        const cards = products.map(product => {
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
                        ? "Coming Soon"
                    : product.completion
                        ?.source === "quest"
                        ? "Quest completed"
                    : product.output.quantity > 0
                        ? `Synthesized · ${product.output.quantity} stored`
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

            if (functionDisplay?.iconUrl) {
                const badge =
                    document.createElement("span");
                badge.className =
                    "poly-product-function-badge";
                badge.title = [
                    functionDisplay.label,
                    functionDisplay.description
                ].filter(Boolean).join(": ");

                const icon =
                    document.createElement("img");
                icon.className =
                    "poly-product-function-icon";
                icon.src =
                    functionDisplay.iconUrl;
                icon.alt =
                    functionDisplay.iconAlt ||
                    `${functionDisplay.label} icon`;
                icon.width = 80;
                icon.height = 80;

                // Development datasets may reference artwork before it is
                // copied into the local asset folder. Avoid leaving a broken
                // image or an empty column in that case.
                icon.addEventListener(
                    "error",
                    () => {
                        button.classList.remove(
                            "poly-product-card--has-function"
                        );
                        badge.remove();
                    },
                    { once: true }
                );

                badge.append(icon);
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

            return button;
        });

        container.replaceChildren(...cards);

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
            elements.progressPanel.hidden = true;
            elements.progress.value = 0;
            elements.countdown.textContent =
                "Assembly timing not configured";
            elements.chamberMode.textContent =
                "Coming Soon";
            elements.chamberStatus.textContent =
                product.lockedMessage;
            elements.assembleButton.disabled = true;
            elements.assembleButton.textContent =
                `${product.definition.name} · Coming Soon`;
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
            product.completion?.source ===
                "quest"
        ) {
            elements.progressPanel.hidden = true;
            elements.progress.value = 0;
            elements.countdown.textContent =
                "Assembly bypassed by quest completion";
            elements.chamberMode.textContent =
                "Quest Completed";
            elements.chamberStatus.textContent =
                `${product.definition.name} was unlocked through the Protein Building Blocks quest. No Polymerizer product was synthesized or added to output inventory.`;
            elements.assembleButton.disabled = true;
            elements.assembleButton.textContent =
                `${product.definition.name} · Quest Completed`;
            return;
        }

        elements.progressPanel.hidden = true;
        elements.progress.value = 0;
        elements.countdown.textContent =
            "15 seconds remaining";
        elements.chamberMode.textContent =
            product.eligible
                ? "Ready"
                : "Blocked";
        elements.chamberStatus.textContent =
            product.eligible
                ? "Structural levels and ATP are ready for a 15-second assembly."
                : "Increase the missing motif levels or ATP before assembly.";

        elements.assembleButton.disabled =
            !product.canStart;
        elements.assembleButton.textContent =
            product.canStart
                ? `Assemble ${product.definition.name} · ${product.atp.cost} ATP`
                : "Assembly Requirements Incomplete";

    },

    renderPreflight(container, product) {

        if (!container || !product) return;

        if (
            product.completion?.source ===
                "quest"
        ) {
            const item =
                document.createElement("li");
            item.className =
                "poly-requirement poly-requirement--complete";

            const label =
                document.createElement("span");
            label.textContent =
                "Protein Building Blocks quest";

            const count =
                document.createElement("strong");
            count.textContent = "Complete";

            const note =
                document.createElement("small");
            note.textContent =
                "Aquaporin discovery granted; no motifs or ATP were consumed here.";

            item.append(label, count, note);
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
                "Development status";

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

    renderOutput(elements, product) {

        if (!product) return;

        elements.outputQuantity.textContent =
            String(product.output.quantity);

        elements.outputMessage.textContent =
            product.output.quantity > 0
                ? `${product.definition.name} × ${product.output.quantity} stored in Polymerizer output inventory.`
                : product.completion?.source ===
                    "quest"
                    ? `${product.definition.name} was unlocked by quest completion. No synthesized protein is stored in the output tray.`
                : product.locked
                    ? `${product.definition.name} output is unavailable until its recipe is implemented.`
                    : `No completed ${product.definition.name} proteins yet.`;

    }

};

export default PolymerizerProductView;
