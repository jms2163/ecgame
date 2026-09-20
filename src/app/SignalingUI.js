// --------------------------------------------------
// SignalingUI.js
// Static foundation shell. Future activities will supply interactions.
// --------------------------------------------------

const SignalingUI = {

    initialized: false,
    active: false,
    rootElement: null,

    initialize() {
        if (this.initialized) {
            return true;
        }

        this.rootElement =
            this.ensureRootElement();

        if (!this.rootElement) {
            console.warn(
                "SignalingUI: unable to mount the zone root"
            );
            return false;
        }

        this.buildStaticUI();
        this.initialized = true;
        return true;
    },

    ensureRootElement() {
        let root =
            document.getElementById(
                "signaling-zone"
            );

        if (root) return root;

        const host =
            document.getElementById(
                "app-main"
            ) ||
            document.getElementById("app") ||
            document.body;

        if (!host) return null;

        root = document.createElement(
            "section"
        );
        root.id = "signaling-zone";
        root.className = "zone hidden";
        root.setAttribute(
            "aria-label",
            "Signaling"
        );
        host.appendChild(root);

        return root;
    },

    buildStaticUI() {
        this.rootElement.innerHTML = `
            <div class="signaling-shell">
                <header class="signaling-header">
                    <div>
                        <p class="signaling-kicker">Information Flow</p>
                        <h1>Cell Signaling</h1>
                        <p class="signaling-subtitle">Development foundation · Student navigation remains Coming Soon</p>
                    </div>
                    <span class="signaling-status">Foundation Preview</span>
                </header>

                <section class="signaling-intro" aria-labelledby="signaling-intro-heading">
                    <p class="signaling-kicker">Core Model</p>
                    <h2 id="signaling-intro-heading">From environmental cue to cellular response</h2>
                    <p>
                        Cells detect information outside the plasma membrane, relay that information inside the cell, and produce a specific response. Future investigations will connect Pond encounters to this sequence.
                    </p>
                </section>

                <ol class="signaling-pathway" aria-label="Cell signaling pathway preview">
                    <li>
                        <span class="signaling-step-number">1</span>
                        <div><strong>Extracellular Signal</strong><p>Cyanobacterial cue or environmental toxin.</p></div>
                    </li>
                    <li>
                        <span class="signaling-step-number">2</span>
                        <div><strong>Receptor</strong><p>A matching receptor detects the signal.</p></div>
                    </li>
                    <li>
                        <span class="signaling-step-number">3</span>
                        <div><strong>Intracellular Relay</strong><p>Relay proteins and GTP pass information through the cell.</p></div>
                    </li>
                    <li class="signaling-step--locked">
                        <span class="signaling-step-number">4</span>
                        <div><strong>Second Messengers</strong><p>cAMP and cGMP activities remain locked for a later milestone.</p></div>
                    </li>
                    <li class="signaling-step--locked">
                        <span class="signaling-step-number">5</span>
                        <div><strong>Cellular Response</strong><p>The cell changes its behavior in response to the message.</p></div>
                    </li>
                </ol>

                <p class="signaling-note" role="status">
                    No signaling activity, discovery, reward, or response is recorded by this development shell.
                </p>
            </div>
        `;
    },

    activate() {
        if (!this.initialized &&
            !this.initialize()) {
            return false;
        }

        this.active = true;
        return true;
    },

    deactivate() {
        this.active = false;
        return true;
    }

};

export default SignalingUI;
