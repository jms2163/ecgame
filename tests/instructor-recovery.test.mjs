import assert from "node:assert/strict";
import fs from "node:fs";
import { generateKeyPairSync } from "node:crypto";
import gameState from "../src/app/GameState.js";
import SaveManager from "../src/app/SaveManager.js";
import RecoveryCodec from "../src/app/RecoveryCodec.js";
import GameBackupManager from "../src/app/GameBackupManager.js";
import InstructorRecoveryManager, {
    BEGIN_RECOVERY,
    END_RECOVERY
} from "../src/app/InstructorRecoveryManager.js";
import {
    createSignedRecovery,
    getSigningIdentity,
    parseRecoverySource
} from "../tools/create-instructor-recovery.mjs";

class MemoryStorage {
    constructor() { this.values = new Map(); }
    getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
    setItem(key, value) { this.values.set(String(key), String(value)); }
    removeItem(key) { this.values.delete(String(key)); }
    clear() { this.values.clear(); }
}

globalThis.localStorage = new MemoryStorage();
const initialState = structuredClone(gameState);
const originalSave = SaveManager.save;

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
const identity = getSigningIdentity(privatePem);
const publicKey = {
    keyId: identity.keyId,
    spkiBase64: identity.publicDer.toString("base64")
};

function resetState({ blank = true } = {}) {
    for (const key of Object.keys(gameState)) delete gameState[key];
    Object.assign(gameState, structuredClone(initialState));
    if (blank) {
        Object.assign(gameState.player, {
            id: null,
            name: "",
            displayName: "",
            profileCreatedAtMs: null,
            nameLockedAtMs: null,
            gamertagUpdatedAtMs: null,
            xp: 0
        });
    }
    localStorage.clear();
    SaveManager.save = originalSave;
}

async function makeReportText({ playerId = "11111111-1111-4111-8111-111111111111", xp = 2150 } = {}) {
    const content = {
        reportSchemaVersion: "1.0",
        report: {
            reportId: "22222222-2222-4222-8222-222222222222",
            generatedAt: "2026-09-08T14:41:49.724Z",
            source: "ECGame",
            environment: "beta"
        },
        game: { activityId: "ecgame-bio101-beta", saveVersion: "under-construction" },
        profile: {
            playerId,
            fullName: "Example Student",
            gamertag: "Example",
            profileCreatedAt: "2026-09-01T14:31:05.459Z",
            nameLockedAt: "2026-09-01T14:31:05.459Z",
            gamertagUpdatedAt: "2026-09-01T14:31:05.459Z"
        },
        progress: {
            player: { level: 1, xp, currentZone: "moleculeLab", currentZoom: 0 },
            zones: [
                { zoneId: "quantum", unlocked: true, completed: true },
                { zoneId: "moleculeLab", unlocked: true, completed: true }
            ],
            unlockedFeatures: ["isotope_mode"],
            resources: {
                atp: { current: 50, maximum: 50 },
                particles: {
                    capacity: 57,
                    current: { proton: 57, neutron: 57, electron: 57 },
                    lifetimeCollected: { proton: 610, neutron: 558, electron: 595 }
                }
            },
            inventory: [],
            quests: [{
                questId: "q1_particles",
                status: "claimed",
                claimedAt: "2026-09-01T14:06:59.193Z"
            }],
            discoveries: {
                registryIds: ["plasma_membrane"],
                byCategory: { atoms: ["H"], isotopes: ["H1"], molecules: ["H2O"] }
            },
            achievements: [],
            certifications: [],
            research: { completedExperiments: [], bestScores: [], stars: [], submissions: [] },
            journal: { recordCount: 0, records: [] }
        }
    };
    const checksum = await RecoveryCodec.sha256Hex(RecoveryCodec.canonicalStringify(content));
    const payload = { ...content, integrity: { algorithm: "SHA-256", checksum } };
    const encoded = RecoveryCodec.encodeUtf8Base64(JSON.stringify(payload));
    return [
        "ECGAME PROGRESS REPORT",
        "Wrapper-Version: 1",
        "Report-Schema: 1.0",
        `Payload-Checksum-SHA256: ${checksum}`,
        "",
        "-----BEGIN ECGAME PROGRESS PAYLOAD-----",
        RecoveryCodec.wrapBase64(encoded),
        "-----END ECGAME PROGRESS PAYLOAD-----"
    ].join("\n");
}

function renderedLegacyVersion(cleanText) {
    return [
        "#",
        "Page",
        "of 5svg",
        "canvas",
        cleanText
            .replace("-----BEGIN", "\\-----BEGIN")
            .replace("-----END", "\\-----END")
            .replace(/\n(?=[A-Za-z0-9+/]{20})/g, "\ncanvas\n")
    ].join("\n");
}

try {
    const cleanReport = await makeReportText();
    const cleanParsed = await parseRecoverySource(cleanReport);
    assert.equal(cleanParsed.source.type, "progress-report");
    const legacyParsed = await parseRecoverySource(renderedLegacyVersion(cleanReport));
    assert.equal(legacyParsed.source.type, "rendered-legacy-progress-report");

    resetState();
    const signedReport = await createSignedRecovery({ sourceText: cleanReport, privatePem });
    await assert.rejects(
        InstructorRecoveryManager.inspectRecoveryText(cleanReport, { publicKey }),
        /payload markers/i,
        "a progress report must not be accepted directly by the student recovery UI"
    );
    const inspection = await InstructorRecoveryManager.inspectRecoveryText(
        signedReport.text,
        { publicKey }
    );
    assert.equal(inspection.summary.blankProfile, true);
    const applied = await InstructorRecoveryManager.applyRecoveryText(
        signedReport.text,
        { publicKey }
    );
    assert.equal(applied.ok, true);
    assert.equal(gameState.player.name, "Example Student");
    assert.equal(gameState.player.xp, 2150);
    assert.equal(gameState.registry.quests.q1_particles.status, "claimed");
    assert.ok(gameState.discoveries.molecules.H2O);
    await assert.rejects(
        InstructorRecoveryManager.applyRecoveryText(signedReport.text, { publicKey }),
        /already applied/i
    );

    resetState({ blank: false });
    Object.assign(gameState.player, {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Example Student",
        displayName: "Example",
        nameLockedAtMs: 1,
        xp: 9000
    });
    const secondSignedReport = await createSignedRecovery({ sourceText: cleanReport, privatePem });
    await InstructorRecoveryManager.applyRecoveryText(secondSignedReport.text, { publicKey });
    assert.equal(gameState.player.xp, 9000, "report recovery must preserve newer progress");

    resetState({ blank: false });
    Object.assign(gameState.player, {
        id: "99999999-9999-4999-8999-999999999999",
        name: "Different Student",
        nameLockedAtMs: 1
    });
    const thirdSignedReport = await createSignedRecovery({ sourceText: cleanReport, privatePem });
    await assert.rejects(
        InstructorRecoveryManager.applyRecoveryText(thirdSignedReport.text, { publicKey }),
        /different player profile/i
    );

    resetState({ blank: false });
    Object.assign(gameState.player, {
        id: "33333333-3333-4333-8333-333333333333",
        name: "Backup Student",
        displayName: "Backup",
        nameLockedAtMs: 1,
        xp: 4321
    });
    const backup = await GameBackupManager.createBackupFile({ state: gameState });
    assert.equal((await GameBackupManager.verifyBackupText(backup.text)).ok, true);
    const signedBackup = await createSignedRecovery({ sourceText: backup.text, privatePem });
    resetState();
    await InstructorRecoveryManager.applyRecoveryText(signedBackup.text, { publicKey });
    assert.equal(gameState.player.name, "Backup Student");
    assert.equal(gameState.player.xp, 4321);

    resetState();
    const tampered = InstructorRecoveryManager.parseRecoveryText(signedReport.text);
    tampered.payload.report.progress.player.xp = 999999;
    const tamperedText = [
        "ECGAME INSTRUCTOR RECOVERY",
        BEGIN_RECOVERY,
        RecoveryCodec.wrapBase64(RecoveryCodec.encodeUtf8Base64(JSON.stringify(tampered))),
        END_RECOVERY
    ].join("\n");
    await assert.rejects(
        InstructorRecoveryManager.inspectRecoveryText(tamperedText, { publicKey }),
        /signature verification failed/i
    );

    resetState();
    const rollbackSigned = await createSignedRecovery({ sourceText: cleanReport, privatePem });
    const beforeRollback = structuredClone(gameState);
    SaveManager.save = () => false;
    await assert.rejects(
        InstructorRecoveryManager.applyRecoveryText(rollbackSigned.text, { publicKey }),
        /could not be saved/i
    );
    assert.deepEqual(gameState, beforeRollback, "failed recovery must roll back live state");

    const drawerSource = fs.readFileSync(
        new URL("../src/app/PlayerBadgeDrawer.js", import.meta.url),
        "utf8"
    );
    assert.match(drawerSource, /Download Backup File/);
    assert.match(drawerSource, /Instructor Recovery/);
    assert.match(drawerSource, /setupMode: true/);
    assert.match(drawerSource, /Use Instructor Recovery/);

    console.log("PASS: signed instructor recovery supports clean and rendered legacy reports, full backups, blank and matching profiles, tamper rejection, replay blocking, and rollback.");
} finally {
    SaveManager.save = originalSave;
    resetState({ blank: false });
}
