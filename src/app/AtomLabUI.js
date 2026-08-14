// --------------------------------------------------
// AtomLabUI.js
// UI shell for Atom Lab zone
// --------------------------------------------------

const AtomLabUI = {

    initialized: false,
    rootElement: null,

    // --------------------------------------------------
    // Initialize Atom Lab UI
    // --------------------------------------------------
    initialize() {

        if (this.initialized) {
            this.render();
            return true;
        }

        this.rootElement = this.ensureRootElement();

        if (!this.rootElement) {
            console.warn("AtomLabUI: unable to mount #atomlab-zone");
            return false;
        }

        this.buildInterface();

        this.initialized = true;
        this.render();

        console.log("AtomLabUI.initialize() called");

        return true;
    },

    // --------------------------------------------------
    // Ensure DOM root exists (dynamic creation)
    // --------------------------------------------------
    ensureRootElement() {

        // If it already exists, return it
        const existingRoot = document.getElementById("atomlab-zone");
        if (existingRoot) {
            return existingRoot;
        }

        // Otherwise create it dynamically
        const appElement = document.getElementById("app");
        if (!appElement) {
            console.warn("AtomLabUI: #app root not found");
            return null;
        }

        const root = document.createElement("section");
        root.id = "atomlab-zone";
        root.className = "hidden";
        root.setAttribute("aria-labelledby", "atomlab-zone-title");

        appElement.appendChild(root);

        return root;
    },

    // --------------------------------------------------
    // Build the initial UI shell
    // --------------------------------------------------
    buildInterface() {

        this.rootElement.replaceChildren();

        // Header
        const header = document.createElement("header");
        header.className = "atomlab-header";

        const title = document.createElement("h1");
        title.id = "atomlab-zone-title";
        title.textContent = "Atom Lab";

        const description = document.createElement("p");
        description.className = "atomlab-description";
        description.textContent = "Craft atoms, explore the periodic table, and build isotopes.";

        header.append(title, description);

        // Placeholder main panel
        const mainPanel = document.createElement("section");
        mainPanel.className = "atomlab-main-panel";

        const placeholder = document.createElement("p");
        placeholder.textContent = "Atom Lab UI will appear here.";

        mainPanel.appendChild(placeholder);

        // Append everything
        this.rootElement.append(header, mainPanel);
    },

    // --------------------------------------------------
    // Render UI state (empty for now)
    // --------------------------------------------------
    render() {
        // Future: update UI based on AtomLabManager state
        return true;
    }

};

export default AtomLabUI;
