// First ETC model: two PSII electrons and two stromal protons load PQ.
// The downstream carriers and a scored assessment will be added separately.
const CHLOROPHYLLS = [[180, 205], [150, 285], [200, 365], [420, 205], [450, 285], [400, 365]];
const PATHS = [[0, 1, 2], [1, 2], [3, 4, 5], [4, 5]];
const PSII_SHIFT = 100;
const PHOTON = { x: 170, y: 85 };
const PQ_START = { x: 380, y: 130 };
const REFILL_PQ_Y = 255;
const PQ_FINISH = { x: 430, y: 235 };
const CYTOCHROME_X = 551;
const CYTOCHROME_Y = 156;
const DOCK_SHIFT = 58;
const QI_X = 428;
const QI_Y = 95;
const QI_PROTON_SOURCE_X = [600, 650];
const PQ_SLOTS = [415, 481];
const STROMAL_PROTON_X = [620, 690];
const REFILL_STROMAL_PROTON_X = [790, 860];
const WATER_X = [115, 285];
const WATER_Y = 525;

function lumenPosition(index) {
    return { x: 690 + index % 5 * 58, y: 555 + Math.floor(index / 5) * 65 };
}

function waterPair(splits, oxygenStage) {
    if (!["water", "approach"].includes(oxygenStage)) return "";
    return WATER_X.map((x, index) => {
        const bond = side => {
            const direction = side === "left" ? -1 : 1;
            const step = index * 2 + (side === "right" ? 1 : 0);
            if (splits > step) return oxygenStage === "water"
                ? `<circle cx="${x + direction * 30}" cy="${WATER_Y}" r="6" class="water-bond-electron"/>` : "";
            return `<line x1="${x + direction * 22}" y1="${WATER_Y}" x2="${x + direction * 46}" y2="${WATER_Y}" class="water-covalent-bond"/>
                <circle cx="${x + direction * 30}" cy="${WATER_Y}" r="6" class="water-bond-electron"/>
                <circle data-etc-water-bond-electron="${step}" cx="${x + direction * 40}" cy="${WATER_Y}" r="6" class="water-bond-electron"/>`;
        };
        const hydrogen = side => {
            const direction = side === "left" ? -1 : 1;
            const step = index * 2 + (side === "right" ? 1 : 0);
            if (splits > step) return "";
            const hx = x + direction * 56;
            return `<g data-etc-water-hydrogen="${step}"><circle cx="${hx}" cy="${WATER_Y}" r="17" class="water-hydrogen"/>
                <text x="${hx}" y="${WATER_Y + 6}" text-anchor="middle" class="water-hydrogen-label">H</text></g>`;
        };
        const facing = index === 0 ? 1 : -1;
        return `<g data-etc-water="${index}" role="img" aria-label="Water ${index + 1}, ${Math.max(0, 2 - Math.max(0, splits - index * 2))} O-H bonds remaining">
            ${bond("left")}${bond("right")}
            <g data-etc-water-oxygen="${index}"><circle cx="${x}" cy="${WATER_Y}" r="21" class="water-oxygen"/>
                <text x="${x}" y="${WATER_Y + 7}" text-anchor="middle" class="water-oxygen-label">O</text>
                ${oxygenStage === "approach" ? `<circle cx="${x + facing * 25}" cy="${WATER_Y - 9}" r="6" class="water-bond-electron"/><circle cx="${x + facing * 25}" cy="${WATER_Y + 9}" r="6" class="water-bond-electron"/>` : ""}</g>
            ${hydrogen("left")}${hydrogen("right")}</g>`;
    }).join("");
}

function oxygenProduct(stage) {
    if (!["bond-one", "bond-two", "flight"].includes(stage)) return "";
    const flying = stage === "flight";
    return `<g ${flying ? "data-etc-o2" : "data-etc-o-bonded"}><g ${flying ? 'class="water-o2-spin"' : ""}>
        <circle cx="170" cy="${WATER_Y}" r="21" class="water-oxygen"/><circle cx="230" cy="${WATER_Y}" r="21" class="water-oxygen"/>
        <text x="170" y="${WATER_Y + 7}" text-anchor="middle" class="water-oxygen-label">O</text>
        <text x="230" y="${WATER_Y + 7}" text-anchor="middle" class="water-oxygen-label">O</text>
        <line x1="191" y1="${WATER_Y - 8}" x2="209" y2="${WATER_Y - 8}" class="water-double-bond"/>
        ${stage === "bond-one" ? "" : `<line x1="191" y1="${WATER_Y + 8}" x2="209" y2="${WATER_Y + 8}" class="water-double-bond"/>`}
        ${flying ? "" : `<g data-etc-o-pair-electrons><circle cx="191" cy="${WATER_Y - 8}" r="6" class="water-bond-electron"/><circle cx="209" cy="${WATER_Y - 8}" r="6" class="water-bond-electron"/><circle cx="191" cy="${WATER_Y + 8}" r="6" class="water-bond-electron"/><circle cx="209" cy="${WATER_Y + 8}" r="6" class="water-bond-electron"/></g>`}</g></g>`;
}

export function excitationPath(random = Math.random) {
    return PATHS[Math.min(3, Math.max(0, Math.floor(random() * 4)))];
}

const PSII_ART = `<svg viewBox="0 0 92 100" aria-hidden="true"><path d="M10 22 C10 8 28 5 46 17 C64 5 82 8 82 22 L86 79 C82 96 63 96 46 83 C29 96 10 96 6 79 Z" fill="#925099" stroke="#29132e" stroke-width="3"/><rect x="37" y="19" width="18" height="64" rx="8" fill="#9ccfe6"/><circle cx="22" cy="35" r="7" fill="#6bbd37"/><circle cx="70" cy="35" r="7" fill="#6bbd37"/><circle cx="19" cy="58" r="7" fill="#6bbd37"/><circle cx="73" cy="58" r="7" fill="#6bbd37"/><circle cx="35" cy="72" r="7" fill="#6bbd37"/><circle cx="57" cy="72" r="7" fill="#6bbd37"/><circle cx="40" cy="84" r="7" fill="#6bbd37"/><circle cx="52" cy="84" r="7" fill="#6bbd37"/><rect x="38" y="8" width="16" height="16" rx="3" fill="#86c8e9"/></svg>`;
const PQ_ART = `<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="5" y="18" width="110" height="55" rx="13" fill="#ffed55" stroke="#6b5000" stroke-width="3"/><circle cx="38" cy="18" r="11" fill="#101918"/><circle cx="82" cy="18" r="11" fill="#101918"/><text x="60" y="56" text-anchor="middle" fill="#17100a" font-size="28" font-weight="800">PQ</text></svg>`;
const CYTOCHROME_SHAPE = `<path d="M15 45 Q15 13 43 13 Q70 13 73 42 L73 170 Q68 215 44 220 Q15 219 15 183 Z" class="etc-cytochrome-body"/>
    <path d="M74 43 Q76 12 105 12 Q135 13 138 47 L138 173 Q161 194 153 233 Q146 265 106 269 Q67 270 65 237 L78 172 Z" class="etc-cytochrome-body"/>
    <circle cx="91" cy="205" r="47" class="etc-cytochrome-iron"/>
    <text x="42" y="107" text-anchor="middle" class="etc-cytochrome-label">b₆</text>
    <text x="121" y="128" text-anchor="middle" class="etc-cytochrome-label">f</text>
    <text x="91" y="215" text-anchor="middle" class="etc-cytochrome-label">Fe-S</text>`;
const CYTOCHROME_ART = `<svg viewBox="0 0 170 280" aria-hidden="true">${CYTOCHROME_SHAPE}</svg>`;
const BLUE_ART = `<svg viewBox="0 0 92 100" aria-hidden="true"><circle cx="46" cy="50" r="24" fill="#328be8" stroke="#103963" stroke-width="4"/></svg>`;
const PROTON_ART = `<svg viewBox="0 0 92 100" aria-hidden="true"><circle cx="46" cy="50" r="24" fill="#fff" stroke="#b6d9f6" stroke-width="3"/><text x="46" y="57" text-anchor="middle" fill="#15334c" font-size="21" font-weight="800">H⁺</text></svg>`;

function material(id, label, art, disabled, selected) {
    return `<div class="organelle-experiment-material psii-material-card"><button type="button" class="psii-source ${selected ? "selected" : ""}" data-etc-material="${id}" aria-label="Drag ${label}" ${disabled ? "disabled" : ""}>${art}</button><span class="organelle-experiment-material-name">${label}</span></div>`;
}

function reference(label, art) {
    return `<div class="organelle-experiment-material psii-material-card psii-reference-card"><div class="psii-reference-art">${art}</div><span class="organelle-experiment-material-name">${label}</span></div>`;
}

function electron(x, y, attribute) {
    return `<g ${attribute}><circle cx="${x}" cy="${y}" r="10" class="psii-electron"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="psii-electron-label">e</text></g>`;
}

function proton(x, y, attribute = "") {
    return `<g ${attribute}><circle cx="${x}" cy="${y}" r="21" class="water-proton"/><text x="${x}" y="${y + 6}" text-anchor="middle" class="water-proton-label">H⁺</text></g>`;
}

function membrane() {
    const heads = Array.from({ length: 20 }, (_, i) => 26 + i * 50)
        .map(x => `<ellipse cx="${x}" cy="174" rx="19" ry="15"/><ellipse cx="${x}" cy="426" rx="19" ry="15"/>`).join("");
    const tails = Array.from({ length: 40 }, (_, i) => 13 + i * 25)
        .map(x => `<path d="M${x} 198 q-9 27 0 52 t0 52 M${x} 400 q9-27 0-52 t0-52"/>`).join("");
    return `<g class="psii-heads">${heads}</g><g class="psii-tails">${tails}</g>`;
}

const PhotosystemIIElectronTransportView = {
    root: null, controls: null, events: null, dragging: null, selected: null,
    psii: false, pq: false, cytochrome: false, loaded: 0, photonVisible: true,
    cycle: 0, donorVisible: true, donorDocked: false, donorProtonsVisible: true,
    donorElectronsUsed: [false, false],
    qiElectrons: 0, qiProtons: 0, fElectrons: 0, lumenProtons: 0,
    waterSplits: 0, oxygenStage: "water",
    phase: "setup", animationStep: null, generation: 0,
    timer: null, wake: null, animations: new Set(),

    clear() {
        this.generation++;
        this.events?.abort();
        this.events = null;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.wake?.();
        this.wake = null;
        this.animations.forEach(animation => animation.cancel());
        this.animations.clear();
        this.dragging?.ghost?.remove();
        this.dragging = null;
        this.root = null;
        this.controls = null;
        this.selected = null;
    },

    reset() {
        const { container, controlContainer } = this;
        if (container) this.mount(container, { controlsElement: controlContainer });
    },

    mount(container, { controlsElement = null } = {}) {
        this.clear();
        this.container = container;
        this.controlContainer = controlsElement;
        this.psii = false;
        this.pq = false;
        this.cytochrome = false;
        this.loaded = 0;
        this.photonVisible = true;
        this.cycle = 0;
        this.donorVisible = true;
        this.donorDocked = false;
        this.donorProtonsVisible = true;
        this.donorElectronsUsed = [false, false];
        this.qiElectrons = 0;
        this.qiProtons = 0;
        this.fElectrons = 0;
        this.lumenProtons = 0;
        this.waterSplits = 0;
        this.oxygenStage = "water";
        this.phase = "setup";
        this.animationStep = null;
        this.root = document.createElement("section");
        this.root.className = "psii-lab etc-lab";
        container.replaceChildren(this.root);
        this.controls = controlsElement;
        this.events = new AbortController();
        const signal = this.events.signal;
        this.controls?.addEventListener("click", event => {
            if (event.target.closest("[data-etc-excite]")) void this.excite();
            if (event.target.closest("[data-etc-split]")) void this.splitWater();
            if (event.target.closest("[data-etc-cycle]")) void this.runQCycle();
            if (event.target.closest("[data-etc-reset]")) this.reset();
        }, { signal });
        this.root.addEventListener("pointerdown", event => {
            const item = event.target.closest("[data-etc-material]");
            if (!item || item.disabled) return;
            event.preventDefault();
            this.selected = item.dataset.etcMaterial;
            const ghost = document.createElement("div");
            ghost.className = "psii-drag-ghost";
            ghost.setAttribute("aria-hidden", "true");
            ghost.appendChild(item.querySelector("svg").cloneNode(true));
            document.body.appendChild(ghost);
            this.dragging = { material: this.selected, ghost };
            this.moveGhost(event);
        }, { signal });
        window.addEventListener("pointermove", event => this.moveGhost(event), { signal });
        window.addEventListener("pointerup", event => {
            if (!this.dragging) return;
            const { material, ghost } = this.dragging;
            ghost.remove();
            this.dragging = null;
            const hit = document.elementFromPoint(event.clientX, event.clientY);
            const board = hit?.closest("[data-etc-board]");
            if (board && this.root?.contains(board)) this.place(material, event.clientX, event.clientY);
            else this.render();
        }, { signal });
        this.root.addEventListener("click", event => {
            const item = event.target.closest("[data-etc-material]");
            if (item && !item.disabled) {
                this.selected = item.dataset.etcMaterial;
                this.render();
            } else if (event.target.closest("[data-etc-board]") && this.selected) {
                this.place(this.selected);
            }
        }, { signal });
        this.render();
    },

    moveGhost(event) {
        if (!this.dragging) return;
        this.dragging.ghost.style.left = `${event.clientX}px`;
        this.dragging.ghost.style.top = `${event.clientY}px`;
    },

    place(material, clientX, clientY) {
        const box = this.root?.querySelector("[data-etc-board]")?.getBoundingClientRect();
        const point = box && Number.isFinite(clientX) && Number.isFinite(clientY)
            ? { x: (clientX - box.left) * 1000 / box.width, y: (clientY - box.top) * 700 / box.height }
            : null;
        if (material === "cytochrome" && this.phase === "await-cytochrome") {
            if (point && (point.x < 550 || point.x > 750 || point.y < 155 || point.y > 465)) {
                this.render("Place cytochrome b₆f in the dotted membrane target to the right of PQH₂.");
                return;
            }
            this.cytochrome = true;
            this.selected = null;
            this.phase = "ready-qcycle";
            this.render();
            return;
        }
        if (material === "pq" && this.phase === "await-second-pq") {
            if (point && (point.x < 370 || point.x >= 550 || point.y < 225 || point.y > 390)) {
                this.render("Place the next empty PQ in the dotted target beside PSII.");
                return;
            }
            this.loaded = 0;
            this.donorVisible = true;
            this.donorDocked = false;
            this.donorProtonsVisible = true;
            this.donorElectronsUsed = [false, false];
            this.photonVisible = true;
            this.selected = null;
            this.phase = "ready-excite";
            this.render();
            return;
        }
        if (this.phase !== "setup") return;
        if (material === "psii" && !this.psii && (!point || point.x < 370)) this.psii = true;
        else if (material === "pq" && this.psii && !this.pq && (!point || point.x >= 370 && point.x < 550 && point.y < 340)) this.pq = true;
        else { this.render("Place PSII on the left first, then place PQ beside its upper right edge."); return; }
        this.selected = null;
        if (this.psii && this.pq) this.phase = "ready-excite";
        this.render();
    },

    async pause(ms, generation) {
        await new Promise(resolve => {
            this.wake = resolve;
            this.timer = setTimeout(() => { this.timer = null; this.wake = null; resolve(); }, ms);
        });
        return generation === this.generation && Boolean(this.root);
    },

    async move(node, dx, dy, duration, generation, fromX = 0, fromY = 0) {
        if (!node || generation !== this.generation) return false;
        const animation = node.animate([
            { transform: `translate(${fromX}px, ${fromY}px)` },
            { transform: `translate(${dx}px, ${dy}px)` }
        ], { duration, easing: "ease-in-out", fill: "forwards" });
        this.animations.add(animation);
        try { await animation.finished; }
        catch { this.animations.delete(animation); return false; }
        this.animations.delete(animation);
        if (generation !== this.generation || !this.root) return false;
        // Persist the position on the SVG element before removing the animation.
        // Otherwise a later jiggle or frame can briefly reveal the old position.
        node.setAttribute("transform", `translate(${dx} ${dy})`);
        animation.cancel();
        return generation === this.generation && Boolean(this.root);
    },

    async rotateAndDock(node, generation) {
        if (!node || generation !== this.generation) return false;
        const cx = PQ_FINISH.x + 68;
        const cy = PQ_FINISH.y + 50;
        const duration = 1450;
        const started = performance.now();
        return new Promise(resolve => {
            const frame = now => {
                if (generation !== this.generation || !this.root) { resolve(false); return; }
                const t = Math.min(1, (now - started) / duration);
                const eased = t * t * (3 - 2 * t);
                node.setAttribute("transform", `translate(0 ${DOCK_SHIFT * eased}) translate(${cx} ${cy}) rotate(${180 * eased}) translate(${-cx} ${-cy})`);
                if (t < 1) requestAnimationFrame(frame);
                else resolve(true);
            };
            requestAnimationFrame(frame);
        });
    },

    async animateFrames(node, frames, duration, generation) {
        if (!node || generation !== this.generation) return false;
        const animation = node.animate(frames, { duration, easing: "ease-in-out", fill: "forwards" });
        this.animations.add(animation);
        try { await animation.finished; }
        catch { this.animations.delete(animation); return false; }
        this.animations.delete(animation);
        return generation === this.generation && Boolean(this.root);
    },

    lift(node) {
        // A traveling particle must render over both the yellow PQ and b₆f.
        this.root?.querySelector("[data-etc-board]")?.appendChild?.(node);
        return node;
    },

    announce(message) {
        const status = this.root?.querySelector("[data-etc-status]");
        if (status) status.textContent = message;
    },

    async excite() {
        if (this.phase !== "ready-excite" || !this.psii || !this.pq || !this.root) return;
        const generation = ++this.generation;
        const path = excitationPath();
        this.phase = "running";
        this.animationStep = "exciting";
        this.render("Blue light travels to an antenna chlorophyll.");
        const [x, y] = CHLOROPHYLLS[path[0]];
        const photon = this.root.querySelector("[data-etc-photon]");
        if (!await this.move(photon, x - PSII_SHIFT - PHOTON.x, y - PHOTON.y, 900, generation)) return;
        photon.style.display = "none";
        this.photonVisible = false;
        for (const index of path) {
            const pigment = this.root.querySelector(`[data-etc-chl="${index}"]`);
            pigment?.classList.add("psii-excited");
            this.announce("Excitation energy passes from chlorophyll to chlorophyll toward P680.");
            if (!await this.pause(650, generation)) return;
            pigment?.classList.remove("psii-excited");
        }
        const p680 = this.root.querySelector("[data-etc-p680]");
        p680?.classList.add("psii-excited");
        if (!await this.pause(700, generation)) return;
        p680?.classList.remove("psii-excited");
        this.announce("P680 gives its electron to the primary electron acceptor, becoming P680+.");
        const ejected = this.root.querySelector("[data-etc-ejected]");
        if (!await this.move(ejected, 0, -105, 1100, generation)) return;
        this.phase = "ready-split";
        this.animationStep = null;
        this.render();
    },

    async splitWater() {
        if (this.phase !== "ready-split" || this.loaded >= 2 || this.waterSplits >= 4 || !this.root) return;
        const generation = ++this.generation;
        const slot = this.loaded;
        const step = this.waterSplits;
        const waterX = WATER_X[Math.floor(step / 2)];
        const direction = step % 2 ? 1 : -1;
        this.phase = "running";
        this.animationStep = "splitting";
        this.render(`An O–H bond breaks in water ${Math.floor(step / 2) + 1}; its H⁺ enters the lumen.`);
        const hydrogen = this.root.querySelector(`[data-etc-water-hydrogen="${step}"]`);
        const hydrogenX = waterX + direction * 56;
        hydrogen.innerHTML = `<circle cx="${hydrogenX}" cy="${WATER_Y}" r="20" class="water-proton"/><text x="${hydrogenX}" y="${WATER_Y + 6}" text-anchor="middle" class="water-proton-label">H⁺</text>`;
        const destination = lumenPosition(step);
        if (!await this.move(hydrogen, destination.x - hydrogenX, destination.y - WATER_Y, 900, generation)) return;
        this.announce("An electron from the broken O–H bond restores P680⁺.");
        const donor = this.root.querySelector(`[data-etc-water-bond-electron="${step}"]`);
        if (!await this.move(donor, 200 - (waterX + direction * 40), 370 - WATER_Y, 1000, generation)) return;
        const p680Label = this.root.querySelector("[data-etc-p680-label]");
        if (p680Label) p680Label.textContent = "P680";
        this.announce("The electron in the primary acceptor moves into PQ.");
        const accepted = this.root.querySelector("[data-etc-accepted]");
        accepted?.classList.remove("psii-electron-shake");
        const startY = this.cycle === 1 ? REFILL_PQ_Y : PQ_START.y;
        if (!await this.move(accepted, PQ_SLOTS[slot] - (300 - PSII_SHIFT), startY + 39 - 241, 1050, generation)) return;
        this.announce("PQ also takes up one H⁺ from the stroma.");
        const stromalProton = this.root.querySelector(`[data-etc-proton="${slot}"]`);
        const sourceX = (this.cycle === 1 ? REFILL_STROMAL_PROTON_X : STROMAL_PROTON_X)[slot];
        if (!await this.move(stromalProton, PQ_SLOTS[slot] - sourceX, startY - 90, 1000, generation)) return;
        this.loaded++;
        this.waterSplits++;
        this.photonVisible = true;
        if (this.loaded === 2) {
            this.phase = "pq-loaded";
            this.photonVisible = false;
        }
        if (this.waterSplits === 4 && !await this.formOxygen(generation)) return;
        if (this.loaded === 2) {
            this.animationStep = null;
            this.render("Two electrons and two stromal protons have loaded PQ, forming PQH₂.");
            if (!await this.pause(650, generation)) return;
            const carrier = this.root.querySelector("[data-etc-pq]");
            if (!await this.move(carrier, PQ_FINISH.x - PQ_START.x, PQ_FINISH.y - startY, 1250, generation)) return;
            this.phase = this.cytochrome ? "ready-second" : "await-cytochrome";
        } else this.phase = "ready-excite";
        this.animationStep = null;
        this.render();
    },

    async formOxygen(generation) {
        this.oxygenStage = "approach";
        this.animationStep = "oxygen";
        this.render("The oxygen atoms from both waters come together in the lumen.");
        if (!(await Promise.all([
            this.move(this.root.querySelector('[data-etc-water-oxygen="0"]'), 55, 0, 850, generation),
            this.move(this.root.querySelector('[data-etc-water-oxygen="1"]'), -55, 0, 850, generation)
        ])).every(Boolean)) return false;
        this.oxygenStage = "bond-one";
        this.render("The first pair of shared electrons forms an O–O bond.");
        if (!await this.pause(650, generation)) return false;
        this.oxygenStage = "bond-two";
        this.render("The second electron pair forms the O=O double bond.");
        if (!await this.pause(650, generation)) return false;
        if (!await this.animateFrames(this.root.querySelector("[data-etc-o-pair-electrons]"),
            [{ opacity: 1 }, { opacity: 0 }], 500, generation)) return false;
        this.oxygenStage = "flight";
        this.render("O₂ leaves the lumen; four water-derived H⁺ remain there.");
        const oxygen = this.root.querySelector("[data-etc-o2]");
        if (!await this.move(oxygen, 190, -575, 1800, generation)) return false;
        this.oxygenStage = "done";
        return true;
    },

    async runQCycle() {
        if (!["ready-qcycle", "ready-second", "ready-recycle"].includes(this.phase) || !this.cytochrome || !this.root) return;
        const generation = ++this.generation;
        const turn = this.cycle;
        this.phase = "qcycle-running";
        if (turn === 2) {
            // The third donor is the PQH₂ the learner just formed at Qi.
            this.donorVisible = turn !== 2;
            this.donorDocked = false;
            this.donorProtonsVisible = true;
            this.donorElectronsUsed = [false, false];
        }
        this.render(turn === 0
            ? "PQH₂ diffuses to cytochrome b₆f with its two H⁺ facing the stroma."
            : turn === 1 ? "The second PQH₂ was loaded by two more excitations at PSII."
                : "The PQH₂ formed at Qi recycles to the donor side before releasing its H⁺.");
        if (turn === 2) {
            const recycled = this.root.querySelector("[data-etc-qi]");
            if (!await this.move(recycled, PQ_FINISH.x - QI_X, PQ_FINISH.y - QI_Y, 950, generation)) return;
            this.qiElectrons = 0;
            this.qiProtons = 0;
            this.donorVisible = true;
            this.render("Recycled PQH₂ has reached the donor site; fresh PQ waits at Qi.");
        }

        this.announce("PQH₂ rotates and moves down: its H⁺ now face the thylakoid lumen.");
        if (!await this.rotateAndDock(this.root.querySelector("[data-etc-pq]"), generation)) return;
        this.donorDocked = true;
        this.render("Both protons leave PQH₂ and enter the thylakoid lumen.");
        const protonMoves = [0, 1].map(index => {
            const node = this.lift(this.root.querySelector(`[data-etc-bound-proton="${index}"]`));
            const destination = lumenPosition(4 + this.lumenProtons + index);
            return this.move(node, destination.x - (PQ_FINISH.x + (index ? 101 : 35)),
                destination.y - (PQ_FINISH.y + DOCK_SHIFT + 100), 1000, generation);
        });
        if (!(await Promise.all(protonMoves)).every(Boolean)) return;
        this.lumenProtons += 2;
        this.donorProtonsVisible = false;
        this.render("One electron goes through the Fe-S center toward cytochrome f.");

        const first = this.lift(this.root.querySelector('[data-etc-bound-electron="0"]'));
        const firstX = PQ_FINISH.x + 35;
        const secondX = PQ_FINISH.x + 101;
        const donorElectronY = PQ_FINISH.y + DOCK_SHIFT + 61;
        const feX = CYTOCHROME_X + 91;
        const feY = CYTOCHROME_Y + 205;
        if (!await this.move(first, feX - firstX, feY - donorElectronY, 950, generation)) return;
        first.querySelector?.("circle")?.classList?.add("psii-electron-shake");
        if (!await this.pause(850, generation)) return;
        first.querySelector?.("circle")?.classList?.remove("psii-electron-shake");
        const fX = CYTOCHROME_X + 145;
        const fY = CYTOCHROME_Y + 225;
        if (!await this.move(first, fX - firstX, fY - donorElectronY, 750, generation,
            feX - firstX, feY - donorElectronY)) return;
        first.querySelector?.("circle")?.classList?.add("psii-electron-shake");
        if (!await this.pause(450, generation)) return;
        first.querySelector?.("circle")?.classList?.remove("psii-electron-shake");
        this.fElectrons++;
        this.donorElectronsUsed[0] = true;
        this.render("The other electron travels through cytochrome b₆ toward the Qi-side PQ.");

        const second = this.lift(this.root.querySelector('[data-etc-bound-electron="1"]'));
        const bX = CYTOCHROME_X + 42;
        const bY = CYTOCHROME_Y + 107;
        if (!await this.move(second, bX - secondX, bY - donorElectronY, 950, generation)) return;
        second.querySelector?.("circle")?.classList?.add("psii-electron-shake");
        if (!await this.pause(650, generation)) return;
        second.querySelector?.("circle")?.classList?.remove("psii-electron-shake");
        const slot = turn === 1 ? 1 : 0;
        const qiX = QI_X + (slot ? 73 : 35);
        const qiElectronY = QI_Y + 39;
        if (!await this.move(second, qiX - secondX, qiElectronY - donorElectronY, 1050, generation,
            bX - secondX, bY - donorElectronY)) return;
        this.announce("The Qi-side PQ also takes up one H⁺ from the stroma.");
        const stromal = this.lift(this.root.querySelector(`[data-etc-qi-source="${slot}"]`));
        if (!await this.move(stromal, qiX - QI_PROTON_SOURCE_X[slot], QI_Y - 65, 900, generation)) return;
        this.qiElectrons++;
        this.qiProtons++;
        this.donorElectronsUsed[1] = true;
        this.render(this.qiElectrons === 1
            ? "Qi-side PQ holds one electron and one H⁺. It remains here for a second turnover."
            : "Qi-side PQ has gained its second electron and H⁺, becoming PQH₂.");
        if (!await this.pause(650, generation)) return;

        const spentDonor = this.root.querySelector("[data-etc-pq]");
        const spentLabel = spentDonor?.querySelector?.(".etc-pq-label");
        if (spentLabel) spentLabel.textContent = "PQ";
        if (!await this.animateFrames(spentDonor, [
            { opacity: 1, transform: "translate(0px, 0px)" },
            { opacity: 0, transform: "translate(125px, 0px)" }
        ], 850, generation)) return;
        this.donorVisible = false;
        this.cycle++;
        if (this.cycle === 2) {
            this.phase = "ready-recycle";
            this.render();
        } else if (this.cycle === 3) {
            this.phase = "done";
            this.render();
        } else {
            this.phase = "await-second-pq";
            this.render();
        }
    },

    render(message = "") {
        if (!this.root) return;
        const pigments = CHLOROPHYLLS.map(([x, y], index) =>
            `<circle data-etc-chl="${index}" cx="${x}" cy="${y}" r="25" class="psii-filled"/>`).join("");
        const p680Plus = this.phase === "ready-split" || this.animationStep === "splitting";
        const psii = this.psii ? `<path d="M140 160 C135 100 240 98 300 135 C360 98 465 100 460 160 L475 416 C470 496 360 490 300 454 C240 490 130 496 125 416 Z" class="psii-body psii-body-filled"/>
            <rect x="265" y="175" width="70" height="245" rx="30" class="psii-core"/>
            <rect x="264" y="205" width="72" height="72" rx="12" class="psii-acceptor psii-acceptor-filled"/>
            ${pigments}<g data-etc-p680 class="psii-p680 psii-filled"><circle cx="276" cy="369" r="25"/><circle cx="324" cy="369" r="25"/></g>
            ${this.phase === "ready-split" || this.animationStep === "splitting" ? electron(300, 241, 'data-etc-accepted class="psii-electron-shake"') : ""}
            ${this.animationStep === "exciting" ? electron(300, 346, 'data-etc-ejected') : ""}
            <text x="300" y="305" text-anchor="middle" class="psii-center-label">PSII</text>
            <text x="300" y="460" text-anchor="middle" class="psii-small-label" data-etc-p680-label>${p680Plus ? "P680+" : "P680"}</text>
            <text x="300" y="196" text-anchor="middle" class="psii-small-label">PRIMARY ACCEPTOR</text>`
            : `<path d="M140 160 C135 100 240 98 300 135 C360 98 465 100 460 160 L475 416 C470 496 360 490 300 454 C240 490 130 496 125 416 Z" class="psii-body"/>`;
        const carrierReleased = this.loaded === 2 && this.phase !== "pq-loaded";
        const carrierX = carrierReleased ? PQ_FINISH.x : PQ_START.x;
        const startY = this.cycle === 1 ? REFILL_PQ_Y : PQ_START.y;
        const carrierY = this.donorDocked ? PQ_FINISH.y + DOCK_SHIFT : carrierReleased ? PQ_FINISH.y : startY;
        const pqh2 = this.phase === "pq-loaded" || carrierReleased;
        const carrier = `<g data-etc-pq class="etc-donor" role="img" aria-label="${pqh2 ? "PQH₂, carrying two electrons and two protons" : `PQ with ${this.loaded} of two electrons and protons loaded`}">
            <rect x="${carrierX}" y="${carrierY}" width="136" height="100" rx="16" class="etc-pq"/>
            ${[0, 1].map(index => {
                const x = carrierX + (index ? 101 : 35);
                return this.loaded > index
                    ? `${this.donorProtonsVisible ? proton(x, this.donorDocked ? carrierY + 100 : carrierY, `data-etc-bound-proton="${index}"`) : ""}${!this.donorElectronsUsed[index] ? electron(x, this.donorDocked ? carrierY + 61 : carrierY + 39, `data-etc-bound-electron="${index}"`) : ""}`
                    : `<circle cx="${x}" cy="${carrierY}" r="19" class="etc-pq-notch"/>`;
            }).join("")}
            <text x="${carrierX + 68}" y="${carrierY + (this.donorDocked ? 25 : 84)}" text-anchor="middle" class="etc-pq-label">${pqh2 ? "PQH₂" : "PQ"}</text>
        </g>`;
        const qi = `<g data-etc-qi role="img" aria-label="Qi-side ${this.qiElectrons === 2 ? "PQH₂" : "PQ"}, ${this.qiElectrons} of two electrons loaded">
            <rect x="${QI_X}" y="${QI_Y}" width="108" height="82" rx="14" class="etc-pq"/>
            ${[0, 1].map(index => this.qiElectrons > index
                ? `${proton(QI_X + (index ? 73 : 35), QI_Y, `data-etc-qi-bound-proton="${index}"`)}${electron(QI_X + (index ? 73 : 35), QI_Y + 39, `data-etc-qi-bound-electron="${index}"`)}`
                : `<circle cx="${QI_X + (index ? 73 : 35)}" cy="${QI_Y}" r="18" class="etc-pq-notch"/>`).join("")}
            <text x="${QI_X + 54}" y="${QI_Y + 72}" text-anchor="middle" class="etc-qi-label">${this.qiElectrons === 2 ? "PQH₂" : "PQ"}</text>
        </g>`;
        const cytochromeX = CYTOCHROME_X;
        const cytochromeY = CYTOCHROME_Y;
        const description = message || ({
            setup: "Drag assembled PSII into the membrane on the left, then place PQ beside its upper right edge.",
            "ready-excite": `Press Excite to load ${this.cycle === 1 ? "the second" : "the first"} PQ. Blue light is above PSII (${this.loaded + 1} of 2).`,
            "ready-split": "Press Split H₂O to restore P680 and transfer an electron and stromal H⁺ to PQ.",
            running: "Follow the electron and proton movements.",
            "pq-loaded": "PQH₂ carries two electrons and two H⁺; watch it move away from PSII.",
            "await-cytochrome": "PQH₂ has moved right. Drag cytochrome b₆f into the dotted membrane target beside it.",
            "ready-qcycle": "Press Run Q cycle to deliver PQH₂ to b₆f (turnover 1 of 2).",
            "await-second-pq": "Drag another empty PQ beside PSII. Two more Excite and Split H₂O rounds will load it for turnover 2 of 2.",
            "ready-second": "Qi PQ has one electron and one H⁺. Press Run Q cycle for a fresh PQH₂ delivery (turnover 2 of 2).",
            "ready-recycle": "Qi PQH₂ is fully loaded. Recycle it to the donor side to release its protons and electrons.",
            "qcycle-running": "Watch the PQH₂ oxidation, proton release, and two electron paths.",
            done: "Two waters supplied four electrons and four lumen H⁺, releasing O₂. Three PQH₂ deliveries added six more lumen H⁺; a new Qi PQ has started loading. PC pickup comes next."
        }[this.phase] ?? "Place the materials to begin.");
        this.root.innerHTML = `<div class="psii-intro"><p><strong>Electron Transport Chain preview:</strong> Two H–O–H molecules appear at PSII. Break an O–H bond with each electron replacement; after four replacements, the oxygens form O₂. Build each PQH₂ with two excitations, then follow two Q-cycle turnovers and a recycled delivery. Water-derived and PQH₂-derived H⁺ collect in the lumen.</p><p class="psii-progress" role="status" data-etc-status>${description}</p></div>
            <div class="psii-workspace"><div class="psii-board"><svg data-etc-board viewBox="0 0 1000 700" role="img" aria-label="PSII and plastoquinone in a thylakoid membrane"><rect width="1000" height="700" rx="24" class="psii-background"/>
                <text x="35" y="70" class="psii-side-label">STROMA</text><text x="35" y="678" class="psii-side-label">THYLAKOID LUMEN</text>
                ${membrane()}
                ${this.pq && this.donorVisible ? carrier : !this.pq || this.phase === "await-second-pq" ? `<rect x="${PQ_START.x}" y="${this.phase === "await-second-pq" ? REFILL_PQ_Y : PQ_START.y}" width="136" height="100" rx="16" class="etc-pq-target"/><text x="${PQ_START.x + 68}" y="${this.phase === "await-second-pq" ? REFILL_PQ_Y + 84 : PQ_START.y + 84}" text-anchor="middle" class="psii-small-label">PQ TARGET</text>` : ""}
                <g transform="translate(-${PSII_SHIFT} 0)">${psii}</g>
                ${this.photonVisible && this.loaded < 2 ? `<circle data-etc-photon cx="${PHOTON.x}" cy="${PHOTON.y}" r="25" class="psii-photon psii-photon--blue"/>` : ""}
                ${[0, 1].map(index => this.loaded > index ? "" : proton((this.cycle === 1 ? REFILL_STROMAL_PROTON_X : STROMAL_PROTON_X)[index], 90, `data-etc-proton="${index}"`)).join("")}
                ${this.cytochrome
                    ? `<g data-etc-cytochrome role="img" aria-label="Cytochrome b₆f complex with b₆, f, and Fe-S regions" transform="translate(${cytochromeX} ${cytochromeY})">${CYTOCHROME_SHAPE}</g>`
                    : this.loaded === 2 ? `<g data-etc-cytochrome-target transform="translate(${cytochromeX} ${cytochromeY})"><path d="M15 45 Q15 13 43 13 Q70 13 73 42 L73 170 Q68 215 44 220 Q15 219 15 183 Z M74 43 Q76 12 105 12 Q135 13 138 47 L138 173 Q161 194 153 233 Q146 265 106 269 Q67 270 65 237 L78 172 Z" class="etc-cytochrome-target"/><text x="84" y="265" text-anchor="middle" class="psii-small-label">b₆f</text></g>` : ""}
                ${this.psii ? `${waterPair(this.waterSplits, this.oxygenStage)}${oxygenProduct(this.oxygenStage)}` : ""}
                ${Array.from({ length: this.waterSplits }, (_, index) => { const position = lumenPosition(index); return proton(position.x, position.y, `data-etc-water-proton="${index}"`); }).join("")}
                ${this.cytochrome ? `<text x="${QI_X + 54}" y="76" text-anchor="middle" class="psii-small-label">Qi SITE</text>${qi}
                    ${[0, 1].map(index => index < this.qiProtons ? "" : proton(QI_PROTON_SOURCE_X[index], 65, `data-etc-qi-source="${index}"`)).join("")}
                    ${Array.from({ length: this.lumenProtons }, (_, index) => { const position = lumenPosition(4 + index); return proton(position.x, position.y, `data-etc-lumen-proton="${index}"`); }).join("")}
                    ${Array.from({ length: this.fElectrons }, (_, index) => electron(CYTOCHROME_X + 145 + index * 20, CYTOCHROME_Y + 225 + index * 18, `data-etc-f-electron="${index}"`)).join("")}
                    ${this.fElectrons ? `<text x="${CYTOCHROME_X + 188}" y="${CYTOCHROME_Y + 205}" class="psii-small-label">toward PC</text>` : ""}` : ""}
                ${this.psii ? `<text x="60" y="595" class="psii-small-label">2 H₂O supply electrons, H⁺, and O₂</text><text x="810" y="677" text-anchor="middle" class="water-protons-label">H⁺ in thylakoid lumen</text>` : ""}
            </svg></div><div class="psii-tray organelle-experiment-material-tray"><h3>Materials</h3><div class="psii-material-list organelle-experiment-material-list">
                ${material("psii", "Assembled PSII", PSII_ART, this.psii || this.phase !== "setup", this.selected === "psii")}
                ${material("pq", "Plastoquinone (PQ)", PQ_ART, this.phase !== "await-second-pq" && (this.pq || this.phase !== "setup"), this.selected === "pq")}
                ${material("cytochrome", "Cytochrome b₆f complex", CYTOCHROME_ART, this.phase !== "await-cytochrome" || this.cytochrome, this.selected === "cytochrome")}
                ${reference("Blue light (already positioned)", BLUE_ART)}
                ${reference("H⁺ from stroma (already positioned)", PROTON_ART)}
            </div><p>Place PSII and PQ first; cytochrome b₆f becomes draggable after PQH₂ forms. Place a fresh PQ after turnover 1, then load it at PSII. One donor electron goes via Fe-S and f toward PC; the other goes via b₆ to the Qi-side PQ. The blue dots to the right mark future PC transfers, not permanent storage in f.</p></div></div>`;
        if (this.controls) {
            const action = this.phase === "ready-excite" ? `<button type="button" class="psii-header-button water-action-ready" data-etc-excite>Excite</button>`
                : this.phase === "ready-split" ? `<button type="button" class="psii-header-button water-action-ready" data-etc-split>Split H₂O</button>`
                    : this.phase === "ready-qcycle" || this.phase === "ready-second" ? `<button type="button" class="psii-header-button water-action-ready" data-etc-cycle>Run Q cycle · ${this.cycle + 1}/2</button>`
                        : this.phase === "ready-recycle" ? `<button type="button" class="psii-header-button water-action-ready" data-etc-cycle>Recycle Qi PQH₂</button>` : "";
            this.controls.innerHTML = `${action}<button type="button" class="psii-header-button" data-etc-reset ${this.phase === "running" || this.phase === "qcycle-running" ? "disabled" : ""}>Reset model</button>`;
        }
    }
};

export default PhotosystemIIElectronTransportView;
