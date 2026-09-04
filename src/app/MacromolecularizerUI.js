// --------------------------------------------------
// MacromolecularizerUI.js
// Console-locked shell for the Macromolecularizer zone
// --------------------------------------------------

import GameStateObserver from "./GameStateObserver.js";
import MacromolecularizerManager
    from "./MacromolecularizerManager.js";

const MacromolecularizerUI = {

    initialized: false,
    active: false,
    subscribed: false,
    rootElement: null,
    elements: {},
    feedbackMessage: "",
    synthesisFeedbackMessage: "",
    upgradeFeedbackMessage: "",

    // --------------------------------------------------
    // Initialize the persistent zone shell once
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            return true;
        }

        this.rootElement =
            this.ensureRootElement();

        if (!this.rootElement) {
            console.warn(
                "[MacromolecularizerUI] Unable to mount #macromolecularizer-zone."
            );

            return false;
        }

        this.buildStaticUI();
        this.cacheElements();
        this.bindEvents();
        this.subscribe();

        this.initialized = true;
        this.render();

        console.log(
            "[MacromolecularizerUI] Initialized."
        );

        return true;

    },

    // --------------------------------------------------
    // Create the zone root when it is first requested
    // --------------------------------------------------
    ensureRootElement() {

        let root =
            document.getElementById(
                "macromolecularizer-zone"
            );

        if (root) {
            return root;
        }

        const host =
            document.getElementById(
                "app-main"
            ) ||
            document.getElementById(
                "app"
            ) ||
            document.body;

        if (!host) {
            return null;
        }

        root =
            document.createElement(
                "section"
            );

        root.id =
            "macromolecularizer-zone";

        root.className =
            "zone hidden";

        root.setAttribute(
            "aria-label",
            "Macromolecularizer"
        );

        host.appendChild(root);

        return root;

    },

    // --------------------------------------------------
    // Build the console-only development shell
    // --------------------------------------------------
    buildStaticUI() {

        this.rootElement.innerHTML = `
            <header class="macromolecularizer-header">
                <p class="macromolecularizer-eyebrow">Macromolecularizer</p>
                <h1>Motif Lab</h1>
                <p>
                    Build small polypeptide motifs from amino-acid
                    synthesis knowledge.
                </p>
            </header>

            <div class="macromolecularizer-layout">
                <aside
                    class="macromolecularizer-catalog"
                    aria-label="Motif recipe catalog"
                >
                    <h2>Motif Recipes</h2>
                    <p id="macromolecularizer-selected-motif"></p>

                    <article
                        id="macromolecularizer-h-helix-card"
                        aria-label="H_helix recipe"
                    >
                        <h3 id="macromolecularizer-card-name"></h3>
                        <p>
                            Recipe ID:
                            <code>H_helix</code>
                        </p>
                        <p id="macromolecularizer-card-summary"></p>
                        <p id="macromolecularizer-card-quantity"></p>
                        <p id="macromolecularizer-card-status"></p>
                    </article>
                </aside>

                <main
                    class="macromolecularizer-workspace"
                    aria-label="Motif synthesis workspace"
                >
                    <h2>Synthesis Workspace</h2>
                    <p>
                        Discover the reactions that build and break
                        biological polymers, then use ATP to run a
                        timed motif synthesis job.
                    </p>

                    <section
                        class="macromolecularizer-reaction-discovery"
                        aria-labelledby="macromolecularizer-reaction-heading"
                    >
                        <h3 id="macromolecularizer-reaction-heading">
                            Reaction Discovery
                        </h3>
                        <p>
                            Dehydration synthesis joins monomers by
                            removing water. Hydrolysis uses water to
                            separate them.
                        </p>
                        <div class="macromolecularizer-reaction-actions">
                            <button
                                id="macromolecularizer-discover-dehydration"
                                type="button"
                                data-reaction-id="dehydration"
                            >
                                Discover Dehydration
                            </button>
                            <button
                                id="macromolecularizer-discover-hydrolysis"
                                type="button"
                                data-reaction-id="hydrolysis"
                            >
                                Discover Hydrolysis
                            </button>
                        </div>
                        <p
                            id="macromolecularizer-reaction-feedback"
                            role="status"
                            aria-live="polite"
                        ></p>
                    </section>

                    <section
                        class="macromolecularizer-motif-recipe"
                        aria-labelledby="macromolecularizer-recipe-heading"
                    >
                        <h3 id="macromolecularizer-recipe-heading">
                            H_helix Recipe
                        </h3>

                        <h4>Requirements for the next synthesis</h4>
                        <ul id="macromolecularizer-requirement-summary"></ul>

                        <p
                            id="macromolecularizer-recipe-gate"
                            role="status"
                        ></p>

                        <div id="macromolecularizer-recipe-details">
                            <h4 id="macromolecularizer-recipe-name"></h4>
                            <p id="macromolecularizer-recipe-description"></p>
                            <p id="macromolecularizer-bond-calculation"></p>

                            <h4>Amino-acid composition</h4>
                            <p>
                                Each required amino-acid type must be
                                synthesized at least once. These quantities
                                describe the motif and are not consumed.
                            </p>
                            <ul id="macromolecularizer-amino-acid-requirements"></ul>

                            <h4>ATP requirement</h4>
                            <p id="macromolecularizer-atp-requirement"></p>

                            <h4>Synthesis timing</h4>
                            <p id="macromolecularizer-synthesis-timing"></p>

                            <p
                                id="macromolecularizer-eligibility-feedback"
                                role="status"
                                aria-live="polite"
                            ></p>

                            <button
                                id="macromolecularizer-start-synthesis"
                                type="button"
                            >
                                Begin H_helix Synthesis
                            </button>

                            <div
                                id="macromolecularizer-synthesis-progress-panel"
                                aria-live="polite"
                                hidden
                            >
                                <label for="macromolecularizer-synthesis-progress">
                                    H_helix synthesis progress
                                </label>
                                <progress
                                    id="macromolecularizer-synthesis-progress"
                                    max="1"
                                    value="0"
                                ></progress>
                                <p id="macromolecularizer-synthesis-countdown"></p>
                            </div>

                            <p
                                id="macromolecularizer-synthesis-feedback"
                                role="status"
                                aria-live="polite"
                            ></p>
                        </div>
                    </section>
                </main>

                <aside
                    class="macromolecularizer-status"
                    aria-label="Macromolecularizer status"
                >
                    <h2>Development Status</h2>
                    <dl>
                        <dt>Access</dt>
                        <dd>Development console only</dd>

                        <dt>Stored motif types</dt>
                        <dd id="macromolecularizer-inventory-count">0</dd>

                        <dt>Total motif copies</dt>
                        <dd id="macromolecularizer-inventory-total">0</dd>

                        <dt>Active synthesis</dt>
                        <dd id="macromolecularizer-active-synthesis">None</dd>
                    </dl>

                    <section
                        aria-labelledby="macromolecularizer-inventory-heading"
                    >
                        <h3 id="macromolecularizer-inventory-heading">
                            Motif Inventory
                        </h3>
                        <p id="macromolecularizer-inventory-empty">
                            No completed motifs yet.
                        </p>
                        <ul id="macromolecularizer-inventory-list"></ul>
                    </section>

                    <section
                        aria-labelledby="macromolecularizer-speed-heading"
                    >
                        <h3 id="macromolecularizer-speed-heading">
                            Dehydration Synthesis Speed
                        </h3>
                        <p>
                            Future quests award Synthesis Points. Each
                            point adds 100% base synthesis speed to jobs
                            started after the upgrade.
                        </p>
                        <dl>
                            <dt>Synthesis Points</dt>
                            <dd id="macromolecularizer-synthesis-points">0</dd>

                            <dt>Upgrade level</dt>
                            <dd id="macromolecularizer-speed-level">0</dd>

                            <dt>Synthesis speed</dt>
                            <dd id="macromolecularizer-speed-multiplier">1×</dd>

                            <dt>Seconds per peptide bond</dt>
                            <dd id="macromolecularizer-seconds-per-bond">30</dd>
                        </dl>
                        <button
                            id="macromolecularizer-upgrade-speed"
                            type="button"
                        >
                            Spend 1 Synthesis Point
                        </button>
                        <p
                            id="macromolecularizer-upgrade-feedback"
                            role="status"
                            aria-live="polite"
                        ></p>
                    </section>
                </aside>
            </div>
        `;

    },

    // --------------------------------------------------
    // Cache stable shell elements
    // --------------------------------------------------
    cacheElements() {

        this.elements = {
            selectedMotif:
                this.rootElement.querySelector(
                    "#macromolecularizer-selected-motif"
                ),
            inventoryCount:
                this.rootElement.querySelector(
                    "#macromolecularizer-inventory-count"
                ),
            inventoryTotal:
                this.rootElement.querySelector(
                    "#macromolecularizer-inventory-total"
                ),
            inventoryEmpty:
                this.rootElement.querySelector(
                    "#macromolecularizer-inventory-empty"
                ),
            inventoryList:
                this.rootElement.querySelector(
                    "#macromolecularizer-inventory-list"
                ),
            activeSynthesis:
                this.rootElement.querySelector(
                    "#macromolecularizer-active-synthesis"
                ),
            reactionFeedback:
                this.rootElement.querySelector(
                    "#macromolecularizer-reaction-feedback"
                ),
            reactionButtons:
                Array.from(
                    this.rootElement.querySelectorAll(
                        "[data-reaction-id]"
                    )
                ),
            motifCard:
                this.rootElement.querySelector(
                    "#macromolecularizer-h-helix-card"
                ),
            cardName:
                this.rootElement.querySelector(
                    "#macromolecularizer-card-name"
                ),
            cardSummary:
                this.rootElement.querySelector(
                    "#macromolecularizer-card-summary"
                ),
            cardQuantity:
                this.rootElement.querySelector(
                    "#macromolecularizer-card-quantity"
                ),
            cardStatus:
                this.rootElement.querySelector(
                    "#macromolecularizer-card-status"
                ),
            recipeGate:
                this.rootElement.querySelector(
                    "#macromolecularizer-recipe-gate"
                ),
            requirementSummary:
                this.rootElement.querySelector(
                    "#macromolecularizer-requirement-summary"
                ),
            recipeDetails:
                this.rootElement.querySelector(
                    "#macromolecularizer-recipe-details"
                ),
            recipeName:
                this.rootElement.querySelector(
                    "#macromolecularizer-recipe-name"
                ),
            recipeDescription:
                this.rootElement.querySelector(
                    "#macromolecularizer-recipe-description"
                ),
            bondCalculation:
                this.rootElement.querySelector(
                    "#macromolecularizer-bond-calculation"
                ),
            aminoAcidRequirements:
                this.rootElement.querySelector(
                    "#macromolecularizer-amino-acid-requirements"
                ),
            atpRequirement:
                this.rootElement.querySelector(
                    "#macromolecularizer-atp-requirement"
                ),
            synthesisTiming:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-timing"
                ),
            eligibilityFeedback:
                this.rootElement.querySelector(
                    "#macromolecularizer-eligibility-feedback"
                ),
            startSynthesisButton:
                this.rootElement.querySelector(
                    "#macromolecularizer-start-synthesis"
                ),
            synthesisProgressPanel:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-progress-panel"
                ),
            synthesisProgress:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-progress"
                ),
            synthesisCountdown:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-countdown"
                ),
            synthesisFeedback:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-feedback"
                ),
            synthesisPoints:
                this.rootElement.querySelector(
                    "#macromolecularizer-synthesis-points"
                ),
            speedLevel:
                this.rootElement.querySelector(
                    "#macromolecularizer-speed-level"
                ),
            speedMultiplier:
                this.rootElement.querySelector(
                    "#macromolecularizer-speed-multiplier"
                ),
            secondsPerBond:
                this.rootElement.querySelector(
                    "#macromolecularizer-seconds-per-bond"
                ),
            upgradeSpeedButton:
                this.rootElement.querySelector(
                    "#macromolecularizer-upgrade-speed"
                ),
            upgradeFeedback:
                this.rootElement.querySelector(
                    "#macromolecularizer-upgrade-feedback"
                )
        };

    },

    // --------------------------------------------------
    // Bind temporary reaction-discovery controls once
    // --------------------------------------------------
    bindEvents() {

        this.elements.reactionButtons
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const result =
                            MacromolecularizerManager
                                .discoverReaction(
                                    button.dataset
                                        .reactionId
                                );

                        this.elements
                            .reactionFeedback
                            .textContent =
                                result.message;

                        this.feedbackMessage =
                            result.message;

                        this.render();
                    }
                );
            });

        this.elements.startSynthesisButton
            .addEventListener(
                "click",
                () => {
                    const result =
                        MacromolecularizerManager
                            .startSynthesis(
                                "H_helix"
                            );

                    this.synthesisFeedbackMessage =
                        result.message;

                    this.render();
                }
            );

        this.elements.upgradeSpeedButton
            .addEventListener(
                "click",
                () => {
                    const result =
                        MacromolecularizerManager
                            .spendSynthesisPointOnDehydrationSpeed();

                    this.upgradeFeedbackMessage =
                        result.message;

                    this.render();
                }
            );

    },

    // --------------------------------------------------
    // Activate the shell
    // --------------------------------------------------
    activate() {

        if (
            !this.initialized &&
            !this.initialize()
        ) {
            return false;
        }

        this.active = true;
        this.render();

        return true;

    },

    // --------------------------------------------------
    // Deactivate the shell
    // --------------------------------------------------
    deactivate() {

        this.active = false;

        return true;

    },

    // --------------------------------------------------
    // Render read-only persistent status
    // --------------------------------------------------
    render() {

        if (!this.initialized) {
            return false;
        }

        const status =
            MacromolecularizerManager
                .getStatus();

        this.elements.selectedMotif
            .textContent =
                `Selected: ${status.selectedMotifId}`;

        this.elements.inventoryCount
            .textContent =
                String(
                    status.motifInventoryStatus
                        .storedTypes
                );

        this.elements.inventoryTotal
            .textContent =
                String(
                    status.motifInventoryStatus
                        .totalQuantity
                );

        this.elements.activeSynthesis
            .textContent =
                status.activeSynthesis
                    ? `${status.activeSynthesis.motifId} — ${this.formatDuration(status.activeSynthesis.remainingMs)} remaining`
                    :
                "None";

        this.renderMotifRecipe(
            status.selectedMotif,
            status.activeSynthesis
        );

        this.renderSpeedUpgrade(
            status.dehydrationSpeed
        );

        this.renderInventory(
            status.motifInventoryStatus
        );

        this.elements.reactionButtons
            .forEach(button => {
                const reactionId =
                    button.dataset.reactionId;

                const discovered =
                    Boolean(
                        status.reactionDiscoveries[
                            reactionId
                        ]
                    );

                button.disabled =
                    discovered;

                button.setAttribute(
                    "aria-pressed",
                    String(discovered)
                );

                if (discovered) {
                    button.textContent =
                        `${this.formatReactionName(reactionId)} Discovered`;
                } else {
                    button.textContent =
                        `Discover ${this.formatReactionName(reactionId)}`;
                }
            });

        if (this.feedbackMessage === "") {
            const discoveredNames =
                Object.entries(
                    status.reactionDiscoveries
                )
                    .filter(([, discovered]) => discovered)
                    .map(([reactionId]) =>
                        this.formatReactionName(
                            reactionId
                        )
                    );

            this.elements.reactionFeedback
                .textContent =
                    discoveredNames.length > 0
                        ? `Known reactions: ${discoveredNames.join(", ")}.`
                        : "No polymer reactions discovered yet.";
        }

        return true;

    },

    // --------------------------------------------------
    // Render H_helix composition and eligibility
    // --------------------------------------------------
    renderMotifRecipe(
        motif,
        activeSynthesis
    ) {

        if (!motif) {
            this.elements.motifCard.hidden =
                true;
            this.elements.recipeDetails.hidden =
                true;
            this.elements.recipeGate
                .textContent =
                    "The selected motif recipe is unavailable.";

            return false;
        }

        const definition =
            motif.definition;

        this.elements.motifCard.hidden =
            false;
        this.elements.cardName
            .textContent =
                definition.name;
        this.elements.cardSummary
            .textContent =
                `${definition.aminoAcidCount} amino acids · ${definition.atpCost} ATP · ${this.formatDuration(motif.timing.durationMs)}`;
        this.elements.cardQuantity
            .textContent =
                `${motif.inventory.quantity} stored`;
        this.elements.cardStatus
            .textContent =
                this.formatLifecycleStatus(
                    motif.lifecycleStatus,
                    motif.inventory.quantity
                );

        this.elements.motifCard.dataset.status =
            motif.lifecycleStatus;

        this.renderRequirementSummary(
            motif
        );

        const dehydrationKnown =
            Boolean(
                motif.reactionDiscoveries
                    .dehydration
            );

        this.elements.recipeGate.hidden =
            dehydrationKnown;
        this.elements.recipeDetails.hidden =
            !dehydrationKnown;

        if (!dehydrationKnown) {
            this.elements.recipeGate
                .textContent =
                    "Discover dehydration before reviewing motif synthesis requirements.";

            return true;
        }

        this.elements.recipeName
            .textContent =
                definition.name;
        this.elements.recipeDescription
            .textContent =
                definition.description;
        this.elements.bondCalculation
            .textContent =
                `${definition.aminoAcidCount} amino acids form ${definition.peptideBondCount} peptide bonds, requiring ${definition.atpCost} ATP.`;

        this.elements
            .aminoAcidRequirements
            .replaceChildren(
                ...motif.aminoAcids.map(
                    requirement => {

                        const item =
                            document.createElement(
                                "li"
                            );

                        item.dataset.status =
                            requirement.synthesized
                                ? "complete"
                                : "missing";

                        item.textContent =
                            `${requirement.quantity} × ${requirement.name} (${requirement.id}) — ${requirement.synthesized
                                ? `Synthesized (${requirement.synthesisCount})`
                                : "Not yet synthesized"}`;

                        return item;

                    }
                )
            );

        this.elements.atpRequirement
            .textContent =
                `${motif.atp.current} ATP available · ${motif.atp.cost} ATP required`;

        this.elements.synthesisTiming
            .textContent =
                `${this.formatDuration(motif.timing.durationMs)} at ${motif.timing.speedMultiplier}× speed (${motif.timing.baseSecondsPerPeptideBond} seconds per peptide bond at base speed).`;

        const selectedJob =
            activeSynthesis
                ?.motifId ===
            definition.id
                ? activeSynthesis
                : null;

        this.elements.startSynthesisButton
            .disabled =
                !motif.canStart;

        this.elements.startSynthesisButton
            .textContent = selectedJob
                ? "H_helix Synthesis in Progress"
                : motif.inventory.quantity > 0
                    ? "Synthesize Another H_helix"
                    : "Begin H_helix Synthesis";

        this.elements.synthesisProgressPanel
            .hidden =
                !selectedJob;

        if (selectedJob) {
            this.elements.synthesisProgress
                .value =
                    selectedJob.progress;

            this.elements.synthesisCountdown
                .textContent =
                    `${this.formatDuration(selectedJob.remainingMs)} remaining · ${Math.floor(selectedJob.progress * 100)}% complete · started at ${selectedJob.speedMultiplier}× speed`;
        } else {
            this.elements.synthesisProgress
                .value = 0;
            this.elements.synthesisCountdown
                .textContent = "";
        }

        this.elements.synthesisFeedback
            .textContent =
                this.synthesisFeedbackMessage ||
                (
                    motif.inventory.quantity > 0
                        ? `${motif.inventory.quantity} completed H_helix ${motif.inventory.quantity === 1
                            ? "is"
                            : "are"} stored in the motif inventory.`
                        : "No H_helix motifs have been completed yet."
                );

        if (selectedJob) {
            this.elements
                .eligibilityFeedback
                .textContent =
                    "H_helix synthesis is running. Amino-acid prerequisites remain available and are not consumed.";
        } else if (
            motif.missingAminoAcidIds
                .length > 0
        ) {
            const missingNames =
                motif.aminoAcids
                    .filter(
                        requirement =>
                            !requirement
                                .synthesized
                    )
                    .map(
                        requirement =>
                            requirement.name
                    );

            this.elements
                .eligibilityFeedback
                .textContent =
                    `Synthesize each of these amino-acid types once in Molecule Lab: ${missingNames.join(", ")}. Recipe quantities describe the motif and are not consumed.`;
        } else if (!motif.atp.canAfford) {
            this.elements
                .eligibilityFeedback
                .textContent =
                    `Generate ${motif.requirements.atp.missingAmount} more ATP in the Pond. ${motif.atp.cost} ATP is required and ${motif.atp.current} ATP is available.`;
        } else {
            this.elements
                .eligibilityFeedback
                .textContent =
                    motif.inventory.quantity > 0
                        ? "All requirements are met. Another H_helix can be synthesized without consuming amino-acid prerequisites."
                        : "All H_helix requirements are met. Synthesis is ready.";
        }

        return true;

    },

    // --------------------------------------------------
    // Render one concise checklist for the next job
    // --------------------------------------------------
    renderRequirementSummary(motif) {

        const reactionNames =
            Object.keys(
                motif.reactionDiscoveries
            ).map(
                reactionId =>
                    this.formatReactionName(
                        reactionId
                    )
            );

        const missingAminoAcidNames =
            motif.aminoAcids
                .filter(
                    requirement =>
                        !requirement
                            .synthesized
                )
                .map(
                    requirement =>
                        requirement.name
                );

        const requirementRows = [
            {
                complete:
                    motif.requirements
                        .reactionDiscovery
                        .complete,
                text:
                    `${reactionNames.join(", ")} discovery — ${motif.requirements.reactionDiscovery.complete
                        ? "Complete"
                        : "Missing"}`
            },
            {
                complete:
                    motif.requirements
                        .aminoAcids
                        .complete,
                text:
                    `Amino-acid synthesis knowledge — ${motif.requirements.aminoAcids.synthesizedTypes} of ${motif.requirements.aminoAcids.requiredTypes} types complete${missingAminoAcidNames.length > 0
                        ? `; missing ${missingAminoAcidNames.join(", ")}`
                        : ""}`
            },
            {
                complete:
                    motif.requirements
                        .atp
                        .complete,
                text:
                    `ATP — ${motif.atp.current} available / ${motif.atp.cost} required${motif.requirements.atp.missingAmount > 0
                        ? `; generate ${motif.requirements.atp.missingAmount} more`
                        : ""}`
            }
        ];

        this.elements.requirementSummary
            .replaceChildren(
                ...requirementRows.map(
                    requirement => {
                        const item =
                            document.createElement(
                                "li"
                            );

                        item.dataset.status =
                            requirement.complete
                                ? "complete"
                                : "missing";

                        item.textContent =
                            requirement.text;

                        return item;
                    }
                )
            );

        return true;

    },

    // --------------------------------------------------
    // Render persisted quantities for enabled motifs
    // --------------------------------------------------
    renderInventory(inventoryStatus) {

        this.elements.inventoryEmpty.hidden =
            inventoryStatus.totalQuantity > 0;

        this.elements.inventoryList
            .replaceChildren(
                ...inventoryStatus.items.map(
                    motif => {
                        const item =
                            document.createElement(
                                "li"
                            );

                        item.dataset.status =
                            motif.lifecycleStatus;

                        item.textContent =
                            `${motif.name} (${motif.id}) — ${motif.quantity} stored · ${this.formatLifecycleStatus(motif.lifecycleStatus, motif.quantity)}`;

                        return item;
                    }
                )
            );

        return true;

    },

    formatLifecycleStatus(
        lifecycleStatus,
        quantity
    ) {

        if (
            lifecycleStatus ===
            "synthesizing"
        ) {
            return quantity > 0
                ? "Synthesizing another motif"
                : "Synthesizing first motif";
        }

        if (
            lifecycleStatus === "ready"
        ) {
            return quantity > 0
                ? "Ready to synthesize another"
                : "Ready to synthesize";
        }

        return quantity > 0
            ? "Requirements incomplete for another synthesis"
            : "Requirements incomplete";

    },

    // --------------------------------------------------
    // Render Synthesis Points and speed-upgrade status
    // --------------------------------------------------
    renderSpeedUpgrade(speed) {

        this.elements.synthesisPoints
            .textContent =
                String(
                    speed.points.current
                );

        this.elements.speedLevel
            .textContent =
                String(speed.level);

        this.elements.speedMultiplier
            .textContent =
                `${speed.speedMultiplier}×`;

        this.elements.secondsPerBond
            .textContent =
                this.formatSeconds(
                    speed.effectiveSecondsPerPeptideBond
                );

        this.elements.upgradeSpeedButton
            .disabled =
                speed.points.current <
                speed.synthesisPointCost;

        this.elements.upgradeFeedback
            .textContent =
                this.upgradeFeedbackMessage ||
                "Speed upgrades apply only to newly started jobs.";

        return true;

    },

    formatDuration(durationMs) {

        const totalSeconds =
            Math.max(
                0,
                Math.ceil(
                    durationMs /
                    1000
                )
            );

        const minutes =
            Math.floor(
                totalSeconds /
                60
            );

        const seconds =
            totalSeconds % 60;

        if (minutes === 0) {
            return `${seconds}s`;
        }

        return `${minutes}m ${seconds}s`;

    },

    formatSeconds(seconds) {

        return Number.isInteger(seconds)
            ? String(seconds)
            : seconds.toFixed(2)
                .replace(/0+$/, "")
                .replace(/\.$/, "");

    },

    formatReactionName(reactionId) {

        return reactionId
            .charAt(0)
            .toUpperCase() +
            reactionId.slice(1);

    },

    // --------------------------------------------------
    // Subscribe once to domain-state changes
    // --------------------------------------------------
    subscribe() {

        if (this.subscribed) {
            return;
        }

        GameStateObserver.on(
            "macromolecularizer-state-changed",
            detail => {
                if (
                    detail?.reason ===
                    "synthesis-completed"
                ) {
                    this.synthesisFeedbackMessage =
                        detail.saved
                            ? `${detail.motifId} synthesis completed and saved.`
                            : `${detail.motifId} synthesis completed, but the browser save failed.`;
                }

                this.render();
            }
        );

        this.subscribed = true;

    }

};

export default MacromolecularizerUI;
