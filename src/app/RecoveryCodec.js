// --------------------------------------------------
// RecoveryCodec.js
// Shared deterministic encoding helpers for backups and instructor recovery
// --------------------------------------------------

const RecoveryCodec = {

    canonicalize(value) {
        if (value === null) return null;
        if (Array.isArray(value)) {
            return value.map(entry => this.canonicalize(entry));
        }
        if (typeof value === "object") {
            return Object.keys(value)
                .sort()
                .reduce((result, key) => {
                    if (value[key] !== undefined && typeof value[key] !== "function") {
                        result[key] = this.canonicalize(value[key]);
                    }
                    return result;
                }, {});
        }
        if (typeof value === "number" && !Number.isFinite(value)) return null;
        return value;
    },

    canonicalStringify(value) {
        return JSON.stringify(this.canonicalize(value));
    },

    encodeUtf8Base64(value) {
        const bytes = new TextEncoder().encode(value);
        return this.bytesToBase64(bytes);
    },

    decodeUtf8Base64(value) {
        return new TextDecoder("utf-8", { fatal: true })
            .decode(this.base64ToBytes(value));
    },

    bytesToBase64(bytes) {
        if (typeof btoa === "function") {
            const chunks = [];
            for (let offset = 0; offset < bytes.length; offset += 0x8000) {
                chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
            }
            return btoa(chunks.join(""));
        }
        return Buffer.from(bytes).toString("base64");
    },

    base64ToBytes(value) {
        if (typeof atob === "function") {
            const binary = atob(value);
            return Uint8Array.from(binary, character => character.charCodeAt(0));
        }
        return new Uint8Array(Buffer.from(value, "base64"));
    },

    wrapBase64(value, lineLength = 76) {
        const lines = [];
        for (let offset = 0; offset < value.length; offset += lineLength) {
            lines.push(value.slice(offset, offset + lineLength));
        }
        return lines.join("\n");
    },

    async sha256Hex(value) {
        if (!globalThis.crypto?.subtle) {
            throw new Error("Web Crypto is unavailable.");
        }
        const digest = await globalThis.crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(value)
        );
        return [...new Uint8Array(digest)]
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");
    },

    extractWrappedPayload(text, beginMarker, endMarker) {
        if (typeof text !== "string") throw new TypeError("Text content is required.");
        const begin = text.indexOf(beginMarker);
        const end = text.indexOf(endMarker);
        if (begin < 0 || end <= begin) throw new Error("Required payload markers are missing.");
        const encoded = text
            .slice(begin + beginMarker.length, end)
            .replace(/\s+/g, "");
        if (!encoded) throw new Error("The encoded payload is empty.");
        return JSON.parse(this.decodeUtf8Base64(encoded));
    }
};

export default RecoveryCodec;
