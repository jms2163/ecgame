// --------------------------------------------------
// PlayerBadgeDrawer.js
// Global player badge, profile setup, and save drawer
// --------------------------------------------------

import NavigationUI from "./NavigationUI.js";
import PlayerProfileManager
    from "./PlayerProfileManager.js";
import SaveManager from "./SaveManager.js";
import GameStateObserver
    from "./GameStateObserver.js";
import ProgressReportExporter
    from "./ProgressReportExporter.js";

const UTILITY_CONTROL_ID = "player-badge";
const DIALOG_ID = "player-badge-drawer";
const DIALOG_TITLE_ID =
    "player-badge-drawer-title";

const PlayerBadgeDrawer = {

    initialized: false,
    badgeButton: null,
    badgeAvatar: null,
    badgeLabel: null,
    badgeStatus: null,
    dialog: null,
    setupStep: 0,
    setupDraft: {
        firstName: "",
        lastName: "",
        gamertag: ""
    },
    setupErrors: {},
    feedback: null,
    editingGamertag: false,
    suppressReactiveRender: false,

    initialize() {

        if (this.initialized) {
            this.refreshBadge();
            return true;
        }

        if (
            typeof HTMLDialogElement ===
                "undefined"
        ) {
            console.error(
                "PlayerBadgeDrawer: this browser does not support dialog controls"
            );

            return false;
        }

        this.createBadgeButton();
        this.createDialog();
        this.registerObservers();

        const registered =
            NavigationUI.registerUtilityControl(
                UTILITY_CONTROL_ID,
                this.badgeButton
            );

        if (!registered) {
            this.dialog.remove();
            this.dialog = null;

            return false;
        }

        this.initialized = true;
        this.refreshBadge();

        return true;

    },

    createElement(
        tagName,
        {
            className = "",
            text = "",
            attributes = {}
        } = {}
    ) {

        const element =
            document.createElement(tagName);

        if (className) {
            element.className = className;
        }

        if (text !== "") {
            element.textContent = text;
        }

        Object.entries(attributes)
            .forEach(([name, value]) => {
                if (
                    value !== null &&
                    value !== undefined
                ) {
                    element.setAttribute(
                        name,
                        String(value)
                    );
                }
            });

        return element;

    },

    createBadgeButton() {

        const button =
            this.createElement(
                "button",
                {
                    className:
                        "player-badge-button",
                    attributes: {
                        type: "button",
                        "aria-haspopup": "dialog",
                        "aria-controls": DIALOG_ID,
                        "aria-expanded": "false"
                    }
                }
            );

        this.badgeAvatar =
            this.createElement(
                "span",
                {
                    className:
                        "player-badge-avatar",
                    text: "?",
                    attributes: {
                        "aria-hidden": "true"
                    }
                }
            );

        const textGroup =
            this.createElement(
                "span",
                {
                    className:
                        "player-badge-text"
                }
            );

        this.badgeLabel =
            this.createElement(
                "span",
                {
                    className:
                        "player-badge-label",
                    text: "Create Game"
                }
            );

        this.badgeStatus =
            this.createElement(
                "span",
                {
                    className:
                        "player-badge-status",
                    text: "Profile needed"
                }
            );

        textGroup.append(
            this.badgeLabel,
            this.badgeStatus
        );

        button.append(
            this.badgeAvatar,
            textGroup
        );

        button.addEventListener(
            "click",
            () => this.open()
        );

        this.badgeButton = button;

    },

    createDialog() {

        const dialog =
            this.createElement(
                "dialog",
                {
                    className:
                        "player-drawer-dialog",
                    attributes: {
                        id: DIALOG_ID,
                        "aria-labelledby":
                            DIALOG_TITLE_ID
                    }
                }
            );

        dialog.addEventListener(
            "close",
            () => {
                document.body.classList.remove(
                    "player-drawer-open"
                );

                this.badgeButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

                this.feedback = null;
                this.editingGamertag = false;

                this.badgeButton.focus();
            }
        );

        dialog.addEventListener(
            "click",
            event => {
                if (event.target !== dialog) {
                    return;
                }

                const bounds =
                    dialog.getBoundingClientRect();

                const insidePanel =
                    event.clientX >= bounds.left &&
                    event.clientX <= bounds.right &&
                    event.clientY >= bounds.top &&
                    event.clientY <= bounds.bottom;

                if (!insidePanel) {
                    dialog.close();
                }
            }
        );

        document.body.appendChild(dialog);

        this.dialog = dialog;

    },

    registerObservers() {

        [
            "player-profile-changed",
            "save-status-changed",
            "game-state-loaded"
        ].forEach(eventName => {
            GameStateObserver.on(
                eventName,
                () => {
                    this.refreshBadge();

                    if (
                        this.dialog?.open &&
                        !this.suppressReactiveRender
                    ) {
                        this.renderDialog();
                    }
                }
            );
        });

    },

    getSaveStatusLabel() {

        const status =
            SaveManager.getStatus();

        if (status.state === "save-failed") {
            return {
                text: "Save failed",
                tone: "error"
            };
        }

        if (status.state === "saved") {
            return {
                text: "Saved",
                tone: "success"
            };
        }

        if (status.state === "loaded") {
            return {
                text:
                    status.lastSuccessfulSaveAtMs
                        ? "Save loaded"
                        : "Loaded · save now",
                tone:
                    status.lastSuccessfulSaveAtMs
                        ? "success"
                        : "neutral"
            };
        }

        if (status.state === "no-save") {
            return {
                text: "Not saved",
                tone: "neutral"
            };
        }

        return {
            text: "Open profile",
            tone: "neutral"
        };

    },

    refreshBadge() {

        if (!this.badgeButton) {
            return false;
        }

        const profile =
            PlayerProfileManager
                .getProfileSnapshot();

        if (!profile.complete) {
            const existingSave =
                SaveManager.hasSave();

            this.badgeAvatar.textContent = "+";
            this.badgeLabel.textContent =
                existingSave
                    ? "Finish Setup"
                    : "Create Game";
            this.badgeStatus.textContent =
                existingSave
                    ? "Keep current progress"
                    : "Profile needed";

            this.badgeStatus.dataset.tone =
                "attention";

            this.badgeButton.setAttribute(
                "aria-label",
                existingSave
                    ? "Finish player profile setup"
                    : "Create a new game profile"
            );

            return true;
        }

        const saveLabel =
            this.getSaveStatusLabel();

        this.badgeAvatar.textContent =
            PlayerProfileManager
                .getInitials();
        this.badgeLabel.textContent =
            profile.gamertag;
        this.badgeStatus.textContent =
            saveLabel.text;
        this.badgeStatus.dataset.tone =
            saveLabel.tone;

        this.badgeButton.setAttribute(
            "aria-label",
            `Open player drawer for ${profile.gamertag}. ${saveLabel.text}.`
        );

        return true;

    },

    open() {

        if (!this.dialog || this.dialog.open) {
            return false;
        }

        this.feedback = null;
        this.renderDialog();

        document.body.classList.add(
            "player-drawer-open"
        );

        this.badgeButton.setAttribute(
            "aria-expanded",
            "true"
        );

        this.dialog.showModal();

        requestAnimationFrame(() => {
            const focusTarget =
                this.dialog.querySelector(
                    "[data-initial-focus]"
                ) ||
                this.dialog.querySelector(
                    `#${DIALOG_TITLE_ID}`
                );

            focusTarget?.focus();
        });

        return true;

    },

    close() {

        if (!this.dialog?.open) {
            return false;
        }

        this.dialog.close();

        return true;

    },

    renderDialog(focusSelector = null) {

        if (!this.dialog) {
            return false;
        }

        const panel =
            this.createElement(
                "div",
                {
                    className:
                        "player-drawer-panel"
                }
            );

        panel.appendChild(
            this.renderHeader()
        );

        const body =
            this.createElement(
                "div",
                {
                    className:
                        "player-drawer-body"
                }
            );

        if (this.feedback) {
            body.appendChild(
                this.renderFeedback()
            );
        }

        const profile =
            PlayerProfileManager
                .getProfileSnapshot();

        if (profile.complete) {
            body.append(
                this.renderProfileSection(
                    profile
                ),
                this.renderSaveSection(),
                this.renderReportSection()
            );
        } else {
            body.appendChild(
                this.renderSetup()
            );
        }

        panel.appendChild(body);

        this.dialog.replaceChildren(panel);

        if (focusSelector) {
            requestAnimationFrame(() => {
                this.dialog
                    .querySelector(
                        focusSelector
                    )
                    ?.focus();
            });
        }

        return true;

    },

    renderHeader() {

        const header =
            this.createElement(
                "header",
                {
                    className:
                        "player-drawer-header"
                }
            );

        const heading =
            this.createElement(
                "h2",
                {
                    text:
                        "Player Badge & Game Management",
                    attributes: {
                        id: DIALOG_TITLE_ID,
                        tabindex: "-1"
                    }
                }
            );

        const closeButton =
            this.createElement(
                "button",
                {
                    className:
                        "player-drawer-close",
                    text: "×",
                    attributes: {
                        type: "button",
                        "aria-label":
                            "Close player drawer"
                    }
                }
            );

        closeButton.addEventListener(
            "click",
            () => this.close()
        );

        header.append(
            heading,
            closeButton
        );

        return header;

    },

    renderFeedback() {

        return this.createElement(
            "div",
            {
                className:
                    "player-drawer-feedback",
                text: this.feedback.message,
                attributes: {
                    role:
                        this.feedback.tone ===
                            "error"
                            ? "alert"
                            : "status",
                    "aria-live": "polite",
                    "data-tone":
                        this.feedback.tone
                }
            }
        );

    },

    renderSetup() {

        const section =
            this.createElement(
                "section",
                {
                    className:
                        "player-setup-section",
                    attributes: {
                        "aria-labelledby":
                            "player-setup-heading"
                    }
                }
            );

        const stepLabel =
            this.createElement(
                "p",
                {
                    className:
                        "player-setup-step",
                    text:
                        `Step ${this.setupStep + 1} of 4`
                }
            );

        section.appendChild(stepLabel);

        const renderers = [
            () => this.renderSetupWelcome(),
            () => this.renderSetupName(),
            () => this.renderSetupGamertag(),
            () => this.renderSetupReview()
        ];

        section.appendChild(
            renderers[this.setupStep]()
        );

        return section;

    },

    renderSetupWelcome() {

        const container =
            this.createElement("div");

        const existingSave =
            SaveManager.hasSave();

        const heading =
            this.createElement(
                "h3",
                {
                    text:
                        existingSave
                            ? "Finish your player profile"
                            : "Create your player profile",
                    attributes: {
                        id: "player-setup-heading"
                    }
                }
            );

        const explanation =
            this.createElement(
                "p",
                {
                    text:
                        existingSave
                            ? "Your current game progress will be kept. Add your name and gamertag to finish setup."
                            : "Choose the identity you will use while exploring ECGame."
                }
            );

        const localNotice =
            this.createElement(
                "p",
                {
                    className:
                        "player-drawer-note",
                    text:
                        "Your game will be saved in this browser profile, not to a cloud account."
                }
            );

        const startButton =
            this.createElement(
                "button",
                {
                    className:
                        "player-drawer-primary",
                    text:
                        existingSave
                            ? "Finish Profile Setup"
                            : "Create Player Profile",
                    attributes: {
                        type: "button",
                        "data-initial-focus": ""
                    }
                }
            );

        startButton.addEventListener(
            "click",
            () => {
                this.setupStep = 1;
                this.setupErrors = {};
                this.renderDialog(
                    "#player-first-name"
                );
            }
        );

        container.append(
            heading,
            explanation,
            localNotice,
            startButton
        );

        return container;

    },

    renderSetupName() {

        const container =
            this.createElement("div");

        const heading =
            this.createElement(
                "h3",
                {
                    text: "Enter your name",
                    attributes: {
                        id: "player-setup-heading"
                    }
                }
            );

        const warning =
            this.createElement(
                "p",
                {
                    className:
                        "player-drawer-warning",
                    text:
                        "Check the spelling carefully. Your name locks when the profile is created."
                }
            );

        const form =
            this.createElement("form");

        form.noValidate = true;

        const firstField =
            this.renderTextField({
                id: "player-first-name",
                label: "First name",
                value:
                    this.setupDraft.firstName,
                error:
                    this.setupErrors.firstName,
                autocomplete: "given-name"
            });

        const lastField =
            this.renderTextField({
                id: "player-last-name",
                label: "Last name",
                value:
                    this.setupDraft.lastName,
                error:
                    this.setupErrors.lastName,
                autocomplete: "family-name"
            });

        const actions =
            this.renderSetupActions({
                back: () => {
                    this.setupStep = 0;
                    this.setupErrors = {};
                    this.renderDialog(
                        "[data-initial-focus]"
                    );
                },
                nextLabel: "Continue",
                next: () => {
                    const firstName =
                        form.elements.firstName
                            .value;
                    const lastName =
                        form.elements.lastName
                            .value;

                    const firstResult =
                        PlayerProfileManager
                            .validateNamePart(
                                firstName,
                                "First name"
                            );
                    const lastResult =
                        PlayerProfileManager
                            .validateNamePart(
                                lastName,
                                "Last name"
                            );

                    this.setupDraft.firstName =
                        firstResult.value;
                    this.setupDraft.lastName =
                        lastResult.value;
                    this.setupErrors = {
                        firstName:
                            firstResult.ok
                                ? ""
                                : firstResult.message,
                        lastName:
                            lastResult.ok
                                ? ""
                                : lastResult.message
                    };

                    if (
                        !firstResult.ok ||
                        !lastResult.ok
                    ) {
                        this.renderDialog(
                            !firstResult.ok
                                ? "#player-first-name"
                                : "#player-last-name"
                        );

                        return;
                    }

                    this.setupStep = 2;
                    this.setupErrors = {};
                    this.renderDialog(
                        "#player-gamertag"
                    );
                }
            });

        form.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                actions.nextButton.click();
            }
        );

        form.append(
            firstField,
            lastField,
            actions.element
        );

        container.append(
            heading,
            warning,
            form
        );

        return container;

    },

    renderSetupGamertag() {

        const container =
            this.createElement("div");

        const heading =
            this.createElement(
                "h3",
                {
                    text: "Choose a gamertag",
                    attributes: {
                        id: "player-setup-heading"
                    }
                }
            );

        const explanation =
            this.createElement(
                "p",
                {
                    text:
                        "Your gamertag appears on the global badge. It does not need to be unique and can be changed later."
                }
            );

        const form =
            this.createElement("form");

        form.noValidate = true;

        const gamertagField =
            this.renderTextField({
                id: "player-gamertag",
                label: "Gamertag",
                value:
                    this.setupDraft.gamertag,
                error:
                    this.setupErrors.gamertag,
                description:
                    "3–20 characters: letters, numbers, spaces, periods, hyphens, or underscores.",
                autocomplete: "off"
            });

        const actions =
            this.renderSetupActions({
                back: () => {
                    this.setupStep = 1;
                    this.setupErrors = {};
                    this.renderDialog(
                        "#player-first-name"
                    );
                },
                nextLabel: "Review Profile",
                next: () => {
                    const result =
                        PlayerProfileManager
                            .validateGamertag(
                                form.elements
                                    .gamertag
                                    .value
                            );

                    this.setupDraft.gamertag =
                        result.value;
                    this.setupErrors = {
                        gamertag:
                            result.ok
                                ? ""
                                : result.message
                    };

                    if (!result.ok) {
                        this.renderDialog(
                            "#player-gamertag"
                        );

                        return;
                    }

                    this.setupStep = 3;
                    this.setupErrors = {};
                    this.renderDialog(
                        "#confirm-player-identity"
                    );
                }
            });

        form.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                actions.nextButton.click();
            }
        );

        form.append(
            gamertagField,
            actions.element
        );

        container.append(
            heading,
            explanation,
            form
        );

        return container;

    },

    renderSetupReview() {

        const container =
            this.createElement("div");

        const heading =
            this.createElement(
                "h3",
                {
                    text: "Review your profile",
                    attributes: {
                        id: "player-setup-heading"
                    }
                }
            );

        const reviewList =
            this.createElement(
                "dl",
                {
                    className:
                        "player-profile-review"
                }
            );

        [
            [
                "Name",
                `${this.setupDraft.firstName} ${this.setupDraft.lastName}`
            ],
            [
                "Gamertag",
                this.setupDraft.gamertag
            ]
        ].forEach(([label, value]) => {
            reviewList.append(
                this.createElement(
                    "dt",
                    { text: label }
                ),
                this.createElement(
                    "dd",
                    { text: value }
                )
            );
        });

        const form =
            this.createElement("form");

        form.noValidate = true;

        const confirmation =
            this.createElement(
                "label",
                {
                    className:
                        "player-confirmation"
                }
            );

        const checkbox =
            this.createElement(
                "input",
                {
                    attributes: {
                        id:
                            "confirm-player-identity",
                        name:
                            "confirmPlayerIdentity",
                        type: "checkbox"
                    }
                }
            );

        const confirmationText =
            this.createElement(
                "span",
                {
                    text:
                        "I checked the spelling. I understand that my name locks when this profile is created."
                }
            );

        confirmation.append(
            checkbox,
            confirmationText
        );

        form.appendChild(confirmation);

        if (this.setupErrors.confirmation) {
            checkbox.setAttribute(
                "aria-invalid",
                "true"
            );
            checkbox.setAttribute(
                "aria-describedby",
                "confirm-player-identity-error"
            );

            form.appendChild(
                this.createElement(
                    "p",
                    {
                        className:
                            "player-field-error",
                        text:
                            this.setupErrors
                                .confirmation,
                        attributes: {
                            id:
                                "confirm-player-identity-error"
                        }
                    }
                )
            );
        }

        const actions =
            this.renderSetupActions({
                back: () => {
                    this.setupStep = 2;
                    this.setupErrors = {};
                    this.renderDialog(
                        "#player-gamertag"
                    );
                },
                nextLabel: "Create Profile",
                next: () => {
                    if (!checkbox.checked) {
                        this.setupErrors = {
                            confirmation:
                                "Confirm that you checked the profile information."
                        };

                        this.renderDialog(
                            "#confirm-player-identity"
                        );

                        return;
                    }

                    this.suppressReactiveRender =
                        true;

                    const result =
                        PlayerProfileManager
                            .createProfile(
                                this.setupDraft
                            );

                    this.suppressReactiveRender =
                        false;

                    if (!result.ok) {
                        this.feedback = {
                            tone: "error",
                            message: result.message
                        };
                        this.renderDialog(
                            "#confirm-player-identity"
                        );

                        return;
                    }

                    this.feedback = {
                        tone:
                            result.saved
                                ? "success"
                                : "error",
                        message: result.message
                    };
                    this.setupStep = 0;
                    this.setupErrors = {};
                    this.setupDraft = {
                        firstName: "",
                        lastName: "",
                        gamertag: ""
                    };
                    this.refreshBadge();
                    this.renderDialog(
                        "[data-save-game]"
                    );
                }
            });

        form.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                actions.nextButton.click();
            }
        );

        form.append(
            actions.element
        );

        container.append(
            heading,
            reviewList,
            form
        );

        return container;

    },

    renderTextField({
        id,
        label,
        value,
        error = "",
        description = "",
        autocomplete = "off"
    }) {

        const field =
            this.createElement(
                "div",
                {
                    className:
                        "player-form-field"
                }
            );

        const labelElement =
            this.createElement(
                "label",
                {
                    text: label,
                    attributes: {
                        for: id
                    }
                }
            );

        const descriptionId =
            description
                ? `${id}-description`
                : null;
        const errorId =
            error
                ? `${id}-error`
                : null;

        const input =
            this.createElement(
                "input",
                {
                    attributes: {
                        id,
                        name:
                            id === "player-first-name"
                                ? "firstName"
                                : id === "player-last-name"
                                    ? "lastName"
                                    : "gamertag",
                        type: "text",
                        value,
                        maxlength:
                            id === "player-gamertag"
                                ? "20"
                                : "50",
                        autocomplete,
                        autocapitalize:
                            id === "player-gamertag"
                                ? "none"
                                : "words",
                        spellcheck:
                            id === "player-gamertag"
                                ? "false"
                                : "true",
                        "aria-invalid":
                            error
                                ? "true"
                                : "false",
                        "aria-describedby":
                            [
                                descriptionId,
                                errorId
                            ]
                                .filter(Boolean)
                                .join(" ") || null
                    }
                }
            );

        field.append(
            labelElement,
            input
        );

        if (description) {
            field.appendChild(
                this.createElement(
                    "p",
                    {
                        className:
                            "player-field-description",
                        text: description,
                        attributes: {
                            id: descriptionId
                        }
                    }
                )
            );
        }

        if (error) {
            field.appendChild(
                this.createElement(
                    "p",
                    {
                        className:
                            "player-field-error",
                        text: error,
                        attributes: {
                            id: errorId
                        }
                    }
                )
            );
        }

        return field;

    },

    renderSetupActions({
        back,
        next,
        nextLabel
    }) {

        const element =
            this.createElement(
                "div",
                {
                    className:
                        "player-drawer-actions"
                }
            );

        const backButton =
            this.createElement(
                "button",
                {
                    className:
                        "player-drawer-secondary",
                    text: "Back",
                    attributes: {
                        type: "button"
                    }
                }
            );

        const nextButton =
            this.createElement(
                "button",
                {
                    className:
                        "player-drawer-primary",
                    text: nextLabel,
                    attributes: {
                        type: "button"
                    }
                }
            );

        backButton.addEventListener(
            "click",
            back
        );
        nextButton.addEventListener(
            "click",
            next
        );

        element.append(
            backButton,
            nextButton
        );

        return {
            element,
            backButton,
            nextButton
        };

    },

    renderProfileSection(profile) {

        const section =
            this.createElement(
                "section",
                {
                    className:
                        "player-drawer-section",
                    attributes: {
                        "aria-labelledby":
                            "player-profile-heading"
                    }
                }
            );

        const heading =
            this.createElement(
                "h3",
                {
                    text: "Player Profile",
                    attributes: {
                        id:
                            "player-profile-heading"
                    }
                }
            );

        const summary =
            this.createElement(
                "div",
                {
                    className:
                        "player-profile-summary"
                }
            );

        const avatar =
            this.createElement(
                "span",
                {
                    className:
                        "player-profile-avatar",
                    text:
                        PlayerProfileManager
                            .getInitials(),
                    attributes: {
                        "aria-hidden": "true"
                    }
                }
            );

        const identity =
            this.createElement("div");

        identity.append(
            this.createElement(
                "p",
                {
                    className:
                        "player-profile-gamertag",
                    text: profile.gamertag
                }
            ),
            this.createElement(
                "p",
                {
                    className:
                        "player-profile-name",
                    text: profile.fullName
                }
            ),
            this.createElement(
                "p",
                {
                    className:
                        "player-profile-lock",
                    text: "Name confirmed and locked"
                }
            )
        );

        summary.append(
            avatar,
            identity
        );

        section.append(
            heading,
            summary
        );

        if (this.editingGamertag) {
            section.appendChild(
                this.renderGamertagEditor(
                    profile
                )
            );
        } else {
            const editButton =
                this.createElement(
                    "button",
                    {
                        className:
                            "player-drawer-secondary player-gamertag-edit",
                        text: "Change Gamertag",
                        attributes: {
                            type: "button"
                        }
                    }
                );

            editButton.addEventListener(
                "click",
                () => {
                    this.editingGamertag =
                        true;
                    this.setupDraft.gamertag =
                        profile.gamertag;
                    this.setupErrors = {};
                    this.renderDialog(
                        "#edit-player-gamertag"
                    );
                }
            );

            section.appendChild(editButton);
        }

        const details =
            this.createElement(
                "details",
                {
                    className:
                        "player-profile-details"
                }
            );

        details.append(
            this.createElement(
                "summary",
                {
                    text: "Profile details"
                }
            ),
            this.createElement(
                "p",
                {
                    text:
                        `Player ID: ${profile.playerId}`
                }
            )
        );

        section.appendChild(details);

        return section;

    },

    renderGamertagEditor(profile) {

        const form =
            this.createElement(
                "form",
                {
                    className:
                        "player-gamertag-form"
                }
            );

        form.noValidate = true;

        const field =
            this.renderTextField({
                id: "edit-player-gamertag",
                label: "New gamertag",
                value:
                    this.setupDraft.gamertag ||
                    profile.gamertag,
                error:
                    this.setupErrors.gamertag,
                description:
                    "Changing your gamertag saves automatically.",
                autocomplete: "off"
            });

        const actions =
            this.createElement(
                "div",
                {
                    className:
                        "player-drawer-actions"
                }
            );

        const cancelButton =
            this.createElement(
                "button",
                {
                    className:
                        "player-drawer-secondary",
                    text: "Cancel",
                    attributes: {
                        type: "button"
                    }
                }
            );

        const saveButton =
            this.createElement(
                "button",
                {
                    className:
                        "player-drawer-primary",
                    text: "Save Gamertag",
                    attributes: {
                        type: "submit"
                    }
                }
            );

        cancelButton.addEventListener(
            "click",
            () => {
                this.editingGamertag = false;
                this.setupErrors = {};
                this.setupDraft.gamertag = "";
                this.renderDialog(
                    ".player-gamertag-edit"
                );
            }
        );

        form.addEventListener(
            "submit",
            event => {
                event.preventDefault();

                const input =
                    form.querySelector(
                        "#edit-player-gamertag"
                    );

                const validation =
                    PlayerProfileManager
                        .validateGamertag(
                            input.value
                        );

                this.setupDraft.gamertag =
                    validation.value;

                if (!validation.ok) {
                    this.setupErrors = {
                        gamertag:
                            validation.message
                    };
                    this.renderDialog(
                        "#edit-player-gamertag"
                    );

                    return;
                }

                this.suppressReactiveRender =
                    true;

                const result =
                    PlayerProfileManager
                        .updateGamertag(
                            validation.value
                        );

                this.suppressReactiveRender =
                    false;
                this.editingGamertag = false;
                this.setupErrors = {};
                this.setupDraft.gamertag = "";
                this.feedback = {
                    tone:
                        result.saved
                            ? "success"
                            : "error",
                    message: result.message
                };
                this.refreshBadge();
                this.renderDialog(
                    ".player-gamertag-edit"
                );
            }
        );

        actions.append(
            cancelButton,
            saveButton
        );

        form.append(
            field,
            actions
        );

        return form;

    },

    renderSaveSection() {

        const section =
            this.createElement(
                "section",
                {
                    className:
                        "player-drawer-section",
                    attributes: {
                        "aria-labelledby":
                            "player-save-heading"
                    }
                }
            );

        const heading =
            this.createElement(
                "h3",
                {
                    text: "Save Game",
                    attributes: {
                        id: "player-save-heading"
                    }
                }
            );

        const status =
            SaveManager.getStatus();

        const statusText =
            status.lastSuccessfulSaveAtMs
                ? `Last saved ${this.formatTimestamp(status.lastSuccessfulSaveAtMs)}.`
                : "This game does not have a verified save timestamp yet.";

        const statusElement =
            this.createElement(
                "p",
                {
                    className:
                        "player-save-status",
                    text: statusText,
                    attributes: {
                        role: "status",
                        "aria-live": "polite",
                        "data-state":
                            status.state
                    }
                }
            );

        const saveButton =
            this.createElement(
                "button",
                {
                    className:
                        "player-drawer-primary player-save-button",
                    text: "Save Game",
                    attributes: {
                        type: "button",
                        "data-save-game": ""
                    }
                }
            );

        saveButton.addEventListener(
            "click",
            () => {
                this.suppressReactiveRender =
                    true;

                const saved =
                    SaveManager.save({
                        reason:
                            "player-drawer-manual"
                    });

                this.suppressReactiveRender =
                    false;
                this.feedback = {
                    tone:
                        saved
                            ? "success"
                            : "error",
                    message:
                        SaveManager
                            .getStatus()
                            .message
                };
                this.refreshBadge();
                this.renderDialog(
                    "[data-save-game]"
                );
            }
        );

        const explanation =
            this.createElement(
                "p",
                {
                    className:
                        "player-drawer-note",
                    text:
                        "This saves your current progress only in this browser profile. It is not a cloud backup."
                }
            );

        const details =
            this.createElement(
                "details",
                {
                    className:
                        "player-save-details"
                }
            );

        details.append(
            this.createElement(
                "summary",
                {
                    text:
                        "When can a local save be unavailable?"
                }
            ),
            this.createElement(
                "p",
                {
                    text:
                        "Clearing browser data, using a different device, browser, or browser profile, or opening a different ECGame website address can make this save unavailable."
                }
            )
        );

        section.append(
            heading,
            statusElement,
            saveButton,
            explanation,
            details
        );

        return section;

    },

    renderReportSection() {

        const section =
            this.createElement(
                "section",
                {
                    className:
                        "player-drawer-section",
                    attributes: {
                        "aria-labelledby":
                            "player-report-heading"
                    }
                }
            );

        const heading =
            this.createElement(
                "h3",
                {
                    text: "Report Progress",
                    attributes: {
                        id: "player-report-heading"
                    }
                }
            );

        const explanation =
            this.createElement(
                "p",
                {
                    className:
                        "player-report-summary",
                    text:
                        "Download a progress record to upload to Canvas or email when requested."
                }
            );

        const reportButton =
            this.createElement(
                "button",
                {
                    className:
                        "player-drawer-primary player-report-button",
                    text:
                        "Download Progress Report",
                    attributes: {
                        type: "button",
                        "data-report-progress": ""
                    }
                }
            );

        reportButton.addEventListener(
            "click",
            async () => {
                reportButton.disabled = true;
                reportButton.textContent =
                    "Preparing Report…";

                try {
                    const result =
                        await ProgressReportExporter
                            .downloadReport();

                    this.feedback = {
                        tone: "success",
                        message: result.message
                    };
                } catch (error) {
                    console.error(
                        "Progress report download failed:",
                        error
                    );

                    this.feedback = {
                        tone: "error",
                        message:
                            "The progress report could not be prepared. No download was created."
                    };
                }

                if (this.dialog?.open) {
                    this.renderDialog(
                        "[data-report-progress]"
                    );
                }
            }
        );

        const details =
            this.createElement(
                "details",
                {
                    className:
                        "player-report-details"
                }
            );

        details.append(
            this.createElement(
                "summary",
                {
                    text:
                        "What is included in this file?"
                }
            ),
            this.createElement(
                "p",
                {
                    text:
                        "The file includes your name, gamertag, internal player ID, and an approved summary of game progress. It does not include an institutional student ID, raw journal responses, or debugging data."
                }
            ),
            this.createElement(
                "p",
                {
                    text:
                        "The JSON is encoded as Base64 for text transport. Base64 is not encryption and does not make the report tamper-proof."
                }
            )
        );

        section.append(
            heading,
            explanation,
            reportButton,
            details
        );

        return section;

    },

    formatTimestamp(timestampMs) {

        if (!Number.isFinite(timestampMs)) {
            return "at an unknown time";
        }

        return new Intl.DateTimeFormat(
            undefined,
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        ).format(
            new Date(timestampMs)
        );

    }

};

export default PlayerBadgeDrawer;
