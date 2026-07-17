/**
 * Rule-Based Risk Assessment Engine
 * 
 * Menggunakan data dari Rule_Base_Risiko_Halal_Lengkap.json untuk
 * mengevaluasi tingkat risiko per indikator, konstruk, dan stage.
 * 
 * Agregasi: weakest-link (MAX)
 *   Indikator → Konstruk: MAX(I1..I5)
 *   Konstruk  → Stage:    MAX(semua Construct dalam stage)
 *   Stage     → Overall:  MAX(semua Stage)
 */

import path from 'path';
import fs from 'fs';

// ─── Types ───

export interface RiskLevel {
  level: number;       // 1-5
  label_id: string;    // "Sangat Rendah" .. "Sangat Tinggi"
  label_en: string;    // "Very Low Risk" .. "Critical Risk"
  recommended_action: string;
}

export interface IndicatorRule {
  rule_id: string;
  level: number;
  label_id: string;
  label_en: string;
  performance_descriptor: string;
  if_then: string;
}

export interface Indicator {
  indicator_no: number;
  indicator_name: string;
  supporting_evidence: string;
  performance_rules: IndicatorRule[];
}

export interface ConstructRule {
  rule_id: string;
  condition: string;
  output_level: number;
  output_label: string;
  recommended_action: string;
}

export interface Construct {
  group_code: string;      // CP1..CP9
  group_label: string;     // "Kandang Sapi / Farm"
  construct_code: string;  // CP1.1, CP1.2, etc.
  construct_name: string;
  construct_rules: ConstructRule[];
  indicators: Indicator[];
}

export interface RuleBaseData {
  metadata: {
    title: string;
    construct_count: number;
    indicator_count: number;
    indicator_rule_count: number;
  };
  risk_scale: RiskLevel[];
  aggregation_rules: {
    indicator: string;
    construct: string;
    stage: string;
    overall: string;
  };
  constructs: Construct[];
}

export interface IndicatorAssessment {
  indicator_no: number;
  indicator_name: string;
  score: number;          // 1-5
  label: string;          // "Sangat Rendah" etc.
  descriptor: string;     // Performance descriptor that matched
}

export interface ConstructAssessment {
  construct_code: string;
  construct_name: string;
  group_code: string;
  risk_level: number;     // MAX of indicator scores
  risk_label: string;
  recommended_action: string;
  indicators: IndicatorAssessment[];
}

export interface StageAssessment {
  stage_code: string;     // CP1..CP9
  stage_name: string;
  risk_level: number;     // MAX of construct risks
  risk_label: string;
  constructs: ConstructAssessment[];
}

export interface OverallAssessment {
  overall_risk_level: number;
  overall_risk_label: string;
  overall_recommended_action: string;
  stages: StageAssessment[];
}

// ─── Rule Base Loader (Singleton) ───

let _ruleBaseCache: RuleBaseData | null = null;

export function loadRuleBase(): RuleBaseData {
  if (_ruleBaseCache) return _ruleBaseCache;

  const jsonPath = path.join(process.cwd(), 'scratch', 'rule base', 'Daffa Rule_Base_Risiko_Halal_Lengkap.json');
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Rule base file not found: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  _ruleBaseCache = JSON.parse(raw) as RuleBaseData;
  
  console.log(`[RuleEngine] Loaded: ${_ruleBaseCache.metadata.construct_count} constructs, ${_ruleBaseCache.metadata.indicator_count} indicators`);
  
  return _ruleBaseCache;
}

// ─── Helper ───

function getRiskLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Sangat Rendah',
    2: 'Rendah',
    3: 'Sedang',
    4: 'Tinggi',
    5: 'Sangat Tinggi',
  };
  return labels[level] || 'Tidak Diketahui';
}

function getRecommendedAction(level: number, ruleBase: RuleBaseData): string {
  const scale = ruleBase.risk_scale.find(s => s.level === level);
  return scale?.recommended_action || '';
}

// ─── Core Assessment Functions ───

/**
 * Evaluasi satu konstruk berdasarkan skor indikator (1-5).
 * 
 * @param constructCode - Kode konstruk (e.g. "CP1.1")
 * @param indicatorScores - Array 5 skor [I1, I2, I3, I4, I5] masing-masing 1-5
 */
export function assessConstruct(
  constructCode: string,
  indicatorScores: number[]
): ConstructAssessment | null {
  const ruleBase = loadRuleBase();
  const construct = ruleBase.constructs.find(c => c.construct_code === constructCode);
  
  if (!construct) return null;
  if (indicatorScores.length < construct.indicators.length) {
    // Pad with 1 (very low risk) for missing indicators
    while (indicatorScores.length < construct.indicators.length) {
      indicatorScores.push(1);
    }
  }

  // Evaluate each indicator
  const indicatorAssessments: IndicatorAssessment[] = construct.indicators.map((ind, i) => {
    const score = Math.min(5, Math.max(1, Math.round(indicatorScores[i] || 1)));
    const matchingRule = ind.performance_rules.find(r => r.level === score);
    
    return {
      indicator_no: ind.indicator_no,
      indicator_name: ind.indicator_name,
      score,
      label: matchingRule?.label_id || getRiskLabel(score),
      descriptor: matchingRule?.performance_descriptor || '',
    };
  });

  // Aggregation: weakest-link (MAX)
  const riskLevel = Math.max(...indicatorAssessments.map(i => i.score));
  
  return {
    construct_code: construct.construct_code,
    construct_name: construct.construct_name,
    group_code: construct.group_code,
    risk_level: riskLevel,
    risk_label: getRiskLabel(riskLevel),
    recommended_action: getRecommendedAction(riskLevel, ruleBase),
    indicators: indicatorAssessments,
  };
}

/**
 * Evaluasi seluruh stage (CP) berdasarkan skor semua konstruknya.
 * 
 * @param cpCode - Kode CP (e.g. "CP1")
 * @param constructScores - Object { "CP1.1": [I1..I5], "CP1.2": [I1..I5], ... }
 */
export function assessStage(
  cpCode: string,
  constructScores: Record<string, number[]>
): StageAssessment | null {
  const ruleBase = loadRuleBase();
  const stageConstructs = ruleBase.constructs.filter(c => c.group_code === cpCode);
  
  if (stageConstructs.length === 0) return null;

  const constructAssessments: ConstructAssessment[] = [];

  for (const construct of stageConstructs) {
    const scores = constructScores[construct.construct_code] || [];
    const assessment = assessConstruct(construct.construct_code, scores);
    if (assessment) constructAssessments.push(assessment);
  }

  const stageRisk = constructAssessments.length > 0 
    ? Math.max(...constructAssessments.map(c => c.risk_level))
    : 1;

  return {
    stage_code: cpCode,
    stage_name: stageConstructs[0].group_label,
    risk_level: stageRisk,
    risk_label: getRiskLabel(stageRisk),
    constructs: constructAssessments,
  };
}

/**
 * Evaluasi keseluruhan risk assessment untuk semua CP.
 * 
 * @param allScores - Object { "CP1": { "CP1.1": [I1..I5], ... }, "CP2": { ... }, ... }
 */
export function assessOverall(
  allScores: Record<string, Record<string, number[]>>
): OverallAssessment {
  const ruleBase = loadRuleBase();
  const stages: StageAssessment[] = [];

  for (const [cpCode, constructScores] of Object.entries(allScores)) {
    const stage = assessStage(cpCode, constructScores);
    if (stage) stages.push(stage);
  }

  const overallRisk = stages.length > 0
    ? Math.max(...stages.map(s => s.risk_level))
    : 1;

  return {
    overall_risk_level: overallRisk,
    overall_risk_label: getRiskLabel(overallRisk),
    overall_recommended_action: getRecommendedAction(overallRisk, ruleBase),
    stages,
  };
}

/**
 * Get all construct codes and names for a given CP.
 * Useful for building questionnaire forms dynamically.
 */
export function getConstructsForCP(cpCode: string): { code: string; name: string; indicatorCount: number; indicators: { no: number; name: string; evidence: string }[] }[] {
  const ruleBase = loadRuleBase();
  return ruleBase.constructs
    .filter(c => c.group_code === cpCode)
    .map(c => ({
      code: c.construct_code,
      name: c.construct_name,
      indicatorCount: c.indicators.length,
      indicators: c.indicators.map(i => ({
        no: i.indicator_no,
        name: i.indicator_name,
        evidence: i.supporting_evidence,
      })),
    }));
}

/**
 * Get the performance descriptor (rubric) for a specific indicator at a specific level.
 */
export function getPerformanceDescriptor(constructCode: string, indicatorNo: number, level: number): string | null {
  const ruleBase = loadRuleBase();
  const construct = ruleBase.constructs.find(c => c.construct_code === constructCode);
  if (!construct) return null;
  
  const indicator = construct.indicators.find(i => i.indicator_no === indicatorNo);
  if (!indicator) return null;

  const rule = indicator.performance_rules.find(r => r.level === level);
  return rule?.performance_descriptor || null;
}
