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
function getCrispScale(value) {
    var absVal = Math.abs(value) + 1; // 0..8 -> 1..9
    var scale = 1;
    if (absVal === 1)
        scale = 1;
    else if (absVal === 2 || absVal === 3)
        scale = 3;
    else if (absVal === 4 || absVal === 5)
        scale = 5;
    else if (absVal === 6 || absVal === 7)
        scale = 7;
    else
        scale = 9;
    if (value > 0)
        return 1 / scale;
    return scale;
}
function calculateCRForMatrix(matrix) {
    var n = matrix.length;
    var colSums = new Array(n).fill(0);
    for (var j = 0; j < n; j++) {
        for (var i = 0; i < n; i++) {
            colSums[j] += matrix[i][j];
        }
    }
    var normalizedMatrix = matrix.map(function (row) { return row.map(function (val, j) { return val / colSums[j]; }); });
    var weights = normalizedMatrix.map(function (row) { return row.reduce(function (a, b) { return a + b; }, 0) / n; });
    var Aw = matrix.map(function (row) { return row.reduce(function (sum, val, j) { return sum + val * weights[j]; }, 0); });
    var lambdaMax = Aw.reduce(function (sum, aw, i) { return sum + aw / weights[i]; }, 0) / n;
    var CI = (lambdaMax - n) / (n - 1);
    var RI_TABLE = { 1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45 };
    var CR = CI / RI_TABLE[n];
    return { CR: CR, weights: weights, lambdaMax: lambdaMax };
}
function analyze() {
    return __awaiter(this, void 0, void 0, function () {
        var responses, cpResponses, codes, n, k, res, comparisons, matrix, _i, _a, _b, key, val, numVal, scale, _c, row, col, i, j, CR, weights, deviations, i, j, expected, actual, diff;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, prisma.questionnaireResponse.findMany({
                        where: { questionnaireType: 'pembobotan' }
                    })];
                case 1:
                    responses = _d.sent();
                    cpResponses = responses.filter(function (r) { var _a; return ((_a = r.answers) === null || _a === void 0 ? void 0 : _a.type) === 'CP_LEVEL'; });
                    console.log("Found ".concat(cpResponses.length, " respondents for CP_LEVEL.\n"));
                    codes = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7', 'CP8', 'CP9'];
                    n = codes.length;
                    for (k = 0; k < cpResponses.length; k++) {
                        res = cpResponses[k];
                        comparisons = res.answers.comparisons || {};
                        matrix = Array.from({ length: n }, function () { return new Array(n).fill(1); });
                        for (_i = 0, _a = Object.entries(comparisons); _i < _a.length; _i++) {
                            _b = _a[_i], key = _b[0], val = _b[1];
                            numVal = Number(val);
                            scale = getCrispScale(numVal);
                            _c = key.split('_vs_'), row = _c[0], col = _c[1];
                            i = codes.indexOf(row);
                            j = codes.indexOf(col);
                            if (i >= 0 && j >= 0) {
                                matrix[i][j] = scale;
                                matrix[j][i] = 1 / scale;
                            }
                        }
                        CR = calculateCRForMatrix(matrix).CR;
                        console.log("Respondent ".concat(k + 1, " (Evaluator ").concat(res.evaluatorId, "): CR = ").concat(CR.toFixed(4)));
                        if (CR > 0.1) {
                            console.log("  -> INCONSISTENT! Identifying top contradictory pairs...");
                            weights = calculateCRForMatrix(matrix).weights;
                            deviations = [];
                            for (i = 0; i < n; i++) {
                                for (j = i + 1; j < n; j++) {
                                    expected = weights[i] / weights[j];
                                    actual = matrix[i][j];
                                    diff = Math.max(actual / expected, expected / actual);
                                    if (diff > 3) { // High deviation threshold
                                        deviations.push({
                                            pair: "".concat(codes[i], " vs ").concat(codes[j]),
                                            actual: actual.toFixed(2),
                                            expected: expected.toFixed(2),
                                            diff: diff.toFixed(2)
                                        });
                                    }
                                }
                            }
                            deviations.sort(function (a, b) { return Number(b.diff) - Number(a.diff); });
                            deviations.slice(0, 5).forEach(function (d) {
                                console.log("     - ".concat(d.pair, ": Actual ").concat(d.actual, ", Expected ").concat(d.expected, " (Dev: ").concat(d.diff, "x)"));
                            });
                        }
                        console.log('');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
analyze().finally(function () { return prisma.$disconnect(); });
