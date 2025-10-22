"use strict";
// services/calculation-service/src/core/tables.ts
// TradesPro Multi-Version Table Lookup Engine
// Supports CEC 2021, 2024, 2027 with intelligent column matching
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableManager = exports.TableVersionManager = void 0;
exports.toFixedDigits = toFixedDigits;
exports.selectAmpacityColumn = selectAmpacityColumn;
exports.lookupAmbientFactor = lookupAmbientFactor;
exports.lookupCountFactor = lookupCountFactor;
exports.lookupConductorSize = lookupConductorSize;
var FIXED_DECIMALS = 6;
/**
 * Deterministic numeric formatting
 */
function toFixedDigits(n) {
    var s = Number(n || 0).toFixed(FIXED_DECIMALS);
    return s.replace(/\.?0+$/, '') || '0';
}
/**
 * Table version manager - loads correct version based on edition
 */
var TableVersionManager = /** @class */ (function () {
    function TableVersionManager() {
        this.cache = new Map();
    }
    /**
     * Load tables for specific code and edition
     */
    TableVersionManager.prototype.loadTables = function () {
        return __awaiter(this, arguments, void 0, function (code, edition) {
            var cacheKey, basePath, _a, table2, table4, table5A, table5C, tables, error_1;
            if (code === void 0) { code = 'cec'; }
            if (edition === void 0) { edition = '2024'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = "".concat(code, "-").concat(edition);
                        if (this.cache.has(cacheKey)) {
                            return [2 /*return*/, this.cache.get(cacheKey)];
                        }
                        basePath = "../data/tables/".concat(edition);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.all([
                                Promise.resolve("".concat("".concat(basePath, "/table2.json"))).then(function (s) { return require(s); }),
                                Promise.resolve("".concat("".concat(basePath, "/table4.json"))).then(function (s) { return require(s); }),
                                Promise.resolve("".concat("".concat(basePath, "/table5A.json"))).then(function (s) { return require(s); }),
                                Promise.resolve("".concat("".concat(basePath, "/table5C.json"))).then(function (s) { return require(s); }),
                            ])];
                    case 2:
                        _a = _b.sent(), table2 = _a[0], table4 = _a[1], table5A = _a[2], table5C = _a[3];
                        tables = {
                            table2: table2.default,
                            table4: table4.default,
                            table5A: table5A.default,
                            table5C: table5C.default,
                            edition: edition,
                            code: code
                        };
                        this.cache.set(cacheKey, tables);
                        return [2 /*return*/, tables];
                    case 3:
                        error_1 = _b.sent();
                        throw new Error("Failed to load ".concat(code, " ").concat(edition, " tables: ").concat(error_1));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear cache
     */
    TableVersionManager.prototype.clearCache = function () {
        this.cache.clear();
    };
    return TableVersionManager;
}());
exports.TableVersionManager = TableVersionManager;
// Global instance
exports.tableManager = new TableVersionManager();
/**
 * Select best ampacity column from a table row
 * Supports multiple naming conventions: ampacity75C, 75C, ampacity75, etc.
 */
function selectAmpacityColumn(row, tempRating) {
    // Try standard formats in order of preference
    var candidates = [
        "ampacity".concat(tempRating, "C"),
        "ampacity".concat(tempRating),
        "".concat(tempRating, "C"),
        "factor".concat(tempRating, "C"),
        "factor".concat(tempRating),
        'ampacity75C', // fallback
        'ampacity',
    ];
    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var candidate = candidates_1[_i];
        if (Object.prototype.hasOwnProperty.call(row, candidate) &&
            row[candidate] !== null &&
            row[candidate] !== undefined) {
            return candidate;
        }
    }
    // Last resort: find any column starting with 'ampacity'
    for (var _a = 0, _b = Object.keys(row); _a < _b.length; _a++) {
        var key = _b[_a];
        if (key.toLowerCase().startsWith('ampacity') &&
            typeof row[key] === 'number') {
            return key;
        }
    }
    return null;
}
/**
 * Lookup ambient temperature correction factor from Table 5A
 */
function lookupAmbientFactor(table5A, ambientTempC, tempRating) {
    var _a;
    var warnings = [];
    // Handle missing table or temperature
    if (!table5A) {
        warnings.push('Table 5A missing; using default factor 1.0');
        return { factor: 1.0, rowIndex: -1, warnings: warnings };
    }
    if (ambientTempC === undefined || ambientTempC <= 30) {
        // Base temperature is 30°C, no correction needed
        return {
            factor: 1.0,
            tableId: table5A.tableId,
            version: table5A.version,
            rowIndex: -1,
            warnings: ambientTempC === undefined ? ['No ambient temp provided; using 1.0'] : undefined,
        };
    }
    // Sort entries by temperature
    var entries = __spreadArray([], (table5A.entries || []), true).sort(function (a, b) { var _a, _b; return ((_a = a.ambientTempC) !== null && _a !== void 0 ? _a : -Infinity) - ((_b = b.ambientTempC) !== null && _b !== void 0 ? _b : -Infinity); });
    // Find closest temperature entry (not exceeding ambient)
    var chosenIndex = -1;
    for (var i = 0; i < entries.length; i++) {
        var rowTemp = (_a = entries[i].ambientTempC) !== null && _a !== void 0 ? _a : -Infinity;
        if (rowTemp <= ambientTempC) {
            chosenIndex = i;
        }
        else {
            break;
        }
    }
    if (chosenIndex === -1) {
        warnings.push("Ambient temp ".concat(ambientTempC, "\u00B0C below table range; using first entry"));
        chosenIndex = 0;
    }
    var row = entries[chosenIndex];
    // Find factor column
    var columnCandidates = [
        "factor".concat(tempRating, "C"),
        "factor".concat(tempRating),
        'factor',
    ];
    var columnUsed;
    for (var _i = 0, columnCandidates_1 = columnCandidates; _i < columnCandidates_1.length; _i++) {
        var col = columnCandidates_1[_i];
        if (Object.prototype.hasOwnProperty.call(row, col) && row[col] !== null) {
            columnUsed = col;
            break;
        }
    }
    if (!columnUsed) {
        warnings.push("No factor column found for ".concat(tempRating, "\u00B0C; using 1.0"));
        return {
            factor: 1.0,
            tableId: table5A.tableId,
            version: table5A.version,
            rowIndex: chosenIndex,
            warnings: warnings,
        };
    }
    var factor = Number(row[columnUsed]);
    if (isNaN(factor)) {
        warnings.push("Invalid factor value; using 1.0");
        return {
            factor: 1.0,
            tableId: table5A.tableId,
            version: table5A.version,
            rowIndex: chosenIndex,
            columnUsed: columnUsed,
            warnings: warnings,
        };
    }
    return {
        factor: factor,
        tableId: table5A.tableId,
        version: table5A.version,
        rowIndex: chosenIndex,
        columnUsed: columnUsed,
    };
}
/**
 * Lookup conductor count correction factor from Table 5C
 */
function lookupCountFactor(table5C, numConductors) {
    var _a;
    var warnings = [];
    if (!table5C) {
        warnings.push('Table 5C missing; using default factor 1.0');
        return { factor: 1.0, rowIndex: -1, columnUsed: 'correctionFactor', warnings: warnings };
    }
    if (numConductors === undefined || numConductors <= 3) {
        // Base case: 1-3 conductors = 1.0
        return {
            factor: 1.0,
            tableId: table5C.tableId,
            version: table5C.version,
            rowIndex: 0,
            columnUsed: 'correctionFactor',
        };
    }
    // Match conductor count range
    for (var i = 0; i < (table5C.entries || []).length; i++) {
        var row = table5C.entries[i];
        var rangeStr = ((_a = row.numConductorsRange) !== null && _a !== void 0 ? _a : '').replace(/\s/g, '');
        if (!rangeStr)
            continue;
        // Handle "43+" format
        if (rangeStr.includes('+')) {
            var min = Number(rangeStr.replace('+', ''));
            if (numConductors >= min) {
                return {
                    factor: Number(row.correctionFactor),
                    tableId: table5C.tableId,
                    version: table5C.version,
                    rowIndex: i,
                    columnUsed: 'correctionFactor',
                };
            }
        }
        // Handle "4–6" or "4-6" format
        if (rangeStr.includes('–') || rangeStr.includes('-')) {
            var separator = rangeStr.includes('–') ? '–' : '-';
            var _b = rangeStr.split(separator), minStr = _b[0], maxStr = _b[1];
            var min = Number(minStr);
            var max = Number(maxStr);
            if (numConductors >= min && numConductors <= max) {
                return {
                    factor: Number(row.correctionFactor),
                    tableId: table5C.tableId,
                    version: table5C.version,
                    rowIndex: i,
                    columnUsed: 'correctionFactor',
                };
            }
        }
        // Handle exact number
        var exact = Number(rangeStr);
        if (!isNaN(exact) && numConductors === exact) {
            return {
                factor: Number(row.correctionFactor),
                tableId: table5C.tableId,
                version: table5C.version,
                rowIndex: i,
                columnUsed: 'correctionFactor',
            };
        }
    }
    warnings.push("No matching conductor count range for ".concat(numConductors, "; using 1.0"));
    return {
        factor: 1.0,
        tableId: table5C.tableId,
        version: table5C.version,
        rowIndex: -1,
        columnUsed: 'correctionFactor',
        warnings: warnings,
    };
}
/**
 * Compare wire sizes for sorting
 */
function compareWireSizes(a, b) {
    var sizeOrder = [
        '14', '12', '10', '8', '6', '4', '3', '2', '1',
        '1/0', '2/0', '3/0', '4/0',
        '250', '300', '350', '400', '500', '600', '700', '750', '800', '900', '1000',
        '1250', '1500', '1750', '2000'
    ];
    var indexA = sizeOrder.indexOf(a);
    var indexB = sizeOrder.indexOf(b);
    // If not found, put at end
    if (indexA === -1 && indexB === -1)
        return 0;
    if (indexA === -1)
        return 1;
    if (indexB === -1)
        return -1;
    return indexA - indexB;
}
/**
 * Lookup conductor size from ampacity table (Table 2 for Cu, Table 4 for Al)
 * Applies ambient and count corrections
 */
function lookupConductorSize(requiredAmps, material, tempRating, ruleTables, ambientTempC, numConductors) {
    var _a;
    var warnings = [];
    var tableReferences = [];
    // Select appropriate table
    var table = material === 'Cu' ? ruleTables.table2 : ruleTables.table4;
    var tableName = material === 'Cu' ? 'Table 2 (Cu)' : 'Table 4 (Al)';
    if (!table || !Array.isArray(table.entries) || table.entries.length === 0) {
        warnings.push("".concat(tableName, " missing or empty"));
        return {
            size: 'UNKNOWN',
            baseAmpacity: 0,
            tableReferences: [{ tableId: (_a = table === null || table === void 0 ? void 0 : table.tableId) !== null && _a !== void 0 ? _a : 'missing' }],
            warnings: warnings,
        };
    }
    // Get correction factors
    var ambientResult = lookupAmbientFactor(ruleTables.table5A, ambientTempC, tempRating);
    if (ambientResult.warnings)
        warnings.push.apply(warnings, ambientResult.warnings);
    var countResult = lookupCountFactor(ruleTables.table5C, numConductors);
    if (countResult.warnings)
        warnings.push.apply(warnings, countResult.warnings);
    // Add correction table references
    if (ambientResult.tableId) {
        tableReferences.push({
            tableId: ambientResult.tableId,
            version: ambientResult.version,
            rowIndex: ambientResult.rowIndex,
            columnUsed: ambientResult.columnUsed,
        });
    }
    if (countResult.tableId) {
        tableReferences.push({
            tableId: countResult.tableId,
            version: countResult.version,
            rowIndex: countResult.rowIndex,
            columnUsed: countResult.columnUsed,
        });
    }
    // Build sorted list of conductors with ampacities
    var conductors = [];
    for (var i = 0; i < table.entries.length; i++) {
        var entry = table.entries[i];
        var col = selectAmpacityColumn(entry, tempRating);
        if (!col)
            continue;
        var val = Number(entry[col]);
        if (isNaN(val))
            continue;
        conductors.push({ entry: entry, ampVal: val, col: col, idx: i });
    }
    if (conductors.length === 0) {
        warnings.push("No valid ampacity column found in ".concat(tableName));
        return {
            size: 'UNKNOWN',
            baseAmpacity: 0,
            tableReferences: [{ tableId: table.tableId, version: table.version }],
            warnings: warnings,
        };
    }
    // Sort by size (not ampacity) to ensure consistent selection
    conductors.sort(function (a, b) { return compareWireSizes(a.entry.size || '', b.entry.size || ''); });
    // Find first conductor with sufficient corrected ampacity
    for (var _i = 0, conductors_1 = conductors; _i < conductors_1.length; _i++) {
        var conductor = conductors_1[_i];
        var correctedAmpacity_1 = Math.floor(conductor.ampVal * ambientResult.factor * countResult.factor);
        if (correctedAmpacity_1 >= requiredAmps) {
            tableReferences.unshift({
                tableId: table.tableId,
                version: table.version,
                rowIndex: conductor.idx,
                columnUsed: conductor.col,
            });
            return {
                size: "".concat(conductor.entry.size, " ").concat(conductor.entry.unit || '', " ").concat(material).trim(),
                baseAmpacity: conductor.ampVal,
                effectiveAmpacity: correctedAmpacity_1,
                ambientFactor: ambientResult.factor,
                countFactor: countResult.factor,
                tableReferences: tableReferences,
                warnings: warnings.length > 0 ? warnings : undefined,
            };
        }
    }
    // No conductor sufficient - return largest available
    var largest = conductors[conductors.length - 1];
    var correctedAmpacity = Math.floor(largest.ampVal * ambientResult.factor * countResult.factor);
    warnings.push("Required ".concat(requiredAmps, "A exceeds table maximum corrected ampacity (").concat(correctedAmpacity, "A); using largest available"));
    tableReferences.unshift({
        tableId: table.tableId,
        version: table.version,
        rowIndex: largest.idx,
        columnUsed: largest.col,
    });
    return {
        size: "".concat(largest.entry.size, " ").concat(largest.entry.unit || '', " ").concat(material, " (OVERSIZE)").trim(),
        baseAmpacity: largest.ampVal,
        effectiveAmpacity: correctedAmpacity,
        ambientFactor: ambientResult.factor,
        countFactor: countResult.factor,
        tableReferences: tableReferences,
        warnings: warnings,
    };
}
