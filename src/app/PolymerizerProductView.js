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
                        product.output.quantity > 0
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

            button.append(
                name,
                status,
                level
            );

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
                : product.locked
                    ? `${product.definition.name} output is unavailable until its recipe is implemented.`
                    : `No completed ${product.definition.name} proteins yet.`;

    }

};

export default PolymerizerProductView;
