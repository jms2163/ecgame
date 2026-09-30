// Activity-local carbon accounting. No player ATP or molecule inventory is spent.
export const FIXATION_ACTIVITY_ID = "calvin-carbon-fixation";

export function createFixationSession() {
    return { phase: "loading", enzymeDocked: false, ruBP: false, co2: false, water: false,
        reactions: 0, mistakes: 0, carbonSource: null };
}

export function dockFixationInput(session, input) {
    if (input === "H2O") {
        if (session.phase !== "intermediate" || session.water) return false;
        session.water = true;
        session.phase = "hydrated";
        return true;
    }
    if (session.phase !== "loading") return false;
    const field = { RuBisCO: "enzymeDocked", RuBP: "ruBP", CO2: "co2" }[input];
    if (!field || session[field]) return false;
    session[field] = true;
    return true;
}

export function canRunFixation(session) {
    return session.phase === "loading" && session.reactions < 3 &&
        session.enzymeDocked && session.ruBP && session.co2;
}

export function beginFixation(session) {
    if (!canRunFixation(session)) return false;
    session.phase = "intermediate";
    return true;
}

export function finishFixation(session) {
    if (session.phase !== "hydrated" || !session.water) return false;
    session.reactions += 1;
    session.ruBP = false;
    session.co2 = false;
    session.water = false;
    session.phase = "products";
    return true;
}

export function storeFixationProducts(session) {
    if (session.phase !== "products") return false;
    session.phase = "stored";
    return true;
}

export function advanceFixation(session) {
    if (session.phase !== "stored") return false;
    session.phase = session.reactions === 3 ? "quiz" : "loading";
    return true;
}

export function answerFixation(session, answer) {
    if (session.phase !== "quiz") return false;
    if (answer !== "CO2") {
        session.mistakes += 1;
        return false;
    }
    session.carbonSource = answer;
    session.phase = "complete";
    return true;
}

export function fixationLedger(session) {
    const rounds = session.reactions;
    return { co2Used: rounds, ruBPUsed: rounds, pgaProduced: rounds * 2,
        carbonIn: rounds * 6, carbonOut: rounds * 6, newlyFixedCarbon: rounds,
        waterUsed: rounds, atpSpent: 0, atpMade: 0 };
}
