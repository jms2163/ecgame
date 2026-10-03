import { activityElement as el } from './GuidedReactionView.js';
import { KREBS_MOLECULES, KREBS_LABELS } from './KrebsPracticeModel.js';
import Visuals from '../data/PolymerizerVisualCatalog.js';

const NS = 'http://www.w3.org/2000/svg';
export function krebsSvg(tag, attrs = {}, text) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    return node;
}
export function krebsEnzyme(step) {
    const visual = Visuals.get(step.enzymeId);
    if (!visual?.finalImageUrl) return el('span', 'krebs-enzyme-badge', step.abbreviation);
    const frame = el('div', 'krebs-enzyme-structure'), image = el('img', 'krebs-enzyme-image');
    frame.dataset.enzyme = step.enzymeId;
    image.src = visual.finalImageUrl; image.alt = `${step.label} protein structure`;
    image.style.transform = `scale(${visual.displayZoomPercent / 100})`;
    // If a configured asset has not been installed, retain an identified fallback.
    image.addEventListener('error', () => frame.replaceChildren(el('span', 'krebs-enzyme-badge', step.abbreviation)), { once: true });
    frame.append(image); return frame;
}
export function moleculePoints(key) {
    const m = KREBS_MOLECULES[key];
    if (m.branched) return [[55, 115], [135, 115], [215, 115], [295, 115], [375, 115], [215, 205]];
    const spacing = m.c > 4 ? 72 : 88;
    return Array.from({ length: m.c }, (_, i) => [60 + i * spacing, 115]);
}
function bond(group, a, b, double = false, className = 'krebs-bond') {
    const [x1, y1] = a, [x2, y2] = b;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const perpendicular = [-(y2 - y1) / length, (x2 - x1) / length];
    const offsets = double ? [-4, 4] : [0];
    for (const offset of offsets) group.append(krebsSvg('line', {
        x1: x1 + perpendicular[0] * offset, y1: y1 + perpendicular[1] * offset,
        x2: x2 + perpendicular[0] * offset, y2: y2 + perpendicular[1] * offset, class: className
    }));
}
function attachedGroup(groups, points, index, type) {
    const [x, y] = points[index];
    const group = krebsSvg('g', { 'data-group-carbon': index, 'data-group-type': type });
    const attach = (label, dx, dy, double = false, className = 'krebs-oxygen') => {
        const distance = Math.hypot(dx, dy), ux = dx / distance, uy = dy / distance;
        // Stop at the C circle and the O glyph, rather than drawing through them.
        bond(group, [x + ux * 19, y + uy * 19], [x + dx - ux * 12, y + dy - uy * 12], double, 'krebs-bond krebs-oxygen-bond');
        group.append(krebsSvg('text', {
            x: x + dx - 8, y: y + dy + 7, class: className
        }, label));
    };
    if (type === 'carboxylate') {
        // One conventional resonance drawing; the carboxyl carbon is already a C sphere.
        attach('O', -27, 38, true);
        attach('O⁻', 27, 38);
    } else if (type === 'thioester') {
        attach('O', 0, -58, true);
        bond(group, [x, y + 19], [x, y + 43]);
        group.append(krebsSvg('text', { x, y: y + 64, 'text-anchor': 'middle', class: 'krebs-coa-label' }, 'S–CoA'));
    } else {
        attach(type === 'hydroxyl' ? 'OH' : 'O', 0, -58, type === 'carbonyl');
    }
    groups.append(group);
}
export function krebsMolecule(key, compact = false) {
    const m = KREBS_MOLECULES[key], card = el('div', `krebs-molecule${compact ? ' is-compact' : ''}`);
    card.dataset.molecule = key;
    const graph = krebsSvg('svg', { viewBox: '0 0 440 260', role: 'img', 'aria-label': `${m.label}, ${m.c} substrate carbons` });
    const points = moleculePoints(key), bonds = krebsSvg('g', { class: 'krebs-bonds' }), groups = krebsSvg('g', { class: 'krebs-functional-groups' });
    const length = m.branched ? 5 : m.c;
    for (let i = 1; i < length; i++) bond(bonds, points[i - 1], points[i], m.double?.[0] === i - 1);
    if (m.branched) bond(bonds, points[2], points[5]);
    graph.append(bonds);
    points.forEach(([x, y], index) => {
        const atom = krebsSvg('g', { class: 'krebs-carbon-atom', 'data-carbon': index });
        atom.append(krebsSvg('circle', { cx: x, cy: y, r: 17 }), krebsSvg('text', { x, y: y + 6, 'text-anchor': 'middle' }, 'C'));
        graph.append(atom);
    });
    if (m.hydroxyl !== undefined) attachedGroup(groups, points, m.hydroxyl, 'hydroxyl');
    if (m.carbonyl !== undefined) attachedGroup(groups, points, m.carbonyl, 'carbonyl');
    if (!m.coa) {
        for (const end of m.branched ? [0, 4, 5] : [0, m.c - 1]) {
            attachedGroup(groups, points, end, 'carboxylate');
        }
    } else {
        attachedGroup(groups, points, 0, 'thioester');
        if (m.c === 4) attachedGroup(groups, points, 3, 'carboxylate');
    }
    graph.append(groups);
    card.append(graph, el('strong', '', m.label), el('small', '', `${m.c} substrate carbons${m.coa ? ' · CoA drawn as a carrier label' : ''}`));
    return card;
}
export function krebsCarrier(key) {
    const card = el('div', 'krebs-carrier'); card.dataset.carrier = key;
    if (key === 'NAD' || key === 'NADH') {
        const drawing = krebsSvg('svg', { viewBox: '0 0 150 110', role: 'img', 'aria-label': KREBS_LABELS[key] });
        // Same yellow notched carrier outline used for NADP+/NADPH in Calvin practice.
        drawing.append(krebsSvg('path', { d: 'M20 22 H58 Q75 54 92 22 H130 Q143 22 143 36 V88 Q143 102 130 102 H20 Q7 102 7 88 V36 Q7 22 20 22 Z', class: 'krebs-nad-shape' }),
            krebsSvg('text', { x: 75, y: 77, 'text-anchor': 'middle', class: 'krebs-carrier-label' }, KREBS_LABELS[key]));
        const hydride = krebsSvg('g', { class: 'krebs-bound-hydride', visibility: key === 'NADH' ? 'visible' : 'hidden', 'aria-label': 'Hydrogen nucleus with two electrons, carried as a hydride' });
        for (const x of [43, 107]) hydride.append(krebsSvg('circle', { cx: x, cy: 22, r: 11, class: 'krebs-hydride-electron' }),
            krebsSvg('text', { x, y: 26, 'text-anchor': 'middle', class: 'krebs-hydride-electron-label' }, 'e⁻'));
        hydride.append(krebsSvg('circle', { cx: 75, cy: 22, r: 16, class: 'krebs-hydride-h' }),
            krebsSvg('text', { x: 75, y: 28, 'text-anchor': 'middle', class: 'krebs-hydride-h-label' }, 'H'));
        drawing.append(hydride);
        card.append(drawing);
    } else {
        card.append(el('strong', '', KREBS_LABELS[key] ?? key));
        if (key === 'ADP' || key === 'ATP') {
            const row = el('div', 'krebs-phosphate-row');
            for (let i = 0; i < (key === 'ATP' ? 3 : 2); i++) row.append(el('span', 'guided-reaction-phosphate-group', 'P'));
            card.append(row);
        }
        if (key === 'Pi') card.append(el('span', 'guided-reaction-phosphate-group', 'P'));
        if (key === 'Water') card.append(el('span', 'krebs-water', 'H–OH'));
        if (key === 'CO2') {
            const drawing = krebsSvg('svg', { viewBox: '0 0 140 70', role: 'img', 'aria-label': 'Carbon dioxide, O double bonded to C double bonded to O' });
            bond(drawing, [29, 35], [51, 35], true);
            bond(drawing, [89, 35], [111, 35], true);
            const carbon = krebsSvg('g', { class: 'krebs-carbon-atom' });
            carbon.append(krebsSvg('circle', { cx: 70, cy: 35, r: 17 }), krebsSvg('text', { x: 70, y: 41, 'text-anchor': 'middle' }, 'C'));
            drawing.append(carbon, krebsSvg('text', { x: 11, y: 42, class: 'krebs-oxygen' }, 'O'), krebsSvg('text', { x: 114, y: 42, class: 'krebs-oxygen' }, 'O'));
            card.append(drawing);
        }
        if (key === 'QH2') card.append(hydrogenBundle(2));
    }
    return card;
}
export function hydrogenBundle(hydrogens = 1) {
    const group = el('div', 'krebs-hydrogen-bundle');
    group.setAttribute('aria-label', `${hydrogens} hydrogen ${hydrogens === 1 ? 'nucleus' : 'nuclei'} and two electrons`);
    group.append(el('span', 'krebs-electron', 'e⁻'));
    for (let i = 0; i < hydrogens; i++) group.append(el('span', 'krebs-hydrogen', 'H'));
    group.append(el('span', 'krebs-electron', 'e⁻'));
    return group;
}
export async function morphKrebsMolecule(host, targetKey, animator, { removeFirst = false } = {}) {
    const old = host.querySelector('.krebs-molecule');
    if (!old) return false;
    const target = krebsMolecule(targetKey), graph = target.querySelector('svg'), oldGraph = old.querySelector('svg');
    target.classList.add('krebs-morph-target'); target.style.opacity = '0'; host.append(target);
    const oldAtoms = [...oldGraph.querySelectorAll('.krebs-carbon-atom')], nextPoints = moleculePoints(targetKey);
    // The product's bond and functional-group changes fade together, while C
    // circles glide to the new skeleton. No acid/base proton-transfer mechanism.
    const movements = nextPoints.map(([x, y], i) => {
        const atom = oldAtoms[i + (removeFirst ? 1 : 0)];
        if (!atom) return Promise.resolve(true);
        const circle = atom.querySelector('circle');
        return animator.play(atom, [{ transform: 'translate(0,0)' },
            { transform: `translate(${x - Number(circle.getAttribute('cx'))}px,${y - Number(circle.getAttribute('cy'))}px)` }], 1500);
    });
    const results = await Promise.all([...movements,
        animator.play(oldGraph.querySelector('.krebs-bonds'), [{ opacity: 1 }, { opacity: 0 }], 1400),
        animator.play(oldGraph.querySelector('.krebs-functional-groups'), [{ opacity: 1 }, { opacity: 0 }], 1400),
        animator.play(target, [{ opacity: 0 }, { opacity: 1 }], 1500)]);
    if (!results.every(Boolean)) return false;
    old.remove(); target.classList.remove('krebs-morph-target'); target.style.opacity = '1'; return true;
}

export async function animateKrebsStage(container, session, spec, animator) {
    const host = container.querySelector('.krebs-substrate-display');
    const source = host.querySelector('.krebs-molecule');
    const carrier = key => container.querySelector(`.krebs-input-dock[data-input="${key}"] .krebs-carrier`);
    const bound = container.querySelector('.krebs-bound-fad');
    const travelBundle = async (hydrogens, destination) => {
        const group = hydrogenBundle(hydrogens); source.append(group);
        const token = animator.token(group); group.remove();
        if (!await animator.travel(token, destination, 1200)) return false;
        return animator.play(token, [{ opacity: 1 }, { opacity: 0 }], 350);
    };
    if (spec.kind === 'join') {
        const acetyl = container.querySelector('[data-input="AcetylCoA"] .krebs-molecule');
        if (!await animator.travel(animator.token(acetyl), source, 1200)) return false;
        if (!await animator.travel(animator.token(carrier('Water')), source, 900)) return false;
    }
    if (spec.kind === 'hydrate') {
        if (!await animator.travel(animator.token(carrier('Water')), source, 1100)) return false;
        if (session.index === 6) {
            const atoms = source.querySelectorAll('.krebs-carbon-atom');
            const hydrogen = el('span', 'krebs-hydrogen', 'H'), hydroxyl = el('span', 'krebs-water-hydroxyl', '–OH');
            carrier('Water').append(hydrogen, hydroxyl);
            const h = animator.token(hydrogen), oh = animator.token(hydroxyl);
            hydrogen.remove(); hydroxyl.remove();
            const added = await Promise.all([animator.travel(h, atoms[2], 1000), animator.travel(oh, atoms[1], 1000)]);
            if (!added.every(Boolean)) return false;
        }
    }
    if (spec.kind === 'oxidize' || spec.kind === 'complex') {
        const nad = carrier('NAD');
        if (!await travelBundle(1, nad.querySelector('.krebs-bound-hydride'))) return false;
        nad.querySelector('.krebs-carrier-label').textContent = 'NADH';
        nad.querySelector('.krebs-bound-hydride').setAttribute('visibility', 'visible');
        nad.querySelector('svg').setAttribute('aria-label', 'NADH'); nad.dataset.carrier = 'NADH';
    }
    if (spec.kind === 'complex') {
        if (!await animator.travel(animator.token(carrier('CoA')), source, 1000)) return false;
    }
    if (spec.kind === 'decarboxylate' || spec.kind === 'complex') {
        const atoms = source.querySelectorAll('.krebs-carbon-atom'), atom = spec.kind === 'complex' ? atoms[0] : atoms[5];
        if (!await animator.play(atom, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(0,90px)', opacity: 0 }], 1100)) return false;
        const co2 = krebsCarrier('CO2'); host.append(co2);
        if (!await animator.play(co2, [{ opacity: 0 }, { opacity: 1 }], 650)) return false;
        co2.remove();
    }
    if (spec.kind === 'phosphorylate') {
        if (!await animator.travel(animator.token(carrier('Pi')), carrier('ADP'), 1300)) return false;
        carrier('ADP').querySelector('strong').textContent = 'ATP';
        carrier('ADP').querySelector('.krebs-phosphate-row').append(el('span', 'guided-reaction-phosphate-group', 'P'));
    }
    if (spec.kind === 'fad') {
        if (!await travelBundle(2, bound)) return false;
        bound.querySelector('strong').textContent = 'Enzyme-bound FADH₂';
    }
    if (spec.kind === 'quinone') {
        const bundle = el('div', 'krebs-hydrogen-bundle');
        bundle.append(el('span', 'krebs-electron', 'e⁻'), el('span', 'krebs-electron', 'e⁻'));
        bound.append(bundle);
        const token = animator.token(bundle); bundle.remove();
        if (!await animator.travel(token, carrier('Q'), 1400)) return false;
        bound.querySelector('strong').textContent = 'Enzyme-bound FAD';
        carrier('Q').querySelector('strong').textContent = 'QH₂';
    }
    const ok = await morphKrebsMolecule(host, spec.product, animator, { removeFirst: spec.kind === 'complex' });
    if (!ok) return false;
    return animator.play(host, [{ opacity: 1 }, { opacity: 1 }], 700);
}
