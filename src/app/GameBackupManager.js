// --------------------------------------------------
// GameBackupManager.js
// Full student-controlled export; restoration requires instructor approval
// --------------------------------------------------

import gameState from "./GameState.js";
import RecoveryCodec from "./RecoveryCodec.js";

const BACKUP_SCHEMA_VERSION = "1.0";
const BEGIN_BACKUP = "-----BEGIN ECGAME FULL BACKUP-----";
const END_BACKUP = "-----END ECGAME FULL BACKUP-----";

const GameBackupManager = {

    async createBackupFile({ state = gameState, createdAtMs = Date.now() } = {}) {
        const snapshot = structuredClone(state);
        const content = {
            backupSchemaVersion: BACKUP_SCHEMA_VERSION,
            createdAt: new Date(createdAtMs).toISOString(),
            profile: {
                playerId: snapshot.player?.id ?? null,
                fullName: snapshot.player?.name ?? "",
                gamertag: snapshot.player?.displayName ?? ""
            },
            game: {
                saveVersion: snapshot.saveVersion ?? "unknown"
            },
            state: snapshot
        };
        const checksum = await RecoveryCodec.sha256Hex(
            RecoveryCodec.canonicalStringify(content)
        );
        const payload = {
            ...content,
            integrity: {
                algorithm: "SHA-256",
                purpose: "Accidental corruption detection before instructor approval",
                checksum
            }
        };
        const encoded = RecoveryCodec.encodeUtf8Base64(JSON.stringify(payload));
        const suffix = String(payload.profile.playerId || "blank")
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 8)
            .toLowerCase();
        const filename = `ECGame-backup-${content.createdAt.slice(0, 10)}-${suffix}.txt`;
        const text = [
            "ECGAME FULL BACKUP",
            `Backup-Schema: ${BACKUP_SCHEMA_VERSION}`,
            `Created-UTC: ${content.createdAt}`,
            `Player-ID: ${payload.profile.playerId ?? "none"}`,
            `Payload-Checksum-SHA256: ${checksum}`,
            "Notice: This file contains the complete local game state.",
            "Notice: It cannot be restored until approved by the instructor.",
            "",
            BEGIN_BACKUP,
            RecoveryCodec.wrapBase64(encoded),
            END_BACKUP,
            ""
        ].join("\n");
        return { filename, text, payload, checksum };
    },

    async verifyBackupText(text) {
        try {
            const payload = RecoveryCodec.extractWrappedPayload(text, BEGIN_BACKUP, END_BACKUP);
            if (payload?.backupSchemaVersion !== BACKUP_SCHEMA_VERSION || !payload?.state) {
                throw new Error("Unsupported or incomplete backup payload.");
            }
            const content = structuredClone(payload);
            delete content.integrity;
            const checksum = await RecoveryCodec.sha256Hex(
                RecoveryCodec.canonicalStringify(content)
            );
            if (checksum !== payload.integrity?.checksum) {
                throw new Error("Backup checksum mismatch. The file is damaged or edited.");
            }
            return { ok: true, payload, errors: [] };
        } catch (error) {
            return { ok: false, payload: null, errors: [error.message] };
        }
    },

    async downloadBackup() {
        const backup = await this.createBackupFile();
        if (typeof document === "undefined" || typeof URL?.createObjectURL !== "function") {
            return { ok: true, message: "Backup prepared.", ...backup };
        }
        const url = URL.createObjectURL(new Blob([backup.text], { type: "text/plain;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = backup.filename;
        link.hidden = true;
        document.body.appendChild(link);
        try {
            link.click();
        } finally {
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        return { ok: true, message: `Backup download started: ${backup.filename}`, ...backup };
    }
};

export { BACKUP_SCHEMA_VERSION, BEGIN_BACKUP, END_BACKUP };
export default GameBackupManager;
