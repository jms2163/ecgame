// Shared DOM building blocks for guided metabolic reactions.
export function activityElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

export function activityButton(text, onClick, disabled = false) {
    const button = activityElement("button", "guided-reaction-button", text);
    button.type = "button";
    button.disabled = disabled;
    button.addEventListener("click", onClick);
    return button;
}

export function carbonMolecule(label, carbonCount, { fixedCarbon = false, phosphates = 0 } = {}) {
    const molecule = activityElement("div", "guided-reaction-molecule");
    const chain = activityElement("div", "guided-reaction-carbon-chain");
    for (let i = 0; i < carbonCount; i += 1) {
        const isNew = fixedCarbon && i === 0;
        const dot = activityElement("span", `guided-reaction-carbon${isNew ? " is-fixed" : ""}`, "C");
        dot.title = isNew ? "Carbon added from CO₂" : "Carbon already in RuBP";
        chain.append(dot);
    }
    const phosphate = () => {
        const marker = activityElement("span", "guided-reaction-phosphate-group", "P");
        marker.title = "Attached phosphate group (not an extra carbon)";
        return marker;
    };
    if (phosphates === 2) chain.prepend(phosphate());
    if (phosphates) chain.append(phosphate());
    molecule.append(chain);
    molecule.append(activityElement("strong", "guided-reaction-molecule-label", label));
    return molecule;
}

export function reactionDock(label, input, filled, onDock) {
    const dock = activityElement("div", `guided-reaction-dock${filled ? " is-filled" : ""}`);
    dock.dataset.input = input;
    dock.append(activityElement("span", "", label));
    dock.addEventListener("dragover", event => { event.preventDefault(); });
    dock.addEventListener("drop", event => {
        event.preventDefault();
        const type = event.dataTransfer?.getData("application/x-ecgame-reaction-input");
        if (type === input) onDock(input);
    });
    return dock;
}

export function draggableInput(button, input) {
    button.draggable = !button.disabled;
    button.addEventListener("dragstart", event => {
        event.dataTransfer?.setData("application/x-ecgame-reaction-input", input);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
    });
    return button;
}
