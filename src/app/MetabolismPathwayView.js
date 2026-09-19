// --------------------------------------------------
// MetabolismPathwayView.js
// Focused, read-only renderer for pathway maps and chemistry summaries.
//
// Milestone 2 renders every configured slot but deliberately receives no
// placement state. The connection-state helper is ready for later milestones:
// red means a gap, yellow means adjacent enzyme cards, and green means the
// entire pathway has been validated as complete.
// --------------------------------------------------

const CONNECTION_STATE = Object.freeze({
    GAP: "gap",
    ADJACENT: "adjacent",
    COMPLETE: "complete"
});

function resolveConnectionState({
    leftOccupied = false,
    rightOccupied = false,
    pathwayComplete = false
} = {}) {

    if (pathwayComplete) {
        return CONNECTION_STATE.COMPLETE;
    }

    if (leftOccupied && rightOccupied) {
        return CONNECTION_STATE.ADJACENT;
    }

    return CONNECTION_STATE.GAP;

}

function setGridPosition(
    element,
    row,
    column
) {

    element.style.gridRow = String(row);
    element.style.gridColumn = String(column);

}

function getCoreSlotPosition(slotNumber) {

    if (slotNumber <= 5) {
        return {
            row: 1,
            column:
                (slotNumber * 2) - 1
        };
    }

    return {
        row: 3,
        column:
            21 - (slotNumber * 2)
    };

}

function getConnectionPosition(
    fromSlot,
    toSlot
) {

    if (fromSlot < 5) {
        return {
            row: 1,
            column: fromSlot * 2,
            vertical: false
        };
    }

    if (fromSlot === 5) {
        return {
            row: 2,
            column: 9,
            vertical: true
        };
    }

    if (toSlot <= 10) {
        return {
            row: 3,
            column:
                20 - (fromSlot * 2),
            vertical: false
        };
    }

    return {
        row: 4,
        column: 1,
        vertical: true
    };

}

function createSlotElement(
    slot,
    occupied,
    branch = null
) {

    const element = document.createElement(
        "article"
    );
    element.className = [
        "metabolism-enzyme-slot",
        occupied
            ? "metabolism-enzyme-slot--occupied"
            : "metabolism-enzyme-slot--empty",
        branch
            ? "metabolism-enzyme-slot--branch"
            : ""
    ].filter(Boolean).join(" ");
    element.dataset.slot = String(slot.slot);
    element.dataset.enzymeId = slot.enzymeId;

    const number = document.createElement(
        "span"
    );
    number.className =
        "metabolism-slot-number";
    number.textContent = `Slot ${slot.slot}`;

    const abbreviation =
        document.createElement("strong");
    abbreviation.className =
        "metabolism-slot-abbreviation";
    abbreviation.textContent =
        slot.abbreviation;

    const label = document.createElement(
        "span"
    );
    label.className =
        "metabolism-slot-label";
    label.textContent = slot.label;

    const status = document.createElement(
        "small"
    );
    status.textContent = occupied
        ? "Enzyme card placed"
        : "Enzyme card required";

    element.append(
        number,
        abbreviation,
        label,
        status
    );

    if (branch) {
        const branchLabel = document.createElement(
            "span"
        );
        branchLabel.className =
            "metabolism-branch-label";
        branchLabel.textContent = branch.name;

        const reaction = document.createElement(
            "span"
        );
        reaction.className =
            "metabolism-branch-reaction";
        reaction.textContent =
            `${branch.input} → ${branch.output}`;

        element.prepend(branchLabel);
        element.insertBefore(
            reaction,
            status
        );
    }

    return element;

}

function createConnectionElement(
    fromSlot,
    toSlot,
    state,
    vertical
) {

    const connection =
        document.createElement("div");
    connection.className = [
        "metabolism-pathway-connection",
        `metabolism-pathway-connection--${state}`,
        vertical
            ? "metabolism-pathway-connection--vertical"
            : ""
    ].filter(Boolean).join(" ");
    connection.dataset.fromSlot =
        String(fromSlot);
    connection.dataset.toSlot =
        String(toSlot);
    connection.setAttribute(
        "aria-label",
        `Connection from slot ${fromSlot} to slot ${toSlot}: ${state}`
    );

    return connection;

}

function createChemistryGroup(
    title,
    values,
    className
) {

    const group = document.createElement(
        "section"
    );
    group.className = [
        "metabolism-chemistry-group",
        className
    ].join(" ");

    const heading = document.createElement(
        "h3"
    );
    heading.textContent = title;

    const list = document.createElement(
        "ul"
    );
    values.forEach(value => {
        const item = document.createElement(
            "li"
        );
        item.textContent = value;
        list.appendChild(item);
    });

    group.append(heading, list);
    return group;

}

const MetabolismPathwayView = {

    render(
        container,
        pathway,
        {
            occupiedEnzymeIds = [],
            pathwayComplete = false,
            onPlaceEnzyme = null
        } = {}
    ) {

        if (!container || !pathway) {
            return false;
        }

        const occupiedIds = new Set(
            occupiedEnzymeIds
        );
        const track = document.createElement(
            "div"
        );
        track.className =
            "metabolism-pathway-track";
        track.setAttribute(
            "aria-label",
            `${pathway.name} enzyme pathway`
        );

        const slots = [
            ...pathway.coreSlots,
            ...pathway.regenerationBranches
                .flatMap(branch =>
                    branch.slots.map(slot => ({
                        ...slot,
                        branch
                    }))
                )
        ];

        slots.forEach((slot, index) => {
            const occupied = occupiedIds.has(
                slot.enzymeId
            );
            const slotElement =
                createSlotElement(
                    slot,
                    occupied,
                    slot.branch
                );
            const slotPosition =
                slot.slot <= 10
                    ? getCoreSlotPosition(
                        slot.slot
                    )
                    : {
                        row: 5,
                        column: 1
                    };

            setGridPosition(
                slotElement,
                slotPosition.row,
                slotPosition.column
            );

            if (
                !occupied &&
                typeof onPlaceEnzyme ===
                    "function"
            ) {
                slotElement.classList.add(
                    "metabolism-enzyme-slot--drop-target"
                );
                slotElement.addEventListener(
                    "dragover",
                    event => {
                        event.preventDefault();
                        if (event.dataTransfer) {
                            event.dataTransfer
                                .dropEffect = "move";
                        }
                    }
                );
                slotElement.addEventListener(
                    "drop",
                    event => {
                        event.preventDefault();
                        const enzymeId =
                            event.dataTransfer
                                ?.getData(
                                    "text/plain"
                                );
                        if (enzymeId) {
                            onPlaceEnzyme(
                                slot.slot,
                                enzymeId
                            );
                        }
                    }
                );
            }
            track.appendChild(slotElement);

            const nextSlot = slots[index + 1];
            if (!nextSlot) return;

            const nextOccupied =
                occupiedIds.has(
                    nextSlot.enzymeId
                );
            const state =
                resolveConnectionState({
                    leftOccupied: occupied,
                    rightOccupied:
                        nextOccupied,
                    pathwayComplete
                });
            const position =
                getConnectionPosition(
                    slot.slot,
                    nextSlot.slot
                );
            const connection =
                createConnectionElement(
                    slot.slot,
                    nextSlot.slot,
                    state,
                    position.vertical
                );

            setGridPosition(
                connection,
                position.row,
                position.column
            );
            track.appendChild(connection);
        });

        container.replaceChildren(track);
        return true;

    },

    renderChemistry(container, pathway) {

        if (!container || !pathway) {
            return false;
        }

        const chemistry = pathway.chemistry;
        const energy = [
            `${chemistry.atpInvestment} ATP invested`,
            `${chemistry.atpGross} ATP produced`,
            `${chemistry.atpNet} ATP net`
        ];

        container.replaceChildren(
            createChemistryGroup(
                "Inputs",
                chemistry.inputs,
                "metabolism-chemistry-group--inputs"
            ),
            createChemistryGroup(
                "Outputs",
                chemistry.outputs,
                "metabolism-chemistry-group--outputs"
            ),
            createChemistryGroup(
                "Cofactors",
                chemistry.cofactors,
                "metabolism-chemistry-group--cofactors"
            ),
            createChemistryGroup(
                "Energy Accounting",
                energy,
                "metabolism-chemistry-group--energy"
            )
        );

        return true;

    }

};

export {
    CONNECTION_STATE,
    resolveConnectionState
};

export default MetabolismPathwayView;
