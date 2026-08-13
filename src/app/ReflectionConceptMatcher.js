// --------------------------------------------------
// ReflectionConceptMatcher.js
// Flexible, data-driven matching for short lab responses.
// It recognizes concepts rather than requiring one exact
// sentence, while preserving scientific negation words.
// --------------------------------------------------

const ReflectionConceptMatcher = {

    normalize(response) {

        return String(response ?? "")
            .normalize("NFKD")
            .replace(/h[₂2]o/gi, "h2o")
            .toLowerCase()
            .replace(/[’']/g, "")
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    },

    escapeRegExp(value) {

        return String(value).replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

    },

    levenshteinDistance(first, second) {

        const source = String(first);
        const target = String(second);

        const previous = Array.from(
            { length: target.length + 1 },
            (_, index) => index
        );

        for (
            let sourceIndex = 1;
            sourceIndex <= source.length;
            sourceIndex += 1
        ) {
            let diagonal = previous[0];

            previous[0] = sourceIndex;

            for (
                let targetIndex = 1;
                targetIndex <= target.length;
                targetIndex += 1
            ) {
                const oldValue = previous[targetIndex];

                previous[targetIndex] = Math.min(
                    previous[targetIndex] + 1,
                    previous[targetIndex - 1] + 1,
                    diagonal + (
                        source[
                            sourceIndex - 1
                        ] === target[
                            targetIndex - 1
                        ]
                            ? 0
                            : 1
                    )
                );

                diagonal = oldValue;
            }
        }

        return previous[target.length];

    },

    getTypoTolerance(term) {

        return String(term).length >= 9
            ? 2
            : 1;

    },

    findTechnicalTermMatch(tokens, technicalTerms = []) {

        for (const term of technicalTerms) {

            const normalizedTerm =
                this.normalize(term);

            if (!normalizedTerm || normalizedTerm.includes(" ")) {
                continue;
            }

            const tolerance =
                this.getTypoTolerance(normalizedTerm);

            const token = tokens.find(candidate =>
                this.levenshteinDistance(
                    candidate,
                    normalizedTerm
                ) <= tolerance
            );

            if (token) {
                return {
                    matched: true,
                    method: "technical-term-typo-tolerance",
                    evidence: token
                };
            }
        }

        return {
            matched: false
        };

    },

    findExactTermMatch(normalizedResponse, terms = []) {

        for (const term of terms) {

            const normalizedTerm =
                this.normalize(term);

            if (!normalizedTerm) {
                continue;
            }

            const expression = new RegExp(
                `(?:^|\\s)${this.escapeRegExp(normalizedTerm)}(?:$|\\s)`,
                "i"
            );

            if (expression.test(normalizedResponse)) {
                return {
                    matched: true,
                    method: "term",
                    evidence: normalizedTerm
                };
            }
        }

        return {
            matched: false
        };

    },

    findPatternMatch(normalizedResponse, patterns = []) {

        for (const pattern of patterns) {

            try {
                const expression = new RegExp(pattern, "i");
                const match = normalizedResponse.match(expression);

                if (match) {
                    return {
                        matched: true,
                        method: "pattern",
                        evidence: match[0]
                    };
                }
            } catch (error) {
                console.warn(
                    "ReflectionConceptMatcher: invalid pattern",
                    pattern,
                    error
                );
            }
        }

        return {
            matched: false
        };

    },

    matchConcept(concept, normalizedResponse, tokens) {

        const patternResult =
            this.findPatternMatch(
                normalizedResponse,
                concept.patterns
            );

        if (patternResult.matched) {
            return patternResult;
        }

        const termResult =
            this.findExactTermMatch(
                normalizedResponse,
                concept.terms
            );

        if (termResult.matched) {
            return termResult;
        }

        return this.findTechnicalTermMatch(
            tokens,
            concept.technicalTerms
        );

    },

    // Legacy keywordGroups remain supported while older
    // experiments are migrated to explicit conceptGroups.
    getConceptGroups(reflection) {

        if (Array.isArray(reflection?.conceptGroups)) {
            return reflection.conceptGroups;
        }

        return (reflection?.keywordGroups ?? []).map(
            (terms, index) => ({
                id: `keyword_group_${index + 1}`,
                terms
            })
        );

    },

    evaluate(reflection, response) {

        const normalizedResponse =
            this.normalize(response);

        const tokens = normalizedResponse
            ? normalizedResponse.split(" ")
            : [];

        const concepts =
            this.getConceptGroups(reflection);

        const conceptMatches = concepts.map(concept => ({
            id: concept.id,
            ...this.matchConcept(
                concept,
                normalizedResponse,
                tokens
            )
        }));

        return {
            normalizedResponse,
            concepts,
            conceptMatches,
            matchedGroups:
                conceptMatches.map(match => match.matched)
        };

    }

};

export default ReflectionConceptMatcher;
