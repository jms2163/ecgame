// --------------------------------------------------
// ProgressReportBuilder.js
// Builds an allowlisted ECGame progress snapshot
// --------------------------------------------------

import gameState from "./GameState.js";
import PlayerProfileManager
    from "./PlayerProfileManager.js";

const REPORT_SCHEMA_VERSION = "1.0";
const ACTIVITY_ID = "ecgame-bio101-beta";

const ProgressReportBuilder = {

    getReportSchemaVersion() {

        return REPORT_SCHEMA_VERSION;

    },

    getActivityId() {

        return ACTIVITY_ID;

    },

    createReportContent({
        generatedAtMs = Date.now(),
        reportId = null
    } = {}) {

        const profile =
            PlayerProfileManager
                .getProfileSnapshot();

        if (!profile.complete) {
            throw new Error(
                "A completed player profile is required before reporting progress."
            );
        }

        const resolvedReportId =
            reportId || this.generateUUID();

        return {
            reportSchemaVersion:
                REPORT_SCHEMA_VERSION,

            report: {
                reportId: resolvedReportId,
                generatedAt:
                    this.toISOString(
                        generatedAtMs
                    ),
                source: "ECGame",
                environment: "beta"
            },

            game: {
                activityId: ACTIVITY_ID,
                saveVersion:
                    typeof gameState.saveVersion ===
                        "string"
                        ? gameState.saveVersion
                        : "unknown"
            },

            profile: {
                playerId: profile.playerId,
                fullName: profile.fullName,
                gamertag: profile.gamertag,
                profileCreatedAt:
                    this.toISOString(
                        profile.profileCreatedAtMs
                    ),
                nameLockedAt:
                    this.toISOString(
                        profile.nameLockedAtMs
                    ),
                gamertagUpdatedAt:
                    this.toISOString(
                        profile.gamertagUpdatedAtMs
                    )
            },

            progress: {
                lastLocalSaveAt:
                    this.toISOString(
                        gameState.saveMetadata
                            ?.lastSavedAtMs
                    ),
                player:
                    this.buildPlayerProgress(),
                zones:
                    this.buildZoneSummaries(),
                unlockedFeatures:
                    this.buildFeatureSummaries(),
                resources:
                    this.buildResourceSummary(),
                inventory:
                    this.buildInventorySummaries(),
                quests:
                    this.buildQuestSummaries(),
                discoveries:
                    this.buildDiscoverySummary(),
                achievements:
                    this.buildAchievementSummaries(),
                certifications:
                    this.buildCertificationSummaries(),
                research:
                    this.buildResearchSummary(),
                journal:
                    this.buildJournalSummary()
            }
        };

    },

    buildPlayerProgress() {

        return {
            level:
                this.toFiniteNumber(
                    gameState.player?.level
                ),
            xp:
                this.toFiniteNumber(
                    gameState.player?.xp
                ),
            currentZone:
                this.toSafeString(
                    gameState.player
                        ?.currentZone
                ),
            currentZoom:
                this.toFiniteNumber(
                    gameState.player
                        ?.currentZoom
                )
        };

    },

    buildZoneSummaries() {

        const zones =
            gameState.zones;

        if (
            !zones ||
            typeof zones !== "object" ||
            Array.isArray(zones)
        ) {
            return [];
        }

        return Object.entries(zones)
            .filter(([zoneId, zone]) =>
                zoneId !== "features" &&
                zone &&
                typeof zone === "object" &&
                !Array.isArray(zone)
            )
            .map(([zoneId, zone]) => ({
                zoneId,
                unlocked:
                    Boolean(zone.unlocked),
                completed:
                    Boolean(zone.completed)
            }))
            .sort((left, right) =>
                left.zoneId.localeCompare(
                    right.zoneId
                )
            );

    },

    buildFeatureSummaries() {

        const features =
            gameState.zones?.features;

        if (
            !features ||
            typeof features !== "object" ||
            Array.isArray(features)
        ) {
            return [];
        }

        return Object.entries(features)
            .filter(([, unlocked]) =>
                Boolean(unlocked)
            )
            .map(([featureId]) =>
                featureId
            )
            .sort();

    },

    buildResourceSummary() {

        const resources =
            gameState.registry?.resources || {};
        const atp = resources.atp || {};
        const particles =
            resources.particles || {};
        const lifetime =
            particles.lifetimeCollected || {};

        return {
            atp: {
                current:
                    this.toFiniteNumber(
                        atp.current
                    ),
                maximum:
                    this.toFiniteNumber(
                        atp.maximum
                    )
            },
            particles: {
                capacity:
                    this.toFiniteNumber(
                        particles.capacity
                    ),
                current: {
                    proton:
                        this.toFiniteNumber(
                            particles.proton
                        ),
                    neutron:
                        this.toFiniteNumber(
                            particles.neutron
                        ),
                    electron:
                        this.toFiniteNumber(
                            particles.electron
                        )
                },
                lifetimeCollected: {
                    proton:
                        this.toFiniteNumber(
                            lifetime.proton
                        ),
                    neutron:
                        this.toFiniteNumber(
                            lifetime.neutron
                        ),
                    electron:
                        this.toFiniteNumber(
                            lifetime.electron
                        )
                }
            }
        };

    },

    buildInventorySummaries() {

        const inventory =
            gameState.registry?.inventory;

        if (!Array.isArray(inventory)) {
            return [];
        }

        return inventory
            .map((entry, index) => {
                if (typeof entry === "string") {
                    return {
                        itemId: entry,
                        quantity: 1
                    };
                }

                if (
                    !entry ||
                    typeof entry !== "object" ||
                    Array.isArray(entry)
                ) {
                    return null;
                }

                const itemId =
                    this.firstSafeString(
                        entry.itemId,
                        entry.id,
                        entry.entityId
                    );

                if (!itemId) {
                    return null;
                }

                return {
                    itemId,
                    quantity:
                        this.firstFiniteNumber(
                            entry.quantity,
                            entry.count,
                            1
                        ),
                    recordIndex: index
                };
            })
            .filter(Boolean)
            .sort((left, right) =>
                left.itemId.localeCompare(
                    right.itemId
                )
            );

    },

    buildQuestSummaries() {

        const quests =
            gameState.registry?.quests;

        if (
            !quests ||
            typeof quests !== "object" ||
            Array.isArray(quests)
        ) {
            return [];
        }

        return Object.entries(quests)
            .map(([questId, record]) => {
                const quest =
                    record &&
                    typeof record === "object" &&
                    !Array.isArray(record)
                        ? record
                        : {};

                return {
                    questId,
                    status:
                        this.toSafeString(
                            quest.status
                        ) || "unknown",
                    activatedAt:
                        this.toISOString(
                            quest.activatedAtMs
                        ),
                    readyAt:
                        this.toISOString(
                            quest.readyAtMs
                        ),
                    viewedAt:
                        this.toISOString(
                            quest.viewedAtMs
                        ),
                    claimedAt:
                        this.toISOString(
                            quest.claimedAtMs
                        )
                };
            })
            .sort((left, right) =>
                left.questId.localeCompare(
                    right.questId
                )
            );

    },

    buildDiscoverySummary() {

        const byCategory = {};
        const discoveryBuckets =
            gameState.discoveries;

        if (
            discoveryBuckets &&
            typeof discoveryBuckets === "object" &&
            !Array.isArray(discoveryBuckets)
        ) {
            Object.entries(discoveryBuckets)
                .sort(([left], [right]) =>
                    left.localeCompare(right)
                )
                .forEach(([category, records]) => {
                    if (
                        !records ||
                        typeof records !== "object" ||
                        Array.isArray(records)
                    ) {
                        return;
                    }

                    byCategory[category] =
                        Object.entries(records)
                            .filter(([, record]) =>
                                Boolean(record)
                            )
                            .map(([discoveryId]) =>
                                discoveryId
                            )
                            .sort();
                });
        }

        const registryIds =
            Array.isArray(
                gameState.registry?.discoveries
            )
                ? gameState.registry.discoveries
                    .map(entry =>
                        typeof entry === "string"
                            ? entry
                            : this.firstSafeString(
                                entry?.discoveryId,
                                entry?.id
                            )
                    )
                    .filter(Boolean)
                : [];

        return {
            registryIds: [
                ...new Set(registryIds)
            ].sort(),
            byCategory
        };

    },

    buildAchievementSummaries() {

        const achievements =
            gameState.registry?.achievements;

        if (
            !achievements ||
            typeof achievements !== "object" ||
            Array.isArray(achievements)
        ) {
            return [];
        }

        return Object.entries(achievements)
            .filter(([, value]) =>
                Boolean(value)
            )
            .map(([achievementId, value]) => ({
                achievementId,
                earned: true,
                awardedAt:
                    this.toISOString(
                        value?.awardedAtMs ||
                        value?.completedAtMs
                    )
            }))
            .sort((left, right) =>
                left.achievementId.localeCompare(
                    right.achievementId
                )
            );

    },

    buildCertificationSummaries() {

        const certifications =
            gameState.registry?.certifications;

        if (!Array.isArray(certifications)) {
            return [];
        }

        return certifications
            .map((entry, index) => {
                if (typeof entry === "string") {
                    return {
                        certificationId: entry,
                        recordIndex: index
                    };
                }

                if (
                    !entry ||
                    typeof entry !== "object" ||
                    Array.isArray(entry)
                ) {
                    return null;
                }

                const certificationId =
                    this.firstSafeString(
                        entry.certificationId,
                        entry.id
                    );

                if (!certificationId) {
                    return null;
                }

                return {
                    certificationId,
                    status:
                        this.toSafeString(
                            entry.status
                        ),
                    awardedAt:
                        this.toISOString(
                            entry.awardedAtMs ||
                            entry.completedAtMs
                        ),
                    recordIndex: index
                };
            })
            .filter(Boolean);

    },

    buildResearchSummary() {

        const research =
            gameState.registry?.research || {};

        return {
            completedExperiments:
                this.buildCompletedExperimentSummaries(
                    research.completedExperiments
                ),
            bestScores:
                this.buildBestScoreSummaries(
                    research.bestExperimentScores
                ),
            stars:
                this.buildStarSummaries(
                    research.stars
                ),
            submissions:
                this.buildSubmissionSummaries(
                    research.experimentSubmissions
                )
        };

    },

    buildCompletedExperimentSummaries(
        completedExperiments
    ) {

        if (
            !completedExperiments ||
            typeof completedExperiments !==
                "object" ||
            Array.isArray(completedExperiments)
        ) {
            return [];
        }

        return Object.entries(completedExperiments)
            .filter(([, value]) =>
                Boolean(value)
            )
            .map(([activityId, value]) => ({
                activityId,
                completed: true,
                completedAt:
                    this.toISOString(
                        value?.completedAtMs ||
                        value?.completedAt
                    )
            }))
            .sort((left, right) =>
                left.activityId.localeCompare(
                    right.activityId
                )
            );

    },

    buildBestScoreSummaries(bestScores) {

        if (
            !bestScores ||
            typeof bestScores !== "object" ||
            Array.isArray(bestScores)
        ) {
            return [];
        }

        return Object.entries(bestScores)
            .map(([activityId, value]) => ({
                activityId,
                score:
                    this.firstFiniteNumber(
                        value,
                        value?.score,
                        value?.bestScore
                    )
            }))
            .filter(record =>
                record.score !== null
            )
            .sort((left, right) =>
                left.activityId.localeCompare(
                    right.activityId
                )
            );

    },

    buildStarSummaries(stars) {

        if (
            !stars ||
            typeof stars !== "object" ||
            Array.isArray(stars)
        ) {
            return [];
        }

        return Object.entries(stars)
            .filter(([, value]) =>
                Boolean(value)
            )
            .map(([activityId, value]) => ({
                activityId,
                earned: true,
                awardedAt:
                    this.toISOString(
                        value?.awardedAtMs ||
                        value?.completedAtMs
                    )
            }))
            .sort((left, right) =>
                left.activityId.localeCompare(
                    right.activityId
                )
            );

    },

    buildSubmissionSummaries(submissions) {

        if (
            !submissions ||
            typeof submissions !== "object" ||
            Array.isArray(submissions)
        ) {
            return [];
        }

        return Object.entries(submissions)
            .map(([activityId, value]) => {
                const records =
                    Array.isArray(value)
                        ? value
                        : value
                            ? [value]
                            : [];

                const lastRecord =
                    records.length > 0
                        ? records[
                            records.length - 1
                        ]
                        : {};

                return {
                    activityId,
                    submissionCount:
                        records.length,
                    status:
                        this.toSafeString(
                            lastRecord?.status
                        ),
                    score:
                        this.firstFiniteNumber(
                            lastRecord?.score,
                            lastRecord?.points
                        ),
                    lastSubmittedAt:
                        this.toISOString(
                            lastRecord
                                ?.submittedAtMs ||
                            lastRecord
                                ?.completedAtMs
                        )
                };
            })
            .sort((left, right) =>
                left.activityId.localeCompare(
                    right.activityId
                )
            );

    },

    buildJournalSummary() {

        const journal =
            gameState.registry?.journal;

        if (!Array.isArray(journal)) {
            return {
                recordCount: 0,
                records: []
            };
        }

        return {
            recordCount: journal.length,
            records: journal.map(
                (entry, index) => {
                    const record =
                        entry &&
                        typeof entry === "object" &&
                        !Array.isArray(entry)
                            ? entry
                            : {};

                    return {
                        recordIndex: index,
                        journalId:
                            this.firstSafeString(
                                record.journalId,
                                record.id
                            ),
                        activityId:
                            this.firstSafeString(
                                record.activityId,
                                record.experimentId
                            ),
                        status:
                            this.toSafeString(
                                record.status
                            ),
                        score:
                            this.firstFiniteNumber(
                                record.score,
                                record.points
                            ),
                        createdAt:
                            this.toISOString(
                                record.createdAtMs
                            ),
                        submittedAt:
                            this.toISOString(
                                record.submittedAtMs
                            ),
                        completedAt:
                            this.toISOString(
                                record.completedAtMs
                            )
                    };
                }
            )
        };

    },

    generateUUID() {

        if (
            globalThis.crypto &&
            typeof globalThis.crypto
                .randomUUID === "function"
        ) {
            return globalThis.crypto
                .randomUUID();
        }

        if (
            !globalThis.crypto ||
            typeof globalThis.crypto
                .getRandomValues !== "function"
        ) {
            throw new Error(
                "Secure report ID generation is unavailable."
            );
        }

        const bytes = new Uint8Array(16);

        globalThis.crypto
            .getRandomValues(bytes);

        bytes[6] =
            (bytes[6] & 0x0f) | 0x40;
        bytes[8] =
            (bytes[8] & 0x3f) | 0x80;

        const hex = [...bytes]
            .map(value =>
                value
                    .toString(16)
                    .padStart(2, "0")
            )
            .join("");

        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20)
        ].join("-");

    },

    canonicalStringify(value) {

        return JSON.stringify(
            this.canonicalize(value)
        );

    },

    canonicalize(value) {

        if (value === null) {
            return null;
        }

        if (Array.isArray(value)) {
            return value.map(entry =>
                this.canonicalize(entry)
            );
        }

        if (typeof value === "object") {
            return Object.keys(value)
                .sort()
                .reduce((result, key) => {
                    if (
                        value[key] !== undefined &&
                        typeof value[key] !==
                            "function"
                    ) {
                        result[key] =
                            this.canonicalize(
                                value[key]
                            );
                    }

                    return result;
                }, {});
        }

        if (
            typeof value === "number" &&
            !Number.isFinite(value)
        ) {
            return null;
        }

        return value;

    },

    toISOString(value) {

        let timestamp = null;

        if (
            typeof value === "string" &&
            value.trim() !== ""
        ) {
            timestamp = Date.parse(value);
        } else if (Number.isFinite(value)) {
            timestamp = value;
        }

        if (!Number.isFinite(timestamp)) {
            return null;
        }

        const date = new Date(timestamp);

        if (!Number.isFinite(date.getTime())) {
            return null;
        }

        return date.toISOString();

    },

    toSafeString(value) {

        if (typeof value !== "string") {
            return null;
        }

        const normalized =
            value.trim();

        return normalized || null;

    },

    firstSafeString(...values) {

        for (const value of values) {
            const normalized =
                this.toSafeString(value);

            if (normalized) {
                return normalized;
            }
        }

        return null;

    },

    toFiniteNumber(value) {

        return Number.isFinite(value)
            ? value
            : null;

    },

    firstFiniteNumber(...values) {

        for (const value of values) {
            if (Number.isFinite(value)) {
                return value;
            }
        }

        return null;

    }

};

export default ProgressReportBuilder;
