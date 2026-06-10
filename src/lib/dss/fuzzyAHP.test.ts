import { describe, it, expect } from 'vitest';
import { 
  getReciprocal, 
  sumTFNs, 
  calculateFSE, 
  defuzzify, 
  normalizeWeights, 
  getRiskLevel,
  calculateConsistencyRatio,
  FuzzyScale,
  type TFN
} from './fuzzyAHP';

describe('Fuzzy AHP Core Mathematical Functions', () => {

  it('getReciprocal should return the inverse of TFN correctly', () => {
    const tfn: TFN = [2, 4, 8];
    const reciprocal = getReciprocal(tfn);
    expect(reciprocal).toEqual([1/8, 1/4, 1/2]);
  });

  it('sumTFNs should sum multiple TFNs correctly', () => {
    const tfns: TFN[] = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ];
    const result = sumTFNs(tfns);
    expect(result).toEqual([12, 15, 18]);
  });

  it('defuzzify should calculate Center of Area correctly', () => {
    const tfn: TFN = [1, 3, 5];
    const crisp = defuzzify(tfn);
    expect(crisp).toBe((1 + 3 + 5) / 3); // 3
  });

  it('normalizeWeights should return array that sums to 1', () => {
    const weights = [2, 4, 4]; // sum is 10
    const normalized = normalizeWeights(weights);
    expect(normalized).toEqual([0.2, 0.4, 0.4]);
  });

  it('normalizeWeights should handle zero sum gracefully', () => {
    const weights = [0, 0, 0];
    const normalized = normalizeWeights(weights);
    // Should split evenly
    expect(normalized[0]).toBeCloseTo(0.3333);
  });

  it('getRiskLevel should return correct level based on score', () => {
    expect(getRiskLevel(0.8)).toBe('Critical');
    expect(getRiskLevel(0.6)).toBe('High');
    expect(getRiskLevel(0.3)).toBe('Moderate');
    expect(getRiskLevel(0.1)).toBe('Low');
  });

  it('calculateConsistencyRatio should identify a perfectly consistent matrix', () => {
    // Perfectly consistent 3x3 crisp matrix equivalent
    // [1,   2,   4]
    // [1/2, 1,   2]
    // [1/4, 1/2, 1]
    
    // We convert this to TFN for the function
    const matrix: TFN[][] = [
      [FuzzyScale.EQUAL,         [2,2,2],           [4,4,4]],
      [[1/2,1/2,1/2],            FuzzyScale.EQUAL,  [2,2,2]],
      [[1/4,1/4,1/4],            [1/2,1/2,1/2],     FuzzyScale.EQUAL]
    ];
    
    // Crisp values expected: 1/7, 2/7, 4/7
    const weights = [4/7, 2/7, 1/7];
    
    const cr = calculateConsistencyRatio(matrix);
    expect(cr.ci).toBe(0); // Perfect consistency means CI = 0
    expect(cr.cr).toBe(0); // Perfect consistency means CR = 0
    expect(cr.isConsistent).toBe(true);
  });

});
