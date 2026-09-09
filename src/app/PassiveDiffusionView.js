import experiment, { substances, predictions } from "./PassiveDiffusionCatalog.js";
import Engine from "./PassiveDiffusionEngine.js";
import Renderer from "./PassiveDiffusionRenderer.js";
import Trials from "./PassiveDiffusionTrialManager.js";
import PlasmaMembraneVisualCatalog from "./PlasmaMembraneVisualCatalog.js";

const View = {
    frame: null,
    events: null,
    state: null,
    running: false,

    clear() {
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.events?.abort();
        this.events = null;
        this.resize?.disconnect();
        this.resize = null;
        this.running = false;
        this.state = null;
        this.root = null;
    },

    stylesheet() {
        if (document.getElementById("passive-diffusion-styles")) return;
        const link = document.createElement("link");
        link.id = "passive-diffusion-styles"; link.rel = "stylesheet";
        link.href = new URL("../../public/css/organelle-lab/passive-diffusion.css", import.meta.url).href;
        document.head.append(link);
    },

    mount(container, { sandbox = false, review = false } = {}) {
        this.clear();
        this.stylesheet();
        this.sandbox = sandbox;
        this.events = new AbortController();
        this.root = document.createElement("section");
        this.root.className = "passive-diffusion-exploration";
        container.replaceChildren(this.root);
        if (review) { this.review(); return; }

        this.root.innerHTML = `
            <p class="pd-notice"></p>
            <p>The lipid bilayer has a greasy interior. No channels, carriers, or ATP-powered transport are present.</p>
            <p class="pd-progress"></p>
            <label>Substance <select class="pd-substance"></select></label>
            <p class="pd-properties"></p>
            <fieldset class="pd-prediction"><legend>What is your prediction?</legend></fieldset>
            <div class="pd-sample-row"><button type="button" class="pd-sample"><canvas width="70" height="55" aria-hidden="true"></canvas><span>Drag sample into either watery side</span></button>
            <button type="button" class="pd-left">Place on side A</button><button type="button" class="pd-right">Place on side B</button></div>
            <div class="pd-chamber-frame"><canvas class="pd-chamber" aria-label="Lipid bilayer simulation: watery sides A and B" role="img"></canvas></div>
            <div class="pd-actions"><button type="button" class="pd-run">Simulate</button><button type="button" class="pd-record">Record observation</button><button type="button" class="pd-reset">New trial / Reset</button></div>
            <p class="pd-status" role="status" aria-live="polite"></p>
            <div class="pd-response" hidden><label>Why do you think this happened? (Optional, ungraded)<textarea maxlength="1500" rows="3"></textarea></label></div>
            <p class="pd-note">Simplified model: particle sizes and timing are illustrative. Water and urea have a 33% crossing chance per encounter, not a measured biological permeability. Cholesterol is retained in the membrane; no transport proteins or concentration trapping are modeled.</p>`;
        const q = selector => this.root.querySelector(selector);
        this.select = q(".pd-substance"); this.canvas = q(".pd-chamber");
        this.runButton = q(".pd-run"); this.recordButton = q(".pd-record");
        this.status = q(".pd-status"); this.response = q(".pd-response");
        this.sample = q(".pd-sample");
        this.chamberFrame = q(".pd-chamber-frame");
        PlasmaMembraneVisualCatalog.applyGeometry(this.chamberFrame);
        this.chamberFrame.prepend(
            PlasmaMembraneVisualCatalog.createVisual({
                animated: true,
                className: "pd-membrane-visual"
            })
        );
        q(".pd-notice").textContent = sandbox
            ? "Re-examine: simulation only. Nothing is recorded, graded, or rewarded."
            : "Explore all 11 substances to earn 250 XP once. Prediction accuracy is not graded. Record each observation to save progress.";
        for (const [id, data] of Object.entries(substances)) {
            const option = document.createElement("option"); option.value = id; option.textContent = data.name;
            this.select.append(option);
        }
        this.refreshSubstanceOptions();
        if (!sandbox) {
            for (const [id, text] of Object.entries(predictions)) {
                const label = document.createElement("label"), radio = document.createElement("input");
                radio.type = "radio"; radio.name = "pd-prediction"; radio.value = id;
                label.append(radio, document.createTextNode(text)); q(".pd-prediction").append(label);
            }
        } else {
            q(".pd-prediction").remove(); this.response.remove(); this.recordButton.remove();
        }
        const on = (node, event, fn) => node.addEventListener(event, fn, { signal: this.events.signal });
        on(this.select, "change", () => this.reset());
        on(this.runButton, "click", () => this.run());
        on(q(".pd-reset"), "click", () => {
            if (this.state && !this.saved && !this.sandbox && !window.confirm("Discard this unrecorded trial? Saved observations will remain.")) return;
            this.reset();
        });
        on(this.recordButton, "click", () => this.record());
        on(q(".pd-left"), "click", () => this.place("left", { x: 0.2, y: 0.5 }));
        on(q(".pd-right"), "click", () => this.place("right", { x: 0.8, y: 0.5 }));
        on(this.sample, "pointerdown", event => {
            if (this.started) return;
            this.dragging = true; this.sample.setPointerCapture(event.pointerId); event.preventDefault();
        });
        on(this.canvas, "pointerdown", event => {
            if (!this.started) { this.dragging = true; this.canvas.setPointerCapture(event.pointerId); }
        });
        on(document, "pointerup", event => {
            if (!this.dragging) return;
            this.dragging = false;
            const bounds = this.canvas.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width;
            const y = (event.clientY - bounds.top) / bounds.height;
            if (x < 0 || x > 1 || y < 0 || y > 1) return;
            const { start, end } =
                PlasmaMembraneVisualCatalog.geometry;
            if (x >= start && x <= end) { this.status.textContent = "Place the sample in a watery side, not inside the membrane."; return; }
            this.place(x < start ? "left" : "right", { x, y });
        });
        on(document, "pointercancel", () => { this.dragging = false; });
        on(document, "visibilitychange", () => { this.lastFrame = null; });
        this.resize = new ResizeObserver(() => this.draw()); this.resize.observe(this.canvas);
        this.reset(false);
    },

    refreshSubstanceOptions() {
        const observed =
            new Set(Trials.progress());

        for (const option of this.select.options) {
            option.textContent =
                `${observed.has(option.value) ? "✓ " : ""}` +
                substances[option.value].name;
        }
    },

    reset(clearPrediction = true) {
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null; this.running = false; this.state = null;
        this.started = false; this.done = false; this.saved = false; this.dragging = false;
        this.trialId = crypto.randomUUID();
        this.select.disabled = false; this.runButton.disabled = false; this.runButton.textContent = "Simulate";
        this.recordButton.disabled = true;
        for (const node of this.root.querySelectorAll(".pd-left,.pd-right,.pd-sample,input")) node.disabled = false;
        if (clearPrediction) for (const radio of this.root.querySelectorAll("input")) radio.checked = false;
        this.root.querySelector(".pd-properties").textContent = `${substances[this.select.value].name}: ${substances[this.select.value].properties}.`;
        this.root.querySelector(".pd-progress").textContent = this.sandbox ? "" : `${Trials.progress().length} / 11 substances explored and saved.`;
        this.response.hidden = true;
        const textarea = this.response.querySelector("textarea"); if (textarea) { textarea.value = ""; textarea.disabled = false; }
        this.status.textContent = "Choose a prediction, then place one sample. You can reposition it before Simulate.";
        if (this.sandbox) this.status.textContent = "Place one sample, then Simulate. Stop to try another setup.";
        const sampleCanvas = this.sample.querySelector("canvas"), ctx = sampleCanvas.getContext("2d");
        ctx.clearRect(0, 0, 70, 55); Renderer.particle(ctx, this.select.value, 35, 27, 1.3);
        this.draw();
    },

    place(side, position) {
        if (this.started) return;
        this.state = Engine.create(this.select.value, side, position);
        this.status.textContent = `${substances[this.select.value].name}: ${this.state.particles.length} particle${this.state.particles.length === 1 ? "" : "s"} placed. Ready to simulate.`;
        this.draw();
    },

    draw() { if (this.canvas && this.root) Renderer.render(this.canvas, this.state); },

    run() {
        if (this.running) {
            cancelAnimationFrame(this.frame); this.frame = null; this.running = false;
            this.runButton.textContent = "Resume simulation"; return;
        }
        if (!this.state) { this.status.textContent = "Place a sample first."; return; }
        const choice = this.root.querySelector("input:checked")?.value;
        if (!this.sandbox && !choice) { this.status.textContent = "Choose a prediction first; “Not sure” is welcome."; return; }
        if (!this.started) this.prediction = choice;
        this.started = true; this.running = true; this.lastFrame = null;
        this.select.disabled = true;
        for (const node of this.root.querySelectorAll(".pd-left,.pd-right,.pd-sample,input")) node.disabled = true;
        this.runButton.textContent = "Pause simulation";
        this.status.textContent = "Observing… watch particles encounter the bilayer. The trial runs at least 12 seconds.";
        const animate = time => {
            if (!this.running || !this.root) return;
            const elapsed = this.lastFrame === null ? 0 : (time - this.lastFrame) / 1000;
            this.lastFrame = time;
            Engine.step(this.state, elapsed); this.draw();
            if (!this.sandbox && Engine.ready(this.state)) {
                this.running = false; this.done = true; this.frame = null;
                this.runButton.disabled = true; this.runButton.textContent = "Observation complete";
                this.recordButton.disabled = false;
                const result = Trials.feedback(this.state, this.prediction), s = Engine.summary(this.state);
                this.status.textContent = `${result.text} Observed: ${s.transferredParticles} of ${s.particles} particles crossed; ${s.embedded} embedded. Record this observation to save it.`;
                this.response.hidden = result.correct;
                return;
            }
            this.frame = requestAnimationFrame(animate);
        };
        this.frame = requestAnimationFrame(animate);
    },

    record() {
        if (!this.done || this.saved || this.sandbox) return;
        const result = Trials.record({ id: this.trialId, state: this.state, prediction: this.prediction,
            reflection: this.response.querySelector("textarea").value });
        if (!result.ok) { this.status.textContent = "Could not save this observation. Your trial is still here; try Record observation again."; return; }
        this.saved = true; this.recordButton.disabled = true;
        this.select.disabled = false;
        this.response.querySelector("textarea").disabled = true;
        this.root.querySelector(".pd-progress").textContent = `${Trials.progress().length} / 11 substances explored and saved.`;
        this.refreshSubstanceOptions();
        this.status.textContent = result.completed
            ? `All substances explored. ${result.xpAwarded ? "250 XP awarded. " : ""}Return to the lab catalog to review your observations or Re-examine.`
            : "Observation saved. Select another substance to continue, or choose New trial / Reset to repeat this one.";
    },

    review() {
        const intro = document.createElement("p");
        intro.textContent = "Saved exploration observations — ungraded predictions and reflections. No assessment regrading applies.";
        this.root.append(intro);
        const records = Trials.records();
        if (!records.length) { intro.textContent += " No observations saved yet."; return; }
        for (const trial of records) {
            const card = document.createElement("article"), heading = document.createElement("h3");
            heading.textContent = trial.substanceName; card.append(heading);
            for (const text of [
                `Recorded: ${new Date(trial.recordedAtMs).toLocaleString()} · Started on ${trial.startingSide === "left" ? "side A" : "side B"}`,
                `Prediction: ${trial.predictionText}`, trial.feedback,
                `Observed: ${trial.observation.transferredParticles} / ${trial.observation.particles} particles crossed; ${trial.observation.embedded} embedded.`,
                `Reflection: ${trial.reflection || "No reflection entered."}`
            ]) { const p = document.createElement("p"); p.textContent = text; card.append(p); }
            this.root.append(card);
        }
    }
};
export default View;
