// --------------------------------------------------
// ProgressReportExporter.js
// Encodes, verifies, and downloads ECGame reports
// --------------------------------------------------

import ProgressReportBuilder
    from "./ProgressReportBuilder.js";

const WRAPPER_VERSION = "1";
const CANONICALIZATION_VERSION =
    "ecgame-json-v1";
const BEGIN_PAYLOAD =
    "-----BEGIN ECGAME PROGRESS PAYLOAD-----";
const END_PAYLOAD =
    "-----END ECGAME PROGRESS PAYLOAD-----";

const ProgressReportExporter = {

    async createReportFile(options = {}) {

        const reportContent =
            ProgressReportBuilder
                .createReportContent(options);

        const canonicalContent =
            ProgressReportBuilder
                .canonicalStringify(
                    reportContent
                );

        const checksum =
            await this.sha256Hex(
                canonicalContent
            );

        const payload = {
            ...reportContent,
            integrity: {
                algorithm: "SHA-256",
                purpose:
                    "Accidental corruption detection only",
                scope:
                    "Canonical JSON of this report without the integrity field",
                canonicalizationVersion:
                    CANONICALIZATION_VERSION,
                checksum
            }
        };

        const payloadJSON =
            JSON.stringify(
                payload,
                null,
                2
            );

        const encodedPayload =
            this.encodeUtf8Base64(
                payloadJSON
            );

        const filename =
            this.buildFilename(payload);

        const text =
            this.buildWrapper({
                payload,
                encodedPayload,
                checksum
            });

        return {
            filename,
            text,
            payload,
            payloadJSON,
            checksum
        };

    },

    async downloadReport(options = {}) {

        if (
            typeof document === "undefined" ||
            typeof Blob === "undefined" ||
            typeof URL === "undefined" ||
            typeof URL.createObjectURL !==
                "function"
        ) {
            throw new Error(
                "This browser cannot prepare a report download."
            );
        }

        const reportFile =
            await this.createReportFile(
                options
            );

        const blob = new Blob(
            [reportFile.text],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );

        const downloadURL =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = downloadURL;
        link.download = reportFile.filename;
        link.hidden = true;

        document.body.appendChild(link);

        try {
            link.click();
        } finally {
            link.remove();

            setTimeout(
                () => URL.revokeObjectURL(
                    downloadURL
                ),
                1000
            );
        }

        return {
            ok: true,
            message:
                `Progress report download started: ${reportFile.filename}`,
            ...reportFile
        };

    },

    buildFilename(payload) {

        const generatedDate =
            payload.report.generatedAt
                .slice(0, 10);

        const reportSuffix =
            payload.report.reportId
                .replace(/[^a-zA-Z0-9]/g, "")
                .slice(0, 6)
                .toLowerCase();

        return [
            "ECGame-progress",
            generatedDate,
            reportSuffix
        ].join("-") + ".txt";

    },

    buildWrapper({
        payload,
        encodedPayload,
        checksum
    }) {

        const wrappedPayload =
            this.wrapBase64(
                encodedPayload
            );

        return [
            "ECGAME PROGRESS REPORT",
            `Wrapper-Version: ${WRAPPER_VERSION}`,
            `Report-Schema: ${payload.reportSchemaVersion}`,
            `Generated-UTC: ${payload.report.generatedAt}`,
            `Student: ${payload.profile.fullName}`,
            `Gamertag: ${payload.profile.gamertag}`,
            `Player-ID: ${payload.profile.playerId}`,
            `Report-ID: ${payload.report.reportId}`,
            "Payload-Encoding: Base64 of UTF-8 JSON",
            `Payload-Checksum-SHA256: ${checksum}`,
            "Notice: Base64 is encoding, not encryption.",
            "",
            BEGIN_PAYLOAD,
            wrappedPayload,
            END_PAYLOAD,
            ""
        ].join("\n");

    },

    encodeUtf8Base64(value) {

        const bytes =
            new TextEncoder().encode(value);

        const chunks = [];
        const chunkSize = 0x8000;

        for (
            let offset = 0;
            offset < bytes.length;
            offset += chunkSize
        ) {
            chunks.push(
                String.fromCharCode(
                    ...bytes.subarray(
                        offset,
                        offset + chunkSize
                    )
                )
            );
        }

        return btoa(
            chunks.join("")
        );

    },

    decodeUtf8Base64(value) {

        const binary = atob(value);
        const bytes =
            new Uint8Array(binary.length);

        for (
            let index = 0;
            index < binary.length;
            index += 1
        ) {
            bytes[index] =
                binary.charCodeAt(index);
        }

        return new TextDecoder(
            "utf-8",
            {
                fatal: true
            }
        ).decode(bytes);

    },

    wrapBase64(value, lineLength = 76) {

        const lines = [];

        for (
            let offset = 0;
            offset < value.length;
            offset += lineLength
        ) {
            lines.push(
                value.slice(
                    offset,
                    offset + lineLength
                )
            );
        }

        return lines.join("\n");

    },

    async sha256Hex(value) {

        if (
            !globalThis.crypto?.subtle ||
            typeof globalThis.crypto.subtle
                .digest !== "function"
        ) {
            throw new Error(
                "SHA-256 checksum generation is unavailable in this browser."
            );
        }

        const bytes =
            new TextEncoder().encode(value);

        const digest =
            await globalThis.crypto.subtle
                .digest(
                    "SHA-256",
                    bytes
                );

        return [...new Uint8Array(digest)]
            .map(byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
            )
            .join("");

    },

    parseWrapper(reportText) {

        if (typeof reportText !== "string") {
            throw new TypeError(
                "Progress report text is required."
            );
        }

        const beginIndex =
            reportText.indexOf(BEGIN_PAYLOAD);
        const endIndex =
            reportText.indexOf(END_PAYLOAD);

        if (
            beginIndex < 0 ||
            endIndex < 0 ||
            endIndex <= beginIndex
        ) {
            throw new Error(
                "The progress report payload markers are missing or invalid."
            );
        }

        const headerText =
            reportText
                .slice(0, beginIndex)
                .trim();

        const encodedPayload =
            reportText
                .slice(
                    beginIndex +
                        BEGIN_PAYLOAD.length,
                    endIndex
                )
                .replace(/\s+/g, "");

        if (encodedPayload === "") {
            throw new Error(
                "The progress report payload is empty."
            );
        }

        const metadata = {};

        headerText
            .split(/\r?\n/)
            .slice(1)
            .forEach(line => {
                const separatorIndex =
                    line.indexOf(":");

                if (separatorIndex < 1) {
                    return;
                }

                const key = line
                    .slice(0, separatorIndex)
                    .trim();
                const value = line
                    .slice(separatorIndex + 1)
                    .trim();

                metadata[key] = value;
            });

        const payloadJSON =
            this.decodeUtf8Base64(
                encodedPayload
            );

        const payload =
            JSON.parse(payloadJSON);

        return {
            metadata,
            encodedPayload,
            payloadJSON,
            payload
        };

    },

    async verifyReportText(reportText) {

        const errors = [];
        let parsed;

        try {
            parsed = this.parseWrapper(
                reportText
            );
        } catch (error) {
            return {
                ok: false,
                errors: [error.message],
                metadata: null,
                payload: null
            };
        }

        const { metadata, payload } = parsed;
        const integrity = payload?.integrity;

        if (
            payload?.reportSchemaVersion !==
            ProgressReportBuilder
                .getReportSchemaVersion()
        ) {
            errors.push(
                "The report schema version is not supported."
            );
        }

        if (
            !integrity ||
            integrity.algorithm !== "SHA-256" ||
            typeof integrity.checksum !== "string"
        ) {
            errors.push(
                "The report checksum metadata is missing or invalid."
            );
        }

        let calculatedChecksum = null;

        if (integrity?.checksum) {
            const reportContent =
                JSON.parse(
                    JSON.stringify(payload)
                );

            delete reportContent.integrity;

            const canonicalContent =
                ProgressReportBuilder
                    .canonicalStringify(
                        reportContent
                    );

            calculatedChecksum =
                await this.sha256Hex(
                    canonicalContent
                );

            if (
                calculatedChecksum !==
                integrity.checksum
            ) {
                errors.push(
                    "The payload checksum does not match. The report may be damaged or edited."
                );
            }

            if (
                metadata[
                    "Payload-Checksum-SHA256"
                ] !== integrity.checksum
            ) {
                errors.push(
                    "The wrapper checksum does not match the payload checksum."
                );
            }
        }

        const metadataComparisons = [
            [
                "Report-Schema",
                payload?.reportSchemaVersion
            ],
            [
                "Generated-UTC",
                payload?.report?.generatedAt
            ],
            [
                "Student",
                payload?.profile?.fullName
            ],
            [
                "Gamertag",
                payload?.profile?.gamertag
            ],
            [
                "Player-ID",
                payload?.profile?.playerId
            ],
            [
                "Report-ID",
                payload?.report?.reportId
            ]
        ];

        metadataComparisons.forEach(
            ([key, expectedValue]) => {
                if (
                    metadata[key] !==
                    String(expectedValue)
                ) {
                    errors.push(
                        `${key} does not match the encoded payload.`
                    );
                }
            }
        );

        return {
            ok: errors.length === 0,
            errors,
            metadata,
            payload,
            calculatedChecksum
        };

    }

};

export default ProgressReportExporter;
