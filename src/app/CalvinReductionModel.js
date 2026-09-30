export const REDUCTION_ACTIVITY_ID = "calvin-reduction";
export const REDUCTION_ENZYMES = ["PhosphoglycerateKinase", "Glyceraldehyde3PhosphateDehydrogenase"];
export const REDUCTION_QUESTIONS = [
    { prompt: "What does ATP supply in this reaction?", answer: "phosphate", options: [["phosphate", "A phosphate group and energy for phosphorylation"], ["carbon", "Three new carbon atoms"], ["electrons", "The electrons used for reduction"]], feedback: "ATP transfers a phosphate group to 3-PGA and becomes ADP." },
    { prompt: "What does NADPH supply?", answer: "electrons", options: [["carbon", "New carbon atoms"], ["electrons", "Electrons for reduction"], ["phosphate", "The phosphate that stays on G3P"]], feedback: "NADPH supplies an electron pair for reduction and becomes NADP⁺." },
    { prompt: "How many carbons are in each G3P?", answer: "three", options: [["six", "Six"], ["one", "One"], ["three", "Three—the same number as in 3-PGA"]], feedback: "Reduction changes the chemical groups, not the three-carbon backbone." },
    { prompt: "Are all six G3P the net output of a complete Calvin cycle?", answer: "one", options: [["all", "Yes—all six can leave while the cycle continues"], ["one", "No—five are needed for regeneration, leaving one net G3P"], ["none", "No—G3P contains no fixed carbon"]], feedback: "Six G3P are formed in reduction. Five are needed to regenerate three RuBP; one is net output." }
];

export function createReductionSession() {
    return { phase: "phosphorylation", pgk: false, gapdh: false, pga: false, atp: false, nadph: false, hplus:false,
        pgkRuns: 0, gapdhRuns: 0, stored: 0, quizIndex: 0, firstAnswers: [], mistakes: 0, saved: false,
        allocation: { regeneration: [], net: [] } };
}
export function dockReductionInput(s, input) {
    const field = s.phase === "phosphorylation" ? { PGK:"pgk", PGA:"pga", ATP:"atp" }[input] :
        s.phase === "reduction" ? { GAPDH:"gapdh", NADPH:"nadph", HPLUS:"hplus" }[input] : null;
    if (!field || s[field]) return false;
    s[field] = true; return true;
}
export function phosphorylatePGA(s) {
    if (s.phase !== "phosphorylation" || !s.pgk || !s.pga || !s.atp || s.pgkRuns >= 6) return false;
    s.pgkRuns++; s.atp = false; s.pga = false; s.phase = "phosphorylated"; return true;
}
export function moveToReduction(s) {
    if (s.phase !== "phosphorylated") return false;
    s.phase = "reduction"; return true;
}
export function reduceBPG(s) {
    if (s.phase !== "reduction" || !s.gapdh || !s.nadph || !s.hplus || s.pgkRuns !== s.gapdhRuns + 1) return false;
    s.gapdhRuns++; s.nadph = false; s.hplus=false; s.phase = "products"; return true;
}
export function storeReductionProducts(s) {
    if (s.phase !== "products" || s.gapdhRuns !== s.stored + 1) return false;
    s.stored++; s.phase = "stored"; return true;
}
export function advanceReduction(s) {
    if (s.phase !== "stored") return false;
    s.phase = s.stored === 6 ? "allocation" : "phosphorylation"; return true;
}
export function repeatRemainingReduction(s) {
    if (s.phase !== "stored" || s.stored < 1 || s.stored >= 6 || !s.pgk || !s.gapdh) return false;
    const next = structuredClone(s);
    while (next.stored < 6) {
        if (!advanceReduction(next) || !dockReductionInput(next,"PGA") || !dockReductionInput(next,"ATP") ||
            !phosphorylatePGA(next) || !moveToReduction(next) || !dockReductionInput(next,"NADPH") ||
            !dockReductionInput(next,"HPLUS") || !reduceBPG(next) || !storeReductionProducts(next)) return false;
    }
    Object.assign(s,next);return true;
}
export function allocateReductionG3P(s,pool,index) {
    if (s.phase !== "allocation" || !["regeneration","net"].includes(pool) || !Number.isInteger(index) || index < 0 || index >= 6) return false;
    if (s.allocation.regeneration.includes(index) || s.allocation.net.includes(index)) return false;
    if (s.allocation[pool].length >= (pool === "regeneration" ? 5 : 1)) return false;
    s.allocation[pool].push(index);return true;
}
export function finishReductionAllocation(s) {
    if (s.phase !== "allocation" || s.allocation.regeneration.length !== 5 || s.allocation.net.length !== 1) return false;
    s.phase = "quiz";return true;
}
export function answerReduction(s, answer) {
    if (s.phase !== "quiz") return false;
    const correct = REDUCTION_QUESTIONS[s.quizIndex].answer === answer;
    if (s.firstAnswers[s.quizIndex] === undefined) s.firstAnswers[s.quizIndex] = correct;
    if (!correct) { s.mistakes++; return false; }
    s.quizIndex++;
    if (s.quizIndex === REDUCTION_QUESTIONS.length) s.phase = "complete";
    return true;
}
export function reductionScore(s) {
    return Math.round(100 * s.firstAnswers.filter(Boolean).length / REDUCTION_QUESTIONS.length);
}
export function reductionLedger(s) {
    return { pgaUsed:s.pgkRuns, atpUsed:s.pgkRuns, adpFormed:s.pgkRuns, nadphUsed:s.gapdhRuns,
        nadpFormed:s.gapdhRuns, protonsUsed:s.gapdhRuns, piFormed:s.gapdhRuns, g3pFormed:s.gapdhRuns, stored:s.stored,
        carbonIn:s.pgkRuns*3, carbonInProducts:s.gapdhRuns*3, carbonInIntermediate:(s.pgkRuns-s.gapdhRuns)*3,
        // Original substrate P plus the three P groups on each used ATP.
        phosphorusIn:s.pgkRuns*4,
        phosphorusOut:s.pgkRuns*2 + s.gapdhRuns*2 + (s.pgkRuns-s.gapdhRuns)*2 };
}
