// --------------------------------------------------
// MetabolismSystemsView.js
// Read-only map-of-maps renderer for metabolic pathway interactions.
// Owns no state and does not imply that conceptual flow lines are active.
// --------------------------------------------------

const CONTROL_LABELS = Object.freeze({
    automatic: "Automatic regulation",
    environment: "Environment-gated",
    regulated: "Regulation planned",
    none: "Flow connection"
});

function setGridPosition(element, position) {
    element.style.gridRow = String(
        position.row
    );
    element.style.gridColumn = String(
        position.column
    );
}

function createNode(
    node,
    onSelectPathway
) {
    const interactive =
        node.type === "pathway" &&
        node.interactive &&
        typeof onSelectPathway ===
            "function";
    const element = document.createElement(
        interactive ? "button" : "article"
    );

    if (interactive) {
        element.type = "button";
    }
    element.className = [
        "metabolism-system-node",
        `metabolism-system-node--${node.type}`,
        `metabolism-system-node--theme-${node.themeId ?? "neutral"}`,
        interactive
            ? "metabolism-system-node--interactive"
            : ""
    ].filter(Boolean).join(" ");
    element.dataset.systemNodeId = node.id;
    element.dataset.controlMode =
        node.controlMode;

    const kind = document.createElement("span");
    kind.className =
        "metabolism-system-node-kind";
    kind.textContent = node.type
        .replaceAll("-", " ");

    const abbreviation =
        document.createElement("strong");
    abbreviation.className =
        "metabolism-system-node-abbreviation";
    abbreviation.textContent =
        node.abbreviation;

    const heading = document.createElement("h3");
    heading.textContent = node.label;

    const description =
        document.createElement("p");
    description.textContent =
        node.description;

    const status = document.createElement("span");
    status.className =
        "metabolism-system-node-status";
    status.textContent = node.statusLabel;

    const control = document.createElement("small");
    control.className =
        "metabolism-system-node-control";
    control.textContent =
        CONTROL_LABELS[node.controlMode] ??
        "Control not configured";

    element.append(
        kind,
        abbreviation,
        heading,
        description,
        status
    );

    if (node.progressLabel) {
        const progress =
            document.createElement("small");
        progress.className =
            "metabolism-system-node-progress";
        progress.textContent =
            node.progressLabel;
        element.append(progress);
    }

    element.append(control);
    setGridPosition(element, node.position);

    if (interactive) {
        element.addEventListener(
            "click",
            () => onSelectPathway(
                node.pathwayId
            )
        );
    }

    return element;
}

function createConnection(connection) {
    const arrows = {
        right: "→",
        down: "↓",
        "down-left": "↙",
        "down-right": "↘"
    };
    const element = document.createElement(
        "div"
    );
    element.className =
        "metabolism-system-connection";
    element.dataset.fromNode =
        connection.from;
    element.dataset.toNode = connection.to;
    element.setAttribute(
        "aria-label",
        `${connection.from} supplies ${connection.to}: ${connection.label}`
    );

    const label = document.createElement("span");
    label.textContent = connection.label;

    const arrow = document.createElement("strong");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent =
        arrows[connection.direction] ?? "→";

    element.append(label, arrow);
    setGridPosition(
        element,
        connection.position
    );
    return element;
}

const MetabolismSystemsView = {
    render(
        container,
        systemsStatus,
        onSelectPathway = null
    ) {
        if (!container || !systemsStatus) {
            return false;
        }

        const track = document.createElement("div");
        track.className =
            "metabolism-systems-track";
        track.setAttribute(
            "aria-label",
            systemsStatus.name
        );

        systemsStatus.nodes.forEach(node =>
            track.appendChild(
                createNode(
                    node,
                    onSelectPathway
                )
            )
        );
        systemsStatus.connections.forEach(
            connection =>
                track.appendChild(
                    createConnection(connection)
                )
        );

        container.replaceChildren(track);
        return true;
    }
};

export default MetabolismSystemsView;
