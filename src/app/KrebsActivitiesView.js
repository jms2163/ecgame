import Manager from './KrebsPracticeManager.js';
import Progress from './MetabolismPracticeProgress.js';
import { activityElement as el, activityButton as button, reactionDock, draggableInput } from './GuidedReactionView.js';
import { GuidedTransferAnimation } from './GuidedTransferAnimation.js';
import { KREBS_STEPS, KREBS_MOLECULES, KREBS_LABELS, krebsStage, dockKrebsInput,
    krebsReady, runKrebsReaction, continueKrebsReaction, storeKrebsProducts,
    answerKrebsQuestion, krebsScore, krebsCarbonLedger, krebsOverviewSnapshot,
    createKrebsSession, createKrebsBatch, recordKrebsBatchStep } from './KrebsPracticeModel.js';
import { krebsSvg as svg, krebsMolecule, krebsCarrier, krebsEnzyme, animateKrebsStage } from './KrebsPracticeVisuals.js';

const point = index => {
    const angle = (-90 + index * 45) * Math.PI / 180;
    return { x: 260 + 175 * Math.cos(angle), y: 255 + 175 * Math.sin(angle) };
};
const View = {
    container: null, layout: null, overviewHost: null, detail: null, board: null,
    running: false, busy: false, repeat: false, version: 0, animator: null,
    message: '', quizFeedback: null, result: null, autoSession: null, batch: null, justPlaced: null,
    close() {
        const wasOpen = Boolean(Manager.session || this.running);
        this.version++; this.animator?.cancel(); this.animator = null;
        this.running = false; this.busy = false; this.autoSession = null;
        Manager.reset(); this.quizFeedback = null; this.result = null; this.message = ''; this.justPlaced = null;
        if (wasOpen) this.container?.closest('#metabolism-zone')?.classList.remove('metabolism-practice-open');
    },
    start(index) {
        this.close(); if (!Manager.start(index)) return false;
        this.message = 'Dock the enzyme and each required input. You can drag a card or click it to place it.';
        this.render(this.container); this.detail?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return true;
    },
    render(container) {
        if (!container) return false;
        this.container = container;
        if (!this.layout || this.layout.parentElement !== container) {
            this.layout = el('div', 'krebs-guided-layout');
            this.overviewHost = el('aside', 'krebs-persistent-overview');
            this.detail = el('div', 'krebs-practice-details');
            this.layout.append(this.overviewHost, this.detail); container.replaceChildren(this.layout);
            this.mountOverview();
        }
        this.sync();
        if (!this.busy) this.renderDetail();
        return true;
    },
    mountOverview() {
        const host = this.overviewHost;
        host.append(el('p', 'metabolism-panel-kicker', 'Krebs Cycle · Persistent overview'), el('h3', '', 'Follow one turn'));
        const wrap = el('div', 'krebs-overview-board');
        this.board = svg('svg', { viewBox: '0 0 520 535', role: 'group', 'aria-label': 'Eight reactions in the Krebs cycle. Click any enzyme dot to practice.' });
        const defs = svg('defs'), marker = svg('marker', { id: 'krebs-ring-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto' });
        marker.append(svg('path', { d: 'M0 0L10 5L0 10Z', fill: '#a1d7ff' })); defs.append(marker); this.board.append(defs);
        this.board.append(svg('circle', { cx: 260, cy: 255, r: 175, class: 'krebs-ring' }));
        this.dots = [];
        KREBS_STEPS.forEach((step, index) => {
            const a = point(index), b = point((index + 1) % 8);
            this.board.insertBefore(svg('path', { d: `M${a.x} ${a.y} A175 175 0 0 1 ${b.x} ${b.y}`, class: 'krebs-ring-arc', 'marker-end': 'url(#krebs-ring-arrow)' }), this.dots[0] ?? null);
            const node = svg('g', { class: 'krebs-reaction-dot', tabindex: 0, role: 'button', 'data-krebs-step': index,
                'aria-label': `Practice ${index + 1}: ${step.label}` });
            node.append(svg('circle', { cx: a.x, cy: a.y, r: 22 }), svg('text', { x: a.x, y: a.y + 6, 'text-anchor': 'middle', class: 'krebs-dot-number' }, index + 1),
                svg('text', { x: a.x, y: a.y + 42, 'text-anchor': 'middle', class: 'krebs-dot-abbr' }, step.abbreviation),
                svg('text', { x: a.x + 23, y: a.y - 18, class: 'krebs-dot-p' }, 'P'));
            const activate = () => { if (!this.busy && !this.running) this.start(index); };
            node.addEventListener('click', activate);
            node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
            this.board.append(node); this.dots.push(node);
        });
        this.board.append(svg('text', { x: 260, y: 31, 'text-anchor': 'middle', class: 'krebs-ring-note' }, '2 C acetyl group enters + 4 C oxaloacetate'),
            svg('text', { x: 475, y: 220, 'text-anchor': 'middle', class: 'krebs-ring-note' }, 'CO₂ out'),
            svg('text', { x: 475, y: 385, 'text-anchor': 'middle', class: 'krebs-ring-note' }, 'CO₂ out'),
            svg('text', { x: 260, y: 505, 'text-anchor': 'middle', class: 'krebs-ring-note' }, '4 C oxaloacetate returns to the start'));
        this.scene = svg('g', { class: 'krebs-moving-scene', 'aria-hidden': 'true' }); this.board.append(this.scene);
        const center = el('div', 'krebs-ring-center');
        this.autoButton = button('Automate', () => this.running ? this.stopAutomatic() : this.startAutomatic());
        this.masteryText = el('small', ''); center.append(this.autoButton, this.masteryText);
        wrap.append(this.board, center); host.append(wrap);
        this.currentText = el('strong', 'krebs-current-step'); this.caption = el('p', 'krebs-overview-caption'); this.caption.setAttribute('role', 'status');
        this.currentEnzyme = el('div', 'krebs-overview-enzyme');
        host.append(this.currentText, this.currentEnzyme, this.caption,
            el('p', 'krebs-turn-summary', 'Per acetyl-CoA: 2 CO₂ · 3 NADH · 1 FADH₂-equivalent · 1 ATP (or GTP)'));
        this.bin = el('div', 'krebs-overview-output'); host.append(this.bin);
        const loop = el('label', 'krebs-loop-control'), check = el('input', '');
        check.type = 'checkbox'; check.checked = this.repeat;
        check.addEventListener('change', () => { this.repeat = check.checked; });
        loop.append(check, document.createTextNode(' Repeat automatic turns')); host.append(loop);
        host.append(el('p', 'guided-reaction-note', 'One glucose supplies two acetyl-CoA, so two turns double these yields. Pyruvate oxidation occurs before this cycle.'),
            el('p', 'guided-reaction-note', 'CO₂ released during the first turn comes from the original oxaloacetate, not directly from the newly added acetyl carbons. This view follows carbon counts, not individual atom identities.'));
    },
    sync() {
        if (!this.board) return;
        const snapshot = krebsOverviewSnapshot(id => Progress.hasPerfectPractice(id));
        const session = this.running ? this.autoSession : Manager.session;
        const index = session?.index ?? 0;
        this.masteryText.textContent = `${snapshot.mastered.length}/8 enzymes practiced`;
        this.autoButton.textContent = this.running ? 'Stop animation' : 'Automate';
        this.autoButton.disabled = !this.running && (!snapshot.canAutomate || this.busy);
        this.autoButton.title = snapshot.canAutomate ? 'Replay a complete turn' : 'Earn a green P on all eight practices to automate';
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('is-current', index === i);
            dot.classList.toggle('is-practiced', snapshot.mastered.includes(KREBS_STEPS[i].enzymeId));
            dot.setAttribute('aria-disabled', String(this.busy || this.running));
            dot.setAttribute('tabindex', this.busy || this.running ? '-1' : '0');
        });
        this.currentText.textContent = `${index + 1}. ${KREBS_STEPS[index].label}`;
        this.currentEnzyme.hidden = !this.running;
        if (this.running && this.currentEnzyme.dataset.step !== String(index)) {
            this.currentEnzyme.replaceChildren(krebsEnzyme(KREBS_STEPS[index]));
            this.currentEnzyme.dataset.step = String(index);
        }
        this.caption.textContent = session ? krebsStage(session)?.note ?? KREBS_STEPS[index].note : 'Click any enzyme dot or practice card. Each reaction is available for exploration.';
        this.container?.closest('#metabolism-zone')?.classList.toggle('metabolism-practice-open', Boolean(Manager.session || this.running));
        this.layout.classList.toggle('is-automating', this.running);
        if (this.batch) this.bin.textContent = `Animation tray · ${this.batch.turns} turn(s) completed · ${this.batch.co2} CO₂ · ${this.batch.nadh} NADH · ${this.batch.fadPairs} FAD electron pair(s) → ${this.batch.qh2} QH₂ · ${this.batch.atp} ATP`;
        else this.bin.textContent = 'Educational replay: the tray counts simulated products only.';
    },
    renderDetail() {
        const container = this.detail, s = Manager.session;
        container.replaceChildren();
        if (!s) {
            container.append(el('h3', '', 'Explore each enzyme'), el('p', '', 'Practice in any order. Complete the reaction, collect its products, and answer all three questions correctly to earn a green P.'));
            const cards = el('div', 'krebs-practice-cards');
            KREBS_STEPS.forEach((step, index) => {
                const card = button(`${index + 1}. ${step.label}`, () => this.start(index));
                card.classList.add('krebs-practice-card'); card.dataset.practiceIndex = index;
                card.append(krebsEnzyme(step));
                card.append(el('small', '', step.equation));
                if (Progress.hasPerfectPractice(step.enzymeId)) card.append(el('span', 'metabolism-practice-marker', 'P'));
                cards.append(card);
            });
            container.append(cards, el('p', 'guided-reaction-note', 'These practice inputs are supplied for learning. Practice does not synthesize proteins, activate pathway benefits, or award discoveries or achievements.'));
            return;
        }
        const step = KREBS_STEPS[s.index], heading = el('div', 'guided-reaction-heading');
        heading.append(el('h3', '', `${s.index + 1}. ${step.label}`), button('Exit practice', () => { this.close(); this.render(this.container); }));
        container.append(heading, el('p', 'krebs-equation', step.equation));
        if (s.phase !== 'reaction' || this.quizFeedback) {
            const enzyme = el('div', 'krebs-selected-enzyme');
            enzyme.append(el('strong', '', step.label), krebsEnzyme(step)); container.append(enzyme);
        }
        const feedback = el('p', 'guided-reaction-feedback', this.message); feedback.setAttribute('role', 'status'); container.append(feedback);
        if (this.quizFeedback) { this.renderAnswerFeedback(container, s); return; }
        if (s.phase === 'complete') { this.renderResult(container, s); return; }
        if (s.phase === 'quiz') { this.renderQuiz(container, s); return; }
        const spec = krebsStage(s), workspace = el('div', 'guided-reaction-workspace krebs-reaction-workspace');
        const tray = el('section', 'guided-reaction-tray'), chamber = el('section', 'guided-reaction-chamber'), output = el('section', 'guided-reaction-output-tray');
        tray.append(el('h4', '', 'Input tray'));
        const dock = input => {
            if (this.busy || Manager.session !== s || !dockKrebsInput(s, input)) return;
            this.justPlaced = input;
            this.message = `${input === 'enzyme' ? step.label : KREBS_MOLECULES[input]?.label ?? KREBS_LABELS[input]} placed.`; this.render(this.container);
        };
        const inputCard = (input, filled) => {
            const label = input === 'enzyme' ? step.label : KREBS_MOLECULES[input]?.label ?? KREBS_LABELS[input];
            const role = input === 'enzyme' ? 'Enzyme' : KREBS_MOLECULES[input] ? 'Substrate'
                : ['NAD', 'CoA', 'Q'].includes(input) ? 'Cofactor'
                : ['ATP', 'ADP'].includes(input) ? 'Energy carrier' : 'Reactant';
            const card = draggableInput(button('', () => dock(input), filled || s.phase !== 'reaction'), input);
            card.setAttribute('aria-label', `${filled ? 'Placed' : 'Place'} ${role.toLowerCase()}: ${label}`);
            card.title = 'Click to place in the reaction pane, or drag to its slot';
            card.append(el('strong', '', role), el('small', '', label));
            if (filled) card.append(el('small', 'krebs-input-placed', 'Placed ✓'));
            tray.append(card);
        };
        const placedFigure = (input, figure) => {
            if (this.justPlaced === input) figure.classList.add('krebs-placed-figure');
            return figure;
        };
        if (s.phase === 'reaction') {
            inputCard('enzyme', s.enzyme);
            for (const input of spec.inputs) inputCard(input, s.docked.includes(input));
            const enzymeDock = reactionDock(step.label, 'enzyme', s.enzyme, dock); enzymeDock.classList.add('krebs-enzyme-dock');
            enzymeDock.append(placedFigure('enzyme', krebsEnzyme(step))); chamber.append(enzymeDock);
            const inputs = el('div', 'krebs-input-docks');
            const substrate = el('div', 'krebs-substrate-display');
            const mainDock = reactionDock(KREBS_MOLECULES[s.main].label, s.main,
                s.stage > 0 || s.docked.includes(s.main), dock);
            mainDock.classList.add('krebs-input-dock');
            substrate.append(placedFigure(s.main, krebsMolecule(s.main))); mainDock.append(substrate); inputs.append(mainDock);
            for (const input of spec.inputs.filter(k => k !== s.main)) {
                const item = reactionDock(KREBS_MOLECULES[input]?.label ?? KREBS_LABELS[input], input, s.docked.includes(input), dock);
                item.classList.add('krebs-input-dock');
                if (s.docked.includes(input)) item.append(placedFigure(input, KREBS_MOLECULES[input] ? krebsMolecule(input, true) : krebsCarrier(input)));
                inputs.append(item);
            }
            chamber.append(inputs);
            if (s.index === 5) {
                const membrane = el('div', 'krebs-bound-fad');
                membrane.append(el('small', '', 'Complex II · inner mitochondrial membrane'), el('strong', '', s.stage ? 'Enzyme-bound FADH₂' : 'Enzyme-bound FAD'));
                if (spec.kind === 'quinone') membrane.append(el('p', 'krebs-proton-source', 'Q + 2e⁻ + 2H⁺ → QH₂. The two H⁺ come from the mitochondrial matrix solution; Complex II does not pump them across the membrane.'));
                chamber.append(membrane);
            }
            chamber.append(el('p', 'krebs-stage-note', spec.note), button(spec.action, () => this.runAnimated(s), !krebsReady(s)));
        } else {
            chamber.append(el('h4', '', s.stage < step.stages.length - 1 ? 'Reaction part complete' : 'Products ready to collect'));
            const row = el('div', 'krebs-local-products'); row.append(krebsMolecule(s.main));
            for (const key of s.local) row.append(krebsCarrier(key)); chamber.append(row, el('p', '', spec.note));
            if (s.stage < step.stages.length - 1) chamber.append(button(s.index === 1 ? 'Keep the water and continue' : 'Continue this enzyme reaction', () => {
                if (continueKrebsReaction(s)) { this.message = 'The same molecule continues through this enzyme. Local products remain visible.'; this.render(this.container); }
            }));
            else chamber.append(button('Store products in output tray', () => {
                if (storeKrebsProducts(s)) { this.message = 'Products moved to the output tray. Collection is bookkeeping, not another chemical reaction.'; this.render(this.container); }
            }));
        }
        output.append(el('h4', '', 'Output tray'));
        if (!s.stored) output.append(el('p', '', 'Products first appear under the reaction. Collect them here when the enzyme has finished.'));
        if (s.local.length && s.phase === 'reaction') {
            output.append(el('h4', '', 'Held from the first part'));
            for (const key of s.local) output.append(krebsCarrier(key));
        }
        const ledger = krebsCarbonLedger(s);
        output.append(el('p', 'krebs-carbon-ledger', `${ledger.incoming} substrate C = ${ledger.main} in the main molecule + ${ledger.co2} in CO₂${ledger.waiting ? ` + ${ledger.waiting} in the waiting acetyl group` : ''}`));
        workspace.append(chamber, tray, output); this.justPlaced = null;
        container.append(workspace, el('p', 'guided-reaction-note', step.note),
            el('p', 'guided-reaction-note', 'Blue C circles count the substrate skeleton. Red O and OH groups are connected by single or double bonds. Carboxylates use one conventional resonance drawing (C=O and C–O⁻). Other hydrogens, proton transfers, and enzyme-bound intermediates are simplified; CoA is a carrier label.'));
    },
    async runAnimated(s) {
        if (this.busy || Manager.session !== s || !krebsReady(s)) return;
        this.busy = true; const version = ++this.version, animator = new GuidedTransferAnimation(); this.animator = animator;
        this.sync();
        for (const control of this.detail.querySelectorAll('button')) if (control.textContent.trim() !== 'Exit practice') control.disabled = true;
        for (const card of this.detail.querySelectorAll('[draggable]')) card.draggable = false;
        try {
            const finished = await animateKrebsStage(this.detail, s, krebsStage(s), animator);
            if (version !== this.version || Manager.session !== s) return;
            this.message = finished && runKrebsReaction(s) ? 'Transformation complete. Read the products below before continuing.' : 'The animation did not finish. Retry the reaction.';
        } catch (error) {
            if (version !== this.version) return;
            console.error('[Krebs practice]', error); this.message = 'The animation did not finish. Retry the reaction.';
        } finally {
            animator.dispose();
            if (version === this.version) { this.busy = false; this.animator = null; this.render(this.container); }
        }
    },
    renderStored(container, s) {
        const tray = el('section', 'krebs-stored-products'); tray.append(el('h4', '', 'Collected output'));
        tray.append(krebsMolecule(s.main, true));
        for (const key of s.local) tray.append(krebsCarrier(key)); container.append(tray);
    },
    renderQuiz(container, s) {
        this.renderStored(container, s);
        const q = KREBS_STEPS[s.index].questions[s.quizIndex], area = el('section', 'krebs-quiz');
        area.append(el('h4', '', `Question ${s.quizIndex + 1} of 3`), el('p', '', q.prompt));
        q.options.forEach((option, index) => area.append(button(option, () => {
            const result = answerKrebsQuestion(s, index);
            if (result.accepted) { this.quizFeedback = { ...result, correctAnswer: q.options[q.answer] }; this.render(this.container); }
        })));
        container.append(area);
    },
    renderAnswerFeedback(container, s) {
        this.renderStored(container, s);
        const result = this.quizFeedback, area = el('section', 'krebs-quiz');
        area.append(el('h4', '', result.correct ? 'Correct' : 'Review this answer'),
            el('p', '', result.correctAnswer), el('p', '', result.explanation),
            button(s.phase === 'complete' ? 'View practice result' : 'Next question', () => {
                this.quizFeedback = null;
                if (s.phase === 'complete') this.result = Manager.complete();
                this.render(this.container);
            }));
        container.append(area);
    },
    renderResult(container, s) {
        this.renderStored(container, s);
        const score = krebsScore(s), area = el('section', 'krebs-quiz');
        area.append(el('h4', '', `Practice complete · ${score}%`));
        if (score === 100 && s.saved) area.append(el('p', '', 'Green P earned for this enzyme. Your practice mastery is saved.'));
        else if (score === 100) area.append(el('p', '', 'Your answers are perfect, but saving did not finish.'), button('Retry saving mastery', () => { this.result = Manager.complete(); this.render(this.container); }));
        else area.append(el('p', '', 'Review the explanations and replay for 100% to earn the green P. Previously earned mastery is kept.'));
        area.append(button('Replay this enzyme', () => this.start(s.index)),
            button(s.index === 7 ? 'Return to citrate synthase' : `Next: ${KREBS_STEPS[s.index + 1].label}`, () => this.start((s.index + 1) % 8)),
            button('Exit practice', () => { this.close(); this.render(this.container); }));
        container.append(area); this.sync();
    },
    stopAutomatic() {
        this.version++; this.animator?.cancel(); this.animator = null;
        this.scene?.replaceChildren(); this.running = false; this.busy = false; this.autoSession = null;
        this.render(this.container);
    },
    startAutomatic() {
        if (this.busy || this.running || !krebsOverviewSnapshot(id => Progress.hasPerfectPractice(id)).canAutomate) return false;
        this.close(); this.running = true; this.batch = createKrebsBatch();
        const version = ++this.version;
        this.render(this.container); this.runAutomatic(version); return true;
    },
    autoToken(label, carbons = 0, moleculeKey = null) {
        const token = svg('g', { class: 'krebs-auto-token' });
        if (label === 'NAD⁺' || label === 'NADH') {
            const carrier = krebsCarrier(label === 'NADH' ? 'NADH' : 'NAD').querySelector('svg');
            carrier.setAttribute('x', 0); carrier.setAttribute('y', -24);
            carrier.setAttribute('width', 90); carrier.setAttribute('height', 66);
            token.setAttribute('class', 'krebs-auto-carrier-token'); token.append(carrier);
            this.scene.append(token); return token;
        }
        if (label === 'CO₂') {
            for (const [i, symbol] of ['O', 'C', 'O'].entries()) token.append(svg('circle', { cx: i * 18, cy: 0, r: 8, style: symbol === 'O' ? 'fill:#ff9999' : '' }), svg('text', { x: i * 18, y: 4, 'text-anchor': 'middle' }, symbol));
        }
        if (carbons) for (let i = 0; i < carbons; i++) {
            if (i) {
                const double = KREBS_MOLECULES[moleculeKey]?.double?.[0] === i - 1;
                for (const offset of double ? [-3, 3] : [0]) token.append(svg('line', { x1: (i - 1) * 16, y1: offset, x2: i * 16, y2: offset, class: 'krebs-bond' }));
            }
            token.append(svg('circle', { cx: i * 16, cy: 0, r: 7 }), svg('text', { x: i * 16, y: 4, 'text-anchor': 'middle' }, 'C'));
        }
        token.append(svg('text', { x: 0, y: carbons || label === 'CO₂' ? 25 : 0, class: 'krebs-auto-label' }, label));
        this.scene.append(token); return token;
    },
    async runAutomatic(version) {
        const animator = new GuidedTransferAnimation(); this.animator = animator;
        const valid = () => version === this.version && this.running;
        const move = (token, from, to, duration = 1200) => animator.play(token, [
            { transform: `translate(${from.x}px,${from.y}px)`, opacity: 1 },
            { transform: `translate(${to.x}px,${to.y}px)`, opacity: 1 }
        ], duration);
        try {
            do {
                for (let index = 0; index < 8 && valid(); index++) {
                    const s = createKrebsSession(index), step = KREBS_STEPS[index], pos = point(index);
                    this.autoSession = s; this.sync();
                    let main = this.autoToken(KREBS_MOLECULES[step.substrate].label, KREBS_MOLECULES[step.substrate].c, step.substrate);
                    const previous = point((index + 7) % 8);
                    if (!await move(main, previous, pos)) return;
                    dockKrebsInput(s, 'enzyme');
                    for (let stageIndex = 0; stageIndex < step.stages.length && valid(); stageIndex++) {
                        const spec = krebsStage(s); this.caption.textContent = spec.note;
                        for (const input of spec.inputs) {
                            dockKrebsInput(s, input);
                            if (input !== step.substrate) {
                                const card = this.autoToken(KREBS_MOLECULES[input]?.label ?? KREBS_LABELS[input], KREBS_MOLECULES[input]?.c ?? 0, input);
                                if (!await move(card, { x: 190, y: 230 }, pos, 850)) return;
                                card.remove();
                            }
                        }
                        if (!await animator.play(main, [{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], 850)) return;
                        if (!valid() || !runKrebsReaction(s)) return;
                        main.remove();
                        main = this.autoToken(KREBS_MOLECULES[s.main].label, KREBS_MOLECULES[s.main].c, s.main);
                        main.style.transform = `translate(${pos.x}px,${pos.y}px)`;
                        for (const key of spec.outputs) {
                            const out = this.autoToken(KREBS_LABELS[key]);
                            if (!await move(out, pos, { x: 15, y: 480 }, 900)) return;
                            out.remove();
                        }
                        if (index === 5) this.caption.textContent = stageIndex === 0 ? 'Bound FAD accepts two electrons, forming bound FADH₂.' : 'Bound FAD is regenerated; QH₂ carries the electrons to the ETC.';
                        if (!await animator.play(main, [{ opacity: 1 }, { opacity: 1 }], 1100)) return;
                        if (stageIndex < step.stages.length - 1) continueKrebsReaction(s);
                    }
                    if (!valid() || !storeKrebsProducts(s) || !recordKrebsBatchStep(this.batch, s)) return;
                    main.remove(); this.sync(); this.scene.replaceChildren();
                }
                if (!valid()) return;
                this.caption.textContent = 'Oxaloacetate is regenerated. One turn has collected two CO₂, three NADH, one QH₂ through bound FAD, and one ATP.';
                const returnToken = this.autoToken('Oxaloacetate · ready for another acetyl group', 4);
                if (!await move(returnToken, point(7), point(0), 1700)) return;
                if (!await animator.play(returnToken, [{ opacity: 1 }, { opacity: 1 }], 1400)) return;
                returnToken.remove();
            } while (this.repeat && valid());
        } catch (error) {
            if (valid()) { console.error('[Krebs overview]', error); this.caption.textContent = 'Replay stopped. You can restart the animation.'; }
        } finally {
            animator.dispose();
            if (version === this.version) {
                this.running = false; this.autoSession = null; this.animator = null;
                this.scene.replaceChildren(); this.render(this.container);
                if (this.batch.turns) this.caption.textContent = 'Turn complete. Oxaloacetate returns to the cycle; NADH and QH₂ can later supply the ETC.';
            }
        }
    }
};
export default View;
