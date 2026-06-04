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
var prisma = new client_1.PrismaClient();
var FuzzyScale = {
    EQUAL: [1, 1, 1],
    MODERATE: [1, 3, 5],
    STRONG: [3, 5, 7],
    VERY_STRONG: [5, 7, 9],
    EXTREME: [7, 9, 9],
};
function getTFNForScale(value) {
    var absVal = Math.abs(value) + 1;
    var tfn;
    if (absVal === 1)
        tfn = FuzzyScale.EQUAL;
    else if (absVal === 2 || absVal === 3)
        tfn = FuzzyScale.MODERATE;
    else if (absVal === 4 || absVal === 5)
        tfn = FuzzyScale.STRONG;
    else if (absVal === 6 || absVal === 7)
        tfn = FuzzyScale.VERY_STRONG;
    else
        tfn = FuzzyScale.EXTREME;
    if (value > 0)
        return [1 / tfn[2], 1 / tfn[1], 1 / tfn[0]];
    return tfn;
}
function sumTFNs(tfns) {
    return tfns.reduce(function (acc, val) { return [acc[0] + val[0], acc[1] + val[1], acc[2] + val[2]]; }, [0, 0, 0]);
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var responses, cpLevelResponses, pairTFNs, _i, cpLevelResponses_1, res, comparisons, _a, _b, _c, key, val, numVal, aggregatedTFNs, n, _d, _e, _f, key, tfns, prodL, prodM, prodU, _g, tfns_1, _h, l, m, u, allCodes, size, matrix, _j, _k, _l, key, tfn, _m, rowCode, colCode, i, j, rowSums, totalSum, reverseTotal, fse, crispValues, sumCrisp, weights, i;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0: return [4 /*yield*/, prisma.questionnaireResponse.findMany({
                        where: { questionnaireType: 'pembobotan' }
                    })];
                case 1:
                    responses = _o.sent();
                    cpLevelResponses = responses.filter(function (r) {
                        var ans = r.answers;
                        return ans && ans.type === 'CP_LEVEL' && Object.keys(ans.comparisons || {}).length > 0;
                    });
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
                    if (n === 0) {
                        console.log("No data");
                        return [2 /*return*/];
                    }
                    for (_d = 0, _e = Object.entries(pairTFNs); _d < _e.length; _d++) {
                        _f = _e[_d], key = _f[0], tfns = _f[1];
                        prodL = 1, prodM = 1, prodU = 1;
                        for (_g = 0, tfns_1 = tfns; _g < tfns_1.length; _g++) {
                            _h = tfns_1[_g], l = _h[0], m = _h[1], u = _h[2];
                            prodL *= l;
                            prodM *= m;
                            prodU *= u;
                        }
                        aggregatedTFNs[key] = [Math.pow(prodL, 1 / n), Math.pow(prodM, 1 / n), Math.pow(prodU, 1 / n)];
                    }
                    allCodes = Array.from(new Set(Object.keys(aggregatedTFNs).flatMap(function (k) { return k.split('_vs_'); }))).sort();
                    size = allCodes.length;
                    matrix = Array.from({ length: size }, function () { return Array.from({ length: size }, function () { return [1, 1, 1]; }); });
                    for (_j = 0, _k = Object.entries(aggregatedTFNs); _j < _k.length; _j++) {
                        _l = _k[_j], key = _l[0], tfn = _l[1];
                        _m = key.split('_vs_'), rowCode = _m[0], colCode = _m[1];
                        i = allCodes.indexOf(rowCode);
                        j = allCodes.indexOf(colCode);
                        if (i >= 0 && j >= 0) {
                            matrix[i][j] = tfn;
                            matrix[j][i] = [1 / tfn[2], 1 / tfn[1], 1 / tfn[0]];
                        }
                    }
                    rowSums = matrix.map(function (row) { return sumTFNs(row); });
                    totalSum = sumTFNs(rowSums);
                    reverseTotal = [1 / totalSum[2], 1 / totalSum[1], 1 / totalSum[0]];
                    fse = rowSums.map(function (sum) { return [sum[0] * reverseTotal[0], sum[1] * reverseTotal[1], sum[2] * reverseTotal[2]]; });
                    crispValues = fse.map(function (tfn) { return (tfn[0] + tfn[1] + tfn[2]) / 3; });
                    sumCrisp = crispValues.reduce(function (a, b) { return a + b; }, 0);
                    weights = crispValues.map(function (w) { return w / sumCrisp; });
                    console.log("=== RESULTS ===");
                    for (i = 0; i < size; i++) {
                        console.log("".concat(allCodes[i], ": ").concat((weights[i] * 100).toFixed(2), "%"));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error).finally(function () { return prisma.$disconnect(); });
