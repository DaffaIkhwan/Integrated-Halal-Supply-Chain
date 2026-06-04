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
exports.HALAL_CRITICAL_POINTS = exports.FuzzyScale = void 0;
exports.getReciprocal = getReciprocal;
exports.sumTFNs = sumTFNs;
exports.calculateFSE = calculateFSE;
exports.defuzzify = defuzzify;
exports.normalizeWeights = normalizeWeights;
exports.getRiskLevel = getRiskLevel;
exports.calculateWeightsFromMatrix = calculateWeightsFromMatrix;
exports.calculateConsistencyRatio = calculateConsistencyRatio;
exports.loadMatrixFromDB = loadMatrixFromDB;
exports.recalculateLevel1Weights = recalculateLevel1Weights;
exports.recalculateLevel2Weights = recalculateLevel2Weights;
exports.recalculateAllWeights = recalculateAllWeights;
exports.calculateBatchRiskScore = calculateBatchRiskScore;
exports.getDynamicCPWeights = getDynamicCPWeights;
/**
 * Fuzzy Linguistic Scale for Halal Risk Assessment
 * Berdasarkan skala Saaty yang di-fuzzy-kan
 */
exports.FuzzyScale = {
    EQUAL: [1, 1, 1],
    MODERATE: [1, 3, 5],
    STRONG: [3, 5, 7],
    VERY_STRONG: [5, 7, 9],
    EXTREME: [7, 9, 9],
};
// ======================================================================
// Core Mathematical Functions (Pure — tidak bergantung DB)
// ======================================================================
/** Mendapatkan nilai resiprokal/kebalikan dari TFN */
function getReciprocal(_a) {
    var l = _a[0], m = _a[1], u = _a[2];
    return [1 / u, 1 / m, 1 / l];
}
/** Menjumlahkan array TFN */
function sumTFNs(tfns) {
    return tfns.reduce(function (acc, val) { return [acc[0] + val[0], acc[1] + val[1], acc[2] + val[2]]; }, [0, 0, 0]);
}
/**
 * Menghitung Fuzzy Synthetic Extent (FSE)
 * S_i = Σ M_{gi}^j ⊗ [Σ Σ M_{gi}^j]^{-1}
 */
function calculateFSE(matrix) {
    var rowSums = matrix.map(function (row) { return sumTFNs(row); });
    var totalSum = sumTFNs(rowSums);
    var reverseTotal = getReciprocal(totalSum);
    return rowSums.map(function (rowSum) { return [
        rowSum[0] * reverseTotal[0],
        rowSum[1] * reverseTotal[1],
        rowSum[2] * reverseTotal[2],
    ]; });
}
/** Defuzzification menggunakan metode Center of Area (CoA): D = (l + m + u) / 3 */
function defuzzify(tfn) {
    return (tfn[0] + tfn[1] + tfn[2]) / 3;
}
/** Menormalkan array sehingga totalnya = 1 */
function normalizeWeights(weights) {
    var sum = weights.reduce(function (a, b) { return a + b; }, 0);
    if (sum === 0)
        return weights.map(function () { return 1 / weights.length; });
    return weights.map(function (w) { return w / sum; });
}
/** Menentukan level risiko berdasarkan skor */
function getRiskLevel(score) {
    if (score >= 0.76)
        return "Critical";
    if (score >= 0.51)
        return "High";
    if (score >= 0.26)
        return "Moderate";
    return "Low";
}
/**
 * Menghitung bobot dari matriks TFN (generik — bisa Level 1 atau Level 2)
 */
function calculateWeightsFromMatrix(matrix, codes) {
    var fse = calculateFSE(matrix);
    var crispValues = fse.map(function (val) { return defuzzify(val); });
    var normalizedWeights = normalizeWeights(crispValues);
    return codes.map(function (code, index) { return ({
        code: code,
        weight: normalizedWeights[index],
        fse: fse[index],
    }); });
}
/**
 * Menghitung Consistency Ratio (CR)
 * 1. Defuzzify matriks TFN → matriks crisp
 * 2. Hitung Aw (matriks × vektor bobot)
 * 3. λmax = (1/n) Σ (Aw_i / w_i)
 * 4. CI = (λmax - n) / (n - 1)
 * 5. CR = CI / RI
 */
function calculateConsistencyRatio(matrix, weights) {
    var n = matrix.length;
    // Random Index (RI) table — Saaty (1990)
    var RI_TABLE = {
        1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
        6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
    };
    // Defuzzify matrix → crisp
    var crispMatrix = matrix.map(function (row) { return row.map(function (cell) { return defuzzify(cell); }); });
    // Aw = crispMatrix × weights
    var Aw = crispMatrix.map(function (row) {
        return row.reduce(function (sum, val, j) { return sum + val * weights[j]; }, 0);
    });
    // λmax
    var lambdaMax = Aw.reduce(function (sum, aw_i, i) {
        if (weights[i] === 0)
            return sum;
        return sum + aw_i / weights[i];
    }, 0) / n;
    var ci = n <= 1 ? 0 : (lambdaMax - n) / (n - 1);
    var ri = RI_TABLE[n] || 1.49;
    var cr = ri === 0 ? 0 : ci / ri;
    return {
        lambdaMax: Number(lambdaMax.toFixed(4)),
        ci: Number(ci.toFixed(4)),
        cr: Number(cr.toFixed(4)),
        isConsistent: cr < 0.10,
    };
}
// ======================================================================
// Database-Driven Functions (Dynamic — baca/tulis dari PostgreSQL)
// ======================================================================
var client_1 = require("@/lib/db/client");
/**
 * Membaca matriks perbandingan berpasangan dari DB dan merekonstruksinya
 * menjadi matriks TFN n×n
 */
function loadMatrixFromDB(matrixType) {
    return __awaiter(this, void 0, void 0, function () {
        var entries, allCodes, n, matrix, _i, entries_1, entry, i, j;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client_1.prisma.pairwiseComparison.findMany({
                        where: { matrixType: matrixType },
                        orderBy: [{ rowCode: 'asc' }, { colCode: 'asc' }],
                    })];
                case 1:
                    entries = _a.sent();
                    if (entries.length === 0) {
                        throw new Error("Matriks \"".concat(matrixType, "\" belum ada di database. Silakan isi data matriks perbandingan berpasangan terlebih dahulu."));
                    }
                    allCodes = __spreadArray([], new Set(entries.map(function (e) { return e.rowCode; })), true);
                    allCodes.sort();
                    n = allCodes.length;
                    matrix = Array.from({ length: n }, function () {
                        return Array.from({ length: n }, function () { return [1, 1, 1]; });
                    });
                    for (_i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                        entry = entries_1[_i];
                        i = allCodes.indexOf(entry.rowCode);
                        j = allCodes.indexOf(entry.colCode);
                        if (i >= 0 && j >= 0) {
                            matrix[i][j] = [entry.tfnLow, entry.tfnMid, entry.tfnUp];
                        }
                    }
                    return [2 /*return*/, { matrix: matrix, codes: allCodes }];
            }
        });
    });
}
/**
 * Menghitung bobot Level 1 (antar CP) dari DB dan menyimpan hasilnya
 * ke tabel CriticalPoint
 */
function recalculateLevel1Weights() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, matrix, codes, results, weights, cr, _i, results_1, r;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, loadMatrixFromDB('LEVEL1_CP')];
                case 1:
                    _a = _b.sent(), matrix = _a.matrix, codes = _a.codes;
                    results = calculateWeightsFromMatrix(matrix, codes);
                    weights = results.map(function (r) { return r.weight; });
                    cr = calculateConsistencyRatio(matrix, weights);
                    _i = 0, results_1 = results;
                    _b.label = 2;
                case 2:
                    if (!(_i < results_1.length)) return [3 /*break*/, 5];
                    r = results_1[_i];
                    return [4 /*yield*/, client_1.prisma.criticalPoint.update({
                            where: { id: r.code },
                            data: { globalWeight: r.weight },
                        })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, {
                        weights: results.map(function (r) { return ({ code: r.code, weight: r.weight }); }),
                        cr: cr,
                    }];
            }
        });
    });
}
/**
 * Menghitung bobot Level 2 (kriteria dalam 1 CP) dari DB dan menyimpan
 * hasilnya ke tabel CriteriaWeight
 */
function recalculateLevel2Weights(cpId) {
    return __awaiter(this, void 0, void 0, function () {
        var matrixType, _a, matrix, codes, results, weights, cr, _i, results_2, r;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    matrixType = "LEVEL2_".concat(cpId);
                    return [4 /*yield*/, loadMatrixFromDB(matrixType)];
                case 1:
                    _a = _b.sent(), matrix = _a.matrix, codes = _a.codes;
                    results = calculateWeightsFromMatrix(matrix, codes);
                    weights = results.map(function (r) { return r.weight; });
                    cr = calculateConsistencyRatio(matrix, weights);
                    _i = 0, results_2 = results;
                    _b.label = 2;
                case 2:
                    if (!(_i < results_2.length)) return [3 /*break*/, 5];
                    r = results_2[_i];
                    return [4 /*yield*/, client_1.prisma.criteriaWeight.updateMany({
                            where: { criticalPointId: cpId, criteriaCode: r.code },
                            data: { weight: r.weight },
                        })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, {
                        weights: results.map(function (r) { return ({ code: r.code, weight: r.weight }); }),
                        cr: cr,
                    }];
            }
        });
    });
}
/**
 * Menghitung SEMUA bobot (Level 1 + semua Level 2) sekaligus
 * dan me-update risk score di CriticalPoint
 */
function recalculateAllWeights() {
    return __awaiter(this, void 0, void 0, function () {
        var level1, cps, level2Results, _i, cps_1, cp, result, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, recalculateLevel1Weights()];
                case 1:
                    level1 = _b.sent();
                    return [4 /*yield*/, client_1.prisma.criticalPoint.findMany({ orderBy: { id: 'asc' } })];
                case 2:
                    cps = _b.sent();
                    level2Results = {};
                    _i = 0, cps_1 = cps;
                    _b.label = 3;
                case 3:
                    if (!(_i < cps_1.length)) return [3 /*break*/, 8];
                    cp = cps_1[_i];
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, recalculateLevel2Weights(cp.id)];
                case 5:
                    result = _b.sent();
                    level2Results[cp.id] = result;
                    return [3 /*break*/, 7];
                case 6:
                    _a = _b.sent();
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8: return [2 /*return*/, { level1: level1, level2: level2Results }];
            }
        });
    });
}
/**
 * Menghitung Risk Score per Batch berdasarkan data CP Records + bobot dari DB
 * Formula: RiskScore_CP = Σ(weight_criteria × riskValue_from_record)
 * GlobalRisk = globalWeight_CP × RiskScore_CP
 */
function calculateBatchRiskScore(batchId) {
    return __awaiter(this, void 0, void 0, function () {
        var batch, cps, totalGlobalRisk, cpResults, _i, cps_2, cp, record, localRisk, _a, _b, cw, rawValue, riskValue, globalWeightedRisk;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, client_1.prisma.halalBatch.findUnique({ where: { id: batchId } })];
                case 1:
                    batch = _d.sent();
                    if (!batch)
                        throw new Error("Batch ".concat(batchId, " tidak ditemukan."));
                    return [4 /*yield*/, client_1.prisma.criticalPoint.findMany({
                            include: { criteriaWeights: true },
                            orderBy: { id: 'asc' },
                        })];
                case 2:
                    cps = _d.sent();
                    totalGlobalRisk = 0;
                    cpResults = [];
                    _i = 0, cps_2 = cps;
                    _d.label = 3;
                case 3:
                    if (!(_i < cps_2.length)) return [3 /*break*/, 8];
                    cp = cps_2[_i];
                    return [4 /*yield*/, getCPRecordRiskValues(batchId, cp.id)];
                case 4:
                    record = _d.sent();
                    if (!record)
                        return [3 /*break*/, 7];
                    localRisk = 0;
                    for (_a = 0, _b = cp.criteriaWeights; _a < _b.length; _a++) {
                        cw = _b[_a];
                        rawValue = (_c = record[cw.criteriaCode]) !== null && _c !== void 0 ? _c : 0;
                        riskValue = rawValue > 0 ? rawValue * 0.20 : 0;
                        localRisk += cw.weight * riskValue;
                    }
                    globalWeightedRisk = cp.globalWeight * localRisk;
                    totalGlobalRisk += globalWeightedRisk;
                    cpResults.push({
                        cpId: cp.id,
                        cpName: cp.name,
                        localRiskScore: Number(localRisk.toFixed(4)),
                        globalWeight: cp.globalWeight,
                        globalWeightedRisk: Number(globalWeightedRisk.toFixed(4)),
                        riskLevel: getRiskLevel(localRisk),
                    });
                    // Update CriticalPoint local risk scores
                    return [4 /*yield*/, client_1.prisma.criticalPoint.update({
                            where: { id: cp.id },
                            data: {
                                localRiskScore: localRisk,
                                globalWeightedRisk: globalWeightedRisk,
                                riskLevel: getRiskLevel(localRisk),
                            },
                        })];
                case 5:
                    // Update CriticalPoint local risk scores
                    _d.sent();
                    // Update CriticalPointRecord for this batch and CP
                    return [4 /*yield*/, client_1.prisma.criticalPointRecord.updateMany({
                            where: { halalBatchId: batchId, criticalPointId: cp.id },
                            data: {
                                riskValue: localRisk,
                                weightedRisk: globalWeightedRisk,
                            },
                        })];
                case 6:
                    // Update CriticalPointRecord for this batch and CP
                    _d.sent();
                    _d.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8: 
                // Update batch total risk
                return [4 /*yield*/, client_1.prisma.halalBatch.update({
                        where: { id: batchId },
                        data: {
                            totalRiskScore: totalGlobalRisk,
                            riskLevel: getRiskLevel(totalGlobalRisk),
                        },
                    })];
                case 9:
                    // Update batch total risk
                    _d.sent();
                    return [2 /*return*/, {
                            batchId: batchId,
                            totalRiskScore: Number(totalGlobalRisk.toFixed(4)),
                            riskLevel: getRiskLevel(totalGlobalRisk),
                            cpBreakdown: cpResults,
                        }];
            }
        });
    });
}
/**
 * Helper: Mengambil risk values dari CP Record tabel sesuai CP ID
 * Returns: { criteriaCode: riskValue }
 */
function getCPRecordRiskValues(batchId, cpId) {
    return __awaiter(this, void 0, void 0, function () {
        var fieldMappings, mapping, record, result, _i, _a, _b, code, field;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    fieldMappings = {
                        CP1: {
                            model: 'cP1FarmRecord',
                            fields: { F1: 'asalUsulRisk', F2: 'kesehatanRisk', F3: 'kepatuhanPakanRisk', F4: 'obatVaksinRisk', F5: 'dokumentasiRisk', F6: 'kebersihanKandangRisk', F7: 'kesiapanSembelihRisk' },
                        },
                        CP2: {
                            model: 'cP2FeedRecord',
                            fields: { FD1: 'halalFeedStatusRisk', FD2: 'supplierRisk', FD3: 'feedStorageRisk', FD4: 'medicationRisk', FD5: 'vetSupervisionRisk' },
                        },
                        CP3: {
                            model: 'cP3TransportRecord',
                            fields: { T1: 'kelayakanRisk', T2: 'kebersihanRisk', T3: 'animalWelfareRisk', T4: 'traceabilityRisk', T5: 'dokumentasiRisk' },
                        },
                        CP4: {
                            model: 'cP4SlaughterRecord',
                            fields: { R1: 'sertifikatHalalRisk', R2: 'kompetensiSembelihRisk', R3: 'prosesSyariahRisk', R4: 'pemeriksaanRisk', R5: 'sanitasiRisk', R6: 'segregasiRisk', R7: 'dokumentasiRisk', R8: 'pengawasanRisk', R9: 'auditRisk', R10: 'traceabilityRisk' },
                        },
                        CP5: {
                            model: 'cP5PostSlaughterRecord',
                            fields: { PS1: 'handlingRisk', PS2: 'sanitasiRisk', PS3: 'batchIdRisk', PS4: 'segregasiRisk', PS5: 'dokumentasiRisk' },
                        },
                        CP6: {
                            model: 'cP6ProcessingRecord',
                            fields: { P1: 'halalIngredientsRisk', P2: 'equipmentRisk', P3: 'dedicatedLineRisk', P4: 'batchControlRisk', P5: 'packagingRisk', P6: 'operatorRisk', P7: 'formulaRisk' },
                        },
                        CP7: {
                            model: 'cP7StorageRecord',
                            fields: { CS1: 'temperatureRisk', CS2: 'segregasiRisk', CS3: 'hygieneRisk', CS4: 'traceabilityRisk', CS5: 'fifoFefoRisk', CS6: 'dokumentasiRisk', CS7: 'incidentRisk' },
                        },
                        CP8: {
                            model: 'cP8DistributionRecord',
                            fields: { D1: 'dedicatedTransRisk', D2: 'vehicleSanitasiRisk', D3: 'temperatureRisk', D4: 'routeRisk', D5: 'loadingRisk', D6: 'dokumentasiRisk', D7: 'kontaminasiRisk' },
                        },
                        CP9: {
                            model: 'cP9RetailRecord',
                            fields: { RT1: 'labelHalalRisk', RT2: 'displayRisk', RT3: 'storageTemRisk', RT4: 'expiryRisk', RT5: 'consumerInfoRisk', RT6: 'supplierTraceRisk', RT7: 'complaintRisk' },
                        },
                        CP10: {
                            model: 'cP10ConsumerRecord',
                            fields: { C1: 'transparansiRisk', C2: 'traceabilityRisk', C3: 'responsivenessRisk', C4: 'consumerTrustRisk', C5: 'halalLiteracyRisk' },
                        },
                    };
                    mapping = fieldMappings[cpId];
                    if (!mapping)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, client_1.prisma[mapping.model].findFirst({
                            where: { halalBatchId: batchId },
                            orderBy: { createdAt: 'desc' },
                        })];
                case 1:
                    record = _d.sent();
                    if (!record)
                        return [2 /*return*/, null];
                    result = {};
                    for (_i = 0, _a = Object.entries(mapping.fields); _i < _a.length; _i++) {
                        _b = _a[_i], code = _b[0], field = _b[1];
                        result[code] = (_c = record[field]) !== null && _c !== void 0 ? _c : 0;
                    }
                    return [2 /*return*/, result];
            }
        });
    });
}
// ======================================================================
// Reference Data (Metadata — no calculation logic)
// ======================================================================
/** CP metadata for chatbot intent detection (keyword matching) */
exports.HALAL_CRITICAL_POINTS = [
    { id: "CP1", name: "Farm/Kandang Sapi", keywords: ["farm", "kandang", "sapi", "ternak"] },
    { id: "CP2", name: "Pakan & Kesehatan Hewan", keywords: ["pakan", "obat", "vaksin", "veteriner"] },
    { id: "CP3", name: "Transportasi ke RPH", keywords: ["transport", "kendaraan", "angkut"] },
    { id: "CP4", name: "RPH/Penyembelihan", keywords: ["sembelih", "RPH", "pisau", "juru sembelih"] },
    { id: "CP5", name: "Post-Slaughter Handling", keywords: ["karkas", "post-slaughter", "carcass"] },
    { id: "CP6", name: "Processing/Pengolahan", keywords: ["proses", "olah", "bumbu", "mesin"] },
    { id: "CP7", name: "Cold Storage/Warehouse", keywords: ["gudang", "suhu", "cold storage", "pendingin"] },
    { id: "CP8", name: "Distribusi/Logistik", keywords: ["distribusi", "logistik", "kirim"] },
    { id: "CP9", name: "Retail/Pasar/Supermarket", keywords: ["retail", "pasar", "supermarket", "toko"] },
    { id: "CP10", name: "Konsumen & Complaint", keywords: ["konsumen", "complaint", "keluhan"] },
];
/**
 * Mendapatkan bobot Critical Points dari database (dynamic, dari Fuzzy AHP).
 * Tidak ada fallback ke data hardcoded — jika DB kosong, throws error.
 */
function getDynamicCPWeights() {
    return __awaiter(this, void 0, void 0, function () {
        var cps;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client_1.prisma.criticalPoint.findMany({
                        include: { criteriaWeights: true },
                        orderBy: { id: 'asc' },
                    })];
                case 1:
                    cps = _a.sent();
                    if (cps.length === 0) {
                        throw new Error('Data CriticalPoint belum ada di database. Jalankan seed-criteria.ts terlebih dahulu.');
                    }
                    return [2 /*return*/, cps.map(function (cp) { return ({
                            cpId: cp.id,
                            name: cp.name,
                            weight: cp.globalWeight,
                            localRiskScore: cp.localRiskScore,
                            globalWeightedRisk: cp.globalWeightedRisk,
                            riskLevel: cp.riskLevel,
                            criteria: cp.criteriaWeights.map(function (cw) { return ({
                                code: cw.criteriaCode,
                                name: cw.criteriaName,
                                weight: cw.weight,
                            }); }),
                        }); })];
            }
        });
    });
}
