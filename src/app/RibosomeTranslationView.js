import Catalog from "./RibosomeTranslationCatalog.js";
import ResearchManager from "./ResearchManager.js";
import SubmissionManager from "./OrganelleExperimentSubmissionManager.js";
import OrganelleExperimentPanel from "./OrganelleExperimentPanel.js";
import SaveManager from "./SaveManager.js";
import gameState from "./GameState.js";

const QUESTIONS = Object.freeze([
    {
        id: "reaction_type",
        prompt: "In this introductory monomer-linking model, which reaction joins monomers into a polypeptide?",
        answers: [
            ["condensation", "Condensation (dehydration)"],
            ["hydrolysis", "Hydrolysis"],
            ["diffusion", "Diffusion"],
            ["redox", "Oxidation-reduction"]
        ],
        correct: "condensation"
    },
    {
        id: "protein_monomer",
        prompt: "Which monomers does a ribosome join to construct a polypeptide?",
        answers: [
            ["amino_acids", "Amino acids"],
            ["lipids", "Lipids"],
            ["carbohydrates", "Carbohydrates"],
            ["nucleotides", "Nucleotides"]
        ],
        correct: "amino_acids"
    }
]);

const CHAIN_COLORS = Object.freeze([
    "#68d37d",
    "#6caaf0",
    "#f0ca61",
    "#e88abd",
    "#b38ae8",
    "#ee9866",
    "#64d6ce",
    "#dc7b75",
    "#91cc68"
]);

const RibosomeTranslationView = {
    clear() {
        this.events?.abort();
        clearInterval(this.timer);
        this.events = null;
        this.timer = null;
        this.root = null;
        this.nativeDragMaterial = null;
    },

    initialState() {
        return {
            selectedMaterial: null,
            largeSubunitPlaced: false,
            smallSubunitPlaced: false,
            mRNAPlaced: false,
            running: false,
            complete: false,
            translationProgress: 0,
            answers: {},
            saved: false,
            message: "Build the ribosome: drag the large subunit into the center."
        };
    },

    stylesheet() {
        if (document.getElementById("ribosome-translation-styles")) return;
        const style = document.createElement("style");
        style.id = "ribosome-translation-styles";
        style.textContent = `
            .rt-lab{max-width:960px;color:#eaf3fb;line-height:1.45}.rt-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}.rt-badge{color:#ffbd66;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
            .rt-model{display:block;width:100%;height:auto;min-height:390px;background:#101c29;border:1px solid #5b7182;border-radius:10px;touch-action:none}.rt-model [data-drop-target]{cursor:pointer}.rt-model .rt-drop-active{filter:drop-shadow(0 0 10px #ffd36f)}
            .rt-mission{display:grid;grid-template-columns:1fr auto;gap:.35rem 1rem;align-items:center;margin:.8rem 0;padding:.65rem .8rem;background:#211d31;border:1px solid #8e73ba;border-radius:8px}.rt-mission progress{grid-column:1/-1;width:100%;accent-color:#70d7cb}.rt-reward{color:#ffd074;font-weight:750}
            .rt-tray{margin:1rem 0}.rt-material-list{display:flex;flex-wrap:wrap;gap:.7rem}.rt-material-card{display:grid;place-items:center;min-width:10rem;max-width:12rem;font:inherit;padding:.65rem;color:#eef8ff;background:#173147;border:1px solid #64899c;border-radius:8px;text-align:center;cursor:grab}.rt-material-card strong{display:block;margin-top:.35rem}.rt-material-icon{display:grid;place-items:center;width:8rem;height:4.6rem}.rt-material-icon svg{display:block;width:100%;height:100%}.rt-material-card[aria-pressed="true"]{outline:3px solid #ffca68;outline-offset:2px}
            .rt-controls{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0}.rt-controls button,.rt-submit{font:inherit;padding:.55rem .85rem;color:#eef8ff;background:#17364c;border:1px solid #6db7bc;border-radius:7px;cursor:pointer}.rt-controls button:disabled,.rt-submit:disabled{opacity:.5;cursor:not-allowed}.rt-status{min-height:2.7rem;color:#a2ebc8;font-weight:650}.rt-note{padding:.7rem;border-left:4px solid #ffbd66;background:#2a241a}
            .rt-check{margin-top:1.2rem}.rt-check fieldset{border:1px solid #607487;border-radius:8px;margin:.8rem 0;padding:.7rem 1rem}.rt-check label{display:block;margin:.35rem 0}
            @media(max-width:680px){.rt-heading{align-items:flex-start;flex-direction:column}.rt-model{min-height:310px}.rt-material-card{min-width:100%}}
        `;
        document.head.appendChild(style);
    },

    mount(container, { sandbox = false, review = false } = {}) {
        this.clear();
        this.stylesheet();
        this.sandbox = sandbox;
        this.root = document.createElement("section");
        this.root.className = "rt-lab";
        container.replaceChildren(this.root);
        if (review) this.renderReview();
        else {
            this.state = this.initialState();
            this.render();
        }
    },

    render() {
        this.events?.abort();
        this.events = new AbortController();
        const placementCount =
            Number(this.state.largeSubunitPlaced) +
            Number(this.state.smallSubunitPlaced) +
            Number(this.state.mRNAPlaced);
        const missionProgress = this.state.complete ? 4 : placementCount;
        this.root.innerHTML = `
            <div class="rt-heading"><h3>Ribosome Level 1: Instruct the Protein-Building Machine</h3><span class="rt-badge">${this.state.complete ? "Protein constructed" : "Introductory model"}</span></div>
            <p>Build the ribosome. Add mRNA. Press play.</p>
            <div class="rt-mission"><strong>Mission progress</strong><span>${missionProgress} / 4</span><progress max="4" value="${missionProgress}">${missionProgress} of 4</progress><span class="rt-reward">Mission reward: 250 XP</span></div>
            <svg class="rt-model" viewBox="0 0 940 430" role="img" aria-label="Introductory model showing mRNA instructions passing through a ribosome while a protein chain grows"></svg>
            ${!this.state.complete ? `<section class="rt-tray"><h4>Materials</h4><div class="rt-material-list"></div></section>` : ""}
            <div class="rt-controls"><button type="button" data-action="simulate" ${this.state.largeSubunitPlaced && this.state.smallSubunitPlaced && this.state.mRNAPlaced && !this.state.running && !this.state.complete ? "" : "disabled"}>▶ Play</button><button type="button" data-action="reset" ${this.state.running ? "disabled" : ""}>Reset</button></div>
            <p class="rt-note"><strong>Level 1 model boundary:</strong> mRNA carries instructions, the ribosome is the protein-building machine, and the product is a chain of amino acids. tRNA, codons, and the A, P, and E sites are reserved for a later translation level.</p>
            ${this.state.complete ? `<section class="rt-check"><h4>Check your model — 100% required</h4>${QUESTIONS.map(question => `<fieldset><legend>${question.prompt}</legend>${question.answers.map(([id, label]) => `<label><input type="radio" name="${question.id}" value="${id}" ${this.state.answers[question.id] === id ? "checked" : ""}> ${label}</label>`).join("")}</fieldset>`).join("")}<button type="button" class="rt-submit">Check Answers and Save</button></section>` : ""}
            <p class="rt-status" role="status" aria-live="polite">${this.state.message}</p>`;
        this.svg = this.root.querySelector(".rt-model");
        this.status = this.root.querySelector(".rt-status");
        this.draw();
        if (!this.state.complete) this.renderMaterials();
        this.bind();
    },

    renderMaterials() {
        const list = this.root.querySelector(".rt-material-list");
        const materials = [
            {
                id: "large_subunit",
                label: "Ribosome large subunit",
                placed: this.state.largeSubunitPlaced,
                icon: '<svg viewBox="0 0 130 70" aria-hidden="true"><path d="M9 55 C11 12 40 5 67 12 C99 4 121 18 122 52 C107 65 25 67 9 55Z" fill="#75b278" stroke="#d2f2ce" stroke-width="4"/></svg>'
            },
            {
                id: "small_subunit",
                label: "Ribosome small subunit",
                placed: this.state.smallSubunitPlaced,
                icon: '<svg viewBox="0 0 130 70" aria-hidden="true"><ellipse cx="65" cy="39" rx="54" ry="25" fill="#70a9c7" stroke="#d1effa" stroke-width="4"/></svg>'
            },
            {
                id: "mrna",
                label: "mRNA",
                placed: this.state.mRNAPlaced,
                icon: '<svg viewBox="0 0 130 70" aria-hidden="true"><path d="M8 38 C34 17 55 57 78 35 C96 18 112 45 123 30" fill="none" stroke="#e76868" stroke-width="9" stroke-linecap="round"/><circle cx="28" cy="29" r="5" fill="#ffd0cf"/><circle cx="68" cy="40" r="5" fill="#ffd0cf"/><circle cx="106" cy="35" r="5" fill="#ffd0cf"/></svg>'
            }
        ].filter(material => !material.placed);
        for (const material of materials) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "rt-material-card";
            button.draggable = true;
            button.dataset.materialId = material.id;
            button.setAttribute("aria-pressed", String(this.state.selectedMaterial === material.id));
            button.innerHTML = `<span class="rt-material-icon">${material.icon}</span><strong>${material.label}</strong>`;
            list.appendChild(button);
        }
    },

    bind() {
        const signal = this.events.signal;
        const on = (node, type, callback) => node?.addEventListener(type, callback, { signal });
        for (const card of this.root.querySelectorAll(".rt-material-card")) {
            on(card, "click", () => {
                this.state.selectedMaterial = card.dataset.materialId;
                for (const candidate of this.root.querySelectorAll(".rt-material-card")) candidate.setAttribute("aria-pressed", String(candidate === card));
            });
            on(card, "dragstart", event => {
                this.nativeDragMaterial = card.dataset.materialId;
                event.dataTransfer.setData("text/plain", card.dataset.materialId);
                event.dataTransfer.effectAllowed = "copy";
            });
        }
        on(this.svg, "click", event => {
            const target = event.target.closest("[data-drop-target]")?.dataset.dropTarget;
            if (target && this.state.selectedMaterial) this.placeMaterial(this.state.selectedMaterial, target);
        });
        on(this.svg, "keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            const target = event.target.closest("[data-drop-target]")?.dataset.dropTarget;
            if (target && this.state.selectedMaterial) {
                event.preventDefault();
                this.placeMaterial(this.state.selectedMaterial, target);
            }
        });
        on(this.svg, "dragover", event => {
            const target = event.target.closest("[data-drop-target]");
            if (!target) return;
            event.preventDefault();
            target.classList.add("rt-drop-active");
        });
        on(this.svg, "dragleave", event => event.target.closest("[data-drop-target]")?.classList.remove("rt-drop-active"));
        on(this.svg, "drop", event => {
            event.preventDefault();
            const target = event.target.closest("[data-drop-target]");
            if (!target) return;
            target.classList.remove("rt-drop-active");
            this.placeMaterial(event.dataTransfer.getData("text/plain") || this.nativeDragMaterial, target.dataset.dropTarget);
            this.nativeDragMaterial = null;
        });
        on(this.root.querySelector('[data-action="simulate"]'), "click", () => this.simulate());
        on(this.root.querySelector('[data-action="reset"]'), "click", () => {
            clearInterval(this.timer);
            this.state = this.initialState();
            this.render();
        });
        on(this.root.querySelector(".rt-submit"), "click", () => this.submit());
        for (const input of this.root.querySelectorAll(".rt-check input")) {
            on(input, "change", () => { this.state.answers[input.name] = input.value; });
        }
    },

    placeMaterial(materialId, targetId) {
        if (materialId === "large_subunit" && targetId === "ribosome_assembly" && !this.state.largeSubunitPlaced) {
            this.state.largeSubunitPlaced = true;
            this.state.selectedMaterial = null;
            this.state.message = "Large subunit placed. Snap the small subunit underneath it.";
            this.render();
            return true;
        }
        if (materialId === "small_subunit" && targetId === "ribosome_assembly" && this.state.largeSubunitPlaced && !this.state.smallSubunitPlaced) {
            this.state.smallSubunitPlaced = true;
            this.state.selectedMaterial = null;
            this.state.message = "Ribosome assembled. Drag mRNA into the input on the left.";
            this.render();
            return true;
        }
        if (materialId === "mrna" && targetId === "mrna" && this.state.largeSubunitPlaced && this.state.smallSubunitPlaced && !this.state.mRNAPlaced) {
            this.state.mRNAPlaced = true;
            this.state.selectedMaterial = null;
            this.state.translationProgress = 0.42;
            this.state.message = "mRNA instructions loaded. Press Play.";
            this.render();
            return true;
        }
        this.state.message = "That material does not belong in this location yet.";
        this.render();
        return false;
    },

    simulate() {
        if (!this.state.largeSubunitPlaced || !this.state.smallSubunitPlaced || !this.state.mRNAPlaced || this.state.running || this.state.complete) return false;
        this.state.running = true;
        this.state.message = "The mRNA instructions move through the ribosome as the amino-acid chain grows…";
        this.status.textContent = this.state.message;
        this.root.querySelector('[data-action="simulate"]').disabled = true;
        this.root.querySelector('[data-action="reset"]').disabled = true;
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.state.translationProgress = Math.min(1, this.state.translationProgress + 0.018);
            this.draw();
            if (this.state.translationProgress >= 1) {
                clearInterval(this.timer);
                this.state.running = false;
                this.state.complete = true;
                this.state.message = "Protein constructed. The completed polypeptide has detached from the ribosome.";
                this.render();
            }
        }, 55);
        return true;
    },

    element(name, attrs = {}, parent = this.svg) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", name);
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
        parent.appendChild(node);
        return node;
    },

    text(x, y, value, size = 16, parent = this.svg) {
        const node = this.element("text", { x, y, fill: "#eef7ff", "font-size": size, "font-weight": 650, "text-anchor": "middle" }, parent);
        node.textContent = value;
        return node;
    },

    target(id, x, y, width, height, label) {
        const group = this.element("g", { "data-drop-target": id, tabindex: 0, role: "button", "aria-label": label });
        this.element("rect", { x, y, width, height, rx: 14, fill: "#172b3a", stroke: "#6e90a3", "stroke-width": 3, "stroke-dasharray": "9 7" }, group);
        return group;
    },

    draw() {
        this.svg.replaceChildren();
        if (!this.state.largeSubunitPlaced) {
            const target = this.target("ribosome_assembly", 330, 90, 280, 230, "Place large ribosomal subunit in the center");
            this.element("path", { d: "M350 220 C355 125 420 105 475 120 C540 102 585 135 590 215 C560 245 385 250 350 220Z", fill: "#75b27822", stroke: "#75b278", "stroke-width": 4, "stroke-dasharray": "9 7" }, target);
            return;
        }

        if (!this.state.smallSubunitPlaced) {
            this.drawLargeSubunit(470, 218);
            const target = this.target("ribosome_assembly", 335, 225, 270, 125, "Snap small ribosomal subunit beneath the large subunit");
            this.element("ellipse", { cx: 470, cy: 285, rx: 110, ry: 48, fill: "#70a9c722", stroke: "#70a9c7", "stroke-width": 4, "stroke-dasharray": "9 7" }, target);
            return;
        }

        if (!this.state.mRNAPlaced) {
            this.drawRibosome(470, 218);
            const target = this.target("mrna", 85, 315, 260, 70, "Place mRNA instructions into the model");
            this.element("path", { d: "M115 350 C160 324 205 376 250 346 C280 326 305 350 325 340", fill: "none", stroke: "#e76868", "stroke-width": 10, "stroke-linecap": "round", opacity: .45 }, target);
            this.element("path", { d: "M350 350 L410 285", fill: "none", stroke: "#8199aa", "stroke-width": 3, "stroke-dasharray": "7 6" });
            return;
        }

        const progress = this.state.complete ? 1 : Math.max(0.42, this.state.translationProgress);
        const translatedFraction =
            Math.max(
                0,
                Math.min(
                    1,
                    (progress - 0.42) / 0.58
                )
            );
        const tapeStart =
            115 + translatedFraction * 300;
        const tapeEnd = 115 + progress * 705;
        this.element("line", { x1: tapeStart, y1: 285, x2: tapeEnd, y2: 285, stroke: "#e76868", "stroke-width": 15, "stroke-linecap": "round" });
        for (let index = 0; index < 12; index += 1) {
            const x = 135 + index * 58;
            if (
                x < tapeStart - 10 ||
                x > tapeEnd - 10
            ) continue;
            this.element("rect", { x, y: 270, width: 38, height: 30, rx: 5, fill: index % 2 ? "#ef9292" : "#d95058", stroke: "#ffd0cf", "stroke-width": 2 });
        }
        this.drawRibosome(470, 218);

        const growth = Math.max(0, Math.min(1, (progress - 0.42) / 0.58));
        const beadCount = this.state.complete ? CHAIN_COLORS.length : Math.max(1, Math.floor(growth * CHAIN_COLORS.length));
        if (this.state.complete) this.drawDetachedChain();
        else this.drawGrowingChain(beadCount);

    },

    drawRibosome(x, y) {
        this.drawSmallSubunit(x, y);
        this.drawLargeSubunit(x, y);
    },

    drawSmallSubunit(x, y) {
        this.element("ellipse", { cx: x, cy: y + 30, rx: 125, ry: 66, fill: "#70a9c7", stroke: "#d1effa", "stroke-width": 4 });
    },

    drawLargeSubunit(x, y) {
        this.element("path", { d: `M${x - 112} ${y} C${x - 95} ${y - 95} ${x + 95} ${y - 95} ${x + 112} ${y} C${x + 75} ${y + 30} ${x - 75} ${y + 30} ${x - 112} ${y}`, fill: "#75b278", stroke: "#d2f2ce", "stroke-width": 4 });
    },

    drawGrowingChain(count) {
        const group = this.element("g", { "data-growing-chain": "true" });
        for (let index = 0; index < count; index += 1) {
            const x = 485 + Math.sin(index * 1.15) * 30;
            const y = 145 - index * 16;
            if (index > 0) {
                const previousX = 485 + Math.sin((index - 1) * 1.15) * 30;
                const previousY = 145 - (index - 1) * 16;
                this.element("line", { x1: previousX, y1: previousY, x2: x, y2: y, stroke: "#f3fbff", "stroke-width": 4 }, group);
            }
            this.element("circle", { cx: x, cy: y, r: 13, fill: CHAIN_COLORS[index], stroke: "#f3fbff", "stroke-width": 3 }, group);
        }
    },

    drawDetachedChain() {
        const group = this.element("g", { "data-detached-protein": "true" });
        CHAIN_COLORS.forEach((color, index) => {
            const x = 650 + index * 27;
            const y = 120 + Math.sin(index * 1.2) * 35;
            if (index > 0) {
                const previousX = 650 + (index - 1) * 27;
                const previousY = 120 + Math.sin((index - 1) * 1.2) * 35;
                this.element("line", { x1: previousX, y1: previousY, x2: x, y2: y, stroke: "#f3fbff", "stroke-width": 4 }, group);
            }
            this.element("circle", { cx: x, cy: y, r: 13, fill: color, stroke: "#f3fbff", "stroke-width": 3 }, group);
        });
    },

    submit() {
        if (this.sandbox || this.state.saved || !this.state.complete) return;
        const incorrect = QUESTIONS.filter(question => this.state.answers[question.id] !== question.correct);
        if (incorrect.length > 0) {
            this.state.message = `100% is required. Recheck ${incorrect.length} answer${incorrect.length === 1 ? "" : "s"}.`;
            this.render();
            return;
        }

        const backup = structuredClone(gameState);
        try {
            const completion = ResearchManager.completeExperiment(Catalog.id);
            if (!completion.completed) throw new Error(completion.reason);
            const report = {
                scorePoints: 100,
                scoreMaximum: 100,
                scorePercent: 100,
                isPerfect: true,
                checks: [
                    { id: "large_subunit_placed", passed: true, awardedPoints: 10, maximumPoints: 10 },
                    { id: "small_subunit_placed", passed: true, awardedPoints: 10, maximumPoints: 10 },
                    { id: "mrna_loaded", passed: true, awardedPoints: 20, maximumPoints: 20 },
                    { id: "protein_constructed", passed: true, awardedPoints: 20, maximumPoints: 20 },
                    { id: "condensation_identified", passed: true, awardedPoints: 20, maximumPoints: 20 },
                    { id: "amino_acids_identified", passed: true, awardedPoints: 20, maximumPoints: 20 }
                ]
            };
            const submission = SubmissionManager.recordSubmission({
                experiment: Catalog,
                report,
                completion,
                placementSnapshot: { components: [{ id: "large_ribosomal_subunit", count: 1 }, { id: "small_ribosomal_subunit", count: 1 }, { id: "mrna", count: 1 }] },
                attemptSnapshot: {
                    answers: structuredClone(this.state.answers),
                    observations: { ribosomeAssembledFromSubunits: true, mRNAProvidedInstructions: true, ribosomeConstructedProtein: true, growingPolymerObserved: true, completedProteinDetached: true }
                }
            });
            if (!submission || !SaveManager.save({ reason: "ribosome-translation-level-1" })) throw new Error("save-failed");
            this.state.saved = true;
            this.root.querySelector(".rt-submit").disabled = true;
            this.status.textContent = `Level 1 complete: 100 / 100. ${completion.xpAwarded} XP awarded. Rough ER targeting is now available if Rough ER has been revealed.`;
            OrganelleExperimentPanel.refresh();
        } catch (error) {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            this.state.message = "Saving failed. Your completed model and answers remain here; retry Check Answers and Save.";
            this.render();
        }
    },

    renderReview() {
        const record = SubmissionManager.getSubmissions(Catalog.id).at(-1);
        this.root.innerHTML = record
            ? `<h3>Ribosome Level 1 — ${record.scorePoints} / ${record.scoreMaximum}</h3><p><strong>Instructions:</strong> mRNA</p><p><strong>Machine:</strong> ribosome</p><p><strong>Monomers:</strong> amino acids</p><p><strong>Product:</strong> polypeptide/protein chain</p><p><strong>Introductory reaction model:</strong> condensation (dehydration)</p>`
            : "No Ribosome Level 1 submission is available.";
    }
};

export { QUESTIONS as RIBOSOME_TRANSLATION_QUESTIONS, CHAIN_COLORS as RIBOSOME_CHAIN_COLORS };
export default RibosomeTranslationView;
