// --------------------------------------------------
// NaturalSelectionClassComparisonClient.js
// Anonymous Apps Script transport for class averages
// --------------------------------------------------

import InvestigationClassComparisonModel
    from "./InvestigationClassComparisonModel.js";
import NaturalSelectionClassComparisonConfig
    from "./NaturalSelectionClassComparisonConfig.js";

const createRandomId = prefix =>
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const delay = milliseconds =>
    new Promise(resolve => {
        globalThis.setTimeout(
            resolve,
            milliseconds
        );
    });

const isValidEndpoint = endpointUrl => {
    if (typeof endpointUrl !== "string") {
        return false;
    }

    try {
        const url = new URL(endpointUrl);
        return (
            url.protocol === "https:" &&
            url.hostname ===
                "script.google.com" &&
            url.pathname.startsWith(
                "/macros/s/"
            ) &&
            url.pathname.endsWith(
                "/exec"
            )
        );
    } catch {
        return false;
    }
};

const createAnonymousParticipantId = (
    storage,
    storageKey
) => {
    try {
        const stored =
            storage?.getItem?.(
                storageKey
            );

        if (
            typeof stored === "string" &&
            stored.length >= 16
        ) {
            return stored;
        }

        const created =
            createRandomId("participant");
        storage?.setItem?.(
            storageKey,
            created
        );
        return created;
    } catch {
        return createRandomId(
            "participant-session"
        );
    }
};

const createJsonpRequester = ({
    documentObject,
    globalObject,
    timeoutMs
}) => {
    let requestNumber = 0;

    return (
        endpointUrl,
        parameters
    ) => new Promise(
        (
            resolve,
            reject
        ) => {
            requestNumber += 1;

            const callbackName =
                `__ecgameNsClassCallback_${Date.now()}_${requestNumber}`;
            const script =
                documentObject
                    .createElement("script");
            const url =
                new URL(endpointUrl);
            let completed = false;

            Object.entries(parameters)
                .forEach(
                    ([key, value]) => {
                        url.searchParams.set(
                            key,
                            String(value)
                        );
                    }
                );
            url.searchParams.set(
                "prefix",
                callbackName
            );

            const cleanup = () => {
                if (completed) {
                    return;
                }
                completed = true;
                globalObject.clearTimeout(
                    timeoutId
                );
                script.remove();
                delete globalObject[
                    callbackName
                ];
            };

            globalObject[callbackName] =
                response => {
                    cleanup();
                    resolve(response);
                };

            script.onerror = () => {
                cleanup();
                reject(
                    new Error(
                        "The class comparison service could not be reached."
                    )
                );
            };

            const timeoutId =
                globalObject.setTimeout(
                    () => {
                        cleanup();
                        reject(
                            new Error(
                                "The class comparison request timed out."
                            )
                        );
                    },
                    timeoutMs
                );

            script.src = url.toString();
            script.async = true;
            documentObject.head.append(
                script
            );
        }
    );
};

const createNaturalSelectionClassComparisonClient = ({
    config =
        NaturalSelectionClassComparisonConfig,
    fetchFunction =
        globalThis.fetch?.bind(globalThis),
    storage =
        globalThis.localStorage,
    documentObject =
        globalThis.document,
    globalObject =
        globalThis
} = {}) => {
    const jsonpRequest =
        documentObject
            ? createJsonpRequester({
                documentObject,
                globalObject,
                timeoutMs:
                    config.requestTimeoutMs
            })
            : null;
    let memoryParticipantId = null;

    const requireConfigured = () => {
        if (!config.enabled) {
            throw new Error(
                "Class comparison is disabled."
            );
        }
        if (
            !isValidEndpoint(
                config.endpointUrl
            )
        ) {
            throw new Error(
                "Class comparison has not been connected to the instructor endpoint."
            );
        }
        if (!jsonpRequest) {
            throw new Error(
                "Class comparison requires a browser document."
            );
        }
    };

    const getParticipantId = () => {
        memoryParticipantId ??=
            createAnonymousParticipantId(
                storage,
                config
                    .anonymousParticipantStorageKey
            );
        return memoryParticipantId;
    };

    const requestJsonp = async parameters => {
        requireConfigured();
        const response =
            await jsonpRequest(
                config.endpointUrl,
                parameters
            );

        if (
            response?.status === "error"
        ) {
            throw new Error(
                response.message ||
                "The class comparison service reported an error."
            );
        }

        return response;
    };

    return {

        isConfigured() {
            return Boolean(
                config.enabled &&
                isValidEndpoint(
                    config.endpointUrl
                ) &&
                config.cohortId
            );
        },

        createSubmission(report) {
            return InvestigationClassComparisonModel
                .createSubmission({
                    report,
                    cohortId:
                        config.cohortId,
                    anonymousParticipantId:
                        getParticipantId(),
                    submissionId:
                        createRandomId(
                            "submission"
                        ),
                    schemaVersion:
                        config
                            .submissionSchemaVersion
                });
        },

        async sendSubmission(submission) {
            requireConfigured();

            if (
                typeof fetchFunction !==
                "function"
            ) {
                throw new Error(
                    "This browser cannot send the class comparison submission."
                );
            }

            const controller =
                typeof AbortController ===
                "function"
                    ? new AbortController()
                    : null;
            const timeoutId =
                globalObject.setTimeout(
                    () => controller?.abort(),
                    config.requestTimeoutMs
                );

            try {
                await fetchFunction(
                    config.endpointUrl,
                    {
                        method: "POST",
                        mode: "no-cors",
                        headers: {
                            "Content-Type":
                                "text/plain;charset=utf-8"
                        },
                        body:
                            JSON.stringify(
                                submission
                            ),
                        signal:
                            controller?.signal
                    }
                );
            } finally {
                globalObject.clearTimeout(
                    timeoutId
                );
            }

            return {
                submissionId:
                    submission.submissionId,
                scenarioKey:
                    submission.scenarioKey
            };
        },

        async confirmSubmission(
            submissionId
        ) {
            const maximumPolls =
                config.confirmation
                    .maximumPolls;

            for (
                let poll = 1;
                poll <= maximumPolls;
                poll += 1
            ) {
                const response =
                    await requestJsonp({
                        action: "status",
                        cohortId:
                            config.cohortId,
                        submissionId
                    });

                if (response.stored) {
                    return response;
                }

                if (poll < maximumPolls) {
                    await delay(
                        config.confirmation
                            .intervalMs
                    );
                }
            }

            throw new Error(
                "The trial was sent, but storage could not be confirmed yet."
            );
        },

        async getAggregate(
            scenarioKey
        ) {
            const response =
                await requestJsonp({
                    action: "aggregate",
                    cohortId:
                        config.cohortId,
                    scenarioKey
                });

            return InvestigationClassComparisonModel
                .normalizeAggregate({
                    response,
                    expectedSchemaVersion:
                        config
                            .aggregateSchemaVersion,
                    expectedScenarioKey:
                        scenarioKey,
                    minimumMatchingTrials:
                        config
                            .minimumMatchingTrials
                });
        }

    };
};

const NaturalSelectionClassComparisonClient =
    createNaturalSelectionClassComparisonClient();

export {
    createAnonymousParticipantId,
    createNaturalSelectionClassComparisonClient,
    isValidEndpoint
};

export default NaturalSelectionClassComparisonClient;
