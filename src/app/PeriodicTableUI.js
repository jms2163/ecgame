import { elementLibrary } from "../data/elementLibrary.js";

const PeriodicTableUI = {

    build() {
        const container = document.createElement("div");
        container.id = "periodic-table";

        // Header Section
        container.innerHTML = `
            <h3>Library</h3>
            <div id="pt-header">
                <div class="pt-stat">Elements Discovered: <span id="elements-count">0/118</span></div>
                <div class="pt-stat secondary">Isotopes Synthesized: <span id="isotopes-count">0</span></div>
            </div>
        `;

        // Grid Section
        const grid = document.createElement("div");
        grid.className = "pt-grid";

        // Generate Element Buttons
        Object.values(elementLibrary).forEach(elementData => {
            // Skip entries missing layout coordinates
            if (!elementData.group || !elementData.period) {
                return;
            }

            const button = document.createElement("button");
            button.className = "element-box";
            button.dataset.symbol = elementData.symbol;
            
            // Grid Placement
            button.style.gridColumn = elementData.group;
            button.style.gridRow = elementData.period;

            // Accessibility: Provide clear full name and atomic number to screen readers
            const elementName = elementData.name || elementData.symbol;
            button.setAttribute("aria-label", `${elementName}, atomic number ${elementData.p}`);

            // Card Markup
            button.innerHTML = `
                <span class="element-atomic-num">${elementData.p}</span>
                <span class="element-symbol">${elementData.symbol}</span>
            `;

            // Click Handler
            button.addEventListener("click", () => {
                console.log(`Clicked element: ${elementData.symbol}`);
                // AtomLabManager.processAction("select_element", elementData.symbol);
            });

            grid.appendChild(button);
        });

        // --- Series Gap Labels (Lanthanides & Actinides) ---

        // Lanthanide Label (57-71)
        const lanthanideLabel = document.createElement("div");
        lanthanideLabel.className = "element-box series-label";
        lanthanideLabel.style.gridColumn = 3;
        lanthanideLabel.style.gridRow = 6;
        lanthanideLabel.setAttribute("aria-label", "Lanthanide series, elements 57 through 71");
        lanthanideLabel.innerHTML = `<span class="element-range">57–71</span>`;

        // Actinide Label (89-103)
        const actinideLabel = document.createElement("div");
        actinideLabel.className = "element-box series-label";
        actinideLabel.style.gridColumn = 3;
        actinideLabel.style.gridRow = 7;
        actinideLabel.setAttribute("aria-label", "Actinide series, elements 89 through 103");
        actinideLabel.innerHTML = `<span class="element-range">89–103</span>`;

        grid.appendChild(lanthanideLabel);
        grid.appendChild(actinideLabel);

        container.appendChild(grid);
        return container;
    },

    render() {
        // State updates go here
    }
};

export default PeriodicTableUI;