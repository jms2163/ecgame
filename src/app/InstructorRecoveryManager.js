// --------------------------------------------------
// InstructorRecoveryManager.js
// Verifies instructor-signed recovery packages and applies them atomically
// --------------------------------------------------

import gameState from "./GameState.js";
import SaveManager from "./SaveManager.js";
import VersionManager from "./VersionManager.js";
import GameStateObserver from "./GameStateObserver.js";
import RecoveryCodec from "./RecoveryCodec.js";
import InstructorRecoveryPublicKey from "./InstructorRecoveryPublicKey.js";

const RECOVERY_SCHEMA_VERSION = "1.0";
const BEGIN_RECOVERY = "-----BEGIN ECGAME INSTRUCTOR RECOVERY-----";
const END_RECOVERY = "-----END ECGAME INSTRUCTOR RECOVERY-----";
const RECOVERY_MARKER_PREFIX = "ECGame_Applied_Recovery_";
const RECOVERY_BACKUP_PREFIX = "ECGame_Pre_Recovery_Backup_";

const InstructorRecoveryManager = {

    parseRecoveryText(text) {
        return RecoveryCodec.extractWrappedPayload(text, BEGIN_RECOVERY, END_RECOVERY);
    },

    async inspectRecoveryText(text, options = {}) {
        const recovery = this.parseRecoveryText(text);
        this.validateRecoveryShape(recovery);

        const configuredKey = options.publicKey ?? InstructorRecoveryPublicKey;
        if (!configuredKey?.spkiBase64 || configuredKey.keyId === "NOT_CONFIGURED") {
            throw new Error("Instructor recovery has not been configured for this ECGame installation.");
        }
        if (recovery.signingKeyId !== configuredKey.keyId) {
            throw new Error("This recovery was issued with a different instructor key.");
        }

        const signedContent = structuredClone(recovery);
        delete signedContent.signature;
        const verified = await this.verifySignature({
            content: RecoveryCodec.canonicalStringify(signedContent),
            signatureBase64: recovery.signature.value,
            publicKeySpkiBase64: configuredKey.spkiBase64
        });
        if (!verified) {
            throw new Error("Instructor signature verification failed. The recovery may be edited or unauthorized.");
        }

        const currentProfile = this.getCurrentProfileStatus(recovery.target);
        if (!currentProfile.allowed) throw new Error(currentProfile.message);

        const alreadyApplied = Boolean(
            localStorage.getItem(`${RECOVERY_MARKER_PREFIX}${recovery.recoveryId}`)
        );
        if (alreadyApplied) throw new Error("This instructor recovery was already applied in this browser.");

        return {
            recovery,
            currentProfile,
            summary: {
                recoveryId: recovery.recoveryId,
                issuedAt: recovery.issuedAt,
                mode: recovery.mode,
                sourceType: recovery.source.type,
                student: recovery.target.fullName,
                gamertag: recovery.target.gamertag,
                playerId: recovery.target.playerId,
                blankProfile: currentProfile.blank
            }
        };
    },

    validateRecoveryShape(recovery) {
        if (!recovery || typeof recovery !== "object" || Array.isArray(recovery)) {
            throw new Error("The recovery payload is invalid.");
        }
        if (recovery.recoverySchemaVersion !== RECOVERY_SCHEMA_VERSION) {
            throw new Error("Unsupported instructor recovery schema.");
        }
        if (!/^[0-9a-f-]{36}$/i.test(recovery.recoveryId || "")) {
            throw new Error("The recovery ID is invalid.");
        }
        if (!["merge-progress-report", "replace-full-backup"].includes(recovery.mode)) {
            throw new Error("The recovery mode is unsupported.");
        }
        if (!recovery.target?.playerId || !recovery.target?.fullName) {
            throw new Error("The recovery target identity is incomplete.");
        }
        if (!recovery.source?.type || !recovery.payload) {
            throw new Error("The recovery source or payload is missing.");
        }
        if (recovery.signature?.algorithm !== "ECDSA-P256-SHA256" ||
            recovery.signature?.format !== "ieee-p1363" ||
            typeof recovery.signature?.value !== "string") {
            throw new Error("The instructor signature metadata is invalid.");
        }
    },

    async verifySignature({ content, signatureBase64, publicKeySpkiBase64 }) {
        if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable.");
        const publicKey = await globalThis.crypto.subtle.importKey(
            "spki",
            RecoveryCodec.base64ToBytes(publicKeySpkiBase64),
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["verify"]
        );
        return globalThis.crypto.subtle.verify(
            { name: "ECDSA", hash: "SHA-256" },
            publicKey,
            RecoveryCodec.base64ToBytes(signatureBase64),
            new TextEncoder().encode(content)
        );
    },

    getCurrentProfileStatus(target) {
        const id = gameState.player?.id ?? null;
        const name = String(gameState.player?.name ?? "").trim();
        const blank = (id === null || id === "") && name === "" &&
            !gameState.player?.nameLockedAtMs;
        const matching = id === target.playerId && name === target.fullName;
        return {
            allowed: blank || matching,
            blank,
            matching,
            message: blank || matching
                ? ""
                : "Recovery stopped: this browser contains a different player profile."
        };
    },

    async applyRecoveryText(text, options = {}) {
        const inspection = await this.inspectRecoveryText(text, options);
        const { recovery } = inspection;
        const previousState = structuredClone(gameState);
        const previousStoredSave = localStorage.getItem("ECGame_Save");
        const backupKey = `${RECOVERY_BACKUP_PREFIX}${recovery.recoveryId}`;

        localStorage.setItem(
            backupKey,
            previousStoredSave ?? JSON.stringify(previousState)
        );

        try {
            if (recovery.mode === "replace-full-backup") {
                this.applyFullReplacement(recovery);
            } else {
                this.applyProgressReportMerge(recovery);
            }

            this.validateResultIdentity(recovery.target);
            const saved = SaveManager.save({
                reason: `instructor-recovery:${recovery.recoveryId}`
            });
            if (!saved) throw new Error("The recovered state could not be saved.");

            localStorage.setItem(
                `${RECOVERY_MARKER_PREFIX}${recovery.recoveryId}`,
                new Date().toISOString()
            );
            GameStateObserver.notify("game-state-loaded", {
                source: "instructor-recovery",
                recoveryId: recovery.recoveryId
            });
            return {
                ok: true,
                backupKey,
                recoveryId: recovery.recoveryId,
                mode: recovery.mode,
                message: `Instructor recovery applied for ${recovery.target.fullName}. Reload ECGame to continue.`
            };
        } catch (error) {
            this.replaceObject(gameState, previousState);
            if (previousStoredSave === null) {
                localStorage.removeItem("ECGame_Save");
            } else {
                localStorage.setItem("ECGame_Save", previousStoredSave);
            }
            throw error;
        }
    },

    applyFullReplacement(recovery) {
        const nextState = recovery.payload?.state;
        if (!nextState || typeof nextState !== "object" || Array.isArray(nextState)) {
            throw new Error("The approved full backup has no valid game state.");
        }
        if (!VersionManager.isCompatible(
            VersionManager.getSaveVersion(nextState),
            VersionManager.getCurrentVersion()
        )) {
            throw new Error("This approved backup is not compatible with the current game.");
        }
        if (nextState.player?.id !== recovery.target.playerId ||
            nextState.player?.name !== recovery.target.fullName) {
            throw new Error("The approved backup identity does not match its recovery target.");
        }
        this.replaceObject(gameState, structuredClone(nextState));
    },

    applyProgressReportMerge(recovery) {
        const report = recovery.payload?.report;
        if (!report?.profile || !report?.progress) {
            throw new Error("The approved progress report payload is incomplete.");
        }
        if (report.profile.playerId !== recovery.target.playerId ||
            report.profile.fullName !== recovery.target.fullName) {
            throw new Error("The progress report identity does not match its recovery target.");
        }

        gameState.player ??= {};
        if (!gameState.player.id) {
            gameState.player.id = report.profile.playerId;
            gameState.player.name = report.profile.fullName;
            gameState.player.displayName = report.profile.gamertag || "Player";
            gameState.player.profileSchemaVersion = "1.0";
            gameState.player.profileCreatedAtMs = Date.parse(report.profile.profileCreatedAt) || Date.now();
            gameState.player.nameLockedAtMs = Date.parse(report.profile.nameLockedAt) || Date.now();
            gameState.player.gamertagUpdatedAtMs = Date.parse(report.profile.gamertagUpdatedAt) || Date.now();
        }

        const progress = report.progress;
        gameState.player.level = this.maximum(gameState.player.level, progress.player?.level);
        gameState.player.xp = this.maximum(gameState.player.xp, progress.player?.xp);

        gameState.zones ??= {};
        for (const zone of progress.zones ?? []) {
            if (!zone?.zoneId) continue;
            gameState.zones[zone.zoneId] ??= { state: {} };
            if (zone.unlocked) gameState.zones[zone.zoneId].unlocked = true;
            if (zone.completed) gameState.zones[zone.zoneId].completed = true;
        }
        gameState.zones.features ??= {};
        for (const featureId of progress.unlockedFeatures ?? []) {
            gameState.zones.features[featureId] = true;
        }

        gameState.registry ??= {};
        gameState.registry.resources ??= {};
        const sourceATP = progress.resources?.atp ?? {};
        const atp = gameState.registry.resources.atp ??= {};
        atp.current = this.maximum(atp.current, sourceATP.current);
        atp.maximum = this.maximum(atp.maximum, sourceATP.maximum);
        const sourceParticles = progress.resources?.particles ?? {};
        const particles = gameState.registry.resources.particles ??= {};
        particles.capacity = this.maximum(particles.capacity, sourceParticles.capacity);
        for (const type of ["proton", "neutron", "electron"]) {
            particles[type] = this.maximum(particles[type], sourceParticles.current?.[type]);
        }
        particles.lifetimeCollected ??= {};
        for (const type of ["proton", "neutron", "electron"]) {
            particles.lifetimeCollected[type] = this.maximum(
                particles.lifetimeCollected[type],
                sourceParticles.lifetimeCollected?.[type]
            );
        }

        gameState.registry.quests ??= {};
        const statusRank = { unknown: 0, "in-progress": 1, ready: 2, claimed: 3 };
        for (const sourceQuest of progress.quests ?? []) {
            if (!sourceQuest?.questId) continue;
            const quest = gameState.registry.quests[sourceQuest.questId] ??= {};
            if ((statusRank[sourceQuest.status] ?? 0) > (statusRank[quest.status] ?? 0)) {
                quest.status = sourceQuest.status;
            }
            for (const [sourceField, targetField] of [
                ["activatedAt", "activatedAtMs"],
                ["readyAt", "readyAtMs"],
                ["viewedAt", "viewedAtMs"],
                ["claimedAt", "claimedAtMs"]
            ]) {
                const timestamp = Date.parse(sourceQuest[sourceField]);
                if (!Number.isFinite(quest[targetField]) && Number.isFinite(timestamp)) {
                    quest[targetField] = timestamp;
                }
            }
            quest.objectiveBaselines ??= {};
        }

        gameState.registry.discoveries ??= [];
        for (const id of progress.discoveries?.registryIds ?? []) {
            if (typeof id === "string" && !gameState.registry.discoveries.includes(id)) {
                gameState.registry.discoveries.push(id);
            }
        }
        gameState.discoveries ??= {};
        const discoveredAt = Date.parse(report.report?.generatedAt) || Date.now();
        for (const [category, ids] of Object.entries(progress.discoveries?.byCategory ?? {})) {
            if (!Array.isArray(ids)) continue;
            gameState.discoveries[category] ??= {};
            for (const id of ids) {
                if (typeof id === "string") {
                    gameState.discoveries[category][id] ??= { discoveredAt, count: 1 };
                }
            }
        }

        this.mergeResearch(progress.research, discoveredAt);
    },

    mergeResearch(source, fallbackTime) {
        if (!source) return;
        gameState.registry.research ??= {};
        const research = gameState.registry.research;
        research.completedExperiments ??= {};
        research.bestExperimentScores ??= {};
        research.stars ??= {};
        research.experimentSubmissions ??= {};
        for (const record of source.completedExperiments ?? []) {
            if (!record?.activityId || !record.completed) continue;
            research.completedExperiments[record.activityId] ??= {
                completedAtMs: Date.parse(record.completedAt) || fallbackTime
            };
        }
        for (const record of source.bestScores ?? []) {
            if (!record?.activityId || !Number.isFinite(record.score)) continue;
            const current = research.bestExperimentScores[record.activityId];
            if (!current || this.scoreValue(record.score) > this.scoreValue(current)) {
                research.bestExperimentScores[record.activityId] = { score: record.score };
            }
        }
        for (const record of source.stars ?? []) {
            if (!record?.activityId || !record.earned) continue;
            research.stars[record.activityId] ??= {
                awardedAtMs: Date.parse(record.awardedAt) || fallbackTime
            };
        }
    },

    scoreValue(value) {
        if (Number.isFinite(value)) return value;
        return Number(value?.scorePercent ?? value?.score ?? value?.scorePoints) || 0;
    },

    maximum(left, right) {
        const a = Number(left);
        const b = Number(right);
        return Math.max(Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0);
    },

    validateResultIdentity(target) {
        if (gameState.player?.id !== target.playerId || gameState.player?.name !== target.fullName) {
            throw new Error("Recovered game identity validation failed.");
        }
    },

    replaceObject(target, source) {
        for (const key of Object.keys(target)) delete target[key];
        Object.assign(target, source);
    }
};

export {
    RECOVERY_SCHEMA_VERSION,
    BEGIN_RECOVERY,
    END_RECOVERY
};
export default InstructorRecoveryManager;
