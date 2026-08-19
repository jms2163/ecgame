// --------------------------------------------------
// PeriodicTableUI.js
// Pure View Component for the Periodic Table Grid
// --------------------------------------------------

import { elementLibrary } from "../data/elementLibrary.js";
import AtomLabManager from "./AtomLabManager.js";
import GameStateManager from "./GameStateManager.js";

const CATEGORY_COLORS = {
    alkali_metal: "rgb(60, 63, 50)",
    alkaline_earth: "rgb(237, 241, 83)",
    lanthanoid: "rgb(60, 63, 50)",
    actinide: "rgb(60, 63, 50)",
    transition_metal: "rgb(60, 63, 50)",
    post_transition_metal: "rgb(60, 63, 50)",
    metalloid: "rgb(60, 63, 50)",
    reactive_nonmetal: "rgb(125, 238, 122)",
    noble_gas: "rgb(60, 63, 50)",
    unknown: "rgb(200, 63, 50)",
    special: "rgb(60, 63, 50)"
};

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

    updateElementTiles(state) {
    if (!this.buttons) return;

    // Ordered sequence of progression elements
    const elementSequence = ["H", "He", "Li", "Be", "B", "C", "N", "O"];
    const isSandboxUnlocked = Boolean(GameStateManager?.hasFeature?.("sandbox_mode"));

    this.buttons.forEach((button, symbol) => {
        const isDiscovered = Boolean(GameStateManager?.hasDiscovery?.(symbol));
        const index = elementSequence.indexOf(symbol);

        let isUnlocked = false;

        if (isDiscovered || isSandboxUnlocked) {
            isUnlocked = true;
        } else if (index === 0) {
            isUnlocked = true; // Hydrogen is always unlocked
        } else if (index > 0) {
            // Unlocked if the immediate predecessor is discovered
            const previousSymbol = elementSequence[index - 1];
            isUnlocked = Boolean(GameStateManager?.hasDiscovery?.(previousSymbol));
        } else {
            // Elements beyond Oxygen remain locked until sandbox mode
            isUnlocked = false;
        }

        button.disabled = !isUnlocked;
        button.classList.toggle("locked-tile", !isUnlocked);
        button.classList.toggle("unlocked-tile", isUnlocked);

        if (isUnlocked) {
            button.removeAttribute("disabled");
        } else {
            button.setAttribute("disabled", "true");
        }
    });
},

    // --------------------------------------------------
    // Build Component Interface
    // --------------------------------------------------
    build() {
        // Clean root grid container
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
            // Add colored elements background feature
            button.dataset.category = elementData.category || "unknown"; // Store category

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

        // Event Delegation: Single click listener on grid wrapper
        this.gridEl.addEventListener("click", (e) => {
            const btn = e.target.closest(".element-box[data-symbol]");
            if (!btn || btn.disabled) return;
            this.handleElementClick(btn.dataset.symbol);
        });

        // Series Gap Labels (Lanthanides & Actinides)
        const lanthanideLabel = this.createSeriesLabel("57–71", 3, 6, "Lanthanide series, elements 57 through 71");
        const actinideLabel = this.createSeriesLabel("89–103", 3, 7, "Actinide series, elements 89 through 103");

        this.gridEl.append(lanthanideLabel, actinideLabel);
        this.container.appendChild(this.gridEl);

        // Initial render pass
        this.render();

        return this.container;
    },

    createSeriesLabel(text, col, row, ariaLabel) {
        const label = this.createElement("div", { className: "element-box series-label" });
        label.style.gridColumn = col;
        label.style.gridRow = row;
        label.setAttribute("aria-label", ariaLabel);
        label.innerHTML = `<span class="element-range">${text}</span>`;
        return label;
    },

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

        this.render(AtomLabManager.getStatus());
    },

    // --------------------------------------------------
    // Top-Down Render Loop
    // --------------------------------------------------
    render(state = AtomLabManager?.getStatus()) {
    if (!this.container || !state) return;

    // 1. Update element lock/enable states
    this.updateElementTiles(state);

    // 2. Synchronize visual selection/discovery state & category colors
    // 2. Synchronize visual selection/discovery state & category colors
    this.buttons.forEach((button, symbol) => {
        const isDiscovered = Boolean(GameStateManager?.hasDiscovery?.(symbol));
        const isSelected = state.targetElement === symbol || state.selectedElement === symbol;

        button.classList.toggle("discovered", isDiscovered);
        button.classList.toggle("selected", isSelected);

        // 3. Dynamic Category Background & Text Color
        const category = button.dataset.category;

        if (isDiscovered && CATEGORY_COLORS[category]) {
            button.style.backgroundColor = CATEGORY_COLORS[category];
            button.style.color = "#111111"; // Black text for contrast against colored background
        } else {
            button.style.backgroundColor = "";
            button.style.color = ""; // Reset to default CSS theme when locked/undiscovered
        }
    });
}
};

export default PeriodicTableUI;