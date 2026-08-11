// --------------------------------------------------
// CellStatusEvaluator.js
// Chooses one prioritized cell-status message
// --------------------------------------------------

const CellStatusEvaluator = {

    // --------------------------------------------------
    // Choose current system status from effective reports
    // --------------------------------------------------
    evaluate(
        conditionReport,
        environmentReport
    ) {

        if (
            !conditionReport ||
            !environmentReport
        ) {
            return {
                code: "AWAITING_DATA",
                message:
                    "Awaiting sensor data."
            };
        }

        const {
            viable,
            lethalSystems
        } =
            conditionReport;

        const {
            temperatureSuitability,
            phSuitability,
            oxygenAvailability,
            chemicalToxicityPenalty
        } =
            environmentReport.modifiers;

        const {
            encystmentPressure
        } =
            environmentReport.stress;

        // --------------------------------------------------
        // Critical survival failures
        // --------------------------------------------------

        if (!viable) {

            if (
                lethalSystems.includes(
                    "atp_production"
                )
            ) {
                return {
                    code: "CRITICAL_ATP",
                    message:
                        "Critical: current conditions cannot sustain ATP production."
                };
            }

            if (
                lethalSystems.includes(
                    "membrane_health"
                )
            ) {
                return {
                    code: "CRITICAL_MEMBRANE",
                    message:
                        "Critical: current conditions severely threaten membrane function."
                };
            }

            return {
                code: "CRITICAL_CELL_HEALTH",
                message:
                    "Critical: core cell functions are severely compromised."
            };

        }

        // --------------------------------------------------
        // Strong environmental pressure
        // --------------------------------------------------

        if (encystmentPressure >= 0.60) {
            return {
                code: "HIGH_ENCYSTMENT_PRESSURE",
                message:
                    "High environmental stress: encystment pressure is elevated."
            };
        }

        // --------------------------------------------------
        // Major temporary limitations
        // --------------------------------------------------

        if (chemicalToxicityPenalty >= 0.25) {
            return {
                code: "CHEMICAL_STRESS",
                message:
                    "Chemical stress is reducing current cell performance."
            };
        }

        if (oxygenAvailability < 0.50) {
            return {
                code: "LOW_OXYGEN",
                message:
                    "Low oxygen is limiting ATP production."
            };
        }

        if (temperatureSuitability < 0.50) {
            return {
                code: "TEMPERATURE_STRESS",
                message:
                    "Cold conditions are slowing cellular processes."
            };
        }

        if (phSuitability < 0.60) {
            return {
                code: "PH_STRESS",
                message:
                    "pH conditions are stressing membrane and enzyme function."
            };
        }

        // --------------------------------------------------
        // Stable conditions
        // --------------------------------------------------

        return {
            code: "STABLE",
            message:
                "Current conditions support basic cellular function."
        };

    }

};

export default CellStatusEvaluator;