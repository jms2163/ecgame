// --------------------------------------------------
// ExperimentPlacementEvaluator.js
// Evaluates data-defined experiment placement rules
// --------------------------------------------------

const ExperimentPlacementEvaluator = {

    // --------------------------------------------------
    // Safely read placement collections
    // --------------------------------------------------
    getPlacements(
        snapshot,
        kind
    ) {

        const collection =
            kind === "material"
                ? snapshot?.components
                : snapshot?.labels;

        return Array.isArray(collection)
            ? collection
            : [];

    },

    // --------------------------------------------------
    // Find one placed label
    // --------------------------------------------------
    getLabelPlacement(
        snapshot,
        labelId
    ) {

        return this.getPlacements(
            snapshot,
            "label"
        ).find(label =>
            label.id === labelId
        ) ?? null;

    },

    // --------------------------------------------------
    // Count one material in one zone
    // --------------------------------------------------
    getMaterialCount(
        snapshot,
        materialId,
        zoneId
    ) {

        return this.getPlacements(
            snapshot,
            "material"
        ).filter(material =>
            material.id === materialId &&
            material.zoneId === zoneId
        ).length;

    },

    // --------------------------------------------------
    // Resolve student-defined semantic zones
    // --------------------------------------------------
    resolveSemanticZones(
        assessment,
        snapshot
    ) {

        const sideZoneIds =
            assessment.sideZoneIds ?? [];

        const assignments = {};

        const issues = [];

        const semanticRules =
            (
                assessment.labelRules ?? []
            ).filter(rule =>
                rule.type ===
                "semantic_zone_label"
            );

        semanticRules.forEach(rule => {

            const placement =
                this.getLabelPlacement(
                    snapshot,
                    rule.labelId
                );

            if (
                !placement ||
                !sideZoneIds.includes(
                    placement.zoneId
                )
            ) {
                issues.push(
                    `No valid ${rule.semanticZone} label placement`
                );

                return;
            }

            assignments[
                rule.semanticZone
            ] = placement.zoneId;

        });

        if (
            assignments.cytosol &&
            assignments.extracellular &&
            assignments.cytosol ===
            assignments.extracellular
        ) {
            issues.push(
                "Cytosol and extracellular solution cannot occupy the same side"
            );
        }

        return {

            assignments,

            valid:
                Boolean(
                    assignments.cytosol &&
                    assignments.extracellular
                ) &&
                assignments.cytosol !==
                assignments.extracellular,

            issues

        };

    },

    // --------------------------------------------------
    // Calculate normalized distance within one zone
    // --------------------------------------------------
    getPlacementDistance(
        firstPlacement,
        secondPlacement
    ) {

        if (
            !firstPlacement ||
            !secondPlacement ||
            firstPlacement.zoneId !==
            secondPlacement.zoneId
        ) {
            return Infinity;
        }

        const firstPosition =
            firstPlacement.position ?? {};

        const secondPosition =
            secondPlacement.position ?? {};

        if (
            !Number.isFinite(firstPosition.x) ||
            !Number.isFinite(firstPosition.y) ||
            !Number.isFinite(secondPosition.x) ||
            !Number.isFinite(secondPosition.y)
        ) {
            return Infinity;
        }

        return Math.hypot(
            firstPosition.x -
            secondPosition.x,

            firstPosition.y -
            secondPosition.y
        );

    },

    // --------------------------------------------------
    // Evaluate a material-count rule
    // --------------------------------------------------
    evaluateMinimumMaterialRule(
        rule,
        context
    ) {

        const zoneId =
            context.semanticZones.assignments[
                rule.semanticZone
            ];

        const count =
            zoneId
                ? this.getMaterialCount(
                    context.snapshot,
                    rule.materialId,
                    zoneId
                )
                : 0;

        const passed =
            Boolean(zoneId) &&
            count >= rule.minimumCount;

        return {

            id:
                rule.id,

            type:
                rule.type,

            passed,

            awardedPoints:
                passed
                    ? rule.points
                    : 0,

            maximumPoints:
                rule.points,

            details: {
                zoneId,
                count,
                minimumCount:
                    rule.minimumCount
            }

        };

    },

    // --------------------------------------------------
    // Evaluate balanced-ion concentration gradient
    // --------------------------------------------------
    evaluateBalancedIonGradientRule(
        rule,
        context
    ) {

        const [
            firstSide,
            secondSide
        ] =
            context.assessment.sideZoneIds ?? [];

        const higherZoneId =
            context.semanticZones.assignments[
                rule.higherConcentrationZone
            ];

        const lowerZoneId =
            [
                firstSide,
                secondSide
            ].find(zoneId =>
                zoneId !== higherZoneId
            );

        const counts = {

            [firstSide]: {
                cation:
                    this.getMaterialCount(
                        context.snapshot,
                        rule.cationId,
                        firstSide
                    ),

                anion:
                    this.getMaterialCount(
                        context.snapshot,
                        rule.anionId,
                        firstSide
                    )
            },

            [secondSide]: {
                cation:
                    this.getMaterialCount(
                        context.snapshot,
                        rule.cationId,
                        secondSide
                    ),

                anion:
                    this.getMaterialCount(
                        context.snapshot,
                        rule.anionId,
                        secondSide
                    )
            }

        };

        const eachSideIsBalanced =
            counts[firstSide].cation ===
            counts[firstSide].anion &&
            counts[secondSide].cation ===
            counts[secondSide].anion;

        const higherSideHasMoreSolute =
            Boolean(
                higherZoneId &&
                lowerZoneId
            ) &&
            counts[higherZoneId].cation >
            counts[lowerZoneId].cation &&
            counts[higherZoneId].anion >
            counts[lowerZoneId].anion;

        const passed =
            context.semanticZones.valid &&
            eachSideIsBalanced &&
            higherSideHasMoreSolute;

        const report = {

            passed,

            higherZoneId,

            lowerZoneId,

            counts,

            eachSideIsBalanced,

            higherSideHasMoreSolute

        };

        context.gradientReports.set(
            rule.id,
            report
        );

        return (
            rule.scoreUnits ?? []
        ).map(unit => ({

            id:
                unit.id,

            type:
                rule.type,

            passed,

            awardedPoints:
                passed
                    ? unit.points
                    : 0,

            maximumPoints:
                unit.points,

            details:
                report

        }));

    },

    // --------------------------------------------------
    // Evaluate one material placed in a required zone at
    // one of the allowed right-angle orientations.
    // --------------------------------------------------
    evaluateMaterialInZoneWithRotationRule(
        rule,
        context
    ) {

        const matchingMaterial =
            this.getPlacements(
                context.snapshot,
                "material"
            ).find(material =>
                material.id === rule.materialId &&
                material.zoneId === rule.zoneId
            ) ?? null;

        const rotationDeg =
            ((matchingMaterial?.rotationDeg ?? 0) % 360 + 360) % 360;

        const allowedRotations =
            rule.allowedRotationDeg ?? [];

        const placementPassed =
            Boolean(matchingMaterial);

        const orientationPassed =
            placementPassed &&
            allowedRotations.includes(rotationDeg);

        return [
            {
                id: rule.placementScoreUnit.id,
                type: rule.type,
                passed: placementPassed,
                awardedPoints: placementPassed
                    ? rule.placementScoreUnit.points
                    : 0,
                maximumPoints:
                    rule.placementScoreUnit.points,
                details: {
                    zoneId: matchingMaterial?.zoneId ?? null,
                    requiredZoneId: rule.zoneId
                }
            },
            {
                id: rule.orientationScoreUnit.id,
                type: rule.type,
                passed: orientationPassed,
                awardedPoints: orientationPassed
                    ? rule.orientationScoreUnit.points
                    : 0,
                maximumPoints:
                    rule.orientationScoreUnit.points,
                details: {
                    rotationDeg,
                    allowedRotations
                }
            }
        ];

    },

    // --------------------------------------------------
    // Evaluate a label placed in one exact zone
    // --------------------------------------------------
    evaluateLabelInZoneRule(
        rule,
        context
    ) {

        const label =
            this.getLabelPlacement(
                context.snapshot,
                rule.labelId
            );

        const passed =
            label?.zoneId ===
            rule.zoneId;

        return {

            id:
                rule.id,

            type:
                rule.type,

            passed,

            awardedPoints:
                passed
                    ? rule.points
                    : 0,

            maximumPoints:
                rule.points,

            details: {
                actualZoneId:
                    label?.zoneId ?? null,

                expectedZoneId:
                    rule.zoneId
            }

        };

    },

    // --------------------------------------------------
    // Evaluate a semantic-zone identity label
    // --------------------------------------------------
    evaluateSemanticZoneLabelRule(
        rule,
        context
    ) {

        const label =
            this.getLabelPlacement(
                context.snapshot,
                rule.labelId
            );

        const expectedZoneId =
            context.semanticZones.assignments[
                rule.semanticZone
            ];

        const gradientReport =
            context.gradientReports.get(
                rule.ionGradientRuleId
            );

        const relationPassed =
            rule.concentrationRelation ===
            "higher"
                ? gradientReport?.higherZoneId ===
                    label?.zoneId &&
                    gradientReport.passed
                : gradientReport?.lowerZoneId ===
                    label?.zoneId &&
                    gradientReport.passed;

        const passed =
            label?.zoneId ===
            expectedZoneId &&
            relationPassed;

        return {

            id:
                rule.id,

            type:
                rule.type,

            passed,

            awardedPoints:
                passed
                    ? rule.points
                    : 0,

            maximumPoints:
                rule.points,

            details: {
                actualZoneId:
                    label?.zoneId ?? null,

                expectedZoneId,

                concentrationRelation:
                    rule.concentrationRelation
            }

        };

    },

    // --------------------------------------------------
    // Evaluate a label near a material in the same zone
    // --------------------------------------------------
    evaluateLabelNearMaterialRule(
        rule,
        context
    ) {

        const label =
            this.getLabelPlacement(
                context.snapshot,
                rule.labelId
            );

        const matchingMaterials =
            this.getPlacements(
                context.snapshot,
                "material"
            ).filter(material =>
                material.id ===
                rule.materialId
            );

        const nearestDistance =
            Math.min(
                ...matchingMaterials.map(
                    material =>
                        this.getPlacementDistance(
                            label,
                            material
                        )
                ),
                Infinity
            );

        const passed =
            nearestDistance <=
            rule.maximumDistance;

        return {

            id:
                rule.id,

            type:
                rule.type,

            passed,

            awardedPoints:
                passed
                    ? rule.points
                    : 0,

            maximumPoints:
                rule.points,

            details: {
                nearestDistance,

                maximumDistance:
                    rule.maximumDistance
            }

        };

    },

    // --------------------------------------------------
    // Evaluate a label inside a derived semantic zone
    // --------------------------------------------------
    evaluateLabelInSemanticZoneRule(
        rule,
        context
    ) {

        const label =
            this.getLabelPlacement(
                context.snapshot,
                rule.labelId
            );

        const expectedZoneId =
            context.semanticZones.assignments[
                rule.semanticZone
            ];

        const passed =
            Boolean(expectedZoneId) &&
            label?.zoneId ===
            expectedZoneId;

        return {

            id:
                rule.id,

            type:
                rule.type,

            passed,

            awardedPoints:
                passed
                    ? rule.points
                    : 0,

            maximumPoints:
                rule.points,

            details: {
                actualZoneId:
                    label?.zoneId ?? null,

                expectedZoneId
            }

        };

    },

    // --------------------------------------------------
    // Evaluate one configured setup rule
    // --------------------------------------------------
    evaluateSetupRule(
        rule,
        context
    ) {

        if (
            rule.type ===
            "minimum_material_in_semantic_zone"
        ) {
            return [
                this.evaluateMinimumMaterialRule(
                    rule,
                    context
                )
            ];
        }

        if (
            rule.type ===
            "balanced_ion_gradient"
        ) {
            return this.evaluateBalancedIonGradientRule(
                rule,
                context
            );
        }

        if (
            rule.type ===
            "material_in_zone_with_allowed_rotation"
        ) {
            return this.evaluateMaterialInZoneWithRotationRule(
                rule,
                context
            );
        }

        return [
            {
                id:
                    rule.id,

                type:
                    rule.type,

                passed:
                    false,

                awardedPoints:
                    0,

                maximumPoints:
                    rule.points ?? 0,

                details: {
                    error:
                        "Unknown setup rule type"
                }
            }
        ];

    },

    // --------------------------------------------------
    // Evaluate one configured label rule
    // --------------------------------------------------
    evaluateLabelRule(
        rule,
        context
    ) {

        if (
            rule.type ===
            "label_in_zone"
        ) {
            return this.evaluateLabelInZoneRule(
                rule,
                context
            );
        }

        if (
            rule.type ===
            "semantic_zone_label"
        ) {
            return this.evaluateSemanticZoneLabelRule(
                rule,
                context
            );
        }

        if (
            rule.type ===
            "label_near_material"
        ) {
            return this.evaluateLabelNearMaterialRule(
                rule,
                context
            );
        }

        if (
            rule.type ===
            "label_in_semantic_zone"
        ) {
            return this.evaluateLabelInSemanticZoneRule(
                rule,
                context
            );
        }

        return {
            id:
                rule.id,

            type:
                rule.type,

            passed:
                false,

            awardedPoints:
                0,

            maximumPoints:
                rule.points ?? 0,

            details: {
                error:
                    "Unknown label rule type"
            }
        };

    },

    // --------------------------------------------------
    // Evaluate a free-response reflection
    // --------------------------------------------------
    evaluateReflection(
        reflection,
        reflectionResponses
    ) {

        if (!reflection) {
            return null;
        }

        const response =
            String(
                reflectionResponses?.[
                    reflection.id
                ] ?? ""
            ).toLowerCase();

        const keywordGroups =
            reflection.keywordGroups ?? [];

        const matchedGroups =
            keywordGroups.map(group =>
                group.some(keyword =>
                    response.includes(
                        String(keyword).toLowerCase()
                    )
                )
            );

        const matchedCount =
            matchedGroups.filter(Boolean).length;

        const awardedPoints =
            keywordGroups.length > 0
                ? Number(
                    (
                        reflection.maximumPoints *
                        (
                            matchedCount /
                            keywordGroups.length
                        )
                    ).toFixed(2)
                )
                : 0;

        return {

            id:
                reflection.id,

            type:
                "reflection_keyword_groups",

            passed:
                matchedCount ===
                keywordGroups.length,

            awardedPoints,

            maximumPoints:
                reflection.maximumPoints,

            details: {
                matchedCount,

                keywordGroupCount:
                    keywordGroups.length,

                matchedGroups
            }

        };

    },

    // --------------------------------------------------
    // Evaluate one complete experiment submission
    // --------------------------------------------------
    evaluate({
        assessment,
        snapshot,
        reflectionResponses = {}
    } = {}) {

        if (!assessment) {
            return {
                scorePoints: 0,
                scoreMaximum: 0,
                scorePercent: 0,
                isPerfect: false,
                criteria: [],
                errors: [
                    "Experiment assessment is unavailable"
                ]
            };
        }

        const context = {

            assessment,

            snapshot: {
                components:
                    this.getPlacements(
                        snapshot,
                        "material"
                    ),

                labels:
                    this.getPlacements(
                        snapshot,
                        "label"
                    )
            },

            semanticZones:
                this.resolveSemanticZones(
                    assessment,
                    snapshot
                ),

            gradientReports:
                new Map()

        };

        const criteria = [];

        (
            assessment.setupRules ?? []
        ).forEach(rule => {

            criteria.push(
                ...this.evaluateSetupRule(
                    rule,
                    context
                )
            );

        });

        (
            assessment.labelRules ?? []
        ).forEach(rule => {

            criteria.push(
                this.evaluateLabelRule(
                    rule,
                    context
                )
            );

        });

        const reflectionCriterion =
            this.evaluateReflection(
                assessment.reflection,
                reflectionResponses
            );

        if (reflectionCriterion) {
            criteria.push(
                reflectionCriterion
            );
        }

        const scorePoints =
            Number(
                criteria.reduce(
                    (
                        total,
                        criterion
                    ) =>
                        total +
                        criterion.awardedPoints,
                    0
                ).toFixed(2)
            );

        const scoreMaximum =
            assessment.scoreMaximum ?? 0;

        const scorePercent =
            scoreMaximum > 0
                ? Number(
                    (
                        scorePoints /
                        scoreMaximum *
                        100
                    ).toFixed(2)
                )
                : 0;

        return {

            scorePoints,

            scoreMaximum,

            scorePercent,

            isPerfect:
                scorePoints ===
                scoreMaximum,

            semanticZones:
                context.semanticZones,

            criteria,

            errors:
                context.semanticZones.issues

        };

    }

};

export default ExperimentPlacementEvaluator;
