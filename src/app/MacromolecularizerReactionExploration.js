// Interactive, replayable carbohydrate and protein dehydration explorations.

const CATEGORY_IDS = Object.freeze({
    carbs: "dehydration-1",
    motifs: "dehydration-2",
    lipids: "dehydration-3",
    nucleotides: "dehydration-4"
});

const INSTRUCTIONS = Object.freeze({
    carbs: [
        "Drag the first glucose to the left dotted template.",
        "Drag the second glucose to the right dotted template.",
        "Drag the OH from carbon 1 of the left glucose to the collection tray.",
        "Drag the H from carbon 4 of the right glucose to the collection tray.",
        "Drag the remaining O on the right glucose to the dangling C on the left.",
        "Glycosidic bond discovered! The two glucose molecules formed a 1→4 linkage."
    ],
    motifs: [
        "Drag the first amino acid to the left dotted template.",
        "Drag the second amino acid to the right dotted template.",
        "Drag OH from the left carboxyl group to the collection tray.",
        "Drag the upper H from the right amino group to the collection tray.",
        "Drag the right amino nitrogen to the left carboxyl carbon to form a peptide bond.",
        "Peptide bond discovered! The amino acids joined and released H₂O."
    ],
    nucleotides: [
        "Drag ADP to the left dotted template.",
        "Drag phosphate to the right dotted template.",
        "Drag energy into the work area above ADP and phosphate.",
        "Drag OH from the incoming phosphate to the collection tray.",
        "Drag H from the terminal ADP hydroxyl to the collection tray.",
        "Drag the incoming phosphate to the terminal oxygen on ADP.",
        "ADP reacts with phosphate to produce ATP and water."
    ],
    "nucleotide-hydrolysis": [
        "Drag ATP to the reaction pane.",
        "Drag H–OH to the terminal phosphate bond in ATP.",
        "ATP reacts with water to produce ADP, phosphate, and energy."
    ],
    "protein-hydrolysis": [
        "Drag water onto the highlighted C—N peptide bond.",
        "Hydrolysis discovered: water breaks a peptide bond."
    ]
});

const DEHYDRATION_ACTIONS = Object.freeze([
    "left", "right", "oh", "h", "bond"
]);
const NUCLEOTIDE_DEHYDRATION_ACTIONS = Object.freeze([
    "left", "right", "energy", "oh", "h", "bond"
]);

const HYDROLYSIS_ACTIONS = Object.freeze([
    "left", "water"
]);
const PROTEIN_HYDROLYSIS_ACTIONS = Object.freeze([
    "water"
]);

const TARGETS_BY_CATEGORY = Object.freeze({
    carbs: Object.freeze([
        "left",
        "right",
        "waste",
        "waste",
        "carbon"
    ]),
    motifs: Object.freeze([
        "left",
        "right",
        "waste",
        "waste",
        "carbon"
    ]),
    nucleotides: Object.freeze([
        "left",
        "right",
        "energy-slot",
        "waste",
        "waste",
        "terminal"
    ]),
    "nucleotide-hydrolysis": Object.freeze([
        "left",
        "terminal-bond"
    ]),
    "protein-hydrolysis": Object.freeze([
        "peptide-bond"
    ])
});

function glucoseMarkup(side, docked) {
    const label = side === "left" ? "First" : "Second";
    const inner = `
        <span class="macro-exp-hex" aria-hidden="true"></span>
        <span class="macro-exp-glucose-name">Glucose ${side === "left" ? "1" : "2"}</span>`;
    return docked
        ? `<div class="macro-exp-glucose macro-exp-glucose--docked" aria-label="${label} glucose placed">${inner}</div>`
        : `<button type="button" class="macro-exp-glucose" data-explore-drag="${side}" aria-label="Drag ${label.toLowerCase()} glucose onto its dotted template">${inner}</button>`;
}

function templateMarkup(side) {
    return `<button type="button" class="macro-exp-template" data-explore-drop="${side}" aria-label="Dotted template for ${side === "left" ? "first" : "second"} glucose">
        <svg viewBox="0 0 150 136" focusable="false" aria-hidden="true">
            <polygon points="38,5 112,5 145,68 112,131 38,131 5,68" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="7 7" />
        </svg>
    </button>`;
}

function aminoAcidMarkup(side, docked, removedOH = false, removedH = false, bonded = false, hydrolysisStep = null) {
    const isLeft = side === "left";
    const interactiveCarbon = docked && isLeft;
    const interactiveNitrogen = docked && !isLeft;
    const removableOH = interactiveCarbon && !removedOH && hydrolysisStep === null;
    const removableH = interactiveNitrogen && !removedH && hydrolysisStep === null;
    const svg = `<svg class="macro-exp-amino-svg" viewBox="0 0 180 150" aria-hidden="true" focusable="false">
        <g class="macro-aa-bonds">
            <line x1="37" y1="76" x2="64" y2="76" />
            <line x1="90" y1="76" x2="117" y2="76" />
            <line x1="77" y1="63" x2="77" y2="39" />
            <line x1="77" y1="89" x2="77" y2="110" />
            <line ${hydrolysisStep === 1 && interactiveNitrogen ? 'class="macro-exp-protein-added-h"' : ''} x1="17" y1="65" x2="14" y2="48" ${removedH && interactiveNitrogen ? 'hidden' : ''} />
            <line x1="17" y1="87" x2="14" y2="103" />
            <line ${hydrolysisStep === 1 && interactiveCarbon ? 'class="macro-exp-protein-added-oh"' : ''} x1="140" y1="86" x2="153" y2="106" ${removedOH && interactiveCarbon ? 'hidden' : ''} />
            <line class="macro-aa-double" x1="140" y1="68" x2="155" y2="48" />
            <line class="macro-aa-double" x1="144" y1="71" x2="159" y2="51" />
        </g>
        ${interactiveNitrogen ? '' : '<circle class="macro-aa-n" cx="23" cy="76" r="13" /><text x="23" y="81">N</text>'}
        ${interactiveCarbon ? '' : '<circle class="macro-aa-c" cx="130" cy="76" r="13" /><text x="130" y="81">C</text>'}
        <circle class="macro-aa-c" cx="77" cy="76" r="13" /><text x="77" y="81">C</text>
        <circle class="macro-aa-h" cx="77" cy="28" r="10" /><text x="77" y="32">H</text>
        ${removableH || (removedH && interactiveNitrogen) ? '' : `<circle class="macro-aa-h ${hydrolysisStep === 1 && interactiveNitrogen ? 'macro-exp-protein-added-h' : ''}" cx="14" cy="38" r="10" /><text class="${hydrolysisStep === 1 && interactiveNitrogen ? 'macro-exp-protein-added-h' : ''}" x="14" y="42">H</text>`}
        <circle class="macro-aa-h" cx="14" cy="113" r="10" /><text x="14" y="117">H</text>
        <rect class="macro-aa-r" x="62" y="111" width="30" height="28" /><text x="77" y="130">R</text>
        <circle class="macro-aa-o" cx="164" cy="38" r="11" /><text x="164" y="42">O</text>
        ${removableOH || (removedOH && interactiveCarbon) ? '' : `<circle class="macro-aa-o ${hydrolysisStep === 1 && interactiveCarbon ? 'macro-exp-protein-added-oh' : ''}" cx="162" cy="116" r="16" /><text class="${hydrolysisStep === 1 && interactiveCarbon ? 'macro-exp-protein-added-oh' : ''}" x="162" y="120">OH</text>`}
    </svg>`;
    const inner = `${svg}<span class="macro-exp-amino-name">${bonded ? "Residue" : "Amino acid"} ${isLeft ? "1" : "2"}</span>
        ${interactiveCarbon ? bonded
            ? '<span class="macro-exp-amino-atom macro-exp-amino-atom--carbon" aria-label="Carbonyl carbon">C</span>'
            : hydrolysisStep !== null
                ? '<span class="macro-exp-amino-atom macro-exp-amino-atom--carbon" aria-label="Carboxyl carbon bearing OH">C</span>'
                : '<button type="button" class="macro-exp-amino-atom macro-exp-amino-atom--carbon" data-explore-drop="carbon" aria-label="Carboxyl carbon, peptide bond target">C</button>' : ''}
        ${removableOH ? '<button type="button" class="macro-exp-amino-atom macro-exp-amino-atom--oh" data-explore-drag="oh" aria-label="Detach OH from left carboxyl group">OH</button>' : ''}
        ${interactiveNitrogen ? removedH && !bonded && hydrolysisStep === null
            ? '<button type="button" class="macro-exp-amino-atom macro-exp-amino-atom--nitrogen" data-explore-drag="bond" aria-label="Drag amino nitrogen to the carboxyl carbon">N</button>'
            : '<span class="macro-exp-amino-atom macro-exp-amino-atom--nitrogen" aria-label="Amino nitrogen">N</span>' : ''}
        ${removableH && hydrolysisStep === null ? '<button type="button" class="macro-exp-amino-atom macro-exp-amino-atom--h" data-explore-drag="h" aria-label="Detach upper H from right amino nitrogen">H</button>' : ''}`;
    return docked
        ? `<div class="macro-exp-amino macro-exp-amino--docked" aria-label="Amino acid ${isLeft ? "1" : "2"} placed">${inner}</div>`
        : `<button type="button" class="macro-exp-amino" data-explore-drag="${side}" aria-label="Drag amino acid ${isLeft ? "1" : "2"} to the ${side} template">${inner}</button>`;
}

function aminoTemplateMarkup(side) {
    return `<button type="button" class="macro-exp-template macro-exp-template--amino" data-explore-drop="${side}" aria-label="Dotted rectangle for amino acid ${side === "left" ? "1" : "2"}">
        <svg viewBox="0 0 180 150" focusable="false" aria-hidden="true">
            <rect x="8" y="8" width="164" height="134" rx="6" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="7 7" />
        </svg>
    </button>`;
}

function nucleotideTemplateMarkup(side) {
    const label = side === "left" ? "ADP" : "phosphate";
    return `<button type="button" class="macro-exp-template macro-exp-template--nucleotide macro-exp-template--nucleotide-${side}" data-explore-drop="${side}" aria-label="Dotted template for ${label}">
        <span>${label}</span>
    </button>`;
}

function adpMarkup(docked, removedH = false, bonded = false) {
    const terminalPhosphate =
        '<span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--phosphate macro-exp-adp-terminal-phosphate">P</span>';
    const terminalOxygen = docked
        ? bonded
            ? '<span class="macro-exp-terminal-oxygen macro-exp-terminal-oxygen--leaving" aria-hidden="true">O</span>'
            : '<button type="button" class="macro-exp-terminal-oxygen" data-explore-drop="terminal" aria-label="Terminal oxygen on ADP, new bond target">O</button>'
        : '<span class="macro-exp-terminal-oxygen">O</span>';
    const terminalHydrogen = docked
        ? '<button type="button" class="macro-exp-terminal-hydrogen" data-explore-drag="h" aria-label="Detach H from the terminal ADP hydroxyl">H</button>'
        : '<span class="macro-exp-terminal-hydrogen">H</span>';
    const inner = `<span class="macro-exp-nucleotide-chain">
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--adenosine">Adenosine</span>
            <span class="macro-exp-nucleotide-link"></span>
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--phosphate">P</span>
            <span class="macro-exp-nucleotide-link"></span>
            ${terminalPhosphate}
            <span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short"></span>
            ${terminalOxygen}
            ${!removedH
                ? `<span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short"></span>${terminalHydrogen}`
                : ""}
        </span>
        <span class="macro-exp-nucleotide-name">ADP</span>`;

    return docked
        ? `<div class="macro-exp-nucleotide macro-exp-nucleotide--adp macro-exp-nucleotide--docked" aria-label="ADP placed">${inner}</div>`
        : `<button type="button" class="macro-exp-nucleotide macro-exp-nucleotide--adp" data-explore-drag="left" aria-label="Drag ADP to its dotted template">${inner}</button>`;
}

function phosphateMarkup(docked, removedOH = false, readyToBond = false, bonded = false) {
    const phosphorus = docked && readyToBond && !bonded
        ? '<button type="button" class="macro-exp-free-phosphate-p" data-explore-drag="bond" aria-label="Drag incoming phosphate to the terminal oxygen on ADP">P</button>'
        : '<span class="macro-exp-free-phosphate-p">P</span>';
    const hydroxyl = docked
        ? '<button type="button" class="macro-exp-free-phosphate-oh" data-explore-drag="oh" aria-label="Detach OH from the incoming phosphate">OH</button>'
        : '<span class="macro-exp-free-phosphate-oh">OH</span>';
    const inner = `<span class="macro-exp-free-phosphate-chain">
            ${removedOH
                ? '<span class="macro-exp-free-phosphate-space" aria-hidden="true"></span><span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short macro-exp-nucleotide-link--hidden" aria-hidden="true"></span>'
                : `${hydroxyl}<span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short"></span>`}
            ${phosphorus}
            <span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short"></span>
            <span class="macro-exp-free-phosphate-o">O</span>
        </span>
        <span class="macro-exp-nucleotide-name">Phosphate</span>`;

    return docked
        ? `<div class="macro-exp-nucleotide macro-exp-nucleotide--phosphate macro-exp-nucleotide--docked" aria-label="Phosphate placed">${inner}</div>`
        : `<button type="button" class="macro-exp-nucleotide macro-exp-nucleotide--phosphate" data-explore-drag="right" aria-label="Drag phosphate to its dotted template">${inner}</button>`;
}

function atpHydrolysisMarkup(docked) {
    const terminalBond = docked
        ? '<button type="button" class="macro-exp-atp-terminal-bond" data-explore-drop="terminal-bond" aria-label="Terminal phosphate bond in ATP"></button>'
        : '<span class="macro-exp-atp-terminal-bond"></span>';
    const inner = `<span class="macro-exp-atp-chain">
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--adenosine">Adenosine</span>
            <span class="macro-exp-nucleotide-link"></span>
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--phosphate">P</span>
            <span class="macro-exp-nucleotide-link"></span>
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--phosphate">P</span>
            ${terminalBond}
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--phosphate">P</span>
        </span>
        <span class="macro-exp-nucleotide-name">ATP</span>`;

    return docked
        ? `<div class="macro-exp-nucleotide macro-exp-nucleotide--atp macro-exp-nucleotide--docked" aria-label="ATP placed">${inner}</div>`
        : `<button type="button" class="macro-exp-nucleotide macro-exp-nucleotide--atp" data-explore-drag="left" aria-label="Drag ATP to the reaction pane">${inner}</button>`;
}

function hydrolysisWaterMarkup() {
    return `<button type="button" class="macro-exp-hydrolysis-water" data-explore-drag="water" aria-label="Drag H-OH water to the terminal phosphate bond">
        <span class="macro-exp-hydrolysis-water-h">H</span>
        <span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short"></span>
        <span class="macro-exp-hydrolysis-water-oh">OH</span>
        <span class="macro-exp-nucleotide-name">Water · H–OH</span>
    </button>`;
}

function energyBoltMarkup(className) {
    return `<svg class="${className}" viewBox="0 0 64 92" aria-hidden="true" focusable="false">
        <path d="M36 4 11 48h19l-8 39 32-51H35L43 4Z" fill="currentColor" stroke="#fff0aa" stroke-width="2" />
    </svg>`;
}

function hydrolysisProductsMarkup() {
    return `<div class="macro-exp-hydrolysis-products" aria-label="ADP and phosphate products">
        ${energyBoltMarkup("macro-exp-hydrolysis-energy")}
        <div class="macro-exp-hydrolysis-product macro-exp-hydrolysis-product--adp" aria-label="ADP product ending in P-O-H">
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--adenosine">Adenosine</span>
            <span class="macro-exp-nucleotide-link"></span>
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--phosphate">P</span>
            <span class="macro-exp-nucleotide-link"></span>
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--phosphate macro-exp-hydrolysis-adp-terminal-p">P</span>
            <span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short macro-exp-hydrolysis-adp-added"></span>
            <span class="macro-exp-terminal-oxygen macro-exp-hydrolysis-adp-added macro-exp-hydrolysis-adp-o">O</span>
            <span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short macro-exp-hydrolysis-adp-hydrogen"></span>
            <span class="macro-exp-terminal-hydrogen macro-exp-hydrolysis-adp-hydrogen macro-exp-hydrolysis-adp-h">H</span>
            <span class="macro-exp-hydrolysis-product-name">ADP · P–O–H</span>
        </div>
        <div class="macro-exp-hydrolysis-product macro-exp-hydrolysis-product--phosphate" aria-label="Phosphate product arranged H-O-P">
            <span class="macro-exp-hydrolysis-phosphate-water-fragment">
                <span class="macro-exp-terminal-hydrogen macro-exp-hydrolysis-phosphate-h">H</span>
                <span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short"></span>
                <span class="macro-exp-terminal-oxygen macro-exp-hydrolysis-phosphate-o">O</span>
                <span class="macro-exp-nucleotide-link macro-exp-nucleotide-link--short"></span>
            </span>
            <span class="macro-exp-nucleotide-unit macro-exp-nucleotide-unit--phosphate macro-exp-hydrolysis-phosphate-p">P</span>
            <span class="macro-exp-hydrolysis-product-name">Phosphate · H–O–P</span>
        </div>
    </div>`;
}

const MacromolecularizerReactionExploration = {
    element: null,
    onComplete: null,
    onExit: null,
    category: "carbs",
    reactionId: "dehydration",
    step: 0,
    completed: false,
    synthesisPointAwarded: false,
    selectedToken: null,
    pointerDrag: null,

    initialize(element, { onComplete, onExit }) {
        this.element = element;
        this.onComplete = onComplete;
        this.onExit = onExit;
        element.addEventListener("pointerdown", event => this.startDrag(event));
        element.addEventListener("click", event => {
            if (event.target.closest("[data-explore-exit]")) {
                this.onExit();
                return;
            }
            const drop = event.target.closest("[data-explore-drop]");
            if (drop && this.selectedToken) {
                this.accept(this.selectedToken, drop.dataset.exploreDrop);
                return;
            }
            const source = event.target.closest("[data-explore-drag]");
            if (source) this.selectedToken = source.dataset.exploreDrag;
        });
        element.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            const source = event.target.closest("[data-explore-drag]");
            if (!source) return;
            event.preventDefault();
            this.selectedToken = source.dataset.exploreDrag;
            this.announce("Selected. Activate the indicated dotted template or collection tray.");
        });
        window.addEventListener("resize", () => {
            this.positionReactantBond();
            this.positionGlycosidicBond();
            this.positionPeptideBond();
            this.positionNucleotideBond();
        });
    },

    open(category, reactionId = "dehydration") {
        this.category = Object.hasOwn(CATEGORY_IDS, category) ? category : "motifs";
        this.reactionId =
            reactionId === "hydrolysis" &&
            (this.category === "nucleotides" || this.category === "motifs")
                ? "hydrolysis"
                : "dehydration";
        this.step = 0;
        this.completed = false;
        this.synthesisPointAwarded = false;
        this.selectedToken = null;
        this.render();
    },

    announce(message) {
        const status = this.element.querySelector(".macro-exp-instruction");
        if (status) status.textContent = message;
    },

    instructions() {
        return INSTRUCTIONS[this.activityKey()] ??
            INSTRUCTIONS.carbs;
    },

    activityKey() {
        return this.reactionId === "hydrolysis" &&
            this.category === "nucleotides"
                ? "nucleotide-hydrolysis"
                : this.reactionId === "hydrolysis" && this.category === "motifs"
                    ? "protein-hydrolysis"
                : this.category;
    },

    actions() {
        return this.activityKey() === "protein-hydrolysis"
            ? PROTEIN_HYDROLYSIS_ACTIONS
            : this.activityKey() === "nucleotide-hydrolysis"
                ? HYDROLYSIS_ACTIONS
                : this.activityKey() === "nucleotides"
                    ? NUCLEOTIDE_DEHYDRATION_ACTIONS
                : DEHYDRATION_ACTIONS;
    },

    targets() {
        return TARGETS_BY_CATEGORY[this.activityKey()] ??
            TARGETS_BY_CATEGORY.carbs;
    },

    accept(token, target) {
        if (!Object.hasOwn(INSTRUCTIONS, this.activityKey()) || this.completed) return false;
        const actions = this.actions();
        if (token !== actions[this.step] || target !== this.targets()[this.step]) {
            this.announce(this.instructions()[this.step]);
            return false;
        }
        this.selectedToken = null;
        this.step += 1;
        if (this.step === actions.length) {
            this.completed = true;
            const result = this.onComplete(
                this.category,
                this.reactionId
            );
            this.synthesisPointAwarded = result?.synthesisPointsAwarded === 1;
            this.render();
            const message = result?.saved === false
                ? "The reaction completed, but the discovery could not be saved. Replay to retry."
                : this.instructions()[this.step];
            this.announce(message);
        } else {
            this.render();
        }
        return true;
    },

    startDrag(event) {
        const source = event.target.closest("[data-explore-drag]");
        if (!source || !this.element.contains(source) || event.button !== 0) return;
        event.preventDefault();
        const token = source.dataset.exploreDrag;
        if (token !== this.actions()[this.step]) return;
        const ghost = source.cloneNode(true);
        ghost.removeAttribute("data-explore-drag");
        ghost.classList.add("macro-exp-drag-ghost");
        ghost.setAttribute("aria-hidden", "true");
        this.element.appendChild(ghost);
        this.pointerDrag = { token, ghost, startX: event.clientX, startY: event.clientY };
        this.moveGhost(event);
        const move = e => this.moveGhost(e);
        const finish = e => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", finish);
            window.removeEventListener("pointercancel", cancel);
            const drag = this.pointerDrag;
            if (!drag) return;
            drag.ghost.remove();
            this.pointerDrag = null;
            if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 8) {
                this.selectedToken = token;
                this.announce("Selected. Drag it to the highlighted target, or activate the target.");
                return;
            }
            const target = [...this.element.querySelectorAll("[data-explore-drop]")]
                .find(el => {
                    const r = el.getBoundingClientRect();
                    return e.clientX >= r.left - 16 && e.clientX <= r.right + 16 &&
                        e.clientY >= r.top - 16 && e.clientY <= r.bottom + 16;
                });
            if (!target || !this.accept(token, target.dataset.exploreDrop)) {
                this.announce(this.instructions()[this.step]);
            }
        };
        const cancel = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", finish);
            window.removeEventListener("pointercancel", cancel);
            this.pointerDrag?.ghost.remove();
            this.pointerDrag = null;
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", finish);
        window.addEventListener("pointercancel", cancel);
    },

    moveGhost(event) {
        if (!this.pointerDrag) return;
        const ghost = this.pointerDrag.ghost;
        ghost.style.left = `${event.clientX}px`;
        ghost.style.top = `${event.clientY}px`;
    },

    positionReactantBond() {
        const slot = this.element?.querySelector('[data-side="left"]');
        const line = slot?.querySelector(".macro-exp-link--left-oh");
        const carbon = slot?.querySelector(".macro-exp-atom--carbon");
        const hydroxyl = slot?.querySelector(".macro-exp-atom--oh");
        if (!line || !carbon || !hydroxyl) return;

        const slotRect = slot.getBoundingClientRect();
        const carbonRect = carbon.getBoundingClientRect();
        const hydroxylRect = hydroxyl.getBoundingClientRect();
        const carbonX = carbonRect.left + carbonRect.width / 2;
        const carbonY = carbonRect.top + carbonRect.height / 2;
        const hydroxylX = hydroxylRect.left + hydroxylRect.width / 2;
        const hydroxylY = hydroxylRect.top + hydroxylRect.height / 2;
        const dx = hydroxylX - carbonX;
        const dy = hydroxylY - carbonY;
        const distance = Math.hypot(dx, dy);
        const carbonRadius = carbonRect.width / 2;
        const hydroxylRadius = hydroxylRect.width / 2;
        if (distance <= carbonRadius + hydroxylRadius) return;

        const directionX = dx / distance;
        const directionY = dy / distance;
        line.style.left = `${carbonX + directionX * carbonRadius - slotRect.left}px`;
        line.style.top = `${carbonY + directionY * carbonRadius - slotRect.top}px`;
        line.style.width = `${distance - carbonRadius - hydroxylRadius}px`;
        line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    },

    positionGlycosidicBond() {
        const field = this.element?.querySelector(".macro-exp-field");
        const line = field?.querySelector(".macro-exp-bond");
        const carbon = field?.querySelector(".macro-exp-atom--carbon");
        const oxygen = field?.querySelector(".macro-exp-atom--oxygen");
        if (!line || !carbon || !oxygen) return;
        const fieldRect = field.getBoundingClientRect();
        const carbonRect = carbon.getBoundingClientRect();
        const oxygenRect = oxygen.getBoundingClientRect();
        line.style.left = `${carbonRect.right - fieldRect.left}px`;
        line.style.top = `${carbonRect.top + carbonRect.height / 2 - fieldRect.top}px`;
        line.style.width = `${Math.max(0, oxygenRect.left - carbonRect.right)}px`;
    },

    positionPeptideBond() {
        const field = this.element?.querySelector(".macro-exp-field--amino");
        const line = field?.querySelector(".macro-exp-peptide-bond");
        const carbon = field?.querySelector(".macro-exp-amino-atom--carbon");
        const nitrogen = field?.querySelector(".macro-exp-amino-atom--nitrogen");
        if (!line || !carbon || !nitrogen) return;

        const fieldRect = field.getBoundingClientRect();
        const c = carbon.getBoundingClientRect();
        const n = nitrogen.getBoundingClientRect();
        const cx = c.left + c.width / 2;
        const cy = c.top + c.height / 2;
        const nx = n.left + n.width / 2;
        const ny = n.top + n.height / 2;
        const dx = nx - cx;
        const dy = ny - cy;
        const distance = Math.hypot(dx, dy);
        const cRadius = c.width / 2;
        const nRadius = n.width / 2;
        if (distance <= cRadius + nRadius) return;
        line.style.left = `${cx + dx / distance * cRadius - fieldRect.left}px`;
        line.style.top = `${cy + dy / distance * cRadius - fieldRect.top}px`;
        line.style.width = `${distance - cRadius - nRadius}px`;
        line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    },

    positionNucleotideBond() {
        const field = this.element?.querySelector(
            ".macro-exp-field--nucleotide"
        );
        const line = field?.querySelector(
            ".macro-exp-nucleotide-bond"
        );
        const terminalPhosphate = field?.querySelector(
            ".macro-exp-adp-terminal-phosphate"
        );
        const phosphorus = field?.querySelector(
            ".macro-exp-free-phosphate-p"
        );
        if (!line || !terminalPhosphate || !phosphorus) return;

        const fieldRect = field.getBoundingClientRect();
        const terminal = terminalPhosphate.getBoundingClientRect();
        const p = phosphorus.getBoundingClientRect();
        const terminalX = terminal.left + terminal.width / 2;
        const terminalY = terminal.top + terminal.height / 2;
        const px = p.left + p.width / 2;
        const py = p.top + p.height / 2;
        const dx = px - terminalX;
        const dy = py - terminalY;
        const distance = Math.hypot(dx, dy);
        const terminalRadius = terminal.width / 2;
        const pRadius = p.width / 2;
        if (distance <= terminalRadius + pRadius) return;

        line.style.left = `${terminalX + dx / distance * terminalRadius - fieldRect.left}px`;
        line.style.top = `${terminalY + dy / distance * terminalRadius - fieldRect.top}px`;
        line.style.width = `${distance - terminalRadius - pRadius}px`;
        line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    },

    renderProtein() {
        const leftDocked = this.step >= 1;
        const rightDocked = this.step >= 2;
        const removedOH = this.step >= 3;
        const removedH = this.step >= 4;
        const bonded = this.step >= 5;
        this.element.innerHTML = `
            <div class="macro-exp-heading"><span>Reaction exploration · proteins</span>
                <button type="button" data-explore-exit>Return to synthesis</button></div>
            <div class="macro-exp-progress" aria-label="Reaction progress">${Math.min(this.step, 5)} / 5 steps</div>
            <p class="macro-exp-instruction" role="status" aria-live="polite">${this.instructions()[this.step]}</p>
            <div class="macro-exp-field macro-exp-field--amino" aria-label="Amino acid reaction field">
                ${bonded ? '<span class="macro-exp-peptide-bond" role="img" aria-label="Peptide bond between carboxyl carbon and amino nitrogen"></span>' : ""}
                <div class="macro-exp-slot" data-side="left">
                    ${leftDocked ? aminoAcidMarkup("left", true, removedOH, false, bonded) : aminoTemplateMarkup("left")}
                </div>
                <div class="macro-exp-slot" data-side="right">
                    ${rightDocked ? aminoAcidMarkup("right", true, false, removedH, bonded) : aminoTemplateMarkup("right")}
                </div>
            </div>
            <div class="macro-exp-toolbar macro-exp-toolbar--amino">
                <div class="macro-exp-supply" aria-label="Amino acid supply">${!leftDocked ? aminoAcidMarkup("left", false) : ""}${!rightDocked ? aminoAcidMarkup("right", false) : ""}</div>
                <button type="button" class="macro-exp-collection" data-explore-drop="waste" aria-label="Collection tray for OH and H">
                    ${removedH ? '<span class="macro-exp-water">H₂O ↑</span>' : removedOH ? "OH + H → H₂O" : "OH + H collection tray"}
                </button>
            </div>
            ${bonded ? '<div class="macro-exp-reveal" role="status">PEPTIDE BOND DISCOVERED!<small>Carboxyl C—N linkage · dehydration releases H₂O</small></div>' : ""}`;
        if (bonded) this.positionPeptideBond();
    },

    renderProteinHydrolysis() {
        const reacted = this.step >= 1;
        this.element.innerHTML = `
            <div class="macro-exp-heading"><span>Reaction exploration · protein hydrolysis</span>
                <button type="button" data-explore-exit>Return to synthesis</button></div>
            <div class="macro-exp-progress" aria-label="Reaction progress">${this.step} / 1 step</div>
            <p class="macro-exp-instruction" role="status" aria-live="polite">${this.instructions()[this.step]}</p>
            <div class="macro-exp-field macro-exp-field--amino macro-exp-field--protein-hydrolysis ${reacted ? "macro-exp-field--protein-reacted" : ""}" aria-label="${reacted ? "Two amino acids after peptide bond cleavage" : "Two residues joined by a peptide bond"}">
                ${reacted
                    ? '<span class="macro-exp-peptide-bond macro-exp-peptide-bond--breaking" aria-hidden="true"></span>'
                    : '<button type="button" class="macro-exp-peptide-bond macro-exp-peptide-bond--target" data-explore-drop="peptide-bond" aria-label="Peptide bond between the left carbonyl carbon and right amino nitrogen; drop water here"></button>'}
                ${reacted ? '<div class="macro-exp-protein-water-animation" aria-hidden="true"><span class="macro-exp-protein-water-oh">OH</span><span class="macro-exp-protein-water-link">—</span><span class="macro-exp-protein-water-h">H</span></div>' : ""}
                <div class="macro-exp-slot" data-side="left">
                    ${aminoAcidMarkup("left", true, !reacted, false, !reacted, this.step)}
                </div>
                <div class="macro-exp-slot" data-side="right">
                    ${aminoAcidMarkup("right", true, false, !reacted, !reacted, this.step)}
                </div>
            </div>
            <div class="macro-exp-toolbar macro-exp-toolbar--amino macro-exp-hydrolysis-toolbar">
                <div class="macro-exp-supply" aria-label="Water supply">
                    ${!reacted ? '<button type="button" class="macro-exp-protein-water" data-explore-drag="water" aria-label="Drag water, OH on the left and H on the right, onto the peptide bond"><span class="macro-exp-protein-water-oh">OH</span><span class="macro-exp-protein-water-link">—</span><span class="macro-exp-protein-water-h">H</span><span class="macro-exp-amino-name">Water · H₂O</span></button>' : ""}
                </div>
            </div>
            ${reacted ? `<div class="macro-exp-reveal" role="status">Hydrolysis discovered: water breaks a peptide bond.<small>Peptide + H₂O → two amino acids · OH to carbon, H to nitrogen${this.synthesisPointAwarded ? " · +1 Synthesis Point" : ""}</small></div>` : ""}`;
        this.positionPeptideBond();
    },

    renderNucleotide() {
        const adpDocked = this.step >= 1;
        const phosphateDocked = this.step >= 2;
        const energyPlaced = this.step >= 3;
        const removedOH = this.step >= 4;
        const removedH = this.step >= 5;
        const bonded = this.step >= 6;
        this.element.innerHTML = `
            <div class="macro-exp-heading"><span>Reaction exploration · energy nucleotide</span>
                <button type="button" data-explore-exit>Return to synthesis</button></div>
            <div class="macro-exp-progress" aria-label="Reaction progress">${Math.min(this.step, 6)} / 6 steps</div>
            <p class="macro-exp-instruction" role="status" aria-live="polite">${this.instructions()[this.step]}</p>
            <div class="macro-exp-field macro-exp-field--nucleotide" aria-label="ADP phosphorylation reaction field">
                ${bonded ? '<span class="macro-exp-nucleotide-bond" role="img" aria-label="New bond between the terminal ADP phosphate and incoming phosphate"></span>' : ""}
                ${this.step === 2 ? `<button type="button" class="macro-exp-nucleotide-energy-target" data-explore-drop="energy-slot" aria-label="Energy input for joining ADP and phosphate">${energyBoltMarkup("macro-exp-nucleotide-energy-icon")}</button>` : ""}
                ${energyPlaced ? `<span class="macro-exp-nucleotide-energy-placed ${bonded ? "macro-exp-nucleotide-energy--absorbed" : ""}" aria-hidden="true">${energyBoltMarkup("macro-exp-nucleotide-energy-icon")}</span>` : ""}
                <div class="macro-exp-slot" data-side="left">
                    ${adpDocked ? adpMarkup(true, removedH, bonded) : nucleotideTemplateMarkup("left")}
                </div>
                <div class="macro-exp-slot" data-side="right">
                    ${phosphateDocked ? phosphateMarkup(true, removedOH, removedH, bonded) : nucleotideTemplateMarkup("right")}
                </div>
            </div>
            <div class="macro-exp-toolbar macro-exp-toolbar--nucleotide">
                <div class="macro-exp-supply" aria-label="Nucleotide component and energy supply">${!adpDocked ? adpMarkup(false) : ""}${!phosphateDocked ? phosphateMarkup(false) : ""}${this.step === 2 ? `<button type="button" class="macro-exp-nucleotide-energy-supply" data-explore-drag="energy" aria-label="Drag energy into the reaction work area">${energyBoltMarkup("macro-exp-nucleotide-energy-icon")}<span>Energy</span></button>` : ""}</div>
                <button type="button" class="macro-exp-collection" data-explore-drop="waste" aria-label="Collection tray for OH and H">
                    ${removedH ? '<span class="macro-exp-water">H₂O ↑</span>' : removedOH ? "OH + H → H₂O" : "OH + H collection tray"}
                </button>
            </div>
            ${bonded ? '<div class="macro-exp-reveal" role="status">ADP REACTS WITH PHOSPHATE TO PRODUCE ATP AND WATER.<small>ADP + phosphate → ATP + H₂O</small></div>' : ""}`;
        if (bonded) this.positionNucleotideBond();
    },

    renderNucleotideHydrolysis() {
        const atpDocked = this.step >= 1;
        const reacted = this.step >= 2;

        this.element.innerHTML = `
            <div class="macro-exp-heading"><span>Reaction exploration · ATP hydrolysis</span>
                <button type="button" data-explore-exit>Return to synthesis</button></div>
            <div class="macro-exp-progress" aria-label="Reaction progress">${Math.min(this.step, 2)} / 2 steps</div>
            <p class="macro-exp-instruction" role="status" aria-live="polite">${this.instructions()[this.step]}</p>
            <div class="macro-exp-field macro-exp-field--hydrolysis" aria-label="ATP hydrolysis reaction field">
                ${reacted
                    ? hydrolysisProductsMarkup()
                    : `<div class="macro-exp-slot macro-exp-slot--hydrolysis">
                        ${atpDocked
                            ? atpHydrolysisMarkup(true)
                            : '<button type="button" class="macro-exp-template macro-exp-template--nucleotide macro-exp-template--nucleotide-left" data-explore-drop="left" aria-label="Dotted template for ATP"><span>ATP</span></button>'}
                    </div>`}
            </div>
            <div class="macro-exp-toolbar macro-exp-toolbar--nucleotide macro-exp-toolbar--hydrolysis">
                <div class="macro-exp-supply" aria-label="ATP hydrolysis supply">
                    ${!atpDocked
                        ? atpHydrolysisMarkup(false)
                        : !reacted
                            ? hydrolysisWaterMarkup()
                            : ""}
                </div>
            </div>
            ${reacted ? '<div class="macro-exp-reveal" role="status">ATP REACTS WITH WATER TO PRODUCE ADP, PHOSPHATE, AND ENERGY.<small>ATP + H₂O → ADP + phosphate + ⚡</small></div>' : ""}`;
    },

    render() {
        if (!this.element) return;
        if (this.activityKey() === "protein-hydrolysis") {
            this.renderProteinHydrolysis();
            return;
        }
        if (
            this.category === "nucleotides" &&
            this.reactionId === "hydrolysis"
        ) {
            this.renderNucleotideHydrolysis();
            return;
        }
        if (this.category === "motifs") {
            this.renderProtein();
            return;
        }
        if (this.category === "nucleotides") {
            this.renderNucleotide();
            return;
        }
        if (this.category !== "carbs") {
            this.element.innerHTML = `
                <div class="macro-exp-heading"><span>Reaction exploration · lipid</span>
                    <button type="button" data-explore-exit>Return to synthesis</button></div>
                <p class="macro-exp-instruction" role="status">This reaction exploration is coming later. Select C or P to explore dehydration now.</p>`;
            return;
        }
        const leftDocked = this.step >= 1;
        const rightDocked = this.step >= 2;
        const removedOH = this.step >= 3;
        const removedH = this.step >= 4;
        const bonded = this.step >= 5;
        this.element.innerHTML = `
            <div class="macro-exp-heading"><span>Reaction exploration · carbohydrates</span>
                <button type="button" data-explore-exit>Return to synthesis</button></div>
            <div class="macro-exp-progress" aria-label="Reaction progress">${Math.min(this.step, 5)} / 5 steps</div>
            <p class="macro-exp-instruction" role="status" aria-live="polite">${this.instructions()[this.step]}</p>
            <div class="macro-exp-field" aria-label="Glucose reaction field">
                ${bonded ? '<span class="macro-exp-bond" role="img" aria-label="Glycosidic bond between carbon on glucose 1 and oxygen on glucose 2"></span>' : ""}
                <div class="macro-exp-slot" data-side="left">
                    ${leftDocked ? glucoseMarkup("left", true) : templateMarkup("left")}
                    ${leftDocked ? '<span class="macro-exp-link macro-exp-link--left-ring" aria-hidden="true"></span>' : ""}
                    ${leftDocked && !removedOH ? '<span class="macro-exp-link macro-exp-link--left-oh" aria-hidden="true"></span>' : ""}
                    ${leftDocked ? bonded
                        ? '<span class="macro-exp-atom macro-exp-atom--carbon" aria-label="Carbon on glucose 1">C</span>'
                        : '<button type="button" class="macro-exp-atom macro-exp-atom--carbon" data-explore-drop="carbon" aria-label="Carbon on glucose 1, bond target">C</button>' : ""}
                    ${leftDocked && !removedOH ? '<button type="button" class="macro-exp-atom macro-exp-atom--oh" data-explore-drag="oh" aria-label="Detach OH from glucose 1">OH</button>' : ""}
                </div>
                <div class="macro-exp-slot" data-side="right">
                    ${rightDocked ? glucoseMarkup("right", true) : templateMarkup("right")}
                    ${rightDocked ? '<span class="macro-exp-link macro-exp-link--right-ring" aria-hidden="true"></span>' : ""}
                    ${rightDocked && !removedH ? '<span class="macro-exp-link macro-exp-link--right-h" aria-hidden="true"></span>' : ""}
                    ${rightDocked ? removedH && !bonded
                        ? '<button type="button" class="macro-exp-atom macro-exp-atom--oxygen" data-explore-drag="bond" aria-label="Drag bonded oxygen to carbon on glucose 1">O</button>'
                        : '<span class="macro-exp-atom macro-exp-atom--oxygen" aria-label="Oxygen bonded to glucose 2">O</span>' : ""}
                    ${rightDocked && !removedH ? '<button type="button" class="macro-exp-atom macro-exp-atom--h" data-explore-drag="h" aria-label="Detach H from oxygen on glucose 2">H</button>' : ""}
                </div>
            </div>
            <div class="macro-exp-toolbar">
                <div class="macro-exp-supply" aria-label="Glucose supply">${!leftDocked ? glucoseMarkup("left", false) : ""}${!rightDocked ? glucoseMarkup("right", false) : ""}</div>
                <button type="button" class="macro-exp-collection" data-explore-drop="waste" aria-label="Collection tray for OH and H">
                    ${removedH ? '<span class="macro-exp-water">H₂O ↑</span>' : removedOH ? "OH + H → H₂O" : "OH + H collection tray"}
                </button>
            </div>
            ${bonded ? '<div class="macro-exp-reveal" role="status">GLYCOSIDIC BOND DISCOVERED!<small>1→4 linkage · dehydration produces H₂O</small></div>' : ""}`;
        if (leftDocked && !removedOH) this.positionReactantBond();
        if (bonded) this.positionGlycosidicBond();
    }
};

export default MacromolecularizerReactionExploration;
