// Keep stable option IDs for scoring while varying the displayed order once
// per attempt. True/false and "none of the above" questions keep their order.
export function randomizedOptions(questions, random = Math.random) {
    return new Map(questions.map(question => {
        const options = [...question.options];
        const fixed = options.length === 2 || options.some(option =>
            /^none of (these|the above)/i.test(option.text)
        );
        if (!fixed) {
            for (let index = options.length - 1; index > 0; index--) {
                const other = Math.floor(random() * (index + 1));
                [options[index], options[other]] = [options[other], options[index]];
            }
        }
        return [question.id, options];
    }));
}
