const IDS = {H:'H_helix',B:'B_sheet',L:'L_loop'};
export function completedComponentIds(definition, record, full = false) {
    if (full) return definition.components.map(c => c.number);
    // Cumulative PNGs require a consecutive prefix; reject invalid/gapped save data.
    const supplied = new Set(Array.isArray(record?.completedIds) ? record.completedIds : []);
    const result = [];
    for (const c of definition.components) {
        if (!supplied.has(c.number)) break;
        result.push(c.number);
    }
    return result;
}
export function componentPlan(definition, componentIds) {
    if (!Array.isArray(componentIds) || !componentIds.length ||
        componentIds.some((id,i)=>!Number.isInteger(id) || !definition.components.some(c=>c.number===id) || (i && id!==componentIds[i-1]+1))) return null;
    const selected = definition.components.filter(c => componentIds.includes(c.number));
    const recipe = {H:0,B:0,L:0};
    for (const c of selected) for (const k of Object.keys(recipe)) recipe[k] += c.recipe[k];
    const atpCost = Object.values(recipe).reduce((a,b)=>a+b,0);
    return {componentIds:[...componentIds], atpCost, durationMs:Math.round(Math.min(60,15+atpCost*.25)*1000),
        motifRequirements:Object.entries(recipe).map(([symbol,quantity])=>({symbol,productId:IDS[symbol],quantity})),
        firstFrame:selected[0].firstFrame, lastFrame:selected.at(-1).lastFrame};
}
export function componentProgress(definition, record, full = false) {
    const done = completedComponentIds(definition,record,full);
    return {completedIds:done, completedCount:done.length, total:definition.components.length,
        nextNumber:definition.components[done.length]?.number ?? null,
        frame:done.length ? definition.components[done.length-1].lastFrame : 0};
}
