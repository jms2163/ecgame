// --------------------------------------------------
// AtomizerUI.js
// Component-based View Controller for Atomizer Zone UI
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";

const ELEMENTS = ['H', 'C', 'N', 'O', 'P', 'S'];

const AtomizerUI = {
    isInitialized: false,

    /**
     * Injects base components and sets up reactive event listeners.
     */
    initialize() {
        this.buildUI();

        if (!this.isInitialized) {
            this.subscribe();
            this.isInitialized = true;
        }
    },

    // ==================================================
    // COMPONENT BUILDERS
    // ==================================================

    /**
     * Builds the Header Panel Component HTML
     */
    createHeaderPanel() {
        return `
            <div class="header-left">
                <span class="atomizer-subtitle">Atomizer - Automatic Synthesis of Atomics</span>
                <h1 class="atomizer-title">Atomic Synthesis</h1>
            </div>
        `;
    },

    /**
     * Builds the Resource Sidebar Component HTML
     */
    createSidebarComponent() {
        const rowsHTML = ELEMENTS.map(sym => `
            <div class="stat-row">
                ${sym}: <span id="res-${sym.toLowerCase()}" class="stat-value">0 / 10</span>
            </div>
        `).join('');

        return `
            <div class="atomizer-stats-container">
                <h3>RESOURCES</h3>
                ${rowsHTML}
            </div>
        `;
    },

    /**
     * Builds an individual Atom Card Component HTML
     */
    createAtomCardComponent(symbol) {
        const lower = symbol.toLowerCase();

        return `
            <div class="atomizer-unit locked" id="unit-${lower}">
                <div class="rate-label" id="rate-${lower}">? ${symbol}/s</div>
                <div class="atom-mine-visual">
                    <img src="./public/assets/atomizer/atomizer-core.png" alt="Atomizer ${symbol}">
                    <span class="atomic-overlay">${symbol}</span>
                </div>
                <div class="boost-label" id="boost-${lower}">Boost: +0%</div>
            </div>
        `;
    },

    /**
     * Builds the Atom Cards Grid Component HTML
     */
    /**
 * Builds the Atom Cards Grid Component HTML
 */
createGridComponent() {
    return ELEMENTS.map(sym => this.createAtomCardComponent(sym)).join('');
},

    // ==================================================
    // MASTER ASSEMBLY & RENDER PASS
    // ==================================================

    /**
     * Assembles and injects all UI components into container elements
     */
    buildUI() {
        const headerEl = document.getElementById("atomizer-header");
        const statsEl = document.getElementById("atomizer-stats");
        const gridEl = document.getElementById("atomizer-grid");

        if (headerEl && !headerEl.innerHTML.trim()) {
            headerEl.className = "atomizer-header-panel";
            headerEl.innerHTML = this.createHeaderPanel();
        }

        if (statsEl && !statsEl.innerHTML.trim()) {
            statsEl.className = "atomizer-stats";
            statsEl.innerHTML = this.createSidebarComponent();
        }

        if (gridEl && !gridEl.innerHTML.trim()) {
            gridEl.className = "atomizer-grid";
            gridEl.innerHTML = this.createGridComponent();
        }
    },

    // ==================================================
    // REACTIVE OBSERVER & ANIMATION UPDATES
    // ==================================================

    subscribe() {
        GameStateObserver.on("atom-inventory-changed", (atoms) => this.renderAll(atoms));
        GameStateObserver.on("atom-synthesized", ({ symbol }) => this.triggerFlash(symbol));
    },

    renderAll(atoms) {
        if (!atoms) return;

        ELEMENTS.forEach((symbol) => {
            const data = atoms[symbol];
            if (!data) return;

            const lower = symbol.toLowerCase();

            // Update Sidebar Inventory (White Numbers)
            const sideEl = document.getElementById(`res-${lower}`);
            if (sideEl) {
                sideEl.textContent = `${Math.floor(data.count)} / ${data.cap}`;
            }

            // Update Card State & Rates
            const cardEl = document.getElementById(`unit-${lower}`);
            if (!cardEl) return;

            if (data.unlocked) {
                cardEl.classList.remove("locked");

                const speedMult = 1 + (data.boost || 0);
                const effectiveInterval = Math.round(data.baseRate / speedMult);

                const rateEl = document.getElementById(`rate-${lower}`);
                if (rateEl) {
                    rateEl.textContent = `1 ${symbol} / ${effectiveInterval}s`;
                }

                const boostEl = document.getElementById(`boost-${lower}`);
                if (boostEl) {
                    const boostPercent = Math.round((data.boost || 0) * 100);
                    boostEl.textContent = `Boost: +${boostPercent}%`;
                }
            } else {
                cardEl.classList.add("locked");

                const rateEl = document.getElementById(`rate-${lower}`);
                if (rateEl) rateEl.textContent = `? ${symbol} / s`;
            }
        });
    },

    triggerFlash(symbol) {
        const cardEl = document.getElementById(`unit-${symbol.toLowerCase()}`);
        if (!cardEl) return;

        cardEl.classList.add("flash");
        setTimeout(() => cardEl.classList.remove("flash"), 300);
    }
};

export default AtomizerUI;