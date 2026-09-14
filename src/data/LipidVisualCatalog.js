// Presentation-only fallbacks for final assembled lipids. A missing graphic
// always resolves to a legible category icon; it never implies a 3D structure.
const ICONS = Object.freeze({
    membrane: "◎",
    storage: "◉",
    signaling: "✦",
    modification: "◆"
});

// Conceptual diagrams, deliberately not atom-level structures.
function phospholipidSchematic(abbreviation) {
    return `<svg viewBox="0 0 120 150" role="img" aria-label="Schematic ${abbreviation} head with two fatty-acid tails">
    <circle cx="60" cy="28" r="23" fill="#245f83" stroke="#8ce4ff" stroke-width="3" />
    <text x="60" y="33" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">${abbreviation}</text>
    <path d="M52 51 L52 67 L42 82 L46 97 L40 112 L44 140 M68 51 L68 67 L78 82 L74 96 L81 112 L75 140" fill="none" stroke="#ffb356" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
}

const STEROL_ESTER_SCHEMATIC = `<svg viewBox="0 0 120 150" role="img" aria-label="Schematic ergosterol ring system connected to an oleate tail">
    <g fill="none" stroke="#8ce4ff" stroke-width="3" stroke-linejoin="round">
        <path d="M12 44 L30 34 L48 44 L48 65 L30 75 L12 65 Z M48 44 L65 34 L83 44 L83 65 L65 75 L48 65 M83 44 L101 34 L112 50 L101 65 L83 65" />
    </g>
    <path d="M60 75 L60 92 L72 102 L66 113 L78 124 L71 140" fill="none" stroke="#ffb356" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

const visuals = Object.freeze({
    PC: Object.freeze({
        classification: "Phosphatidylcholine · head and two tails (schematic)",
        schematic: true,
        svgMarkup: phospholipidSchematic("PC")
    }),
    PE: Object.freeze({ classification: "Phosphatidylethanolamine · head and two tails (schematic)", schematic: true, svgMarkup: phospholipidSchematic("PE") }),
    PS: Object.freeze({ classification: "Phosphatidylserine · head and two tails (schematic)", schematic: true, svgMarkup: phospholipidSchematic("PS") }),
    PI: Object.freeze({ classification: "Phosphatidylinositol · head and two tails (schematic)", schematic: true, svgMarkup: phospholipidSchematic("PI") }),
    ErgosterolOleate: Object.freeze({ classification: "Sterol esters · ergosterol oleate (schematic)", schematic: true, svgMarkup: STEROL_ESTER_SCHEMATIC })
});

export default Object.freeze({
    get(lipid) {
        const id = typeof lipid === "string" ? lipid : lipid?.id;
        const groups = typeof lipid === "string" ? [] : lipid?.groups ?? [];
        const visual = visuals[id] ?? {};
        return Object.freeze({
            icon: visual.icon ?? ICONS[groups[0]] ?? "◇",
            classification: visual.classification ?? "Assembled lipid · graphic coming soon",
            previewImage: visual.previewImage ?? null,
            observationImage: visual.observationImage ?? null,
            schematic: Boolean(visual.schematic),
            svgMarkup: visual.svgMarkup ?? null
        });
    }
});
