// Guided V-type assembly prototype. Catalog releaseStatus keeps it locked in the UI.
export const V_PARTS = Object.freeze([
    { id: "c-ring", name: "c / c′ / c″ rotor ring", detail: "Membrane c subunits bind protons as the ring rotates.", art: '<ellipse cx="605" cy="390" rx="68" ry="44" fill="#c88bc3" stroke="#704071" stroke-width="5"/><ellipse cx="605" cy="390" rx="29" ry="18" fill="#213049"/>' },
    { id: "a", name: "a proton channel", detail: "Subunit a forms the proton pathway beside the c ring.", art: '<path d="M500 335 Q468 342 470 390 Q470 449 527 446 L543 424 Q510 425 511 390 Q510 358 541 352 Z" fill="#a8d18c" stroke="#587c45" stroke-width="5"/>' },
    { id: "d-e", name: "d and e membrane connectors", detail: "Subunits d and e support the membrane sector.", art: '<ellipse cx="608" cy="338" rx="29" ry="18" fill="#e9be67" stroke="#946c25" stroke-width="4"/><ellipse cx="727" cy="430" rx="18" ry="15" fill="#e9be67" stroke="#946c25" stroke-width="4"/>' },
    { id: "d-f", name: "D / F rotor shaft", detail: "The D and F stalk connects the rotor ring to the head.", art: '<path d="M595 307 L593 230 L610 230 L620 307 Z" fill="#e7d18e" stroke="#8a7249" stroke-width="4"/>' },
    { id: "a-b", name: "A / B catalytic head", detail: "Three A and three B units form the V₁ head; it uses ATP to drive proton pumping.", art: '<ellipse cx="548" cy="185" rx="47" ry="57" fill="#6d76c7" stroke="#404780" stroke-width="4"/><ellipse cx="600" cy="160" rx="52" ry="65" fill="#8195db" stroke="#404780" stroke-width="4"/><ellipse cx="652" cy="185" rx="47" ry="57" fill="#6d76c7" stroke="#404780" stroke-width="4"/>' },
    { id: "e-g", name: "E / G peripheral stalk", detail: "E and G provide an outer brace that keeps the catalytic head in place.", art: '<path d="M493 342 Q476 300 485 217 Q478 126 541 112 M714 340 Q737 272 720 198 Q730 130 665 111" fill="none" stroke="#efa25d" stroke-width="17" stroke-linecap="round"/>' },
    { id: "c", name: "C stalk stabilizer", detail: "Subunit C helps join the peripheral stalk to the membrane sector.", art: '<ellipse cx="484" cy="291" rx="24" ry="20" fill="#e2c278" stroke="#8d702e" stroke-width="4"/>' },
    { id: "h", name: "H regulatory subunit", detail: "Subunit H helps regulate the V-type pump.", art: '<ellipse cx="721" cy="229" rx="24" ry="20" fill="#d8b3db" stroke="#845388" stroke-width="4"/>' }
]);
const View = {
    root: null, controls: null, generation: 0,
    clear() { this.generation++; this.events?.abort(); this.root = null; this.controls = null; },
    mount(container, { controlsElement = null } = {}) {
        this.clear(); this.container = container; this.controlContainer = controlsElement;
        this.root = document.createElement("section"); this.root.className = "psii-lab atp-lab";
        container.replaceChildren(this.root); this.controls = controlsElement;
        this.index = 0; this.motion = ""; this.showLabels = true;
        this.events = new AbortController();
        controlsElement?.addEventListener("click", event => {
            if (event.target.closest("[data-v-assemble]")) void this.assemble();
            if (event.target.closest("[data-v-labels]")) { this.showLabels = !this.showLabels; this.render(); }
            if (event.target.closest("[data-v-reset]")) this.mount(this.container, { controlsElement: this.controlContainer });
        }, { signal: this.events.signal });
        this.render();
    },
    async assemble() {
        if (this.motion || this.index >= V_PARTS.length) return;
        const token = this.generation;
        this.motion = "glide"; this.render();
        await new Promise(resolve => setTimeout(resolve, 1050));
        if (token !== this.generation || !this.root) return;
        this.index++; this.motion = ""; this.render();
    },
    render() {
        if (!this.root) return;
        const part = V_PARTS[this.index];
        const draw = (item, preview = false) => `<g>${item.art}${this.showLabels ? `<text x="605" y="${preview ? 483 : 475}" text-anchor="middle" class="atp-part-label">${item.name}</text>` : ""}</g>`;
        const labels = { "c-ring": [605, 396, "c/c′/c″"], a: [486, 395, "a"], "d-e": [734, 467, "d/e"], "d-f": [602, 277, "D/F"], "a-b": [603, 165, "A/B"], "e-g": [730, 205, "E/G"], c: [482, 298, "C"], h: [721, 236, "H"] };
        const complete = V_PARTS.slice(0, this.index).map(item => {
            const [x, y, name] = labels[item.id];
            return `<g>${item.art}${this.showLabels ? `<text x="${x}" y="${y}" text-anchor="middle" class="atp-part-label">${name}</text>` : ""}</g>`;
        }).join("");
        const preview = part && !this.motion ? `<g class="atp-preview-part" transform="translate(-430 0)">${draw(part, true)}</g>` : "";
        const flying = part && this.motion ? `<g class="atp-part-glide">${draw(part, false)}</g>` : "";
        this.root.innerHTML = `<div class="psii-intro"><p><strong>Assemble V-ATPase in testing:</strong> Read each V-type component, then press Assemble. This pump normally spends ATP to move H⁺ into an acidic compartment.</p><p class="psii-progress" role="status">${part ? `${this.index + 1}/${V_PARTS.length}: ${part.name}. ${part.detail}` : "Assembly complete. This prototype remains in testing."}</p></div><div class="psii-workspace"><div class="psii-board"><svg viewBox="0 0 1000 580" role="img" aria-label="Guided V-ATPase assembly"><rect width="1000" height="580" rx="24" class="psii-background"/><text x="30" y="55" class="psii-side-label">CYTOSOL</text><text x="30" y="555" class="psii-side-label">ORGANELLE LUMEN</text><rect x="0" y="343" width="1000" height="100" fill="#a2ba87" opacity=".45"/><rect x="23" y="77" width="285" height="430" rx="15" class="atp-preview-box"/><text x="165" y="105" text-anchor="middle" class="atp-preview-title">NEXT COMPONENT</text>${preview}${flying}${complete}</svg></div></div>`;
        if (this.controls) this.controls.innerHTML = `${part ? `<button type="button" class="psii-header-button ${!this.motion ? "water-action-ready" : ""}" data-v-assemble ${this.motion ? "disabled" : ""}>Assemble</button>` : ""}<button type="button" class="psii-header-button" data-v-labels>${this.showLabels ? "Hide labels" : "Show labels"}</button><button type="button" class="psii-header-button" data-v-reset>Reset model</button>`;
    }
};
export default View;
