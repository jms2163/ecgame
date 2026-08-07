// --------------------------------------------------
// BootstrapUI.js
// Displays simple text-based initialization status
// --------------------------------------------------

const BootstrapUI = {

    element: null,

    initialize() {
        // Create a simple container
        this.element = document.createElement("pre");
        this.element.style.fontFamily = "monospace";
        this.element.style.padding = "20px";
        this.element.style.whiteSpace = "pre";
        this.element.textContent = "ECGame\nInitializing...\n";
        document.body.appendChild(this.element);
    },

    mark(stepName) {
        // Append a checkmark line
        this.element.textContent += `✔ ${stepName}\n`;
    },

    fail(stepName) {
        // Append an X line
        this.element.textContent += `✖ ${stepName}\n`;
    },

    ready() {
        this.element.textContent += "\nReady.\n";
    }
};

export default BootstrapUI;
