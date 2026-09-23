const TOTAL_LIPID_POSITIONS = 12;
const FUNCTIONAL_FLUIDITY_MINIMUM = 40;
const FUNCTIONAL_FLUIDITY_MAXIMUM = 60;

const TAIL_TYPES = Object.freeze({
    saturated: Object.freeze({
        id: "saturated",
        name: "Saturated Lipid",
        shortName: "Straight tails",
        description:
            "Straight fatty-acid tails can pack closely together."
    }),
    unsaturated: Object.freeze({
        id: "unsaturated",
        name: "Unsaturated Lipid",
        shortName: "Kinked tails",
        description:
            "Double-bond kinks prevent neighboring tails from packing tightly."
    })
});

function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(
        minimum,
        Math.min(maximum, value)
    );
}

function calculateFluidity(slots = []) {
    const saturatedCount = slots.filter(
        type => type === "saturated"
    ).length;
    const unsaturatedCount = slots.filter(
        type => type === "unsaturated"
    ).length;

    // Empty positions are neutral while the patch is being constructed.
    // When all twelve positions are filled, a balanced mixture rests at the
    // center of the qualitative meter.
    return Math.round(clamp(
        50 +
            ((unsaturatedCount - saturatedCount) /
                TOTAL_LIPID_POSITIONS) *
                50
    ));
}

function getFluidityBand(value) {
    if (value < FUNCTIONAL_FLUIDITY_MINIMUM) {
        return "stiff";
    }
    if (value > FUNCTIONAL_FLUIDITY_MAXIMUM) {
        return "loose";
    }
    return "functional";
}

const SmoothERLipidCompositionView = {
    events: null,
    root: null,
    state: null,

    clear() {
        this.events?.abort();
        this.events = null;
        this.root = null;
        this.state = null;
    },

    initialState() {
        return {
            slots: Array(
                TOTAL_LIPID_POSITIONS
            ).fill(null),
            selectedType: null,
            actions: [],
            completed: false
        };
    },

    mount(
        container,
        { review = false } = {}
    ) {
        this.clear();
        this.root = document.createElement(
            "section"
        );
        this.root.className =
            "ser-fluidity-lab";
        container.replaceChildren(this.root);

        if (review) {
            this.renderPrototypeNotice(
                "This visual prototype does not create or save a graded submission."
            );
            return;
        }

        this.state = this.initialState();
        this.render();
    },

    render() {
        this.events?.abort();
        this.events = new AbortController();

        if (this.state.completed) {
            this.renderCompletion();
            return;
        }

        this.renderBuilder();
    },

    renderBuilder() {
        const filledCount =
            this.state.slots.filter(Boolean)
                .length;
        const fluidity = calculateFluidity(
            this.state.slots
        );
        const band = getFluidityBand(
            fluidity
        );
        const isComplete =
            filledCount ===
            TOTAL_LIPID_POSITIONS;
        const isFunctional =
            isComplete &&
            band === "functional";

        this.root.innerHTML = `
            <header class="ser-fluidity-heading">
                <div>
                    <p class="ser-fluidity-eyebrow">Smooth ER · Controlled Investigation</p>
                    <h3>Stage 1: Tail Packing and Fluidity</h3>
                </div>
                <strong>One variable: tail saturation</strong>
            </header>
            <section class="ser-fluidity-mission">
                <div class="ser-fluidity-mission-icon" aria-hidden="true">❄</div>
                <div>
                    <strong>Cold Pond Mission</strong>
                    <p>Construct a complete membrane patch that remains fluid without becoming excessively loose. Temperature and every other membrane component are held constant.</p>
                </div>
            </section>
            <div class="ser-fluidity-workspace">
                <section class="ser-tail-rack" aria-label="Available lipid tail types">
                    <p class="ser-fluidity-step">1 · Add lipids from left to right</p>
                    <h4>Choose one tail type</h4>
                    <p>Each tap adds that lipid to the next open position. After the membrane is full, select a card and tap any position to replace it.</p>
                    <div class="ser-tail-card-list"></div>
                    <p class="ser-fluidity-selection" role="status"></p>
                    <div class="ser-fluidity-edit-actions">
                        <button type="button" data-action="undo" ${this.state.actions.length === 0 ? "disabled" : ""}>Undo Last</button>
                        <button type="button" data-action="reset">Reset Patch</button>
                    </div>
                </section>
                <section class="ser-fluidity-canvas" aria-label="Animated membrane patch">
                    <div class="ser-fluidity-canvas-heading">
                        <div>
                            <p class="ser-fluidity-step">2 · Watch the membrane respond</p>
                            <h4>Living Membrane</h4>
                        </div>
                        <span>${filledCount} / ${TOTAL_LIPID_POSITIONS} positions</span>
                    </div>
                    <div class="ser-fluidity-scene" data-fluidity-band="${band}" style="--ser-fluidity-value: ${fluidity}; --ser-wave-size: ${Math.max(1, Math.round(fluidity / 13))}px; --ser-wave-negative: -${Math.max(1, Math.round(fluidity / 13))}px; --ser-wave-duration: ${Math.max(1.15, 4.4 - fluidity / 28)}s;">
                        <span class="ser-fluidity-side-label ser-fluidity-side-label--top">Cytosol</span>
                        <div class="ser-fluidity-bilayer"></div>
                        <span class="ser-fluidity-side-label ser-fluidity-side-label--bottom">SER lumen</span>
                    </div>
                </section>
            </div>
            <section class="ser-fluidity-meter-panel" aria-label="Live fluidity meter">
                <div class="ser-fluidity-meter-heading">
                    <div>
                        <p class="ser-fluidity-step">3 · One live measurement</p>
                        <h4>Fluidity</h4>
                    </div>
                    <strong class="ser-fluidity-reading ser-fluidity-reading--${band}">${this.bandLabel(band, filledCount)}</strong>
                </div>
                <div class="ser-fluidity-meter" role="meter" aria-label="Membrane fluidity" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${fluidity}">
                    <div class="ser-fluidity-zone ser-fluidity-zone--stiff"><span>Too stiff</span></div>
                    <div class="ser-fluidity-zone ser-fluidity-zone--functional"><span>Functional</span></div>
                    <div class="ser-fluidity-zone ser-fluidity-zone--loose"><span>Too fluid</span></div>
                    <i class="ser-fluidity-marker" style="left: ${fluidity}%" aria-hidden="true"></i>
                </div>
                <p class="ser-fluidity-feedback" role="status" aria-live="polite">${this.feedbackText({ filledCount, band })}</p>
                ${isFunctional ? `<button type="button" class="ser-fluidity-continue" data-action="continue">Continue</button>` : ""}
            </section>`;

        this.renderTailCards();
        this.renderMembraneSlots();
        this.bindBuilder();
    },

    renderTailCards() {
        const list = this.root.querySelector(
            ".ser-tail-card-list"
        );
        list.innerHTML = Object.values(
            TAIL_TYPES
        ).map(type => `
            <button type="button" class="ser-tail-card ser-tail-card--${type.id}${this.state.selectedType === type.id ? " is-selected" : ""}" data-tail-type="${type.id}" aria-pressed="${this.state.selectedType === type.id}">
                <span class="ser-tail-card-icon" aria-hidden="true"><i></i><i></i></span>
                <span><strong>${type.name}</strong><b>${type.shortName}</b><small>${type.description}</small></span>
            </button>`).join("");

        const selection = this.root.querySelector(
            ".ser-fluidity-selection"
        );
        selection.textContent =
            this.state.selectedType
                ? `${TAIL_TYPES[this.state.selectedType].name} selected.`
                : "Tap a card to add the first lipid.";
    },

    renderMembraneSlots() {
        const bilayer = this.root.querySelector(
            ".ser-fluidity-bilayer"
        );
        this.state.slots.forEach(
            (tailType, index) => {
                const button =
                    document.createElement("button");
                button.type = "button";
                button.className =
                    `ser-fluidity-position${tailType ? ` is-filled is-${tailType}` : " is-empty"}`;
                button.dataset.position =
                    String(index);
                button.style.setProperty(
                    "--ser-position-index",
                    String(index)
                );
                button.setAttribute(
                    "aria-label",
                    tailType
                        ? `Position ${index + 1}: ${TAIL_TYPES[tailType].name}`
                        : `Position ${index + 1}: empty`
                );
                button.innerHTML = tailType
                    ? `<span class="ser-fluidity-leaflet ser-fluidity-leaflet--top" aria-hidden="true"><i class="ser-fluidity-head"></i><i class="ser-fluidity-tail ser-fluidity-tail--a"></i><i class="ser-fluidity-tail ser-fluidity-tail--b"></i></span><span class="ser-fluidity-leaflet ser-fluidity-leaflet--bottom" aria-hidden="true"><i class="ser-fluidity-head"></i><i class="ser-fluidity-tail ser-fluidity-tail--a"></i><i class="ser-fluidity-tail ser-fluidity-tail--b"></i></span>`
                    : `<span class="ser-fluidity-empty-number" aria-hidden="true">${index + 1}</span>`;
                bilayer.appendChild(button);
            }
        );
    },

    bindBuilder() {
        const signal = this.events.signal;

        this.root.querySelectorAll(
            "[data-tail-type]"
        ).forEach(card => {
            card.addEventListener(
                "click",
                () => this.chooseAndAdd(
                    card.dataset.tailType
                ),
                { signal }
            );
        });

        this.root.querySelectorAll(
            "[data-position]"
        ).forEach(position => {
            position.addEventListener(
                "click",
                () => this.replacePosition(
                    Number(
                        position.dataset.position
                    )
                ),
                { signal }
            );
        });

        this.root.querySelector(
            '[data-action="undo"]'
        )?.addEventListener(
            "click",
            () => this.undo(),
            { signal }
        );
        this.root.querySelector(
            '[data-action="reset"]'
        )?.addEventListener(
            "click",
            () => {
                this.state = this.initialState();
                this.render();
            },
            { signal }
        );
        this.root.querySelector(
            '[data-action="continue"]'
        )?.addEventListener(
            "click",
            () => {
                this.state.completed = true;
                this.render();
            },
            { signal }
        );
    },

    chooseAndAdd(tailType) {
        if (!TAIL_TYPES[tailType]) return;
        this.state.selectedType = tailType;
        const nextEmpty =
            this.state.slots.indexOf(null);

        if (nextEmpty >= 0) {
            this.state.actions.push({
                index: nextEmpty,
                previous: null
            });
            this.state.slots[nextEmpty] =
                tailType;
        }
        this.render();
    },

    replacePosition(index) {
        if (
            !this.state.selectedType ||
            !this.state.slots[index] ||
            this.state.slots[index] ===
                this.state.selectedType
        ) {
            return;
        }

        this.state.actions.push({
            index,
            previous: this.state.slots[index]
        });
        this.state.slots[index] =
            this.state.selectedType;
        this.render();
    },

    undo() {
        const action =
            this.state.actions.pop();
        if (!action) return;
        this.state.slots[action.index] =
            action.previous;
        this.render();
    },

    bandLabel(band, filledCount) {
        if (filledCount === 0) {
            return "Build to observe";
        }
        return {
            stiff: "Too stiff",
            functional: "Functional range",
            loose: "Too fluid"
        }[band];
    },

    feedbackText({ filledCount, band }) {
        if (filledCount === 0) {
            return "Add straight- or kinked-tail lipids. The membrane and meter will respond immediately.";
        }
        if (
            filledCount <
            TOTAL_LIPID_POSITIONS
        ) {
            return `Continue building from left to right. ${TOTAL_LIPID_POSITIONS - filledCount} positions remain.`;
        }
        if (band === "stiff") {
            return "This completed membrane is packed too tightly. Select Unsaturated Lipid, then tap one or more straight-tail positions.";
        }
        if (band === "loose") {
            return "This completed membrane is excessively fluid. Select Saturated Lipid, then tap one or more kinked-tail positions.";
        }
        return "Functional fluidity reached. Kinked tails prevent overly tight packing while straight tails keep the membrane from becoming excessively loose.";
    },

    renderCompletion() {
        this.root.innerHTML = `
            <section class="ser-fluidity-completion">
                <span aria-hidden="true">✓</span>
                <p class="ser-fluidity-eyebrow">Stage 1 prototype complete</p>
                <h3>One variable produced one visible result</h3>
                <p>You changed only fatty-acid tail saturation and observed its effect on membrane fluidity. No XP, achievement, recipe, or saved submission was awarded by this prototype.</p>
                <button type="button" data-action="replay">Rebuild the Membrane</button>
                <p class="ser-fluidity-next">Planned next investigation: cholesterol buffering, with tail composition held constant.</p>
            </section>`;
        this.root.querySelector(
            '[data-action="replay"]'
        ).addEventListener(
            "click",
            () => {
                this.state = this.initialState();
                this.render();
            },
            { signal: this.events.signal }
        );
    },

    renderPrototypeNotice(message) {
        this.root.innerHTML = `
            <section class="ser-fluidity-completion">
                <p class="ser-fluidity-eyebrow">Visual prototype</p>
                <h3>No saved submission yet</h3>
                <p>${message}</p>
            </section>`;
    }
};

export {
    FUNCTIONAL_FLUIDITY_MAXIMUM,
    FUNCTIONAL_FLUIDITY_MINIMUM,
    TAIL_TYPES,
    TOTAL_LIPID_POSITIONS,
    calculateFluidity,
    getFluidityBand
};

export default SmoothERLipidCompositionView;
