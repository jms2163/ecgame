// Pure educational sessions. None of these tokens are game inventory.
const question = (prompt, options, answer, explanation) => ({ prompt, options, answer, explanation });
export const KREBS_MOLECULES = Object.freeze({
    Oxaloacetate: { label: 'Oxaloacetate', c: 4, carbonyl: 1 },
    AcetylCoA: { label: 'Acetyl-CoA', c: 2, coa: true },
    Citrate: { label: 'Citrate', c: 6, branched: true, hydroxyl: 2 },
    CisAconitate: { label: 'cis-Aconitate', c: 6, branched: true, double: [1, 2] },
    Isocitrate: { label: 'Isocitrate', c: 6, branched: true, hydroxyl: 1 },
    Oxalosuccinate: { label: 'Oxalosuccinate', c: 6, branched: true, carbonyl: 1 },
    AlphaKetoglutarate: { label: 'α-Ketoglutarate', c: 5, carbonyl: 1 },
    SuccinylCoA: { label: 'Succinyl-CoA', c: 4, coa: true },
    Succinate: { label: 'Succinate', c: 4 },
    Fumarate: { label: 'Fumarate', c: 4, double: [1, 2] },
    Malate: { label: 'Malate', c: 4, hydroxyl: 1 }
});
export const KREBS_LABELS = Object.freeze({
    NAD: 'NAD⁺', NADH: 'NADH', H: 'H⁺', Water: 'H₂O', CoA: 'CoA–SH',
    Pi: 'Pᵢ', ADP: 'ADP', ATP: 'ATP', Q: 'Q', QH2: 'QH₂', CO2: 'CO₂', enzyme: 'Enzyme'
});
const stage = (action, inputs, product, outputs, note, kind) => ({ action, inputs, product, outputs, note, kind });
export const KREBS_STEPS = [
    {
        enzymeId: 'CitrateSynthase', label: 'Citrate Synthase', abbreviation: 'CS',
        substrate: 'Oxaloacetate', product: 'Citrate',
        equation: 'Oxaloacetate + acetyl-CoA + H₂O → citrate + CoA–SH',
        note: 'Join a four-carbon acceptor to a two-carbon acetyl group. CoA is a reusable carrier; its own carbons are not counted in the acetyl group. Water is used in thioester hydrolysis; intermediates are omitted.',
        stages: [stage('Join the acetyl group to oxaloacetate', ['Oxaloacetate', 'AcetylCoA', 'Water'], 'Citrate', ['CoA'], '4 C + 2 C form a 6 C product. The acetyl group leaves CoA; CoA–SH is released.', 'join')],
        questions: [
            question('How many carbons are in citrate?', ['Two', 'Four', 'Six'], 2, 'Four from oxaloacetate plus two in the acetyl group make six.'),
            question('What enters this cycle from acetyl-CoA?', ['A two-carbon acetyl group', 'A six-carbon glucose', 'A phosphate group'], 0, 'Acetyl-CoA delivers a two-carbon acetyl group.'),
            question('Is CoA used up permanently here?', ['Yes, its atoms vanish', 'No, it is released and can be reused', 'Yes, it becomes CO₂'], 1, 'CoA is released as CoA–SH and can carry another acyl group.')
        ]
    },
    {
        enzymeId: 'Aconitase', label: 'Aconitase', abbreviation: 'ACO', substrate: 'Citrate', product: 'Isocitrate',
        equation: 'Citrate ⇌ isocitrate (water removed, then added back; net water use = 0)',
        note: 'Move the hydroxyl group to a neighboring carbon without changing the number of carbons. The released water is available to add back; no NAD⁺ or NADH participates.',
        stages: [
            stage('Remove water and form a double bond', ['Citrate'], 'CisAconitate', ['Water'], 'The –OH disappears as the neighboring C–C bond becomes C=C. The six-carbon intermediate is cis-aconitate.', 'dehydrate'),
            stage('Add the water back in the new position', ['Water'], 'Isocitrate', [], 'The C=C becomes C–C and –OH appears on the neighboring carbon. This is an isomerization, not an oxidation.', 'hydrate')
        ],
        questions: [
            question('What changed from citrate to isocitrate?', ['The number of carbons', 'The position of the –OH group', 'NADH became NAD⁺'], 1, 'The hydroxyl group changes position while all six carbons remain.'),
            question('How many carbons are in isocitrate?', ['Four', 'Five', 'Six'], 2, 'Aconitase rearranges the six-carbon molecule; no CO₂ is released.'),
            question('What is the net water use across both parts?', ['Zero: removed then added back', 'Two waters are used', 'One water is made as net output'], 0, 'One water is removed and one is added back, so net use is zero.')
        ]
    },
    {
        enzymeId: 'IsocitrateDehydrogenase', label: 'Isocitrate Dehydrogenase', abbreviation: 'IDH', substrate: 'Isocitrate', product: 'AlphaKetoglutarate',
        equation: 'Isocitrate + NAD⁺ → α-ketoglutarate + CO₂ + NADH + H⁺',
        note: 'Use the NAD⁺-dependent respiratory enzyme. First oxidize an alcohol to a carbonyl; then release one carbon as CO₂. The short-lived intermediate is shown only to make these two changes visible.',
        stages: [
            stage('Oxidize –OH to =O and reduce NAD⁺', ['Isocitrate', 'NAD'], 'Oxalosuccinate', ['NADH', 'H'], 'The substrate is oxidized: –OH becomes =O. NAD⁺ accepts a hydrogen with two electrons and becomes NADH.', 'oxidize'),
            stage('Release one carbon as CO₂', [], 'AlphaKetoglutarate', ['CO2'], 'Six carbons become five plus one CO₂. The NADH made in the first part stays in the local products.', 'decarboxylate')
        ],
        questions: [
            question('Where did the missing carbon go?', ['Into ATP', 'Into CO₂', 'It disappeared'], 1, 'One carbon leaves the six-carbon substrate as CO₂.'),
            question('What happens to NAD⁺?', ['It accepts electrons and becomes NADH', 'It donates electrons and becomes NADPH', 'It becomes ATP'], 0, 'NAD⁺ is reduced to NADH as the substrate is oxidized.'),
            question('How many carbons remain in α-ketoglutarate?', ['Four', 'Six', 'Five'], 2, 'The six-carbon substrate loses one carbon as CO₂, leaving five.')
        ]
    },
    {
        enzymeId: 'AlphaKetoglutarateDehydrogenase', label: 'α-Ketoglutarate Dehydrogenase Complex', abbreviation: 'αKGDH', substrate: 'AlphaKetoglutarate', product: 'SuccinylCoA',
        equation: 'α-Ketoglutarate + CoA–SH + NAD⁺ → succinyl-CoA + CO₂ + NADH + H⁺',
        note: 'This card represents a multienzyme complex. It couples oxidation and CO₂ release to attachment of CoA. Its enzyme-bound cofactors and detailed intermediates are omitted.',
        stages: [stage('Release CO₂, capture electrons, and attach CoA', ['AlphaKetoglutarate', 'CoA', 'NAD'], 'SuccinylCoA', ['CO2', 'NADH', 'H'], 'Five substrate carbons become four plus CO₂. NADH stores electrons; CoA carries the four-carbon succinyl group.', 'complex')],
        questions: [
            question('How many substrate carbons remain in the succinyl group?', ['Four', 'Five', 'Six'], 0, 'A five-carbon substrate releases one carbon as CO₂, leaving four in the succinyl group.'),
            question('Which carrier attaches to the remaining carbon skeleton?', ['ATP', 'CoA', 'NADH'], 1, 'CoA becomes attached to the four-carbon succinyl group.'),
            question('What else is produced along with CO₂?', ['NADPH', 'Oxygen', 'NADH'], 2, 'NAD⁺ accepts electrons during oxidation and becomes NADH.')
        ]
    },
    {
        enzymeId: 'SuccinylCoASynthetase', label: 'Succinyl-CoA Synthetase', abbreviation: 'SCS', substrate: 'SuccinylCoA', product: 'Succinate',
        equation: 'Succinyl-CoA + ADP + Pᵢ → succinate + CoA–SH + ATP',
        note: 'This practice uses the ATP-forming version, matching the game catalog. Other isoforms use GDP and form GTP instead. Energy from the succinyl-CoA thioester drives substrate-level phosphorylation; phosphate intermediates are omitted.',
        stages: [stage('Use thioester energy to form ATP', ['SuccinylCoA', 'ADP', 'Pi'], 'Succinate', ['CoA', 'ATP'], 'CoA is released. A phosphate joins ADP to make ATP; all four substrate carbons remain.', 'phosphorylate')],
        questions: [
            question('What directly makes ATP in this reaction?', ['A proton gradient through ATP synthase', 'Substrate-level phosphorylation', 'Light absorbed by chlorophyll'], 1, 'Energy from the substrate drives phosphate addition to ADP.'),
            question('Where does ATP’s added phosphate come from?', ['Inorganic phosphate, Pᵢ', 'A carbon atom', 'NADH'], 0, 'Inorganic phosphate joins ADP; phosphate intermediates are omitted in the animation.'),
            question('What is released from succinyl-CoA?', ['CO₂', 'NADPH', 'CoA–SH'], 2, 'CoA–SH is released while the four-carbon succinate remains.')
        ]
    },
    {
        enzymeId: 'SuccinateDehydrogenase', label: 'Succinate Dehydrogenase · Complex II', abbreviation: 'SDH', substrate: 'Succinate', product: 'Fumarate',
        equation: 'Succinate + Q → fumarate + QH₂ (through enzyme-bound FAD/FADH₂)',
        note: 'Complex II sits in the inner mitochondrial membrane. FAD stays bound inside it. The familiar “one FADH₂ per turn” describes this electron-capture event, not a free FADH₂ molecule sent to an output tray. QH₂ carries the electrons onward.',
        stages: [
            stage('Remove hydrogen and reduce bound FAD', ['Succinate'], 'Fumarate', [], 'The central C–C becomes C=C. Two H and two electrons go to the enzyme’s FAD, forming bound FADH₂.', 'fad'),
            stage('Pass those electrons to Q', ['Q'], 'Fumarate', ['QH2'], 'Two electrons move through Complex II to Q, which also takes up two H⁺ from solution. Bound FAD is regenerated; QH₂ leaves toward the ETC. Detailed proton exchanges are omitted.', 'quinone')
        ],
        questions: [
            question('What happens to the central carbon–carbon bond?', ['It breaks into two molecules', 'It becomes a double bond', 'It gains phosphate'], 1, 'Removing hydrogen produces a C=C double bond in fumarate.'),
            question('Does FADH₂ leave this enzyme as a free carrier?', ['Yes, it travels like NADH', 'Yes, it becomes ATP', 'No, FAD stays enzyme-bound'], 2, 'FAD/FADH₂ stays in Complex II and transfers its electrons onward.'),
            question('Which carrier leaves with those electrons?', ['QH₂', 'NADPH', 'CO₂'], 0, 'Q accepts the electrons and becomes QH₂, which carries them onward in the membrane.')
        ]
    },
    {
        enzymeId: 'Fumarase', label: 'Fumarase', abbreviation: 'FUM', substrate: 'Fumarate', product: 'Malate',
        equation: 'Fumarate + H₂O → malate',
        note: 'Hydrate a carbon–carbon double bond. Water adds –OH to one carbon and H to the neighboring carbon. This does not split the molecule and does not require NAD⁺.',
        stages: [stage('Add water across the double bond', ['Fumarate', 'Water'], 'Malate', [], 'The C=C becomes C–C; –OH appears on one carbon and H is added to its neighbor. Four carbons remain connected.', 'hydrate')],
        questions: [
            question('What does fumarase add?', ['Carbon dioxide', 'A phosphate group', 'Water'], 2, 'Water adds across the carbon–carbon double bond.'),
            question('Does this reaction split the carbon skeleton?', ['No, all four carbons remain connected', 'Yes, into two two-carbon molecules', 'Yes, one carbon leaves as CO₂'], 0, 'Hydration changes the bond and functional groups, not the carbon count.'),
            question('What happens to the C=C bond?', ['It becomes a triple bond', 'It becomes a single bond', 'It disappears along with both carbons'], 1, 'The double bond becomes a single bond as H and –OH are added.')
        ]
    },
    {
        enzymeId: 'MalateDehydrogenase', label: 'Malate Dehydrogenase', abbreviation: 'MDH', substrate: 'Malate', product: 'Oxaloacetate',
        equation: 'Malate + NAD⁺ → oxaloacetate + NADH + H⁺',
        note: 'Oxidize –OH to =O to regenerate the four-carbon acceptor. NADH can later donate electrons to the ETC. Most respiratory ATP is made later, not in this reaction.',
        stages: [stage('Oxidize malate and regenerate oxaloacetate', ['Malate', 'NAD'], 'Oxaloacetate', ['NADH', 'H'], '–OH becomes =O. NAD⁺ becomes NADH; oxaloacetate can accept another acetyl group.', 'oxidize')],
        questions: [
            question('Which molecule is regenerated to start another turn?', ['Glucose', 'Oxaloacetate', 'Pyruvate'], 1, 'The four-carbon oxaloacetate acceptor is regenerated.'),
            question('Which functional-group change is shown?', ['–OH becomes =O', '=O becomes –OH', 'A phosphate becomes CO₂'], 0, 'Malate’s alcohol is oxidized to a carbonyl.'),
            question('What is the yield of one full turn per acetyl-CoA?', ['Six NADH and no CO₂', 'Only one ATP', 'Two CO₂, three NADH, one FADH₂-equivalent, and one ATP or GTP'], 2, 'A turn yields two CO₂, three NADH, one electron pair captured through bound FAD, and one ATP or GTP. Oxaloacetate is regenerated.')
        ]
    }
];

export function createKrebsSession(index) {
    if (!Number.isInteger(index) || !KREBS_STEPS[index]) return null;
    return { index, stage: 0, phase: 'reaction', docked: [], enzyme: false,
        main: KREBS_STEPS[index].substrate, local: [], used: {}, history: [],
        stored: false, quizIndex: 0, answers: [], mistakes: 0, saved: false };
}
export const krebsStage = s => KREBS_STEPS[s?.index]?.stages[s.stage] ?? null;
export function dockKrebsInput(s, input) {
    if (!s || s.phase !== 'reaction') return false;
    if (input === 'enzyme') { if (s.enzyme) return false; s.enzyme = true; return true; }
    if (!krebsStage(s).inputs.includes(input) || s.docked.includes(input)) return false;
    s.docked.push(input); return true;
}
export const krebsReady = s => Boolean(s?.phase === 'reaction' && s.enzyme && krebsStage(s)?.inputs.every(k => s.docked.includes(k)));
export function runKrebsReaction(s) {
    if (!krebsReady(s)) return false;
    const spec = krebsStage(s);
    for (const input of spec.inputs) s.used[input] = (s.used[input] ?? 0) + 1;
    // Aconitase reuses the water just released; it is not net output.
    if (s.index === 1 && s.stage === 1) s.local.splice(s.local.indexOf('Water'), 1);
    s.main = spec.product; s.local.push(...spec.outputs);
    s.history.push(s.stage); s.phase = 'products'; return true;
}
export function continueKrebsReaction(s) {
    if (!s || s.phase !== 'products' || s.stage >= KREBS_STEPS[s.index].stages.length - 1) return false;
    s.stage++; s.docked = []; s.phase = 'reaction'; return true;
}
export function storeKrebsProducts(s) {
    if (!s || s.phase !== 'products' || s.stage !== KREBS_STEPS[s.index].stages.length - 1 || s.stored) return false;
    s.stored = true; s.phase = 'quiz'; return true;
}
export function answerKrebsQuestion(s, answer) {
    if (!s || s.phase !== 'quiz' || !Number.isInteger(answer)) return { accepted: false };
    const q = KREBS_STEPS[s.index].questions[s.quizIndex];
    if (answer < 0 || answer >= q.options.length) return { accepted: false };
    const correct = answer === q.answer;
    s.answers.push({ question: s.quizIndex, answer, correct });
    if (!correct) s.mistakes++;
    // Always advance after one response; corrections are explained visibly.
    s.quizIndex++;
    if (s.quizIndex === KREBS_STEPS[s.index].questions.length) s.phase = 'complete';
    return { accepted: true, correct, explanation: q.explanation };
}
export function krebsScore(s) {
    const count = KREBS_STEPS[s?.index]?.questions.length ?? 0;
    return count && s.answers.length === count ? Math.round(s.answers.filter(a => a.correct).length / count * 100) : 0;
}
export function krebsSessionComplete(s) {
    return Boolean(s && s.phase === 'complete' && s.stored && s.enzyme &&
        s.main === KREBS_STEPS[s.index]?.product &&
        s.history.length === KREBS_STEPS[s.index].stages.length &&
        s.history.every((n, i) => n === i) && s.quizIndex === 3 && s.answers.length === 3);
}
export function krebsCarbonLedger(s) {
    const spec = KREBS_STEPS[s?.index];
    if (!spec) return null;
    const incoming = KREBS_MOLECULES[spec.substrate].c + (s.index === 0 ? 2 : 0);
    // The acetyl group waits separately until condensation has occurred.
    const waiting = s.index === 0 && !s.history.length ? 2 : 0;
    return { incoming, main: KREBS_MOLECULES[s.main].c,
        co2: s.local.filter(k => k === 'CO2').length, waiting };
}
export function krebsOverviewSnapshot(hasPractice = () => false) {
    const mastered = KREBS_STEPS.filter(step => hasPractice(step.enzymeId)).map(step => step.enzymeId);
    return { mastered, canAutomate: mastered.length === KREBS_STEPS.length, totalEnzymes: KREBS_STEPS.length };
}
export function createKrebsBatch() { return { turns: 0, co2: 0, nadh: 0, fadPairs: 0, qh2: 0, atp: 0, oxaloacetate: 1, acetylUsed: 0 }; }
export function recordKrebsBatchStep(batch, s) {
    if (!batch || !s?.stored || s.index !== (batch.nextIndex ?? 0)) return false;
    for (const k of s.local) {
        if (k === 'CO2') batch.co2++;
        if (k === 'NADH') batch.nadh++;
        if (k === 'ATP') batch.atp++;
        if (k === 'QH2') { batch.qh2++; batch.fadPairs++; }
    }
    if (s.index === 0) { batch.acetylUsed++; batch.oxaloacetate = 0; }
    batch.nextIndex = (s.index + 1) % 8;
    if (s.index === 7) { batch.turns++; batch.oxaloacetate = 1; }
    return true;
}
