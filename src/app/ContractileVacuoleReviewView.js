import GuidedExperimentManager from './GuidedExperimentManager.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const ContractileVacuoleReviewView = {
    svgElement(name, attributes = {}, text = null) {
        const element = document.createElementNS(SVG_NS, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        if (text !== null) element.textContent = text;
        return element;
    },

    addIon(svg, x, y, label, className) {
        const group = this.svgElement('g', { class: `cv-review-ion ${className}` });
        group.append(
            this.svgElement('circle', { cx: x, cy: y, r: 15 }),
            this.svgElement('text', { x, y: y + 5, 'text-anchor': 'middle' }, label)
        );
        svg.append(group);
    },

    addArrow(svg, x1, y1, x2, y2, className = '') {
        svg.append(this.svgElement('line', {
            x1, y1, x2, y2,
            class: `cv-review-arrow ${className}`,
            'marker-end': 'url(#cv-review-arrowhead)'
        }));
    },

    createDiagram(experiment, score) {
        const svg = this.svgElement('svg', {
            class: 'cv-cumulative-diagram',
            viewBox: '0 0 900 660',
            role: 'img',
            'aria-labelledby': 'cv-review-diagram-title cv-review-diagram-description'
        });
        svg.append(
            this.svgElement('title', { id: 'cv-review-diagram-title' }, 'Cumulative contractile vacuole membrane model'),
            this.svgElement('desc', { id: 'cv-review-diagram-description' }, 'Four stacked stages show proton pumping, sodium proton exchange, chloride entry, and osmotic water entry across the contractile vacuole membrane.'),
            this.svgElement('defs')
        );
        const marker = this.svgElement('marker', {
            id: 'cv-review-arrowhead', markerWidth: 8, markerHeight: 8,
            refX: 7, refY: 4, orient: 'auto', markerUnits: 'strokeWidth'
        });
        marker.append(this.svgElement('path', { d: 'M0,0 L8,4 L0,8 Z' }));
        svg.querySelector('defs').append(marker);

        svg.append(
            this.svgElement('text', { x: 260, y: 34, class: 'cv-review-side-label', 'text-anchor': 'middle' }, 'CYTOSOL'),
            this.svgElement('text', { x: 640, y: 34, class: 'cv-review-side-label', 'text-anchor': 'middle' }, 'CV LUMEN'),
            this.svgElement('rect', { x: 420, y: 48, width: 60, height: 584, rx: 24, class: 'cv-review-membrane' })
        );

        [190, 330, 470].forEach(y => svg.append(
            this.svgElement('line', { x1: 28, y1: y, x2: 872, y2: y, class: 'cv-review-divider' })
        ));

        const rows = [
            { y: 118, title: '1 · Proton pump', protein: 'V-ATPase', left: 'ATP', ions: [['H⁺', 330, 'cv-review-ion--proton']], arrow: [350, 520] },
            { y: 258, title: '2 · Na⁺/H⁺ exchanger', protein: 'Na⁺/H⁺', ions: [['Na⁺', 330, 'cv-review-ion--sodium'], ['H⁺', 570, 'cv-review-ion--proton']], arrows: [[350, 520], [550, 380]] },
            { y: 398, title: '3 · Chloride channel', protein: 'Cl⁻ channel', ions: [['Cl⁻', 330, 'cv-review-ion--chloride'], ['Na⁺', 620, 'cv-review-ion--sodium']], arrow: [350, 520] },
            { y: 548, title: '4 · Osmotic water entry', protein: 'Aquaporin', ions: [['H₂O', 320, 'cv-review-ion--water'], ['Na⁺', 610, 'cv-review-ion--sodium'], ['Cl⁻', 660, 'cv-review-ion--chloride']], arrow: [350, 520] }
        ];

        rows.forEach((row, index) => {
            const stageScore = score.stageScores[index];
            const opacity = stageScore?.completed ? '1' : '0.28';
            const group = this.svgElement('g', { style: `opacity:${opacity}` });
            group.append(
                this.svgElement('text', { x: 42, y: row.y - 42, class: 'cv-review-stage-label' }, row.title),
                this.svgElement('rect', { x: 403, y: row.y - 29, width: 94, height: 58, rx: 14, class: 'cv-review-protein' }),
                this.svgElement('text', { x: 450, y: row.y + 5, class: 'cv-review-protein-label', 'text-anchor': 'middle' }, row.protein)
            );
            svg.append(group);
            row.ions.forEach(([label, x, className], ionIndex) =>
                this.addIon(group, x, row.y + (ionIndex - (row.ions.length - 1) / 2) * 38, label, className)
            );
            if (row.left) group.append(this.svgElement('text', { x: 220, y: row.y + 5, class: 'cv-review-atp' }, row.left));
            if (row.arrows) row.arrows.forEach(([x1, x2]) => this.addArrow(group, x1, row.y, x2, row.y));
            if (row.arrow) this.addArrow(group, row.arrow[0], row.y, row.arrow[1], row.y);
        });

        return svg;
    },

    mount(host, experiment) {
        host.replaceChildren();
        const progress = GuidedExperimentManager.read(experiment.id);
        const score = GuidedExperimentManager.score(experiment, progress);

        const section = document.createElement('section');
        section.className = 'cv-guided-review';
        const heading = document.createElement('h3');
        heading.textContent = 'Cumulative Contractile Vacuole Model';
        const summary = document.createElement('p');
        summary.className = 'cv-guided-review-score';
        summary.textContent = `Current checkpoint score: ${score.scorePoints} / ${score.scoreMaximum} (${score.scorePercent}%). ` +
            'Each completed simulation stage is worth 20 points; each correct prediction adds 5 points.';
        section.append(heading, summary, this.createDiagram(experiment, score));

        const stageList = document.createElement('ol');
        stageList.className = 'cv-guided-review-stage-list';
        score.stageScores.forEach((stageScore, index) => {
            const stage = experiment.sequence.stages[index];
            const selectedChoice = stage.guidedUi?.predictionChoices
                ?.find(choice => choice.id === stageScore.predictionId);
            const item = document.createElement('li');
            const title = document.createElement('strong');
            title.textContent = `${stage.title} — ${stageScore.scorePoints} / ${stageScore.scoreMaximum}`;
            const detail = document.createElement('p');
            detail.textContent = !stageScore.completed
                ? 'No checkpoint saved.'
                : `Prediction: ${selectedChoice?.text ?? 'No prediction recorded'} ` +
                    `(${stageScore.predictionCorrect ? 'correct' : 'revise this prediction to improve the score'}).`;
            item.append(title, detail);
            stageList.append(item);
        });
        section.append(stageList);
        host.append(section);
        return score;
    }
};

export default ContractileVacuoleReviewView;
