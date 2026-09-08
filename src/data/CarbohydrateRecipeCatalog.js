// Disaccharide assembly: quantities describe composition, not consumed stock.
// ATP/time are game costs, not a biochemical claim about direct ATP coupling.
const recipes = [
    ["Maltose", { Glucose: 2 }, "Two glucose units joined by an α(1→4) glycosidic bond."],
    ["Sucrose", { Glucose: 1, Fructose: 1 }, "Glucose and fructose joined by an α(1→2)β glycosidic bond."],
    ["Lactose", { Glucose: 1, Galactose: 1 }, "Galactose and glucose joined by a β(1→4) glycosidic bond."]
];

const definitions = Object.freeze(recipes.map(([id, composition, description]) =>
    Object.freeze({
        id, name: id, category: "carbs", discoveryCategory: "molecules",
        description, info: description, implemented: true,
        monomerCount: 2, bondCount: 1, bondType: "glycosidic",
        atpCost: 1, compositionCount: 2, compositionValid: true,
        monomers: Object.freeze(Object.entries(composition).map(([id, quantity]) =>
            Object.freeze({ id, quantity })
        )),
        requiredReactionIds: Object.freeze(["dehydration"])
    })
));

export default Object.freeze({
    getAll() { return definitions; },
    get(id) { return definitions.find(recipe => recipe.id === id) ?? null; }
});
