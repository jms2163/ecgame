// --------------------------------------------------
// PeriodicTableUI.js
// Pure View Component for the Periodic Table Grid
// --------------------------------------------------

import { elementLibrary } from "../data/elementLibrary.js";
import AtomLabManager from "./AtomLabManager.js";
import GameStateManager from "./GameStateManager.js";

const PeriodicTableUI = {

    container: null,
    gridEl: null,
    buttons: new Map(),

    // --------------------------------------------------
    // DOM Construction Helper
    // --------------------------------------------------
    createElement(tag, props = {}) {
        const el = document.createElement(tag);
        Object.assign(el, props);
        return el;
    },

    // --------------------------------------------------
    // Build Component Interface
    // --------------------------------------------------
    build() {
        // Clean root grid container (No duplicate Library header)
        this.container = this.createElement("div", { id: "periodic-table" });
        this.gridEl = this.createElement("div", { className: "pt-grid" });
        this.buttons.clear();

        // Generate Element Buttons
        Object.values(elementLibrary).forEach(elementData => {
            if (!elementData.group || !elementData.period) return;

            const button = this.createElement("button", {
                className: "element-box"
            });
            button.dataset.symbol = elementData.symbol;

            // Grid Placement
            button.style.gridColumn = elementData.group;
            button.style.gridRow = elementData.period;

            // Accessibility Labeling
            const elementName = elementData.name || elementData.symbol;
            button.setAttribute("aria-label", `${elementName}, atomic number ${elementData.p}`);

            // Card Markup
            button.innerHTML = `
                <span class="element-atomic-num">${elementData.p}</span>
                <span class="element-symbol">${elementData.symbol}</span>
            `;

            this.buttons.set(elementData.symbol, button);
            this.gridEl.appendChild(button);
        });

        // Event Delegation: Single click listener on the grid wrapper
        this.gridEl.addEventListener("click", (e) => {
            const btn = e.target.closest(".element-box[data-symbol]");
            if (!btn) return;
            this.handleElementClick(btn.dataset.symbol);
        });

        // Series Gap Labels (Lanthanides & Actinides)
        const lanthanideLabel = this.createSeriesLabel("57–71", 3, 6, "Lanthanide series, elements 57 through 71");
        const actinideLabel = this.createSeriesLabel("89–103", 3, 7, "Actinide series, elements 89 through 103");

        this.gridEl.append(lanthanideLabel, actinideLabel);
        this.container.appendChild(this.gridEl);

        return this.container;
    },

    // Helper for non-interactive series gap markers
    createSeriesLabel(text, col, row, ariaLabel) {
        const label = this.createElement("div", { className: "element-box series-label" });
        label.style.gridColumn = col;
        label.style.gridRow = row;
        label.setAttribute("aria-label", ariaLabel);
        label.innerHTML = `<span class="element-range">${text}</span>`;
        return label;
    },

    // Action Dispatcher
    handleElementClick(symbol) {
        const isDiscovered = GameStateManager?.hasDiscovery?.(symbol);

        if (isDiscovered) {
            console.log(`[PeriodicTable] Viewing discovered element: ${symbol}`);
            AtomLabManager.processAction("view_element", symbol);
        } else {
            const result = AtomLabManager.processAction("select_element", symbol);
            if (!result.accepted) {
                console.warn(`[PeriodicTable] Selection rejected: ${result.message}`);
            }
        }

        // Request UI refresh via global event dispatch or direct status check
        this.render(AtomLabManager.getStatus());
    },

    // --------------------------------------------------
    // Top-Down Render Loop
    // --------------------------------------------------
    render(state = AtomLabManager?.getStatus()) {
        if (!this.container || !state) return;

        // Synchronize visual state for each element button
        this.buttons.forEach((button, symbol) => {
            const isDiscovered = GameStateManager?.hasDiscovery?.(symbol);
            const isSelected = state.targetElement === symbol || state.selectedElement === symbol;

            button.classList.toggle("discovered", !!isDiscovered);
            button.classList.toggle("selected", !!isSelected);
        });
    }
};

export default PeriodicTableUI;