// --------------------------------------------------
// PolymerizerProductView.js
// Focused renderer for product cards and read-only preflight details.
// --------------------------------------------------

import PolymerizerVisualCatalog
    from "../data/PolymerizerVisualCatalog.js";

const MOTIF_NAMES = Object.freeze({
    H_helix: "Alpha Helix Motif",
    L_loop: "Loop Motif"
});

const PolymerizerProductView = {

    renderCatalog(
        container,
        products = [],
        activeAssembly = null
    ) {

        if (!container) return;

        const cards = products.map(product => {
            const button =
                document.createElement("button");

            button.type = "button";
            button.className =
                "poly-product-card poly-product-card--selected";
            button.disabled = true;
            button.setAttribute(
                "aria-current",
                "true"
            );

            const name =
                document.createElement("strong");
            name.textContent =
                product.definition.name;

            const status =
                document.createElement("span");
            status.textContent =
                activeAssembly
                    ?.productId === product.id
                    ? activeAssembly.complete
                        ? "Finalizing"
                        : "Assembling"
                    : product.eligible
                        ? "Requirements met · Ready"
                        : "Requirements incomplete";

            button.append(name, status);
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

        const visual =
            PolymerizerVisualCatalog.get(
                product.id
            );

        elements.productName.textContent =
            product.definition.name;
        elements.productClass.textContent =
            `${product.definition.className} protein · ${product.definition.location}`;
        elements.productDescription.textContent =
            product.definition.description;

        if (visual) {
            elements.productImage.src =
                visual.imageUrl;
            elements.productImage.alt =
                visual.alt;
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
                    ? "Recording the completed Aquaporin and its discovery."
                    : "Aquaporin is assembling. Motif levels remain available in Macromolecularizer.";
            elements.assembleButton.disabled = true;
            elements.assembleButton.textContent =
                activeAssembly.complete
                    ? "Finalizing Aquaporin…"
                    : "Assembling Aquaporin…";
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
                ? "Assemble Aquaporin · 15 ATP"
                : "Assembly Requirements Incomplete";

    },

    renderPreflight(container, product) {

        if (!container || !product) return;

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
                : "No completed proteins yet. Finish an assembly to place Aquaporin in this output tray.";

    }

};

export default PolymerizerProductView;
