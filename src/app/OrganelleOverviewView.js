// --------------------------------------------------
// OrganelleOverviewView.js
// Renders the selected organelle while no experiment
// is open. This view reads static profile data only.
// --------------------------------------------------

const OrganelleOverviewView = {

    getElements() {

        return {
            title:
                document.getElementById(
                    "organelle-experiment-stage-title"
                ),

            controls:
                document.getElementById(
                    "organelle-experiment-stage-controls"
                ),

            content:
                document.getElementById(
                    "organelle-experiment-stage-content"
                )
        };

    },

    createElement(
        tagName,
        className = "",
        textContent = ""
    ) {

        const element =
            document.createElement(
                tagName
            );

        if (className) {
            element.className =
                className;
        }

        if (textContent) {
            element.textContent =
                textContent;
        }

        return element;

    },

    getUnlockMessage(profile) {

        const requirement =
            profile?.unlock
                ?.displayRequirement;

        if (!requirement) {
            return `To unlock ${profile.name}, continue biological investigations.`;
        }

        return `To unlock ${profile.name}, ${requirement}`;

    },

    renderFigure(
        container,
        figureDefinition
    ) {

        if (!figureDefinition?.src) {
            return;
        }

        const figure =
            this.createElement(
                "figure",
                "organelle-overview-figure"
            );

        const image =
            this.createElement(
                "img",
                "organelle-overview-image"
            );

        image.src =
            figureDefinition.src;

        image.alt =
            figureDefinition.alt ?? "";

        figure.appendChild(
            image
        );

        if (figureDefinition.caption) {

            const caption =
                this.createElement(
                    "figcaption",
                    "organelle-overview-caption",
                    figureDefinition.caption
                );

            figure.appendChild(
                caption
            );

        }

        container.appendChild(
            figure
        );

    },

    renderComponents(
        container,
        components
    ) {

        if (
            !Array.isArray(components) ||
            components.length === 0
        ) {
            return;
        }

        const section =
            this.createElement(
                "section",
                "organelle-overview-section"
            );

        section.appendChild(
            this.createElement(
                "h3",
                "organelle-overview-heading",
                "Labeled Components"
            )
        );

        const list =
            this.createElement(
                "dl",
                "organelle-overview-component-list"
            );

        components.forEach(
            component => {

                list.append(
                    this.createElement(
                        "dt",
                        "",
                        component.label
                    ),

                    this.createElement(
                        "dd",
                        "",
                        component.description
                    )
                );

            }
        );

        section.appendChild(
            list
        );

        container.appendChild(
            section
        );

    },

    renderBenefits(
        container,
        benefits
    ) {

        if (
            !Array.isArray(benefits) ||
            benefits.length === 0
        ) {
            return;
        }

        const section =
            this.createElement(
                "section",
                "organelle-overview-section organelle-overview-benefits"
            );

        section.appendChild(
            this.createElement(
                "h3",
                "organelle-overview-heading",
                "Organelle Benefit"
            )
        );

        benefits.forEach(
            benefit => {

                const card =
                    this.createElement(
                        "article",
                        "organelle-overview-benefit"
                    );

                card.append(
                    this.createElement(
                        "h4",
                        "",
                        benefit.label
                    ),

                    this.createElement(
                        "p",
                        "",
                        benefit.description.replace(
                            /^Proposed benefit:\s*/i,
                            ""
                        )
                    )
                );

                section.appendChild(
                    card
                );

            }
        );

        container.appendChild(
            section
        );

    },

    render({
        profile,
        available
    }) {

        const {
            title,
            controls,
            content
        } = this.getElements();

        if (
            !title ||
            !controls ||
            !content
        ) {
            console.warn(
                "OrganelleOverviewView: experiment stage elements not found"
            );

            return false;
        }

        if (!profile) {
            title.textContent =
                "Unknown Organelle";

            controls.replaceChildren();
            content.replaceChildren(
                this.createElement(
                    "p",
                    "organelle-overview-status organelle-overview-status--locked",
                    "This organelle profile is unavailable."
                )
            );

            return false;
        }

        title.textContent =
            profile.name;

        controls.replaceChildren();
        content.replaceChildren();

        const overview =
            this.createElement(
                "article",
                "organelle-overview"
            );

        overview.dataset.organelleId =
            profile.id;

        overview.dataset.availability =
            available
                ? "available"
                : "locked";

        const status =
            this.createElement(
                "p",
                `organelle-overview-status organelle-overview-status--${available
                    ? "available"
                    : "locked"
                }`,

                available
                    ? "Select an available experiment from the organelle panel to begin."
                    : this.getUnlockMessage(
                        profile
                    )
            );

        const classification =
            this.createElement(
                "p",
                "organelle-overview-classification",
                profile.classification
            );

        const description =
            this.createElement(
                "p",
                "organelle-overview-description",
                profile.description
            );

        overview.append(
            status,
            classification
        );

        this.renderFigure(
            overview,
            profile.figure
        );

        overview.appendChild(
            description
        );

        this.renderComponents(
            overview,
            profile.components
        );

        this.renderBenefits(
            overview,
            profile.benefits
        );

        content.appendChild(
            overview
        );

        return true;

    }

};

export default OrganelleOverviewView;
