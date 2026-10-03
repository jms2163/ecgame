import Progress from './MetabolismPracticeProgress.js';
import { KREBS_STEPS, createKrebsSession, krebsScore, krebsSessionComplete } from './KrebsPracticeModel.js';

// Permanent educational access within Metabolism; no reconstruction benefits.
const Manager = {
    session: null,
    start(index) { const next = createKrebsSession(index); if (!next) return false; this.session = next; return true; },
    reset() { this.session = null; },
    complete(nowMs = Date.now()) {
        const s = this.session;
        if (!krebsSessionComplete(s)) return { success: false, reason: 'activity-incomplete' };
        const scorePercent = krebsScore(s);
        const result = scorePercent === 100
            ? Progress.recordPerfectPractice(KREBS_STEPS[s.index].enzymeId, `krebs-practice-${s.index + 1}`, nowMs)
            : { success: true, reason: 'practice-complete' };
        if (result.success) s.saved = true;
        return { ...result, scorePercent };
    }
};
export default Manager;
