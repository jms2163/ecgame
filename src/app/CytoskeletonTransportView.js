import Catalog from './CytoskeletonTransportCatalog.js';
import ResearchManager from './ResearchManager.js';
import SubmissionManager from './OrganelleExperimentSubmissionManager.js';
import SaveManager from './SaveManager.js';
import gameState from './GameState.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TUBULIN_COUNT = 4;
const TRANSPORT_STEPS = 3;

// Dedicated two-stage activity: first construct a simplified microtubule
// protofilament, then use ATP-powered kinesin to move a cargo vesicle.
const CytoskeletonTransportView = {
    clear() {
        this.events?.abort();
        if (this.frame !== null && this.frame !== undefined) cancelAnimationFrame(this.frame);
        this.events = null;
        this.frame = null;
        this.root = null;
        this.svg = null;
        this.running = false;
    },

    stylesheet() {
        if (document.getElementById('cytoskeleton-transport-styles')) return;
        const style = document.createElement('style');
        style.id = 'cytoskeleton-transport-styles';
        style.textContent = `
            .ct-lab{max-width:960px;color:#e9f2fc;line-height:1.45}
            .ct-lab button,.ct-lab textarea{font:inherit}
            .ct-stage-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}
            .ct-stage-badge{color:#ffb24a;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
            .ct-model{display:block;width:100%;height:auto;min-height:330px;background:#101c29;border:1px solid #516878;border-radius:10px;touch-action:none}
            .ct-model [data-drop-target]{cursor:pointer;outline:none}
            .ct-model [data-drop-target]:focus-visible{filter:drop-shadow(0 0 7px #ffbe60)}
            .ct-actions{display:flex;flex-wrap:wrap;gap:.65rem;margin:1rem 0}
            .ct-actions button,.ct-next,.ct-submit{background:#183044;color:#e9f2fc;border:1px solid #5da8aa;border-radius:7px;padding:.55rem .85rem;cursor:pointer}
            .ct-actions button:hover:not(:disabled),.ct-next:hover:not(:disabled),.ct-submit:hover:not(:disabled){background:#285269}
            .ct-lab button:disabled{opacity:.5;cursor:not-allowed}
            .ct-lab fieldset{border:1px solid #586c7e;border-radius:8px;margin:1rem 0;padding:.7rem 1rem}
            .ct-lab fieldset label{display:block;margin:.35rem 0}
            .ct-status{min-height:2.6rem;color:#9cebc6;font-weight:650}
            .ct-note{font-size:.9rem;color:#b2c1d0}
            .ct-material-card[aria-pressed="true"]{outline:3px solid #ffbe60;outline-offset:2px}
            .ct-material-card:focus-visible{outline:3px solid #83e6c9;outline-offset:2px}
            .ct-material-card--dragging{opacity:.55;outline:3px solid #ffbe60;outline-offset:2px}
            .ct-drag-ghost{position:fixed;z-index:10000;display:grid;place-items:center;width:7.25rem;min-height:5.75rem;pointer-events:none;transform:translate(-50%,-50%);border:2px solid #df80ff;background:#2b103d;opacity:.92;box-shadow:0 10px 24px #000b}
            .ct-model .ct-drop-active rect{stroke:#ffbe60;stroke-width:4;fill:#263c48}
            .ct-material-icon{display:grid;place-items:center;width:4.8rem;height:3rem}
            .ct-tubulin-group{display:flex;gap:.18rem}
            .ct-tubulin-dot{width:.75rem;height:.75rem;border:2px solid #e8fff0;border-radius:50%;box-shadow:0 0 6px currentColor}
            .ct-tubulin-dot--alpha{color:#b9ffc4;background:#82d993}
            .ct-tubulin-dot--beta{color:#49b46b;background:#176b3d}
            .ct-kinesin-icon{position:relative;width:2.8rem;height:2.3rem}
            .ct-kinesin-icon::before,.ct-kinesin-icon::after{content:"";position:absolute;bottom:.1rem;width:.65rem;height:.65rem;border-radius:50%;background:#ffad42;border:2px solid #ffe0a1}
            .ct-kinesin-icon::before{left:.35rem}.ct-kinesin-icon::after{right:.35rem}
            .ct-kinesin-icon span{position:absolute;left:1.32rem;top:.15rem;width:.16rem;height:1.65rem;background:#ffcf74}
            .ct-cargo-icon{width:2.3rem;height:2.3rem;border-radius:50%;background:#397eac;border:3px solid #b8dcff;box-shadow:inset 0 0 10px #78b8da}
            .ct-atp-icon{color:#ffe166;font-size:2.6rem;line-height:1;text-shadow:0 0 9px #ffad21}
            .ct-reflection{display:block;margin:1rem 0}.ct-reflection textarea{display:block;width:min(100%,680px);min-height:5rem;margin-top:.45rem;background:#101c29;color:#fff;border:1px solid #7992a4;border-radius:5px;padding:.55rem}
            @media(max-width:650px){.ct-stage-heading{align-items:flex-start;flex-direction:column}.ct-model{min-height:260px}}
        `;
        document.head.append(style);
    },

    initialState() {
        return {
            stage: 1,
            selectedMaterial: null,
            alphaPlaced: false,
            betaPlaced: false,
            assemblyProgress: 0,
            assemblyComplete: false,
            kinesinPlaced: false,
            cargoPlaced: false,
            atpPlaced: false,
            transportProgress: 0,
            transportComplete: false,
            activeAtpStep: -1,
            atpApproach: 0,
            motorGlow: 0,
            saved: false
        };
    },

    mount(container, { sandbox = false, review = false } = {}) {
        this.clear();
        this.stylesheet();
        this.sandbox = sandbox;
        this.events = new AbortController();
        this.state = this.initialState();
        this.root = document.createElement('section');
        this.root.className = 'ct-lab';
        container.replaceChildren(this.root);
        if (review) { this.review(); return; }
        this.renderPage();
    },

    renderPage() {
        const stageOne = this.state.stage === 1;
        const stageTitle = stageOne ? 'Stage 1: Assemble Filament' : 'Stage 2: Transport a Vesicle';
        const instructions = stageOne
            ? 'Drag the light-green α-tubulin group and dark-green β-tubulin group into their dotted receiving areas. Predict what will happen, then simulate.'
            : 'Drag kinesin onto the filament, attach the cargo vesicle, and add ATP. Predict what will happen, then simulate.';

        this.root.innerHTML = `
            <div class="ct-stage-heading"><h3>${stageTitle}</h3><span class="ct-stage-badge">${this.state.stage} of 2</span></div>
            <p>${instructions}</p>
            <fieldset class="ct-prediction"><legend>${stageOne ? 'Prediction: What will happen when α- and β-tubulin are simulated?' : 'Prediction: What will happen after ATP is added?'}</legend>
                ${stageOne ? `
                    <label><input type="radio" name="ct-prediction" value="dimers_then_filament"> α and β first form dimers; the dimers then assemble into an alternating filament.</label>
                    <label><input type="radio" name="ct-prediction" value="separate_rows"> α and β remain in separate rows.</label>
                    <label><input type="radio" name="ct-prediction" value="unsure"> I am not sure yet.</label>` : `
                    <label><input type="radio" name="ct-prediction" value="kinesin_steps"> ATP repeatedly activates kinesin, which carries the vesicle one unit at a time.</label>
                    <label><input type="radio" name="ct-prediction" value="track_moves"> ATP makes the entire filament slide and push the vesicle.</label>
                    <label><input type="radio" name="ct-prediction" value="unsure"> I am not sure yet.</label>`}
            </fieldset>
            <svg class="ct-model" viewBox="0 0 900 350" role="img"></svg>
            <section class="organelle-experiment-material-tray ct-material-tray">
                <h3>Materials</h3>
                <div class="organelle-experiment-material-list ct-material-list"></div>
            </section>
            <div class="ct-actions">
                <button type="button" class="ct-simulate">Simulate</button>
                <button type="button" class="ct-reset-stage">Reset Stage</button>
                ${stageOne ? '<button type="button" class="ct-next" disabled>Continue to Stage 2</button>' : ''}
            </div>
            <p class="ct-status" role="status" aria-live="polite"></p>
            ${!stageOne && !this.sandbox ? `<label class="ct-reflection">Explain how the tubulin units, kinesin, cargo vesicle, and ATP contributed to transport.
                <textarea maxlength="1500" rows="4"></textarea></label>
                <button type="button" class="ct-submit">Save Investigation</button>` : ''}
            <p class="ct-note">Simplified model: one alternating αβ row represents one microtubule protofilament. A complete microtubule is a hollow cylinder assembled from multiple protofilaments. Lab ATP does not spend game ATP.</p>`;

        this.svg = this.root.querySelector('.ct-model');
        this.status = this.root.querySelector('.ct-status');
        this.bindPageEvents();
        this.renderMaterials();
        this.draw();
        this.say(this.sandbox
            ? 'Re-examine mode: run both stages freely. Nothing is saved or rewarded.'
            : stageOne ? 'Place both tubulin groups and choose a prediction.' : 'Place kinesin, cargo, and ATP in that order, then choose a prediction.');
    },

    // Publish instructions and simulation outcomes without interrupting the
    // active drag or animation. Kept as one method so every stage uses the
    // same accessible live-status element.
    say(message) {
        if (this.status) this.status.textContent = message;
    },

    bindPageEvents() {
        const signal = this.events.signal;
        const on = (node, type, callback) => node?.addEventListener(type, callback, { signal });
        on(this.root.querySelector('.ct-simulate'), 'click', () => this.simulate());
        on(this.root.querySelector('.ct-reset-stage'), 'click', () => this.resetStage());
        on(this.root.querySelector('.ct-next'), 'click', () => this.advanceStage());
        on(this.root.querySelector('.ct-submit'), 'click', () => this.submit());
        on(this.svg, 'dragover', event => {
            const target = event.target.closest('[data-drop-target]');
            if (target) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                for (const node of this.svg.querySelectorAll('[data-drop-target]')) {
                    node.classList.toggle('ct-drop-active', node === target);
                }
            }
        });
        on(this.svg, 'dragleave', event => {
            if (event.relatedTarget && this.svg.contains(event.relatedTarget)) return;
            for (const node of this.svg.querySelectorAll('[data-drop-target]')) {
                node.classList.remove('ct-drop-active');
            }
        });
        on(this.svg, 'drop', event => {
            event.preventDefault();
            const target = event.target.closest('[data-drop-target]')?.dataset.dropTarget;
            const material = event.dataTransfer.getData('text/plain') || this.nativeDragMaterial;
            this.place(material, target);
            this.nativeDragMaterial = null;
        });
        on(this.svg, 'click', event => {
            const target = event.target.closest('[data-drop-target]')?.dataset.dropTarget;
            if (target) this.place(this.state.selectedMaterial, target);
        });
        on(this.svg, 'keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const target = event.target.closest('[data-drop-target]')?.dataset.dropTarget;
            if (!target) return;
            event.preventDefault();
            this.place(this.state.selectedMaterial, target);
        });
    },

    materialDefinitions() {
        return this.state.stage === 1
            ? [
                { id: 'alpha', name: 'α-Tubulin Group', icon: '<span class="ct-tubulin-group">' + '<i class="ct-tubulin-dot ct-tubulin-dot--alpha"></i>'.repeat(TUBULIN_COUNT) + '</span>' },
                { id: 'beta', name: 'β-Tubulin Group', icon: '<span class="ct-tubulin-group">' + '<i class="ct-tubulin-dot ct-tubulin-dot--beta"></i>'.repeat(TUBULIN_COUNT) + '</span>' }
            ]
            : [
                { id: 'kinesin', name: 'Kinesin', icon: '<span class="ct-kinesin-icon"><span></span></span>' },
                { id: 'cargo', name: 'Cargo Vesicle', icon: '<span class="ct-cargo-icon"></span>' },
                { id: 'atp', name: 'ATP', icon: '<span class="ct-atp-icon" aria-hidden="true">ϟ</span>' }
            ];
    },

    renderMaterials() {
        const list = this.root.querySelector('.ct-material-list');
        for (const material of this.materialDefinitions()) {
            const card = document.createElement('div');
            card.className = 'organelle-experiment-material ct-material-card';
            card.dataset.materialId = material.id;
            card.tabIndex = 0;
            card.draggable = true;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-pressed', 'false');
            card.setAttribute('aria-label', `Drag ${material.name} to its dotted target`);
            card.innerHTML = `<span class="ct-material-icon">${material.icon}</span><span class="organelle-experiment-material-name">${material.name}</span>`;
            card.addEventListener('click', () => this.selectMaterial(material.id), { signal: this.events.signal });
            card.addEventListener('keydown', event => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                this.selectMaterial(material.id);
            }, { signal: this.events.signal });
            card.addEventListener('pointerdown', event => {
                // Mouse input uses native HTML dragging. The visible custom
                // pointer ghost remains available for touch and pen input.
                if (event.pointerType === 'mouse') return;
                this.beginMaterialDrag(material, card, event);
            }, { signal: this.events.signal });
            card.addEventListener('dragstart', event => {
                if (this.running) {
                    event.preventDefault();
                    return;
                }
                this.selectMaterial(material.id);
                this.nativeDragMaterial = material.id;
                event.dataTransfer.setData('text/plain', material.id);
                event.dataTransfer.effectAllowed = 'copy';
                card.classList.add('ct-material-card--dragging');
            }, { signal: this.events.signal });
            card.addEventListener('dragend', () => {
                this.nativeDragMaterial = null;
                card.classList.remove('ct-material-card--dragging');
                for (const target of this.svg.querySelectorAll('[data-drop-target]')) {
                    target.classList.remove('ct-drop-active');
                }
            }, { signal: this.events.signal });
            list.append(card);
        }
    },

    // Match the rest of Organelle Lab: use pointer events and a visual ghost
    // instead of browser-native HTML drag, which is unreliable on buttons and
    // touch/trackpad input. The release location determines the SVG target.
    beginMaterialDrag(material, card, event) {
        if (this.running || (event.pointerType === 'mouse' && event.button !== 0)) return;
        event.preventDefault();
        this.selectMaterial(material.id);

        const ghost = card.cloneNode(true);
        ghost.className = 'ct-drag-ghost';
        ghost.removeAttribute('tabindex');
        ghost.removeAttribute('role');
        ghost.setAttribute('aria-hidden', 'true');
        document.body.append(ghost);

        const positionGhost = pointerEvent => {
            ghost.style.left = `${pointerEvent.clientX}px`;
            ghost.style.top = `${pointerEvent.clientY}px`;
            for (const target of this.svg.querySelectorAll('[data-drop-target]')) {
                target.classList.remove('ct-drop-active');
            }
            document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)
                ?.closest('[data-drop-target]')
                ?.classList.add('ct-drop-active');
        };

        const finish = pointerEvent => {
            window.removeEventListener('pointermove', positionGhost);
            window.removeEventListener('pointerup', finish);
            window.removeEventListener('pointercancel', cancel);
            const target = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)
                ?.closest('[data-drop-target]')
                ?.dataset.dropTarget;
            ghost.remove();
            for (const node of this.svg.querySelectorAll('[data-drop-target]')) {
                node.classList.remove('ct-drop-active');
            }
            if (target) this.place(material.id, target);
            else this.say(`${material.name} was returned to the tray. Release it over its dotted target.`);
        };

        const cancel = () => {
            window.removeEventListener('pointermove', positionGhost);
            window.removeEventListener('pointerup', finish);
            window.removeEventListener('pointercancel', cancel);
            ghost.remove();
        };

        positionGhost(event);
        window.addEventListener('pointermove', positionGhost);
        window.addEventListener('pointerup', finish, { once: true });
        window.addEventListener('pointercancel', cancel, { once: true });
    },

    selectMaterial(materialId) {
        this.state.selectedMaterial = materialId;
        for (const card of this.root.querySelectorAll('.ct-material-card')) {
            card.setAttribute('aria-pressed', String(card.dataset.materialId === materialId));
        }
        const name = this.materialDefinitions().find(item => item.id === materialId)?.name ?? materialId;
        this.say(`Selected ${name}. Drag it to, or click, its dotted target.`);
    },

    place(material, target) {
        if (!material || !target || this.running) return;
        if (this.state.stage === 1) {
            if (!['alpha', 'beta'].includes(material) || target !== material) {
                this.say('Place each tubulin group in its matching dotted receiving area.');
                return;
            }
            this.state[`${material}Placed`] = true;
            this.say(this.state.alphaPlaced && this.state.betaPlaced
                ? 'Both groups are placed. Choose a prediction, then simulate dimer and filament assembly.'
                : `${material === 'alpha' ? 'α' : 'β'}-tubulin group placed. Add the other group.`);
        } else {
            const order = ['kinesin', 'cargo', 'atp'];
            const flags = [this.state.kinesinPlaced, this.state.cargoPlaced, this.state.atpPlaced];
            const expected = order[flags.findIndex(value => !value)];
            if (material !== expected || target !== material) {
                this.say(`Place ${expected === 'kinesin' ? 'kinesin first' : expected === 'cargo' ? 'the cargo vesicle after kinesin' : 'ATP after the cargo is attached'}.`);
                return;
            }
            this.state[`${material}Placed`] = true;
            this.say(material === 'atp'
                ? 'All transport components are ready. Choose a prediction, then simulate.'
                : `${material === 'kinesin' ? 'Kinesin placed on the track' : 'Cargo attached to kinesin'}. Add the next material.`);
        }
        this.draw();
    },

    hasPrediction() {
        return this.sandbox || Boolean(this.root.querySelector('input[name="ct-prediction"]:checked'));
    },

    predictionValue() {
        return this.root.querySelector('input[name="ct-prediction"]:checked')?.value ?? 'sandbox';
    },

    simulate() {
        if (this.running) return;
        if (!this.hasPrediction()) {
            this.say('Choose a prediction before simulating. “I am not sure yet” is welcome.');
            return;
        }
        if (this.state.stage === 1) {
            if (!this.state.alphaPlaced || !this.state.betaPlaced) {
                this.say('Place both tubulin groups before simulating.');
                return;
            }
            this.state.stageOnePrediction = this.predictionValue();
            this.animateAssembly();
            return;
        }
        if (!this.state.kinesinPlaced || !this.state.cargoPlaced || !this.state.atpPlaced) {
            this.say('Place kinesin, cargo, and ATP before simulating.');
            return;
        }
        this.state.stageTwoPrediction = this.predictionValue();
        this.animateTransport();
    },

    animateAssembly() {
        this.running = true;
        this.setControlsDisabled(true);
        this.say('α- and β-tubulin are rotating and moving together…');
        const started = performance.now();
        const duration = 4300;
        const tick = now => {
            const elapsed = Math.min(duration, now - started);
            this.state.assemblyProgress = elapsed / duration;
            this.draw();
            if (elapsed < duration) {
                this.frame = requestAnimationFrame(tick);
                return;
            }
            this.frame = null;
            this.running = false;
            this.state.assemblyComplete = true;
            this.setControlsDisabled(false);
            this.root.querySelector('.ct-next').disabled = false;
            this.draw();
            this.say('Stage 1 complete: α and β first formed dimers; four αβ dimers then assembled as AB + AB + AB + AB. The filament is now the stationary track.');
        };
        this.frame = requestAnimationFrame(tick);
    },

    animateTransport() {
        this.running = true;
        this.setControlsDisabled(true);
        this.say('ATP is approaching kinesin…');
        const stepDuration = 1250;
        const started = performance.now();
        const tick = now => {
            const total = Math.min(TRANSPORT_STEPS, (now - started) / stepDuration);
            const step = Math.min(TRANSPORT_STEPS - 1, Math.floor(total));
            const withinStep = total - Math.floor(total);
            this.state.activeAtpStep = step;
            this.state.atpApproach = Math.min(1, withinStep / 0.28);
            this.state.motorGlow = withinStep >= 0.28 && withinStep < 0.52
                ? Math.sin(((withinStep - 0.28) / 0.24) * Math.PI)
                : 0;
            const movementWithinStep = Math.max(0, Math.min(1, (withinStep - 0.52) / 0.35));
            this.state.transportProgress = Math.min(TRANSPORT_STEPS, Math.floor(total) + movementWithinStep);
            this.draw();
            if (total < TRANSPORT_STEPS) {
                this.frame = requestAnimationFrame(tick);
                return;
            }
            this.frame = null;
            this.running = false;
            this.state.transportProgress = TRANSPORT_STEPS;
            this.state.transportComplete = true;
            this.state.activeAtpStep = -1;
            this.state.atpApproach = 0;
            this.state.motorGlow = 0;
            this.setControlsDisabled(false);
            this.root.querySelector('.ct-simulate').disabled = true;
            this.say('Stage 2 complete: each ATP contact briefly activated kinesin, and kinesin carried the vesicle one αβ-dimer unit toward the + end. The filament remained stationary.');
            this.draw();
        };
        this.frame = requestAnimationFrame(tick);
    },

    setControlsDisabled(disabled) {
        for (const control of this.root.querySelectorAll('button,input,textarea')) control.disabled = disabled;
    },

    resetStage() {
        if (this.running) return;
        const stage = this.state.stage;
        const preserved = this.initialState();
        if (stage === 2) {
            preserved.stage = 2;
            preserved.alphaPlaced = true;
            preserved.betaPlaced = true;
            preserved.assemblyProgress = 1;
            preserved.assemblyComplete = true;
            preserved.stageOnePrediction = this.state.stageOnePrediction;
        }
        this.state = preserved;
        this.renderPage();
        this.say(`Stage ${stage} reset.`);
    },

    advanceStage() {
        if (!this.state.assemblyComplete || this.running) return;
        const stageOnePrediction = this.state.stageOnePrediction;
        this.state = this.initialState();
        this.state.stage = 2;
        this.state.alphaPlaced = true;
        this.state.betaPlaced = true;
        this.state.assemblyProgress = 1;
        this.state.assemblyComplete = true;
        this.state.stageOnePrediction = stageOnePrediction;
        this.renderPage();
    },

    svgElement(tag, attributes, parent = this.svg) {
        const node = document.createElementNS(SVG_NS, tag);
        for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
        parent.append(node);
        return node;
    },

    svgText(x, y, text, size = 17, parent = this.svg) {
        const node = this.svgElement('text', {
            x, y, fill: '#e9f2fc', 'font-size': size,
            'font-family': 'system-ui', 'text-anchor': 'middle'
        }, parent);
        node.textContent = text;
        return node;
    },

    dropTarget(id, x, y, width, height, label) {
        const group = this.svgElement('g', {
            'data-drop-target': id, tabindex: 0, role: 'button', 'aria-label': label
        });
        this.svgElement('rect', {
            x, y, width, height, rx: 12, fill: '#142634', stroke: '#9eb2c1',
            'stroke-width': 2, 'stroke-dasharray': '8 6'
        }, group);
        return group;
    },

    tubulinCircle(x, y, type, parent = this.svg) {
        const alpha = type === 'alpha';
        const group = this.svgElement('g', {}, parent);
        this.svgElement('circle', {
            cx: x, cy: y, r: 24, fill: alpha ? '#82d993' : '#176b3d',
            stroke: alpha ? '#d8ffe0' : '#70d892', 'stroke-width': 3
        }, group);
        this.svgText(x, y + 7, alpha ? 'α' : 'β', 21, group);
        return group;
    },

    draw() {
        if (!this.svg) return;
        this.svg.replaceChildren();
        this.svg.setAttribute('aria-label', this.state.stage === 1
            ? 'Tubulin dimer and filament assembly workspace'
            : 'Kinesin transporting a cargo vesicle along a stationary microtubule track');
        if (this.state.stage === 1) this.drawAssemblyStage();
        else this.drawTransportStage();
    },

    drawAssemblyStage() {
        this.svgText(450, 32, 'αβ-Tubulin Assembly Field', 22);
        const progress = this.state.assemblyProgress;
        if (!this.state.alphaPlaced && progress === 0) {
            const target = this.dropTarget('alpha', 65, 65, 300, 120, 'Drop alpha-tubulin group here');
            this.svgText(215, 130, 'DROP α-TUBULIN GROUP', 16, target);
        }
        if (!this.state.betaPlaced && progress === 0) {
            const target = this.dropTarget('beta', 535, 65, 300, 120, 'Drop beta-tubulin group here');
            this.svgText(685, 130, 'DROP β-TUBULIN GROUP', 16, target);
        }

        const dimerPhase = Math.min(1, progress / 0.46);
        const filamentPhase = Math.max(0, Math.min(1, (progress - 0.52) / 0.42));
        const easedDimer = 1 - Math.pow(1 - dimerPhase, 3);
        const easedFilament = filamentPhase < 0.5
            ? 2 * filamentPhase * filamentPhase
            : 1 - Math.pow(-2 * filamentPhase + 2, 2) / 2;

        for (let index = 0; index < TUBULIN_COUNT; index += 1) {
            const alphaStart = { x: 120 + index * 70, y: 115 + (index % 2) * 30 };
            const betaStart = { x: 780 - index * 70, y: 115 + ((index + 1) % 2) * 30 };
            const dimerCenterX = 250 + index * 135;
            const dimerAlpha = { x: dimerCenterX, y: 225 };
            const dimerBeta = { x: dimerCenterX, y: 275 };
            const finalAlpha = { x: 208 + index * 124, y: 255 };
            const finalBeta = { x: 263 + index * 124, y: 255 };
            if (this.state.alphaPlaced || progress > 0) {
                const x = progress <= 0.52 ? alphaStart.x + (dimerAlpha.x - alphaStart.x) * easedDimer : dimerAlpha.x + (finalAlpha.x - dimerAlpha.x) * easedFilament;
                const y = progress <= 0.52 ? alphaStart.y + (dimerAlpha.y - alphaStart.y) * easedDimer : dimerAlpha.y + (finalAlpha.y - dimerAlpha.y) * easedFilament;
                this.tubulinCircle(x, y, 'alpha');
            }
            if (this.state.betaPlaced || progress > 0) {
                const x = progress <= 0.52 ? betaStart.x + (dimerBeta.x - betaStart.x) * easedDimer : dimerBeta.x + (finalBeta.x - dimerBeta.x) * easedFilament;
                const y = progress <= 0.52 ? betaStart.y + (dimerBeta.y - betaStart.y) * easedDimer : dimerBeta.y + (finalBeta.y - dimerBeta.y) * easedFilament;
                this.tubulinCircle(x, y, 'beta');
            }
        }

        if (progress > 0.18 && progress < 0.54) {
            this.svgText(450, 330, 'Step 1: α and β rotate, collide, and form αβ dimers', 17);
        } else if (progress >= 0.54 && progress < 1) {
            this.svgElement('line', { x1: 165, y1: 255, x2: 735, y2: 255, stroke: '#83acc0', 'stroke-width': 4, 'stroke-dasharray': '7 7' });
            this.svgText(450, 330, 'Step 2: dimers assemble end-to-end as AB + AB + AB + AB', 17);
        } else if (this.state.assemblyComplete) {
            this.svgElement('line', { x1: 165, y1: 255, x2: 735, y2: 255, stroke: '#83acc0', 'stroke-width': 4 });
            this.svgText(450, 330, 'FILAMENT ASSEMBLED — stationary transport track', 18);
        }
    },

    drawTrack() {
        this.svgElement('line', { x1: 105, y1: 247, x2: 785, y2: 247, stroke: '#89afc1', 'stroke-width': 5 });
        for (let index = 0; index < TUBULIN_COUNT; index += 1) {
            const base = 130 + index * 155;
            this.tubulinCircle(base, 247, 'alpha');
            this.tubulinCircle(base + 55, 247, 'beta');
        }
        this.svgText(92, 300, '− end', 16);
        this.svgText(802, 300, '+ end', 16);
    },

    drawTransportStage() {
        this.svgText(450, 31, 'Vesicle Transport Field', 22);
        this.drawTrack();
        // Four dimers provide three exact center-to-center transport steps.
        const motorOffset = this.state.transportProgress * 155;
        const motorX = 154 + motorOffset;
        if (!this.state.kinesinPlaced) {
            const target = this.dropTarget('kinesin', 105, 151, 100, 70, 'Drop kinesin on the microtubule');
            this.svgText(155, 193, 'KINESIN', 14, target);
        } else {
            const motor = this.svgElement('g', { 'data-moving-motor': 'true' });
            if (this.state.motorGlow > 0) {
                this.svgElement('circle', { cx: motorX, cy: 192, r: 38 + this.state.motorGlow * 10, fill: '#ffd84c', opacity: 0.18 + this.state.motorGlow * 0.3 }, motor);
            }
            this.svgElement('line', { x1: motorX, y1: 180, x2: motorX, y2: 219, stroke: '#ffd17c', 'stroke-width': 6 }, motor);
            this.svgElement('circle', { cx: motorX - 13, cy: 225, r: 10, fill: '#f09a26', stroke: '#ffe6a8', 'stroke-width': 2 }, motor);
            this.svgElement('circle', { cx: motorX + 13, cy: 225, r: 10, fill: '#f09a26', stroke: '#ffe6a8', 'stroke-width': 2 }, motor);
            this.svgText(motorX, 174, 'K', 15, motor);
        }

        if (this.state.kinesinPlaced && !this.state.cargoPlaced) {
            const target = this.dropTarget('cargo', 105, 75, 100, 70, 'Attach cargo vesicle to kinesin');
            this.svgText(155, 117, 'CARGO', 14, target);
        } else if (this.state.cargoPlaced) {
            const cargo = this.svgElement('g', { 'data-moving-cargo': 'true' });
            this.svgElement('line', { x1: motorX, y1: 180, x2: motorX, y2: 146, stroke: '#ffd17c', 'stroke-width': 5 }, cargo);
            this.svgElement('circle', { cx: motorX, cy: 110, r: 35, fill: '#397eac', stroke: '#b8dcff', 'stroke-width': 4 }, cargo);
            this.svgText(motorX, 116, 'Cargo', 15, cargo);
        }

        if (this.state.cargoPlaced && !this.state.atpPlaced) {
            const target = this.dropTarget('atp', 714, 58, 122, 90, 'Drop ATP supply here');
            this.svgText(775, 110, 'ATP ϟ', 20, target);
        } else if (this.state.atpPlaced) {
            for (let index = 0; index < TRANSPORT_STEPS; index += 1) {
                if (index < this.state.activeAtpStep || this.state.transportComplete) continue;
                let x = 790 - index * 38;
                let y = 91 + (index % 2) * 35;
                let opacity = 1;
                if (index === this.state.activeAtpStep && this.running) {
                    const startX = 790 - index * 38;
                    const startY = 91 + (index % 2) * 35;
                    x = startX + (motorX - startX) * this.state.atpApproach;
                    y = startY + (190 - startY) * this.state.atpApproach;
                    opacity = 1 - this.state.atpApproach * 0.7;
                }
                const bolt = this.svgText(x, y, 'ϟ', 35);
                bolt.setAttribute('fill', '#ffe166');
                bolt.setAttribute('opacity', opacity);
            }
            this.svgText(762, 40, 'ATP supply', 15);
        }
        if (this.state.transportComplete) this.svgText(450, 334, 'TRANSPORT COMPLETE — three ATP-driven kinesin steps', 18);
    },

    submit() {
        if (this.sandbox || this.state.saved) return;
        const reflection = this.root.querySelector('textarea')?.value.trim() ?? '';
        if (!this.state.transportComplete) { this.say('Complete both guided stages before saving.'); return; }
        if (reflection.length < 20) { this.say('Record a short explanation before saving (at least 20 characters).'); return; }
        const status = ResearchManager.getExperimentStatus(Catalog.id);
        if (!status.available) { this.say('This investigation has already been completed. Use Re-examine to run it again.'); return; }

        const backup = structuredClone(gameState);
        try {
            const completion = ResearchManager.completeExperiment(Catalog.id);
            if (!completion.completed) throw new Error(completion.reason);
            const criteria = [
                ['stage_1_prediction', 10], ['alpha_beta_groups_placed', 20],
                ['dimers_and_filament_assembled', 20], ['stage_2_prediction', 10],
                ['kinesin_cargo_atp_placed', 20], ['atp_driven_transport_observed', 10],
                ['reflection_recorded', 10]
            ];
            const report = {
                scorePoints: 100, scoreMaximum: 100, scorePercent: 100, isPerfect: true,
                checks: criteria.map(([id, points]) => ({ id, passed: true, awardedPoints: points, maximumPoints: points }))
            };
            const submission = SubmissionManager.recordSubmission({
                experiment: Catalog, report, completion,
                placementSnapshot: { components: [
                    { id: 'alpha_tubulin_group', count: TUBULIN_COUNT },
                    { id: 'beta_tubulin_group', count: TUBULIN_COUNT },
                    { id: 'kinesin', count: 1 }, { id: 'cargo_vesicle', count: 1 },
                    { id: 'lab_atp_supply', count: TRANSPORT_STEPS }
                ] },
                attemptSnapshot: {
                    reflectionResponses: { cytoskeleton_transport_reflection: reflection },
                    predictions: {
                        filamentAssembly: this.state.stageOnePrediction,
                        vesicleTransport: this.state.stageTwoPrediction
                    },
                    observations: {
                        alphaBetaDimersFormed: TUBULIN_COUNT,
                        alternatingTrack: true,
                        atpKinesinContacts: TRANSPORT_STEPS,
                        kinesinSteps: TRANSPORT_STEPS,
                        trackMoved: false
                    }
                }
            });
            if (!submission || !SaveManager.save({ reason: 'cytoskeleton-transport' })) throw new Error('save-failed');
            this.state.saved = true;
            this.root.querySelector('.ct-submit').disabled = true;
            this.say(`Investigation saved: 100 / 100. ${completion.xpAwarded} XP awarded.`);
        } catch (error) {
            for (const key of Object.keys(gameState)) delete gameState[key];
            Object.assign(gameState, backup);
            this.say('Saving failed. Your completed model and explanation remain here; retry Save Investigation.');
        }
    },

    review() {
        const submissions = SubmissionManager.getSubmissions(Catalog.id);
        if (!submissions.length) { this.root.textContent = 'No Cytoskeleton Transport submission is available.'; return; }
        const record = submissions.at(-1);
        const reflection = record.attemptSnapshot?.reflectionResponses?.cytoskeleton_transport_reflection ?? 'No response saved.';
        const predictions = record.attemptSnapshot?.predictions ?? {};
        this.root.innerHTML = `
            <h3>Cytoskeleton Transport — ${record.scorePoints} / ${record.scoreMaximum}</h3>
            <p><strong>Stage 1 prediction:</strong> ${this.escapeHtml(predictions.filamentAssembly ?? 'Not recorded')}</p>
            <p><strong>Stage 2 prediction:</strong> ${this.escapeHtml(predictions.vesicleTransport ?? 'Not recorded')}</p>
            <p><strong>Observed:</strong> αβ dimers assembled into a stationary alternating track. Three ATP contacts produced three kinesin steps carrying the vesicle toward the + end.</p>
            <p><strong>Your explanation:</strong> ${this.escapeHtml(reflection)}</p>`;
    },

    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    }
};

export default CytoskeletonTransportView;
