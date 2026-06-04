"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var fuzzyAHP_1 = require("../lib/dss/fuzzyAHP");
var prisma = new client_1.PrismaClient();
// Helper to interpret pairwise scale
function getTFNForScale(value) {
    var absVal = Math.abs(value) + 1; // map 0..8 to 1..9
    var tfn;
    if (absVal === 1)
        tfn = fuzzyAHP_1.FuzzyScale.EQUAL;
    else if (absVal === 2 || absVal === 3)
        tfn = fuzzyAHP_1.FuzzyScale.MODERATE;
    else if (absVal === 4 || absVal === 5)
        tfn = fuzzyAHP_1.FuzzyScale.STRONG;
    else if (absVal === 6 || absVal === 7)
        tfn = fuzzyAHP_1.FuzzyScale.VERY_STRONG;
    else
        tfn = fuzzyAHP_1.FuzzyScale.EXTREME;
    // If value < 0, it means left is more important.
    // If value > 0, right is more important, so left gets reciprocal.
    if (value > 0) {
        return [1 / tfn[2], 1 / tfn[1], 1 / tfn[0]];
    }
    return tfn;
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var responses, cpLevelResponses, pairTFNs, _i, cpLevelResponses_1, res, comparisons, _a, _b, _c, key, val, numVal, aggregatedTFNs, n, _d, _e, _f, key, tfns, prodL, prodM, prodU, _g, tfns_1, _h, l, m, u, _j, _k, _l, key, tfn, parts, rowCode, colCode, allCodes, _m, allCodes_1, code, _o, weights, cr;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    console.log("Fetching K1 V1 responses for CP_LEVEL...");
                    return [4 /*yield*/, prisma.questionnaireResponse.findMany({
                            where: { questionnaireType: 'pembobotan' }
                        })];
                case 1:
                    responses = _p.sent();
                    cpLevelResponses = responses.filter(function (r) {
                        var ans = r.answers;
                        return ans && ans.type === 'CP_LEVEL' && Object.keys(ans.comparisons || {}).length > 0;
                    });
                    console.log("Found ".concat(cpLevelResponses.length, " valid respondents for CP_LEVEL."));
                    if (cpLevelResponses.length === 0) {
                        console.log("No data to process.");
                        return [2 /*return*/];
                    }
                    pairTFNs = {};
                    for (_i = 0, cpLevelResponses_1 = cpLevelResponses; _i < cpLevelResponses_1.length; _i++) {
                        res = cpLevelResponses_1[_i];
                        comparisons = res.answers.comparisons;
                        for (_a = 0, _b = Object.entries(comparisons); _a < _b.length; _a++) {
                            _c = _b[_a], key = _c[0], val = _c[1];
                            numVal = Number(val);
                            if (!pairTFNs[key])
                                pairTFNs[key] = [];
                            pairTFNs[key].push(getTFNForScale(numVal));
                        }
                    }
                    aggregatedTFNs = {};
                    n = cpLevelResponses.length;
                    for (_d = 0, _e = Object.entries(pairTFNs); _d < _e.length; _d++) {
                        _f = _e[_d], key = _f[0], tfns = _f[1];
                        prodL = 1, prodM = 1, prodU = 1;
                        for (_g = 0, tfns_1 = tfns; _g < tfns_1.length; _g++) {
                            _h = tfns_1[_g], l = _h[0], m = _h[1], u = _h[2];
                            prodL *= l;
                            prodM *= m;
                            prodU *= u;
                        }
                        aggregatedTFNs[key] = [
                            Math.pow(prodL, 1 / n),
                            Math.pow(prodM, 1 / n),
                            Math.pow(prodU, 1 / n)
                        ];
                    }
                    console.log("Calculated Geometric Means. Updating PairwiseComparison table...");
                    // Clear existing CP LEVEL 1 pairwise matrix
                    return [4 /*yield*/, prisma.pairwiseComparison.deleteMany({
                            where: { matrixType: 'LEVEL1_CP' }
                        })];
                case 2:
                    // Clear existing CP LEVEL 1 pairwise matrix
                    _p.sent();
                    _j = 0, _k = Object.entries(aggregatedTFNs);
                    _p.label = 3;
                case 3:
                    if (!(_j < _k.length)) return [3 /*break*/, 7];
                    _l = _k[_j], key = _l[0], tfn = _l[1];
                    parts = key.split('_vs_');
                    if (parts.length !== 2)
                        return [3 /*break*/, 6];
                    rowCode = parts[0], colCode = parts[1];
                    // Insert A -> B
                    return [4 /*yield*/, prisma.pairwiseComparison.create({
                            data: {
                                matrixType: 'LEVEL1_CP',
                                rowCode: rowCode,
                                colCode: colCode,
                                tfnLow: tfn[0],
                                tfnMid: tfn[1],
                                tfnUp: tfn[2]
                            }
                        })];
                case 4:
                    // Insert A -> B
                    _p.sent();
                    // Insert B -> A (reciprocal)
                    return [4 /*yield*/, prisma.pairwiseComparison.create({
                            data: {
                                matrixType: 'LEVEL1_CP',
                                rowCode: colCode,
                                colCode: rowCode,
                                tfnLow: 1 / tfn[2],
                                tfnMid: 1 / tfn[1],
                                tfnUp: 1 / tfn[0]
                            }
                        })];
                case 5:
                    // Insert B -> A (reciprocal)
                    _p.sent();
                    _p.label = 6;
                case 6:
                    _j++;
                    return [3 /*break*/, 3];
                case 7:
                    allCodes = Array.from(new Set(Object.keys(aggregatedTFNs).flatMap(function (k) { return k.split('_vs_'); })));
                    _m = 0, allCodes_1 = allCodes;
                    _p.label = 8;
                case 8:
                    if (!(_m < allCodes_1.length)) return [3 /*break*/, 11];
                    code = allCodes_1[_m];
                    return [4 /*yield*/, prisma.pairwiseComparison.create({
                            data: {
                                matrixType: 'LEVEL1_CP',
                                rowCode: code,
                                colCode: code,
                                tfnLow: 1,
                                tfnMid: 1,
                                tfnUp: 1
                            }
                        })];
                case 9:
                    _p.sent();
                    _p.label = 10;
                case 10:
                    _m++;
                    return [3 /*break*/, 8];
                case 11:
                    console.log("DB Updated. Recalculating weights...");
                    return [4 /*yield*/, (0, fuzzyAHP_1.recalculateLevel1Weights)()];
                case 12:
                    _o = _p.sent(), weights = _o.weights, cr = _o.cr;
                    console.log("\n=== FINAL RESULTS ===");
                    console.log("CR:", cr);
                    console.log("Weights:");
                    weights.forEach(function (w) {
                        console.log("".concat(w.code, ": ").concat((w.weight * 100).toFixed(2), "%"));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(console.error)
    .finally(function () { return prisma.$disconnect(); });
