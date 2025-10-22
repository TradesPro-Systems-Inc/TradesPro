"use strict";
// services/calculation-service/src/calculators/baseLoadCalculator.ts
// Pure function calculator for CEC 8-200 basic load
// No I/O, no side effects, fully deterministic
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBaseLoad = calculateBaseLoad;
exports.calculateBaseLoadWithAudit = calculateBaseLoadWithAudit;
exports.validateLivingArea = validateLivingArea;
exports.calculateLivingAreaFromFloors = calculateLivingAreaFromFloors;
/**
 * Calculate basic load per CEC 8-200 1)a)i-ii
 *
 * Formula:
 * - First 90 m²: 5000W
 * - Additional area: 1000W per 90 m² portion (rounded up)
 *
 * @param livingArea_m2 - Total living area in square meters
 * @returns Basic load in watts
 *
 * @example
 * calculateBaseLoad(90)   // Returns 5000
 * calculateBaseLoad(91)   // Returns 6000
 * calculateBaseLoad(180)  // Returns 6000
 * calculateBaseLoad(181)  // Returns 7000
 */
function calculateBaseLoad(livingArea_m2) {
    if (livingArea_m2 <= 0) {
        throw new Error('Living area must be positive');
    }
    if (livingArea_m2 <= 90) {
        return 5000;
    }
    var additionalArea = livingArea_m2 - 90;
    var additionalPortions = Math.ceil(additionalArea / 90);
    return 5000 + (additionalPortions * 1000);
}
/**
 * Calculate intermediate values for audit trail
 *
 * @param livingArea_m2 - Total living area
 * @returns Object with intermediate calculation values
 */
function calculateBaseLoadWithAudit(livingArea_m2) {
    var basicLoad_W = calculateBaseLoad(livingArea_m2);
    var firstPortion_m2 = Math.min(livingArea_m2, 90);
    var additionalArea_m2 = Math.max(0, livingArea_m2 - 90);
    var additionalPortions = additionalArea_m2 > 0 ? Math.ceil(additionalArea_m2 / 90) : 0;
    return {
        basicLoad_W: basicLoad_W,
        intermediateValues: {
            firstPortion_m2: firstPortion_m2,
            additionalArea_m2: additionalArea_m2,
            additionalPortions: additionalPortions
        }
    };
}
/**
 * Validate living area input
 *
 * @param livingArea_m2 - Area to validate
 * @returns Validation result with any warnings
 */
function validateLivingArea(livingArea_m2) {
    var warnings = [];
    if (livingArea_m2 <= 0) {
        return { valid: false, warnings: ['Living area must be positive'] };
    }
    if (livingArea_m2 < 30) {
        warnings.push('Living area is unusually small (< 30 m²)');
    }
    if (livingArea_m2 > 1000) {
        warnings.push('Living area is unusually large (> 1000 m²). Consider using 8-202 for apartment buildings.');
    }
    return { valid: true, warnings: warnings };
}
function calculateLivingAreaFromFloors(floors) {
    var breakdown = [];
    var totalArea_m2 = 0;
    for (var _i = 0, floors_1 = floors; _i < floors_1.length; _i++) {
        var floor = floors_1[_i];
        var factor = 1.0;
        var description = floor.description || floor.type || 'Unknown floor';
        // Apply CEC 8-110 rules
        if (floor.type === 'basement') {
            var height = floor.height_m || 0;
            if (height > 1.8) {
                factor = 0.75;
                description += " (height ".concat(height.toFixed(1), "m, counted at 75%)");
            }
            else {
                factor = 0;
                description += " (height ".concat(height.toFixed(1), "m, not counted)");
            }
        }
        var countedArea = floor.area_m2 * factor;
        totalArea_m2 += countedArea;
        breakdown.push({
            description: description,
            rawArea_m2: floor.area_m2,
            factor: factor,
            countedArea_m2: countedArea
        });
    }
    return {
        totalArea_m2: totalArea_m2,
        breakdown: breakdown
    };
}
