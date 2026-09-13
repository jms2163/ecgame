// Interactive, replayable carbohydrate dehydration exploration.
// Future categories have separate discovery IDs but no activity yet.

const CATEGORY_IDS = Object.freeze({
    carbs: "dehydration-1",
    motifs: "dehydration-2",
    lipids: "dehydration-3",
    nucleotides: "dehydration-4"
});

const INSTRUCTIONS = [
    "Drag the first glucose to the left dotted template.",
    "Drag the second glucose to the right dotted template.",
    "Drag the OH from carbon 1 of the left glucose to the collection tray.",
    "Drag the H from carbon 4 of the right glucose to the collection tray.",
    "Drag the remaining O on the right glucose to the dangling C on the left.",
    "Glycosidic bond discovered! The two glucose molecules formed a 1→4 linkage."
];

const ACTIONS = ["left", "right", "oh", "h", "bond"];
const TARGETS = ["left", "right", "waste", "waste", "carbon"];

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

const MacromolecularizerReactionExploration = {
    element: null,
    onComplete: null,
    onExit: null,
    category: "carbs",
    step: 0,
    completed: false,
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
        });
    },

    open(category) {
        this.category = CATEGORY_IDS[category] ? category : "motifs";
        this.step = 0;
        this.completed = false;
        this.selectedToken = null;
        this.render();
    },

    announce(message) {
        const status = this.element.querySelector(".macro-exp-instruction");
        if (status) status.textContent = message;
    },

    accept(token, target) {
        if (this.category !== "carbs" || this.completed) return false;
        if (token !== ACTIONS[this.step] || target !== TARGETS[this.step]) {
            this.announce(INSTRUCTIONS[this.step]);
            return false;
        }
        this.selectedToken = null;
        this.step += 1;
        if (this.step === ACTIONS.length) {
            this.completed = true;
            const result = this.onComplete("carbs");
            this.render();
            const message = result?.saved === false
                ? "The bond formed, but the discovery could not be saved. Please retry."
                : INSTRUCTIONS[this.step];
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
        if (token !== ACTIONS[this.step]) return;
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
                this.announce(INSTRUCTIONS[this.step]);
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

    render() {
        if (!this.element) return;
        if (this.category !== "carbs") {
            const categoryName = this.category === "nucleotides" ? "nucleic acid" : "protein";
            this.element.innerHTML = `
                <div class="macro-exp-heading"><span>Reaction exploration · ${categoryName}</span>
                    <button type="button" data-explore-exit>Return to synthesis</button></div>
                <p class="macro-exp-instruction" role="status">This reaction exploration is coming later. Select C to explore carbohydrate dehydration now.</p>`;
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
            <p class="macro-exp-instruction" role="status" aria-live="polite">${INSTRUCTIONS[this.step]}</p>
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
