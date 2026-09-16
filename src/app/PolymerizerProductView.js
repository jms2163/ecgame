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

    renderCatalog(container, products = []) {

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
                product.eligible
                    ? "Requirements met · Preview"
                    : "Requirements incomplete";

            button.append(name, status);
            return button;
        });

        container.replaceChildren(...cards);

    },

    renderChamber(elements, product) {

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

        elements.chamberStatus.textContent =
            product.eligible
                ? "Structural levels and ATP are ready. Assembly activates in a later milestone."
                : "Increase the missing motif levels in Macromolecularizer before assembly.";

        elements.assembleButton.disabled = true;
        elements.assembleButton.textContent =
            "Assembly Disabled — Milestone 2";

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
                : "No completed proteins yet. Output inventory activates with functional assembly.";

    }

};

export default PolymerizerProductView;
