import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash, createPrivateKey, createPublicKey, randomUUID, sign } from "node:crypto";
import { pathToFileURL } from "node:url";
import RecoveryCodec from "../src/app/RecoveryCodec.js";

const BEGIN_REPORT = "-----BEGIN ECGAME PROGRESS PAYLOAD-----";
const END_REPORT = "-----END ECGAME PROGRESS PAYLOAD-----";
const BEGIN_BACKUP = "-----BEGIN ECGAME FULL BACKUP-----";
const END_BACKUP = "-----END ECGAME FULL BACKUP-----";
const BEGIN_RECOVERY = "-----BEGIN ECGAME INSTRUCTOR RECOVERY-----";
const END_RECOVERY = "-----END ECGAME INSTRUCTOR RECOVERY-----";

function parseArguments(argv) {
    const values = {};
    for (let index = 0; index < argv.length; index += 1) {
        if (argv[index] === "--source") values.source = argv[++index];
        else if (argv[index] === "--output") values.output = argv[++index];
        else if (argv[index] === "--private-key") values.privateKey = argv[++index];
    }
    return values;
}

function parseEncodedPayload(text, beginMarker, endMarker, { tolerateRenderedArtifacts = false } = {}) {
    const normalized = text.replace(/\\-----/g, "-----");
    const begin = normalized.indexOf(beginMarker);
    const end = normalized.indexOf(endMarker);
    if (begin < 0 || end <= begin) throw new Error("Payload markers are missing.");
    const body = normalized.slice(begin + beginMarker.length, end);
    let encoded;
    if (tolerateRenderedArtifacts) {
        encoded = body
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => /^[A-Za-z0-9+/]+={0,2}$/.test(line))
            .filter(line => line.length >= 8)
            .join("");
    } else {
        encoded = body.replace(/\s+/g, "");
    }
    if (!encoded) throw new Error("Encoded payload is empty.");
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
}

async function verifyChecksumPayload(payload, label) {
    const content = structuredClone(payload);
    delete content.integrity;
    const checksum = await RecoveryCodec.sha256Hex(
        RecoveryCodec.canonicalStringify(content)
    );
    if (checksum !== payload.integrity?.checksum) {
        throw new Error(`${label} checksum verification failed.`);
    }
}

export async function parseRecoverySource(text) {
    if (text.includes("ECGAME FULL BACKUP")) {
        const payload = parseEncodedPayload(text, BEGIN_BACKUP, END_BACKUP);
        await verifyChecksumPayload(payload, "Full backup");
        if (!payload.state || !payload.profile?.playerId) {
            throw new Error("The full backup is missing its state or player identity.");
        }
        return {
            mode: "replace-full-backup",
            source: {
                type: "full-backup",
                createdAt: payload.createdAt,
                saveVersion: payload.game?.saveVersion ?? "unknown"
            },
            target: {
                playerId: payload.profile.playerId,
                fullName: payload.profile.fullName,
                gamertag: payload.profile.gamertag
            },
            payload: { state: payload.state }
        };
    }

    if (!text.includes("ECGAME PROGRESS REPORT")) {
        throw new Error("Select an ECGame progress report or full backup file.");
    }

    let payload;
    let sourceType = "progress-report";
    try {
        payload = parseEncodedPayload(text, BEGIN_REPORT, END_REPORT);
    } catch {
        payload = parseEncodedPayload(text, BEGIN_REPORT, END_REPORT, {
            tolerateRenderedArtifacts: true
        });
        sourceType = "rendered-legacy-progress-report";
    }
    await verifyChecksumPayload(payload, "Progress report");
    if (!payload.profile?.playerId || !payload.profile?.fullName || !payload.progress) {
        throw new Error("The progress report is missing identity or progress data.");
    }
    return {
        mode: "merge-progress-report",
        source: {
            type: sourceType,
            reportId: payload.report?.reportId ?? null,
            generatedAt: payload.report?.generatedAt ?? null,
            saveVersion: payload.game?.saveVersion ?? "unknown"
        },
        target: {
            playerId: payload.profile.playerId,
            fullName: payload.profile.fullName,
            gamertag: payload.profile.gamertag
        },
        payload: { report: payload }
    };
}

export function getSigningIdentity(privatePem) {
    const privateKey = createPrivateKey(privatePem);
    const publicDer = createPublicKey(privateKey).export({ type: "spki", format: "der" });
    return {
        privateKey,
        publicDer,
        keyId: createHash("sha256").update(publicDer).digest("hex").slice(0, 16)
    };
}

export async function createSignedRecovery({ sourceText, privatePem, issuedAt = new Date().toISOString() }) {
    const parsed = await parseRecoverySource(sourceText);
    const signing = getSigningIdentity(privatePem);
    const unsigned = {
        recoverySchemaVersion: "1.0",
        recoveryId: randomUUID(),
        issuedAt,
        signingKeyId: signing.keyId,
        mode: parsed.mode,
        source: parsed.source,
        target: parsed.target,
        payload: parsed.payload
    };
    const signature = sign(
        "sha256",
        Buffer.from(RecoveryCodec.canonicalStringify(unsigned), "utf8"),
        { key: signing.privateKey, dsaEncoding: "ieee-p1363" }
    );
    const recovery = {
        ...unsigned,
        signature: {
            algorithm: "ECDSA-P256-SHA256",
            format: "ieee-p1363",
            value: signature.toString("base64")
        }
    };
    const encoded = Buffer.from(JSON.stringify(recovery), "utf8").toString("base64");
    const text = [
        "ECGAME INSTRUCTOR RECOVERY",
        "Recovery-Schema: 1.0",
        `Recovery-ID: ${recovery.recoveryId}`,
        `Issued-UTC: ${recovery.issuedAt}`,
        `Student: ${recovery.target.fullName}`,
        `Player-ID: ${recovery.target.playerId}`,
        `Mode: ${recovery.mode}`,
        `Signing-Key-ID: ${recovery.signingKeyId}`,
        "Notice: ECGame will reject edited or unsigned recovery content.",
        "",
        BEGIN_RECOVERY,
        RecoveryCodec.wrapBase64(encoded),
        END_RECOVERY,
        ""
    ].join("\n");
    return { recovery, text };
}

async function main() {
    const args = parseArguments(process.argv.slice(2));
    if (!args.source) {
        throw new Error("Usage: node tools/create-instructor-recovery.mjs --source <report-or-backup.txt> [--output <recovery.txt>]");
    }
    const privateKeyPath = args.privateKey ?? path.join(
        os.homedir(), "Documents", "ECGame-Instructor-Recovery", "instructor-private-key.pem"
    );
    const sourceText = fs.readFileSync(path.resolve(args.source), "utf8");
    const privatePem = fs.readFileSync(privateKeyPath, "utf8");
    const result = await createSignedRecovery({ sourceText, privatePem });
    const defaultFilename = `ECGame-recovery-${result.recovery.target.playerId.slice(0, 8)}-${result.recovery.recoveryId.slice(0, 8)}.txt`;
    const outputPath = path.resolve(args.output ?? path.join(os.homedir(), "Downloads", defaultFilename));
    fs.writeFileSync(outputPath, result.text, { encoding: "utf8", flag: "wx" });
    console.table({
        result: "SIGNED RECOVERY CREATED",
        student: result.recovery.target.fullName,
        sourceType: result.recovery.source.type,
        mode: result.recovery.mode,
        output: outputPath
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
