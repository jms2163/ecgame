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
            const button = document.createElement("button");
            button.className = "element-box";
            button.dataset.symbol = elementData.symbol;
            
            // This is the magic! CSS Grid places it exactly where it belongs
            button.style.gridColumn = elementData.group;
            button.style.gridRow = elementData.period;

            // Optional: You can style different categories with CSS variables or classes
            // button.classList.add(`category-${elementData.class}`);

            // Inner HTML of the card
            button.innerHTML = `
                <span class="element-atomic-num">${elementData.atomicNum}</span>
                <span class="element-symbol">${elementData.symbol}</span>
            `;

            // Wire up the click event for your manager
            button.addEventListener("click", () => {
                console.log(`Clicked element: ${elementData.symbol}`);
                // AtomLabManager.processAction("select_element", elementData.symbol);
            });

            grid.appendChild(button);
        });

        container.appendChild(grid);
        return container;
    },

    render() {
        // Here you will update the #elements-count and toggle disabled states 
        // based on what the player has unlocked in DiscoveryManager.
    }
};

export default PeriodicTableUI;