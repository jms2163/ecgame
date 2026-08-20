// --------------------------------------------------
// AtomizerUI.js
// Component-based View Controller for Atomizer Zone UI
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import AtomizerManager from "./AtomizerManager.js";

const ELEMENTS = ['H', 'C', 'N', 'O', 'P', 'S'];

const AtomizerUI = {
    isSpendMode: false,
    isInitialized: false,

    initialize() {
        this.buildUI();

        if (!this.isInitialized) {
            this.subscribe();
            this.isInitialized = true;
        }
    },

    createHeaderPanel() {
        return `
            <div class="header-left">
                <span class="atomizer-subtitle">Atomizer - Automatic Synthesis of Atomics</span>
                <h1 class="atomizer-title">Atomic Synthesis</h1>
            </div>
        `;
    },

    createSkillboxComponent() {
        return `
            <div class="atomizer-skill-box">
                <h3 class="skill-title">Skill Points</h3>
                <div class="skill-subtitle">(1 sp per 5 elements)</div>
                <div class="skill-count">Available: <span id="sp-count-val" class="stat-value">0</span></div>
                <div class="skill-btn-group">
                    <button id="btn-sp-spend" class="sp-btn">Spend</button>
                    <button id="btn-sp-reset" class="sp-btn">Reset</button>
                </div>
            </div>
        `;
    },

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
            ${this.createSkillboxComponent()}
        `;
    },

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

    createGridComponent() {
        return ELEMENTS.map(sym => this.createAtomCardComponent(sym)).join('');
    },

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

        this.attachEventListeners();
    },

    attachEventListeners() {
        const spendBtn = document.getElementById("btn-sp-spend");
        const resetBtn = document.getElementById("btn-sp-reset");
        const gridEl = document.getElementById("atomizer-grid");

        if (spendBtn && !spendBtn.dataset.bound) {
            spendBtn.dataset.bound = "true";
            spendBtn.addEventListener("click", () => {
                const spData = AtomizerManager.getSkillPointData();
                if (spData.available <= 0) {
                    alert("No Skill Points available! Discover 5 elements to earn 1 SP.");
                    return;
                }
                this.isSpendMode = !this.isSpendMode;
                spendBtn.classList.toggle("active", this.isSpendMode);
                gridEl?.classList.toggle("spend-mode-active", this.isSpendMode);
            });
        }

        if (resetBtn && !resetBtn.dataset.bound) {
            resetBtn.dataset.bound = "true";
            resetBtn.addEventListener("click", () => {
                if (confirm("Reset all allocated Skill Points? This will cost 10 ATP.")) {
                    const result = AtomizerManager.resetSkillPoints();
                    if (!result.success) {
                        alert(result.reason);
                    }
                }
            });
        }

        if (gridEl && !gridEl.dataset.bound) {
            gridEl.dataset.bound = "true";
            gridEl.addEventListener("click", (e) => {
                if (!this.isSpendMode) return;
                const card = e.target.closest(".atomizer-unit");
                if (card && !card.classList.contains("locked")) {
                    const symbol = card.id.replace("unit-", "").toUpperCase();
                    if (AtomizerManager.spendSkillPoint(symbol)) {
                        this.isSpendMode = false;
                        spendBtn?.classList.remove("active");
                        gridEl.classList.remove("spend-mode-active");
                    }
                }
            });
        }
    },

    subscribe() {
        GameStateObserver.on("atom-inventory-changed", (state) => this.renderAll(state));
        GameStateObserver.on("atom-synthesized", ({ symbol }) => this.triggerFlash(symbol));
    },

    renderAll(state) {
        if (!state) return;
        const atoms = state.atoms || state;

        const spValEl = document.getElementById("sp-count-val");
        if (spValEl) {
            const spData = AtomizerManager.getSkillPointData();
            spValEl.textContent = spData.available;
        }

        ELEMENTS.forEach((symbol) => {
            const data = atoms[symbol];
            if (!data) return;

            const lower = symbol.toLowerCase();

            const sideEl = document.getElementById(`res-${lower}`);
            if (sideEl) {
                sideEl.textContent = `${Math.floor(data.count)} / ${data.cap}`;
            }

            const cardEl = document.getElementById(`unit-${lower}`);
            if (!cardEl) return;

            if (data.unlocked) {
                cardEl.classList.remove("locked");

                const spBoost = (state.spAllocated?.[symbol] || 0) * 0.10;
                const speedMult = 1 + (data.boost || 0) + spBoost;
                const effectiveInterval = Math.round(data.baseRate / speedMult);

                const rateEl = document.getElementById(`rate-${lower}`);
                if (rateEl) {
                    rateEl.textContent = `1 ${symbol} / ${effectiveInterval}s`;
                }

                const boostEl = document.getElementById(`boost-${lower}`);
                if (boostEl) {
                    const boostPercent = Math.round(((data.boost || 0) + spBoost) * 100);
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